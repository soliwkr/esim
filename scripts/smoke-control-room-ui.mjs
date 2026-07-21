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

async function mockReadApis(page, snapshot = fixture, delayMs = 0) {
  await page.route('**/api/health', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(healthFixture)
  }));
  await page.route(`**${snapshotProxyPath}`, async (route) => {
    assert.equal(route.request().method(), 'GET');
    assert.equal(route.request().headers().authorization, undefined);
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snapshot) });
  });
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
  assert.ok(Array.isArray(realProxySnapshot.claims));
  assert.ok(Array.isArray(realProxySnapshot.drafts));

  const anonymousSnapshot = await fetch(`${origin}/api/maintenance/control-room`);
  assert.equal(anonymousSnapshot.status, 401);
  const realSnapshotResponse = await fetch(`${origin}/api/maintenance/control-room`, {
    headers: { authorization: `Bearer ${maintenanceToken}` }
  });
  const realSnapshot = await realSnapshotResponse.json();
  assert.equal(realSnapshotResponse.status, 200);
  assert.equal(realSnapshot.ok, true);
  assert.ok(Array.isArray(realSnapshot.claims));
  assert.ok(Array.isArray(realSnapshot.drafts));

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
  await automaticPage.getByText('Stato del runtime').waitFor();
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
  await fixturePage.getByText('Claim dallo snapshot').waitFor();
  await fixturePage.getByText('Fixture: guida di destinazione').waitFor();
  const claimButton = fixturePage.getByRole('button', { name: 'Apri claim 101' });
  await claimButton.focus();
  await fixturePage.keyboard.press('Enter');
  await fixturePage.getByRole('dialog').getByText('Claim #101').waitFor();
  await fixturePage.keyboard.press('Escape');
  await fixturePage.getByRole('combobox', { name: 'Filtra per stato' }).click();
  await fixturePage.getByRole('option', { name: 'pending' }).click();
  await fixturePage.getByText('La velocità dichiarata è ancora da verificare.').waitFor();
  assert.equal(await fixturePage.getByRole('button', { name: /pubblic/i }).count(), 0);
  assert.deepEqual(mutationRequests, []);
  await fixtureContext.close();

  const emptyContext = await accessContext(browser);
  const emptyPage = await emptyContext.newPage();
  await mockReadApis(emptyPage, { ...fixture, claims: [], drafts: [] });
  await emptyPage.goto(`${origin}/control-room-foundation`);
  await emptyPage.getByTestId('empty-claims').waitFor();
  await emptyPage.getByTestId('empty-drafts').waitFor();
  await emptyContext.close();

  const errorContext = await accessContext(browser);
  const errorPage = await errorContext.newPage();
  await errorPage.route('**/api/health', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(healthFixture) }));
  await errorPage.route(`**${snapshotProxyPath}`, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'fixture_failure' }) }));
  await errorPage.goto(`${origin}/control-room-foundation`);
  await errorPage.getByTestId('error-state').waitFor();
  await errorPage.getByRole('button', { name: 'Riprova' }).waitFor();
  await errorContext.close();

  const mobileContext = await accessContext(browser, { viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mockReadApis(mobilePage);
  await mobilePage.goto(`${origin}/control-room-foundation`);
  await mobilePage.locator('html[data-control-room-hydrated="true"]').waitFor();
  await mobilePage.getByRole('button', { name: 'Apri navigazione' }).focus();
  await mobilePage.keyboard.press('Enter');
  await mobilePage.getByRole('dialog').getByRole('navigation', { name: 'Navigazione Control Room' }).waitFor();
  await mobilePage.keyboard.press('Escape');
  await mobileContext.close();

  console.log('Control Room Access, server-side session and browser smoke passed.');
} catch (error) {
  console.error(error);
  console.error(logs.join('').slice(-12_000));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await stopWrangler();
}
