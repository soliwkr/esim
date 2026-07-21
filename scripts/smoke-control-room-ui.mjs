import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { createAccessTestCredentials } from './access-test-token.mjs';

const port = Number(process.env.CONTROL_ROOM_SMOKE_PORT || 8789);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const maintenanceToken = 'runtime-smoke-control-room-token';
const access = createAccessTestCredentials();
const accessHeaders = { 'cf-access-jwt-assertion': access.token };
const snapshotProxyPath = '/control-room-foundation/api/snapshot';
const logs = [];

const [fixture, healthFixture] = await Promise.all([
  readFile('tests/fixtures/control-room-snapshot.json', 'utf8').then(JSON.parse),
  readFile('tests/fixtures/control-room-health.json', 'utf8').then(JSON.parse)
]);

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

async function mockHealth(page, body = healthFixture, status = 200) {
  await page.route('**/api/health', (route) => route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body)
  }));
}

async function mockSnapshot(page, body = fixture, status = 200, delayMs = 0) {
  await page.route(`**${snapshotProxyPath}`, async (route) => {
    assert.equal(route.request().method(), 'GET');
    assert.equal(route.request().headers().authorization, undefined);
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

async function mockReadApis(page, snapshot = fixture, delayMs = 0) {
  await mockHealth(page);
  await mockSnapshot(page, snapshot, 200, delayMs);
}

function accessContext(browser, options = {}) {
  return browser.newContext({ ...options, extraHTTPHeaders: { ...accessHeaders, ...(options.extraHTTPHeaders || {}) } });
}

let browser;

try {
  await waitForRuntime(wrangler);

  const anonymousPageResponse = await fetch(`${origin}/control-room-foundation`);
  assert.equal(anonymousPageResponse.status, 403);

  const pageResponse = await fetch(`${origin}/control-room-foundation`, { headers: accessHeaders });
  const serverHtml = await pageResponse.text();
  assert.equal(pageResponse.status, 200);
  assert.match(pageResponse.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(pageResponse.headers.get('cache-control') || '', /no-store/);
  assert.match(pageResponse.headers.get('content-security-policy') || '', /connect-src 'self'/);
  assert.equal((serverHtml.match(/<astro-island/g) || []).length, 1);
  assert.match(serverHtml, /noindex,nofollow,noarchive/);
  assert.doesNotMatch(serverHtml, new RegExp(maintenanceToken));
  assert.doesNotMatch(serverHtml, new RegExp(access.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  const anonymousProxy = await fetch(`${origin}${snapshotProxyPath}`);
  assert.equal(anonymousProxy.status, 403);
  const realProxyResponse = await fetch(`${origin}${snapshotProxyPath}`, { headers: accessHeaders });
  const realProxySnapshot = await realProxyResponse.json();
  assert.equal(realProxyResponse.status, 200);
  assert.match(realProxyResponse.headers.get('cache-control') || '', /no-store/);
  assert.match(realProxyResponse.headers.get('x-robots-tag') || '', /noindex/);
  assert.equal(realProxySnapshot.ok, true);
  for (const key of ['researchRuns', 'signals', 'briefs', 'claims', 'evidenceBundles', 'drafts', 'queue', 'audit']) {
    assert.ok(Array.isArray(realProxySnapshot[key]), `Missing ${key} array`);
  }

  const anonymousSnapshot = await fetch(`${origin}/api/maintenance/control-room`);
  assert.equal(anonymousSnapshot.status, 401);
  const realSnapshotResponse = await fetch(`${origin}/api/maintenance/control-room`, {
    headers: { authorization: `Bearer ${maintenanceToken}` }
  });
  const realSnapshot = await realSnapshotResponse.json();
  assert.equal(realSnapshotResponse.status, 200);
  assert.equal(realSnapshot.ok, true);
  assert.ok(Array.isArray(realSnapshot.queue));
  assert.ok(Array.isArray(realSnapshot.audit));

  browser = await chromium.launch({ headless: true });

  const automaticContext = await accessContext(browser);
  const automaticPage = await automaticContext.newPage();
  let proxyReads = 0;
  let directProtectedReads = 0;
  const consoleMessages = [];
  automaticPage.on('console', (message) => consoleMessages.push(message.text()));
  automaticPage.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname === snapshotProxyPath) proxyReads += 1;
    if (pathname === '/api/maintenance/control-room') directProtectedReads += 1;
  });
  await automaticPage.goto(`${origin}/control-room-foundation`);
  await automaticPage.getByText('Stato operativo').waitFor();
  await automaticPage.getByText('Run di ricerca recente').waitFor();
  await automaticPage.getByText('Priorità editoriali persistite').waitFor();
  await automaticPage.getByText('Draft, preview e revisione').waitFor();
  await automaticPage.getByText('Coda operativa in sola lettura').waitFor();
  await automaticPage.getByText('Eventi e traccia operativa').waitFor();
  await automaticPage.getByTestId('publication-guardrail').waitFor();
  assert.ok(proxyReads >= 1);
  assert.equal(directProtectedReads, 0);
  assert.equal(await automaticPage.getByLabel('Token di manutenzione').count(), 0);
  assert.equal(await automaticPage.getByRole('button', { name: 'Apri sessione' }).count(), 0);
  assert.equal(await automaticPage.getByRole('button', { name: 'Blocca' }).count(), 0);
  assert.equal(await automaticPage.evaluate(() => window.sessionStorage.getItem('srMaintenanceToken')), null);
  assert.equal(consoleMessages.join('\n').includes(maintenanceToken), false);
  assert.equal(await automaticPage.locator('html').getAttribute('data-control-room-hydrated'), 'true');
  assert.equal(new URL(automaticPage.url()).search, '');
  await automaticContext.close();

  const fixtureContext = await accessContext(browser, { viewport: { width: 1280, height: 900 } });
  const fixturePage = await fixtureContext.newPage();
  await mockReadApis(fixturePage, fixture, 450);
  const mutationRequests = [];
  fixturePage.on('request', (request) => {
    if (request.method() !== 'GET') mutationRequests.push(`${request.method()} ${request.url()}`);
  });
  await fixturePage.goto(`${origin}/control-room-foundation`);
  await fixturePage.getByTestId('loading-state').waitFor();
  await fixturePage.getByText('Fonti e coda').waitFor();
  await fixturePage.getByLabel('Run di ricerca recente').getByText('eSIM Cina problemi VPN').waitFor();
  await fixturePage.getByText('Le eSIM in Cina funzionano davvero senza VPN?').waitFor();
  await fixturePage.getByText('eSIM in Cina: funzionano davvero senza VPN?').waitFor();
  await fixturePage.getByText('Claim dallo snapshot').waitFor();
  await fixturePage.getByText('Evidence bundle e gate').waitFor();
  await fixturePage.getByText('Draft, preview e revisione').waitFor();
  await fixturePage.getByText('eSIM in Cina: dichiarazioni dei provider e limiti delle prove').waitFor();
  await fixturePage.getByText('Coda operativa in sola lettura').waitFor();
  await fixturePage.getByText('Eventi e traccia operativa').waitFor();
  await fixturePage.getByText('fixture_review_worker_unavailable').waitFor();
  await fixturePage.getByTestId('publication-guardrail').getByText('disabilitata').waitFor();

  const runButton = fixturePage.getByRole('button', { name: 'Apri run 501' });
  await runButton.focus();
  await fixturePage.keyboard.press('Enter');
  await fixturePage.getByRole('dialog').getByText('Run radar #501').waitFor();
  await fixturePage.keyboard.press('Escape');

  await fixturePage.getByRole('button', { name: 'Vedi segnali' }).first().click();
  await fixturePage.getByText('Le eSIM in Cina funzionano davvero senza VPN?').waitFor();
  assert.equal(await fixturePage.getByText('Hotspot non disponibile durante il viaggio').count(), 0);

  const signalButton = fixturePage.getByRole('button', { name: 'Apri segnale 601' });
  await signalButton.focus();
  await fixturePage.keyboard.press('Enter');
  await fixturePage.getByRole('dialog').getByText('Segnale #601').waitFor();
  await fixturePage.getByRole('dialog').getByText('Segnale, non prova commerciale').waitFor();
  await fixturePage.keyboard.press('Escape');

  const briefButton = fixturePage.getByRole('button', { name: 'Apri brief 701' });
  await briefButton.focus();
  await fixturePage.keyboard.press('Enter');
  await fixturePage.getByRole('dialog').getByText('Brief #701').waitFor();
  await fixturePage.keyboard.press('Escape');

  const claimButton = fixturePage.getByRole('button', { name: 'Apri claim 101' });
  await claimButton.focus();
  await fixturePage.keyboard.press('Enter');
  await fixturePage.getByRole('dialog').getByText('Claim #101').waitFor();
  await fixturePage.keyboard.press('Escape');

  const draftButton = fixturePage.getByRole('button', { name: 'Apri draft 202' });
  await draftButton.focus();
  await fixturePage.keyboard.press('Enter');
  await fixturePage.getByRole('dialog').getByText('Draft #202').waitFor();
  await fixturePage.getByRole('dialog').getByText('Decisione editoriale ≠ pubblicazione').waitFor();
  await fixturePage.keyboard.press('Escape');

  const queueButton = fixturePage.getByRole('button', { name: 'Apri task queue 803' });
  await queueButton.focus();
  await fixturePage.keyboard.press('Enter');
  await fixturePage.getByRole('dialog').getByText('Task queue #803').waitFor();
  await fixturePage.keyboard.press('Escape');

  await fixturePage.getByRole('combobox', { name: 'Filtra per stato', exact: true }).click();
  await fixturePage.getByRole('option', { name: 'pending' }).click();
  await fixturePage.getByText('La velocità dichiarata è ancora da verificare.').waitFor();
  assert.equal(await fixturePage.getByRole('button', { name: /retry|complete|dismiss|pubblic|approv|genera|rigenera/i }).count(), 0);
  assert.deepEqual(mutationRequests, []);
  await fixtureContext.close();

  const healthFailureContext = await accessContext(browser);
  const healthFailurePage = await healthFailureContext.newPage();
  await mockSnapshot(healthFailurePage);
  await mockHealth(healthFailurePage, { ok: false, error: 'fixture_health_failure' }, 500);
  await healthFailurePage.goto(`${origin}/control-room-foundation`);
  await healthFailurePage.getByTestId('health-error').waitFor();
  await healthFailurePage.getByText('Run di ricerca recente').waitFor();
  await healthFailurePage.getByText('Draft, preview e revisione').waitFor();
  await healthFailurePage.getByText('Coda operativa in sola lettura').waitFor();
  await healthFailureContext.close();

  const snapshotFailureContext = await accessContext(browser);
  const snapshotFailurePage = await snapshotFailureContext.newPage();
  await mockHealth(snapshotFailurePage);
  await mockSnapshot(snapshotFailurePage, { ok: false, error: 'fixture_snapshot_failure' }, 500);
  await snapshotFailurePage.goto(`${origin}/control-room-foundation`);
  await snapshotFailurePage.getByTestId('snapshot-error').waitFor();
  await snapshotFailurePage.getByText('Binding del radar recent-demand.').waitFor();
  assert.equal(await snapshotFailurePage.getByText('Draft, preview e revisione').count(), 0);
  assert.equal(await snapshotFailurePage.getByText('Coda operativa in sola lettura').count(), 0);
  await snapshotFailureContext.close();

  const invalidSnapshotContext = await accessContext(browser);
  const invalidSnapshotPage = await invalidSnapshotContext.newPage();
  await mockHealth(invalidSnapshotPage);
  await mockSnapshot(invalidSnapshotPage, {
    ...fixture,
    signals: [{ ...fixture.signals[0], run_id: 'invalid-run' }]
  });
  await invalidSnapshotPage.goto(`${origin}/control-room-foundation`);
  await invalidSnapshotPage.getByTestId('snapshot-error').waitFor();
  await invalidSnapshotPage.getByText('Contratto snapshot non valido').waitFor();
  await invalidSnapshotContext.close();

  const invalidHealthContext = await accessContext(browser);
  const invalidHealthPage = await invalidHealthContext.newPage();
  await mockSnapshot(invalidHealthPage);
  await mockHealth(invalidHealthPage, { ...healthFixture, aiGateway: 7 });
  await invalidHealthPage.goto(`${origin}/control-room-foundation`);
  await invalidHealthPage.getByTestId('health-error').waitFor();
  await invalidHealthPage.getByText('Contratto Health API non valido').waitFor();
  await invalidHealthContext.close();

  const emptyContext = await accessContext(browser);
  const emptyPage = await emptyContext.newPage();
  await mockReadApis(emptyPage, {
    ...fixture,
    researchRuns: [],
    signals: [],
    briefs: [],
    claims: [],
    evidenceBundles: [],
    drafts: [],
    queue: [],
    audit: []
  });
  await emptyPage.goto(`${origin}/control-room-foundation`);
  await emptyPage.getByTestId('empty-runs').waitFor();
  await emptyPage.getByTestId('empty-signals').waitFor();
  await emptyPage.getByTestId('empty-briefs').waitFor();
  await emptyPage.getByTestId('empty-claims').waitFor();
  await emptyPage.getByTestId('empty-evidence-bundles').waitFor();
  await emptyPage.getByTestId('empty-drafts').waitFor();
  await emptyPage.getByTestId('empty-queue').waitFor();
  await emptyPage.getByTestId('empty-audit').waitFor();
  await emptyContext.close();

  const mobileContext = await accessContext(browser, { viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mockReadApis(mobilePage);
  await mobilePage.goto(`${origin}/control-room-foundation`);
  await mobilePage.getByTestId('control-room-app').waitFor();
  await mobilePage.locator('html[data-control-room-hydrated="true"]').waitFor();
  await mobilePage.getByText('Draft, preview e revisione').waitFor();
  await mobilePage.getByText('Coda operativa in sola lettura').waitFor();
  await mobilePage.getByRole('button', { name: 'Apri navigazione' }).focus();
  await mobilePage.keyboard.press('Enter');
  const mobileNavigation = mobilePage.getByRole('dialog').getByRole('navigation', { name: 'Navigazione Control Room' });
  await mobileNavigation.waitFor();
  await mobileNavigation.getByRole('link', { name: 'Radar' }).waitFor();
  await mobileNavigation.getByRole('link', { name: 'Brief' }).waitFor();
  await mobileNavigation.getByRole('link', { name: 'Readiness' }).waitFor();
  await mobileNavigation.getByRole('link', { name: 'Draft e decisioni' }).waitFor();
  await mobileNavigation.getByRole('link', { name: 'Queue', exact: true }).waitFor();
  await mobileNavigation.getByRole('link', { name: 'Audit', exact: true }).waitFor();
  await mobilePage.keyboard.press('Escape');
  await mobileContext.close();

  console.log('Control Room overview, radar, signals, briefs, claims, readiness, drafts, queue, audit, Access and browser smoke passed.');
} catch (error) {
  console.error(error);
  console.error(logs.join('').slice(-12_000));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await stopWrangler();
}
