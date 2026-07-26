import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import ts from 'typescript';
import { createAccessTestCredentials } from './access-test-token.mjs';
import {
  applyProductionConsentConfig,
  PRODUCTION_CONSENT_EMBED_ID,
  PRODUCTION_CONSENT_PROVIDER,
} from './prepare-production-consent-config.mjs';

const port = Number(process.env.PUBLIC_CONSENT_SMOKE_PORT || 8842);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const statePath = '.wrangler/public-consent-smoke';
const embedId = '11111111-2222-4333-8444-555555555555';
const embedUrl = `https://embeds.iubenda.com/widgets/${embedId}.js`;
const access = createAccessTestCredentials();
const logs = [];

function record(chunk) {
  const value = chunk.toString();
  logs.push(value);
  process.stdout.write(value);
}

function wrangler(args) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], {
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`Wrangler failed:\n${result.stdout}\n${result.stderr}`);
}

async function verifyPureContract() {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'senza-roaming-consent-'));
  const compiledModulePath = path.join(temporaryDirectory, 'public-consent.mjs');
  try {
    const source = await readFile('src/public-consent.ts', 'utf8');
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        strict: true,
      },
      fileName: 'src/public-consent.ts',
      reportDiagnostics: true,
    });
    const errors = (compiled.diagnostics || []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );
    assert.deepEqual(
      errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
      [],
    );
    await writeFile(compiledModulePath, compiled.outputText, 'utf8');
    const consent = await import(`${pathToFileURL(compiledModulePath).href}?v=${Date.now()}`);

    assert.deepEqual(consent.resolvePublicConsentConfig({}), { kind: 'disabled' });
    assert.deepEqual(
      consent.resolvePublicConsentConfig({ CMP_PROVIDER: 'iubenda' }),
      { kind: 'invalid', reason: 'incomplete' },
    );
    assert.deepEqual(
      consent.resolvePublicConsentConfig({ CMP_PROVIDER: 'custom', CMP_EMBED_ID: embedId }),
      { kind: 'invalid', reason: 'unsupported_provider' },
    );
    assert.deepEqual(
      consent.resolvePublicConsentConfig({ CMP_PROVIDER: 'iubenda', CMP_EMBED_ID: 'not-a-uuid' }),
      { kind: 'invalid', reason: 'invalid_embed_id' },
    );

    const enabled = consent.resolvePublicConsentConfig({
      CMP_PROVIDER: ' IUBENDA ',
      CMP_EMBED_ID: ` ${embedId.toUpperCase()} `,
    });
    assert.equal(enabled.kind, 'enabled');
    assert.equal(Object.isFrozen(enabled), true);
    assert.equal(Object.isFrozen(enabled.config), true);
    assert.equal(enabled.config.embedId, embedId);
    assert.equal(consent.iubendaEmbedUrl(enabled.config), embedUrl);

    const baseDeploymentConfig = {
      vars: {
        SITE_NAME: 'Senza Roaming',
        CMP_PROVIDER: '',
        CMP_EMBED_ID: '',
        GTM_ID: '',
      },
    };
    const productionDeploymentConfig = applyProductionConsentConfig(baseDeploymentConfig);
    assert.equal(baseDeploymentConfig.vars.CMP_PROVIDER, '');
    assert.equal(baseDeploymentConfig.vars.CMP_EMBED_ID, '');
    assert.equal(productionDeploymentConfig.vars.CMP_PROVIDER, PRODUCTION_CONSENT_PROVIDER);
    assert.equal(productionDeploymentConfig.vars.CMP_EMBED_ID, PRODUCTION_CONSENT_EMBED_ID);
    assert.equal(productionDeploymentConfig.vars.GTM_ID, '');
    assert.match(PRODUCTION_CONSENT_EMBED_ID, /^[0-9a-f-]{36}$/);
    assert.throws(
      () => applyProductionConsentConfig({ vars: { GTM_ID: 'G-TEST' } }),
      /GTM_ID to remain empty/,
    );
    assert.throws(
      () => applyProductionConsentConfig({ vars: { GTM_ID: '', CMP_SITE_ID: '1234567' } }),
      /Legacy consent variable CMP_SITE_ID/,
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

function migrate() {
  wrangler(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', statePath]);
}

function startRuntime() {
  const child = spawn(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js', 'dev', '--config', configPath,
    '--persist-to', statePath, '--port', String(port), '--ip', '127.0.0.1',
    '--var', 'CMP_PROVIDER:iubenda',
    '--var', `CMP_EMBED_ID:${embedId}`,
    '--var', `CF_ACCESS_TEAM_DOMAIN:${access.issuer}`,
    '--var', `CF_ACCESS_AUD:${access.audience}`,
    '--var', `CF_ACCESS_TEST_JWKS:${access.jwks}`,
  ], {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: 'consent-smoke-maintenance-token',
      AI_GATEWAY_TOKEN: 'consent-smoke-ai-token',
      AFFILIATE_MODE: 'disabled',
      ASTRO_TELEMETRY_DISABLED: '1',
    },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', record);
  child.stderr.on('data', record);
  return child;
}

async function waitForRuntime(child, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Runtime exited.\n${logs.join('')}`);
    try {
      if ((await fetch(`${origin}/api/health`)).ok) return;
    } catch {
      // workerd is starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Consent runtime timed out.\n${logs.join('')}`);
}

function signal(child, name) {
  if (!child || child.exitCode !== null || !child.pid) return;
  if (process.platform === 'win32') child.kill(name);
  else process.kill(-child.pid, name);
}

async function stopRuntime(child) {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  signal(child, 'SIGTERM');
  if (await Promise.race([exited.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 5_000))])) return;
  signal(child, 'SIGKILL');
  await Promise.race([once(child, 'exit'), new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

function assertIubendaEnabled(html, pathname) {
  const escapedUrl = embedUrl.replaceAll('.', '\\.').replaceAll('/', '\\/');
  const matches = html.match(new RegExp(escapedUrl, 'g')) || [];
  assert.equal(matches.length, 1, `${pathname} must include one unified iubenda embed.`);
  assert.match(html, /class="iubenda-cs-preferences-link"/);
  assert.doesNotMatch(html, /cs\.iubenda\.com\/autoblocking|cdn\.iubenda\.com\/cs\/iubenda_cs\.js|csConfiguration/i);
  assert.doesNotMatch(html, /googletagmanager|google-analytics|gtag\(|measurement[_-]?id["'=:\s]+G-[A-Z0-9]+/i);

  const embedTag = html.match(/<script[^>]+src="https:\/\/embeds\.iubenda\.com\/widgets\/[0-9a-f-]+\.js"[^>]*>/i)?.[0];
  assert.ok(embedTag, `${pathname} must contain the remote embed script tag.`);
  assert.doesNotMatch(embedTag, /\b(?:async|defer)\b/i);
}

function assertIubendaExcluded(body, pathname) {
  assert.doesNotMatch(
    body,
    /embeds\.iubenda\.com|iubenda-cs-preferences-link|CMP_EMBED_ID/i,
    `${pathname} must not include CMP code.`,
  );
}

async function verifyRuntime() {
  for (const pathname of ['/', '/guide', '/destinazioni', '/confronti', '/metodo', '/trasparenza', '/privacy']) {
    const response = await fetch(`${origin}${pathname}`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assertIubendaEnabled(html, pathname);
  }

  const privacy = await (await fetch(`${origin}/privacy`)).text();
  assert.match(privacy, /iubenda è configurata; GTM e GA4 restano inattivi\./);
  assert.match(privacy, /Gestisci preferenze cookie/);

  for (const pathname of ['/astro-foundation', '/astro-foundation/privacy', '/missing-consent-page', '/.env']) {
    const response = await fetch(`${origin}${pathname}`);
    const body = await response.text();
    if (pathname.startsWith('/astro-foundation')) assert.equal(response.status, 200);
    else assert.equal(response.status, 404);
    assertIubendaExcluded(body, pathname);
  }

  for (const pathname of ['/sitemap.xml', '/robots.txt', '/api/health']) {
    const response = await fetch(`${origin}${pathname}`);
    const body = await response.text();
    assert.equal(response.status, 200);
    assertIubendaExcluded(body, pathname);
  }
  assert.equal((await fetch(`${origin}/control-room-foundation`)).status, 403);

  const browser = await chromium.launch({ headless: true });
  try {
    const googleRequests = [];
    const desktop = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    desktop.on('request', (request) => {
      if (/google-analytics|googletagmanager|doubleclick|googleadservices/i.test(request.url())) googleRequests.push(request.url());
    });
    await desktop.route('https://embeds.iubenda.com/widgets/**', async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: `
          window.__iubendaRemoteEmbedTestLoaded = true;
          document.addEventListener('click', function (event) {
            var link = event.target.closest && event.target.closest('.iubenda-cs-preferences-link');
            if (!link) return;
            event.preventDefault();
            var existing = document.getElementById('iubenda-test-dialog');
            if (existing) existing.remove();
            var dialog = document.createElement('div');
            dialog.id = 'iubenda-test-dialog';
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-label', 'Preferenze cookie test');
            dialog.innerHTML = '<button type="button">Rifiuta</button><button type="button">Accetta</button>';
            document.body.appendChild(dialog);
          });
        `,
      });
    });

    await desktop.goto(`${origin}/`);
    await desktop.getByRole('heading', { level: 1, name: 'Trova la eSIM giusta prima di partire.' }).waitFor();
    await desktop.waitForFunction(() => window.__iubendaRemoteEmbedTestLoaded === true);
    assert.deepEqual(googleRequests, []);
    assert.equal(await desktop.locator('script[src*="googletagmanager"],script[src*="google-analytics"]').count(), 0);
    assert.equal(await desktop.locator(`script[src="${embedUrl}"]`).count(), 1);
    assert.equal(await desktop.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);

    const preferences = desktop.getByRole('link', { name: 'Gestisci preferenze cookie' });
    await preferences.focus();
    assert.equal(await desktop.evaluate(() => document.activeElement?.textContent?.trim()), 'Gestisci preferenze cookie');
    await preferences.click();
    await desktop.getByRole('dialog', { name: 'Preferenze cookie test' }).waitFor();
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.route('https://embeds.iubenda.com/widgets/**', (route) => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await mobile.goto(`${origin}/privacy`);
    await mobile.getByRole('heading', { level: 1, name: 'Raccogliere meno, spiegare meglio.' }).waitFor();
    await mobile.getByRole('link', { name: 'Gestisci preferenze cookie' }).waitFor();
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    await mobile.close();
  } finally {
    await browser.close();
  }
}

let child;
try {
  await verifyPureContract();
  migrate();
  child = startRuntime();
  await waitForRuntime(child);
  await verifyRuntime();
  console.log('Public consent foundation smoke passed.');
} finally {
  await stopRuntime(child);
  await rm(statePath, { recursive: true, force: true });
}
