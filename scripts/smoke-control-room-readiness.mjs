import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { createAccessTestCredentials } from './access-test-token.mjs';

const port = Number(process.env.CONTROL_ROOM_READINESS_SMOKE_PORT || 8791);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const maintenanceToken = 'runtime-smoke-control-room-readiness-token';
const access = createAccessTestCredentials();
const accessHeaders = { 'cf-access-jwt-assertion': access.token };
const snapshotProxyPath = '/control-room-foundation/api/snapshot';
const logs = [];

const [fixture, healthFixture, componentSource, apiClientSource] = await Promise.all([
  readFile('tests/fixtures/control-room-snapshot.json', 'utf8').then(JSON.parse),
  readFile('tests/fixtures/control-room-health.json', 'utf8').then(JSON.parse),
  readFile('apps/web/src/components/control-room/ReadinessEvidence.tsx', 'utf8'),
  readFile('apps/web/src/lib/control-room-api.ts', 'utf8')
]);

assert.doesNotMatch(componentSource, /\bfetch\s*\(|XMLHttpRequest|sessionStorage|localStorage|Authorization|Bearer/i);
assert.doesNotMatch(componentSource, /method\s*:\s*['"`](?:POST|PUT|PATCH|DELETE)['"`]/i);
assert.match(apiClientSource, /parseEvidenceBundles/);
assert.match(apiClientSource, /evidenceBundles:\s*parseEvidenceBundles/);
assert.match(apiClientSource, /review_draft_eligible/);
assert.match(apiClientSource, /publication_eligible/);

function record(chunk) {
  const value = chunk.toString();
  logs.push(value);
  process.stdout.write(value);
}

async function waitForRuntime(child, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`wrangler dev exited with code ${child.exitCode}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {
      // workerd is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error('Timed out waiting for the workerd runtime.');
}

const wrangler = spawn(
  process.execPath,
  [
    'node_modules/wrangler/bin/wrangler.js',
    'dev',
    '--config', configPath,
    '--persist-to', '.wrangler/state',
    '--port', String(port),
    '--ip', '127.0.0.1',
    '--var', `CF_ACCESS_TEAM_DOMAIN:${access.issuer}`,
    '--var', `CF_ACCESS_AUD:${access.audience}`,
    '--var', `CF_ACCESS_TEST_JWKS:${access.jwks}`
  ],
  {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: maintenanceToken,
      AI_GATEWAY_TOKEN: 'runtime-smoke-ai-token',
      ASTRO_TELEMETRY_DISABLED: '1'
    },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe']
  }
);

wrangler.stdout.on('data', record);
wrangler.stderr.on('data', record);

function signalWrangler(signal) {
  if (wrangler.exitCode !== null || !wrangler.pid) return;
  if (process.platform === 'win32') wrangler.kill(signal);
  else process.kill(-wrangler.pid, signal);
}

async function stopWrangler() {
  if (wrangler.exitCode !== null) return;
  const exited = once(wrangler, 'exit');
  signalWrangler('SIGTERM');
  const graceful = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000))
  ]);
  if (graceful) return;
  signalWrangler('SIGKILL');
  await Promise.race([once(wrangler, 'exit'), new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

async function mockApis(page, snapshot = fixture) {
  await page.route('**/api/health', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(healthFixture)
  }));
  await page.route(`**${snapshotProxyPath}`, (route) => {
    assert.equal(route.request().method(), 'GET');
    assert.equal(route.request().headers().authorization, undefined);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(snapshot)
    });
  });
}

function accessContext(browser, options = {}) {
  return browser.newContext({ ...options, extraHTTPHeaders: { ...accessHeaders, ...(options.extraHTTPHeaders || {}) } });
}

async function choose(page, label, option) {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByRole('option', { name: option }).click();
}

let browser;

try {
  await waitForRuntime(wrangler);

  const realProxyResponse = await fetch(`${origin}${snapshotProxyPath}`, { headers: accessHeaders });
  const realProxySnapshot = await realProxyResponse.json();
  assert.equal(realProxyResponse.status, 200);
  assert.ok(Array.isArray(realProxySnapshot.evidenceBundles));

  browser = await chromium.launch({ headless: true });

  const context = await accessContext(browser, { viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await mockApis(page);
  const mutationRequests = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') mutationRequests.push(`${request.method()} ${request.url()}`);
  });

  await page.goto(`${origin}/control-room-foundation`);
  await page.getByText('Evidence bundle e gate').waitFor();
  await page.getByText('2 di 2 bundle visibili').waitFor();
  await page.getByTestId('readiness-guardrail').getByText('Draft eligibility ≠ publication eligibility').waitFor();

  const firstRow = page.getByRole('row').filter({ hasText: 'esim-cina-senza-vpn' });
  await firstRow.getByText('77', { exact: true }).waitFor();
  assert.equal(await firstRow.getByText('Sì', { exact: true }).count(), 1);
  assert.equal(await firstRow.getByText('No', { exact: true }).count(), 1);

  const openButton = page.getByRole('button', { name: 'Apri evidence bundle 31' });
  await openButton.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.getByText('Evidence bundle #31').waitFor();
  await dialog.getByText('Readiness 77').waitFor();
  await dialog.getByText('missing_first_party_tests').waitFor();
  await dialog.getByText('provider_scope_conflict').waitFor();
  await dialog.getByText('Test first-party').waitFor();
  await dialog.getByText('fixture-reviewer').waitFor();
  await page.keyboard.press('Escape');

  await choose(page, 'Filtra per stato revisione', 'approved_for_draft');
  await page.getByText('1 di 2 bundle visibili').waitFor();
  await page.getByText('esim-cina-senza-vpn').waitFor();

  await choose(page, 'Filtra per stato revisione', 'Tutti gli stati');
  await choose(page, 'Filtra per idoneità draft', 'Draft non idoneo');
  await page.getByText('esim-hotspot-tethering').waitFor();
  assert.equal(await page.getByText('esim-cina-senza-vpn').count(), 0);

  await choose(page, 'Filtra per idoneità draft', 'Tutti i gate draft');
  await choose(page, 'Filtra per warning', 'Con warning');
  await page.getByText('esim-cina-senza-vpn').waitFor();
  assert.equal(await page.getByText('esim-hotspot-tethering').count(), 0);

  await choose(page, 'Filtra per warning', 'Con o senza warning');
  await choose(page, 'Filtra per idoneità pubblicazione', 'Pubblicazione idonea');
  await page.getByTestId('empty-readiness-filter').waitFor();

  assert.equal(await page.getByRole('button', { name: /approv|genera|pubblic/i }).count(), 0);
  assert.deepEqual(mutationRequests, []);
  await context.close();

  const invalidContext = await accessContext(browser);
  const invalidPage = await invalidContext.newPage();
  await mockApis(invalidPage, {
    ...fixture,
    evidenceBundles: [{ ...fixture.evidenceBundles[0], publication_eligible: 2 }]
  });
  await invalidPage.goto(`${origin}/control-room-foundation`);
  await invalidPage.getByTestId('snapshot-error').waitFor();
  await invalidPage.getByText('Contratto snapshot non valido').waitFor();
  await invalidContext.close();

  const emptyContext = await accessContext(browser);
  const emptyPage = await emptyContext.newPage();
  await mockApis(emptyPage, { ...fixture, evidenceBundles: [] });
  await emptyPage.goto(`${origin}/control-room-foundation`);
  await emptyPage.getByTestId('empty-evidence-bundles').waitFor();
  await emptyContext.close();

  const mobileContext = await accessContext(browser, { viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mockApis(mobilePage);
  await mobilePage.goto(`${origin}/control-room-foundation`);
  await mobilePage.getByText('Evidence bundle e gate').waitFor();
  await mobilePage.getByRole('button', { name: 'Apri navigazione' }).focus();
  await mobilePage.keyboard.press('Enter');
  const mobileNavigation = mobilePage.getByRole('dialog').getByRole('navigation', { name: 'Navigazione Control Room' });
  await mobileNavigation.getByRole('link', { name: 'Readiness' }).waitFor();
  await mobilePage.keyboard.press('Escape');
  await mobileContext.close();

  console.log('Control Room readiness, evidence bundle, gate separation and contract smoke passed.');
} catch (error) {
  console.error(error);
  console.error(logs.join('').slice(-12_000));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await stopWrangler();
}
