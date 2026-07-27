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
import {
  applyProductionMeasurementConfig,
  PRODUCTION_GA4_MEASUREMENT_ID,
  PRODUCTION_GTM_ID,
} from './prepare-production-measurement-config.mjs';

const port = Number(process.env.PUBLIC_MEASUREMENT_SMOKE_PORT || 8843);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const statePath = '.wrangler/public-measurement-smoke';
const embedId = '11111111-2222-4333-8444-555555555555';
const gtmId = 'GTM-TEST123';
const ga4MeasurementId = 'G-TEST123';
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

async function loadMeasurementContract() {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'senza-roaming-measurement-'));
  const compiledModulePath = path.join(temporaryDirectory, 'public-measurement.mjs');
  const source = await readFile('src/public-measurement.ts', 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      strict: true,
      verbatimModuleSyntax: true,
    },
    fileName: 'src/public-measurement.ts',
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
  const contract = await import(`${pathToFileURL(compiledModulePath).href}?v=${Date.now()}`);
  return { contract, temporaryDirectory };
}

async function verifyPureContract() {
  const { contract, temporaryDirectory } = await loadMeasurementContract();
  try {
    const consentEnabled = {
      kind: 'enabled',
      config: { provider: 'iubenda', embedId },
    };
    assert.deepEqual(contract.resolvePublicMeasurementConfig({}, consentEnabled), { kind: 'disabled' });
    assert.deepEqual(
      contract.resolvePublicMeasurementConfig({ GTM_ID: gtmId }, consentEnabled),
      { kind: 'invalid', reason: 'incomplete' },
    );
    assert.deepEqual(
      contract.resolvePublicMeasurementConfig(
        { GTM_ID: 'GTM invalid', GA4_MEASUREMENT_ID: ga4MeasurementId },
        consentEnabled,
      ),
      { kind: 'invalid', reason: 'invalid_gtm_id' },
    );
    assert.deepEqual(
      contract.resolvePublicMeasurementConfig(
        { GTM_ID: gtmId, GA4_MEASUREMENT_ID: 'UA-LEGACY' },
        consentEnabled,
      ),
      { kind: 'invalid', reason: 'invalid_ga4_measurement_id' },
    );
    assert.deepEqual(
      contract.resolvePublicMeasurementConfig(
        { GTM_ID: gtmId, GA4_MEASUREMENT_ID: ga4MeasurementId },
        { kind: 'disabled' },
      ),
      { kind: 'invalid', reason: 'consent_unavailable' },
    );

    const enabled = contract.resolvePublicMeasurementConfig(
      { GTM_ID: ` ${gtmId.toLowerCase()} `, GA4_MEASUREMENT_ID: ` ${ga4MeasurementId.toLowerCase()} ` },
      consentEnabled,
    );
    assert.equal(enabled.kind, 'enabled');
    assert.equal(enabled.config.gtmId, gtmId);
    assert.equal(enabled.config.ga4MeasurementId, ga4MeasurementId);
    assert.equal(Object.isFrozen(enabled), true);
    assert.equal(Object.isFrozen(enabled.config), true);

    const home = contract.resolvePublicMeasurementPageContext({ routeClass: 'home', pageType: 'home' });
    assert.equal(home.kind, 'enabled');
    assert.deepEqual(home.context, {
      routeClass: 'home',
      pageType: 'home',
      contentSlug: '',
      renderMode: 'canonical',
      siteLanguage: 'it',
    });
    const article = contract.resolvePublicMeasurementPageContext({
      routeClass: 'article',
      pageType: 'comparison',
      contentSlug: 'migliore-esim',
    });
    assert.equal(article.kind, 'enabled');
    assert.deepEqual(
      contract.resolvePublicMeasurementPageContext({ routeClass: 'article', pageType: 'guide' }),
      { kind: 'invalid', reason: 'invalid_content_slug' },
    );
    assert.deepEqual(
      contract.resolvePublicMeasurementPageContext({ routeClass: 'trust', pageType: 'comparison' }),
      { kind: 'invalid', reason: 'invalid_combination' },
    );
    assert.deepEqual(
      contract.resolvePublicMeasurementPageContext({ routeClass: 'home', pageType: 'home', contentSlug: 'unexpected' }),
      { kind: 'invalid', reason: 'invalid_content_slug' },
    );

    const script = contract.publicMeasurementBootstrapScript(enabled.config, article.context);
    assert.match(script, /__SENZA_ROAMING_MEASUREMENT_V1__/);
    assert.match(script, /sr_page_view_ready/);
    assert.match(script, /googletagmanager\.com\/gtm\.js/);
    assert.match(script, /migliore-esim/);
    assert.doesNotMatch(script, /location\.href|location\.search|location\.hash/);

    const sourceConfig = {
      vars: {
        CMP_PROVIDER: '',
        CMP_EMBED_ID: '',
        GTM_ID: '',
        GA4_MEASUREMENT_ID: '',
        AFFILIATE_MODE: 'disabled',
      },
    };
    const consentConfig = applyProductionConsentConfig(sourceConfig);
    const productionConfig = applyProductionMeasurementConfig(consentConfig);
    assert.equal(sourceConfig.vars.CMP_PROVIDER, '');
    assert.equal(consentConfig.vars.CMP_PROVIDER, PRODUCTION_CONSENT_PROVIDER);
    assert.equal(consentConfig.vars.CMP_EMBED_ID, PRODUCTION_CONSENT_EMBED_ID);
    assert.equal(productionConfig.vars.GTM_ID, PRODUCTION_GTM_ID);
    assert.equal(productionConfig.vars.GA4_MEASUREMENT_ID, PRODUCTION_GA4_MEASUREMENT_ID);
    assert.throws(
      () => applyProductionMeasurementConfig({ vars: { ...consentConfig.vars, GTM_ID: 'GTM-OTHER' } }),
      /Source GTM_ID must remain empty/,
    );
    assert.throws(
      () => applyProductionMeasurementConfig({ vars: { ...consentConfig.vars, AFFILIATE_MODE: 'enabled' } }),
      /AFFILIATE_MODE=disabled/,
    );
    assert.throws(
      () => applyProductionMeasurementConfig({ vars: { ...consentConfig.vars, GOOGLE_ADS_ID: 'AW-1' } }),
      /Advertising variable GOOGLE_ADS_ID/,
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
    '--var', `GTM_ID:${gtmId}`,
    '--var', `GA4_MEASUREMENT_ID:${ga4MeasurementId}`,
    '--var', `CF_ACCESS_TEAM_DOMAIN:${access.issuer}`,
    '--var', `CF_ACCESS_AUD:${access.audience}`,
    '--var', `CF_ACCESS_TEST_JWKS:${access.jwks}`,
  ], {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: 'measurement-smoke-maintenance-token',
      AI_GATEWAY_TOKEN: 'measurement-smoke-ai-token',
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
  throw new Error(`Measurement runtime timed out.\n${logs.join('')}`);
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

async function verifyRuntime() {
  const homeResponse = await fetch(`${origin}/`);
  const homeHtml = await homeResponse.text();
  assert.equal(homeResponse.status, 200);
  assert.equal(homeHtml.match(/class="_iub_cs_activate"/g)?.length, 1);
  assert.match(homeHtml, /type="text\/plain"/);
  assert.match(homeHtml, /data-iub-purposes="4"/);
  assert.match(homeHtml, /sr_page_view_ready/);
  assert.match(homeHtml, new RegExp(gtmId));
  assert.match(homeHtml, new RegExp(ga4MeasurementId));
  assert.doesNotMatch(homeHtml, /<noscript[^>]*>[\s\S]*googletagmanager/i);

  const previewHtml = await (await fetch(`${origin}/astro-foundation`)).text();
  assert.doesNotMatch(previewHtml, /_iub_cs_activate|sr_page_view_ready|GTM-TEST123|G-TEST123/);

  const privacyHtml = await (await fetch(`${origin}/privacy`)).text();
  assert.match(privacyHtml, /iubenda, GTM e GA4 sono configurati con caricamento post-consenso\./);
  assert.match(privacyHtml, /Google Consent Mode Basic/);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    const gtmRequests = [];
    page.on('request', (request) => {
      if (/googletagmanager\.com\/gtm\.js/i.test(request.url())) gtmRequests.push(request.url());
    });
    await page.route('https://embeds.iubenda.com/widgets/**', async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: `
          window.__grantMeasurementConsent = function () {
            var blocked = document.querySelector('script._iub_cs_activate[type="text/plain"][data-iub-purposes="4"]');
            if (!blocked) throw new Error('Blocked measurement script missing');
            var active = document.createElement('script');
            active.textContent = blocked.textContent;
            blocked.after(active);
          };
        `,
      });
    });
    await page.route('https://www.googletagmanager.com/gtm.js**', async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: 'window.__gtmMeasurementSmokeLoaded=(window.__gtmMeasurementSmokeLoaded||0)+1;',
      });
    });

    await page.goto(`${origin}/?utm_source=must-not-leak#fragment`);
    await page.getByRole('heading', { level: 1, name: 'Scegli la eSIM giusta per il tuo viaggio.' }).waitFor();
    assert.equal(gtmRequests.length, 0);
    assert.equal(await page.evaluate(() => typeof window.dataLayer), 'undefined');
    assert.equal(await page.locator('script._iub_cs_activate[type="text/plain"][data-iub-purposes="4"]').count(), 1);

    await page.evaluate(() => window.__grantMeasurementConsent());
    await page.waitForFunction(() => window.__gtmMeasurementSmokeLoaded === 1);
    assert.equal(gtmRequests.length, 1);
    assert.match(gtmRequests[0], new RegExp(`id=${gtmId}`));

    const state = await page.evaluate(() => ({
      loaded: window.__SENZA_ROAMING_MEASUREMENT_V1__,
      dataLayer: window.dataLayer,
    }));
    assert.equal(state.loaded, true);
    const context = state.dataLayer.find((entry) => entry.sr_ga4_measurement_id);
    assert.equal(context.sr_ga4_measurement_id, ga4MeasurementId);
    assert.equal(context.route_class, 'home');
    assert.equal(context.page_type, 'home');
    assert.equal(context.content_slug, '');
    assert.equal(context.render_mode, 'canonical');
    assert.equal(context.site_language, 'it');
    assert.equal(context.page_location, `${origin}/`);
    const pageReadyEvents = state.dataLayer.filter((entry) => entry.event === 'sr_page_view_ready');
    assert.equal(pageReadyEvents.length, 1);
    assert.equal(pageReadyEvents[0].page_location, `${origin}/`);
    assert.doesNotMatch(pageReadyEvents[0].page_location, /[?#]/);

    await page.evaluate(() => window.__grantMeasurementConsent());
    await page.waitForTimeout(100);
    assert.equal(gtmRequests.length, 1);
    assert.equal(await page.evaluate(() => window.dataLayer.filter((entry) => entry.event === 'sr_page_view_ready').length), 1);
    await page.close();
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
  console.log('Public measurement foundation smoke passed.');
} finally {
  await stopRuntime(child);
  await rm(statePath, { recursive: true, force: true });
}
