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

const port = Number(process.env.PUBLIC_CONSENT_SMOKE_PORT || 8842);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const statePath = '.wrangler/public-consent-smoke';
const siteId = '1234567';
const cookiePolicyId = '7654321';
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
      consent.resolvePublicConsentConfig({ CMP_PROVIDER: 'iubenda', CMP_SITE_ID: siteId }),
      { kind: 'invalid', reason: 'incomplete' },
    );
    assert.deepEqual(
      consent.resolvePublicConsentConfig({
        CMP_PROVIDER: 'custom',
        CMP_SITE_ID: siteId,
        CMP_COOKIE_POLICY_ID: cookiePolicyId,
      }),
      { kind: 'invalid', reason: 'unsupported_provider' },
    );
    assert.deepEqual(
      consent.resolvePublicConsentConfig({
        CMP_PROVIDER: 'iubenda',
        CMP_SITE_ID: '0',
        CMP_COOKIE_POLICY_ID: cookiePolicyId,
      }),
      { kind: 'invalid', reason: 'invalid_site_id' },
    );

    const enabled = consent.resolvePublicConsentConfig({
      CMP_PROVIDER: ' iubenda ',
      CMP_SITE_ID: siteId,
      CMP_COOKIE_POLICY_ID: cookiePolicyId,
    });
    assert.equal(enabled.kind, 'enabled');
    assert.equal(Object.isFrozen(enabled), true);
    assert.equal(Object.isFrozen(enabled.config), true);
    assert.equal(consent.iubendaAutoblockingUrl(enabled.config), `https://cs.iubenda.com/autoblocking/${siteId}.js`);
    const bootstrap = consent.serializeIubendaBootstrap(enabled.config);
    assert.match(bootstrap, /googleConsentMode/);
    assert.match(bootstrap, /rejectButtonDisplay/);
    assert.match(bootstrap, new RegExp(`"siteId":${siteId}`));
    assert.match(bootstrap, new RegExp(`"cookiePolicyId":${cookiePolicyId}`));
    assert.doesNotMatch(bootstrap, /<\/script|googletagmanager|gtag\(/i);
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
    '--var', `CMP_PROVIDER:iubenda`,
    '--var', `CMP_SITE_ID:${siteId}`,
    '--var', `CMP_COOKIE_POLICY_ID:${cookiePolicyId}`,
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
  assert.match(html, new RegExp(`https://cs\\.iubenda\\.com/autoblocking/${siteId}\\.js`), `${pathname} must include autoblocking.`);
  assert.match(html, /https:\/\/cdn\.iubenda\.com\/cs\/iubenda_cs\.js/, `${pathname} must include the CMP runtime.`);
  assert.match(html, new RegExp(`"siteId":${siteId}`));
  assert.match(html, new RegExp(`"cookiePolicyId":${cookiePolicyId}`));
  assert.match(html, /"googleConsentMode":true/);
  assert.match(html, /"rejectButtonDisplay":true/);
  assert.match(html, /class="iubenda-cs-preferences-link"/);
  assert.doesNotMatch(html, /googletagmanager|google-analytics|gtag\(|G-[A-Z0-9]+/i);

  const configIndex = html.indexOf('var _iub = window._iub');
  const autoblockingIndex = html.indexOf(`https://cs.iubenda.com/autoblocking/${siteId}.js`);
  const runtimeIndex = html.indexOf('https://cdn.iubenda.com/cs/iubenda_cs.js');
  assert.ok(configIndex > -1 && configIndex < autoblockingIndex && autoblockingIndex < runtimeIndex);

  const autoblockingTag = html.match(new RegExp(`<script[^>]+src="https://cs\\.iubenda\\.com/autoblocking/${siteId}\\.js"[^>]*>`, 'i'))?.[0];
  assert.ok(autoblockingTag);
  assert.doesNotMatch(autoblockingTag, /\b(?:async|defer)\b/i);
  const runtimeTag = html.match(/<script[^>]+src="https:\/\/cdn\.iubenda\.com\/cs\/iubenda_cs\.js"[^>]*>/i)?.[0];
  assert.ok(runtimeTag);
  assert.match(runtimeTag, /\basync\b/i);
}

function assertIubendaExcluded(body, pathname) {
  assert.doesNotMatch(body, /iubenda|CMP_SITE_ID|cookiePolicyId|csConfiguration/i, `${pathname} must not include CMP code.`);
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
    await desktop.route('https://cs.iubenda.com/**', async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: 'window.__iubendaAutoblockingTestLoaded = true;',
      });
    });
    await desktop.route('https://cdn.iubenda.com/**', async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: `
          window.__iubendaRuntimeTestLoaded = true;
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
    await desktop.waitForFunction(() => window.__iubendaRuntimeTestLoaded === true);
    const configuration = await desktop.evaluate(() => window._iub?.csConfiguration);
    assert.equal(configuration.siteId, Number(siteId));
    assert.equal(configuration.cookiePolicyId, Number(cookiePolicyId));
    assert.equal(configuration.googleConsentMode, true);
    assert.equal(configuration.banner.rejectButtonDisplay, true);
    assert.deepEqual(googleRequests, []);
    assert.equal(await desktop.locator('script[src*="googletagmanager"],script[src*="google-analytics"]').count(), 0);
    assert.equal(await desktop.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);

    const preferences = desktop.getByRole('link', { name: 'Gestisci preferenze cookie' });
    await preferences.focus();
    assert.equal(await desktop.evaluate(() => document.activeElement?.textContent?.trim()), 'Gestisci preferenze cookie');
    await preferences.click();
    await desktop.getByRole('dialog', { name: 'Preferenze cookie test' }).waitFor();
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.route('https://cs.iubenda.com/**', (route) => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await mobile.route('https://cdn.iubenda.com/**', (route) => route.fulfill({ contentType: 'application/javascript', body: '' }));
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
