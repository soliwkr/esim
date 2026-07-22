import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { createAccessTestCredentials } from './access-test-token.mjs';

const port = Number(process.env.CONTROL_ROOM_DRAFT_DETAIL_SMOKE_PORT || 8795);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const maintenanceToken = 'runtime-smoke-control-room-draft-detail-token';
const access = createAccessTestCredentials();
const accessHeaders = { 'cf-access-jwt-assertion': access.token };
const snapshotProxyPath = '/control-room-foundation/api/snapshot';
const detailProxyPath = '/control-room-foundation/api/draft-detail';
const logs = [];

const [snapshotFixture, healthFixture, detailFixture, componentSource, apiSource, contractSource, workerSource] = await Promise.all([
  readFile('tests/fixtures/control-room-snapshot.json', 'utf8').then(JSON.parse),
  readFile('tests/fixtures/control-room-health.json', 'utf8').then(JSON.parse),
  readFile('tests/fixtures/control-room-draft-detail.json', 'utf8').then(JSON.parse),
  readFile('apps/web/src/components/control-room/DraftDetailReadonly.tsx', 'utf8'),
  readFile('apps/web/src/lib/draft-detail-api.ts', 'utf8'),
  readFile('apps/web/src/lib/draft-detail-contract.ts', 'utf8'),
  readFile('apps/web/src/worker.ts', 'utf8')
]);

assert.doesNotMatch(componentSource, /\bfetch\s*\(|XMLHttpRequest|sessionStorage|localStorage|Authorization|Bearer/i);
assert.doesNotMatch(componentSource, /method\s*:\s*['"`](?:POST|PUT|PATCH|DELETE)['"`]/i);
assert.match(componentSource, /Approved draft ≠ published page/);
assert.match(componentSource, /Risorsa indipendente e GET-only/);
assert.match(apiSource, /control-room-foundation\/api\/draft-detail/);
assert.doesNotMatch(apiSource, /Authorization|Bearer|maintenance-token/i);
assert.match(contractSource, /parseDraftDetailResponse/);
assert.match(contractSource, /materializedPageStatus/);
assert.match(contractSource, /fieldClaimIds/);
assert.match(workerSource, /CONTROL_ROOM_DRAFT_DETAIL_PATH/);
assert.match(workerSource, /editorial-draft-grounding/);
assert.match(workerSource, /method_not_allowed/);

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

function accessContext(browser, options = {}) {
  return browser.newContext({ ...options, extraHTTPHeaders: { ...accessHeaders, ...(options.extraHTTPHeaders || {}) } });
}

async function mockBaseApis(page, snapshot = snapshotFixture) {
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

async function mockDetail(page, body = detailFixture, status = 200, counter = null) {
  await page.route(/\/control-room-foundation\/api\/draft-detail\?draftId=\d+$/, (route) => {
    if (counter) counter.count += 1;
    assert.equal(route.request().method(), 'GET');
    assert.equal(route.request().headers().authorization, undefined);
    return route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body)
    });
  });
}

async function openDetail(page) {
  const section = page.getByTestId('draft-detail-section');
  await section.getByText('Dettaglio draft completo').waitFor();
  const button = section.getByRole('button', { name: /Apri dettaglio completo draft 202/ });
  await button.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.getByText('Dettaglio completo draft #202').waitFor();
  return dialog;
}

let browser;

try {
  await waitForRuntime(wrangler);

  const anonymous = await fetch(`${origin}${detailProxyPath}?draftId=202`);
  assert.equal(anonymous.status, 403);

  const invalidAccess = await fetch(`${origin}${detailProxyPath}?draftId=202`, {
    headers: { 'cf-access-jwt-assertion': `${access.token}invalid` }
  });
  assert.equal(invalidAccess.status, 403);

  const mutation = await fetch(`${origin}${detailProxyPath}?draftId=202`, {
    method: 'POST',
    headers: accessHeaders
  });
  assert.equal(mutation.status, 405);
  assert.equal(mutation.headers.get('allow'), 'GET');

  const invalidId = await fetch(`${origin}${detailProxyPath}?draftId=invalid`, { headers: accessHeaders });
  assert.equal(invalidId.status, 400);

  const missing = await fetch(`${origin}${detailProxyPath}?draftId=999999`, { headers: accessHeaders });
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get('cache-control') || '', /no-store/);
  assert.match(missing.headers.get('x-robots-tag') || '', /noindex/);

  browser = await chromium.launch({ headless: true });

  const context = await accessContext(browser, { viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const detailRequests = { count: 0 };
  await mockBaseApis(page);
  await mockDetail(page, detailFixture, 200, detailRequests);
  const mutationRequests = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') mutationRequests.push(`${request.method()} ${request.url()}`);
  });

  await page.goto(`${origin}/control-room-foundation`);
  await page.getByTestId('draft-detail-section').waitFor();
  assert.equal(detailRequests.count, 0, 'Draft detail must not load before opening a version.');

  const dialog = await openDetail(page);
  await dialog.getByTestId('draft-detail-ready').waitFor();
  assert.equal(detailRequests.count, 1);
  await dialog.getByText('Draft: approved').waitFor();
  await dialog.getByText('Pagina: review').waitFor();
  await dialog.getByText('Publication eligibility: no').waitFor();
  await dialog.getByText('eSIM in Cina: cosa dichiarano i provider').waitFor();
  await dialog.getByText('Cosa dichiarano le fonti ufficiali').waitFor();
  await dialog.getByText('Limite delle evidenze').waitFor();
  await dialog.getByText('Una eSIM evita sempre la VPN in Cina?').waitFor();
  await dialog.getByRole('link', { name: /Airalo · pagina ufficiale Cina/ }).waitFor();
  await dialog.getByText('#101', { exact: true }).first().waitFor();
  await dialog.getByText('#105', { exact: true }).waitFor();
  assert.equal(await dialog.getByRole('button', { name: /approv|genera|rigenera|materializz|pubblic|rifiut/i }).count(), 0);
  assert.deepEqual(mutationRequests, []);
  await page.keyboard.press('Escape');
  await context.close();

  const invalidContext = await accessContext(browser);
  const invalidPage = await invalidContext.newPage();
  await mockBaseApis(invalidPage);
  const invalidDetail = structuredClone(detailFixture);
  invalidDetail.draft.fieldClaimIds.title = [101, 'invalid'];
  await mockDetail(invalidPage, invalidDetail);
  await invalidPage.goto(`${origin}/control-room-foundation`);
  const invalidDialog = await openDetail(invalidPage);
  await invalidDialog.getByTestId('draft-detail-error').waitFor();
  await invalidDialog.getByText('Contratto dettaglio draft non valido').waitFor();
  await invalidPage.getByTestId('drafts-section').getByText('Draft, preview e revisione').waitFor();
  await invalidContext.close();

  const errorContext = await accessContext(browser);
  const errorPage = await errorContext.newPage();
  const retries = { count: 0 };
  await mockBaseApis(errorPage);
  await mockDetail(errorPage, { ok: false, error: 'temporary_unavailable' }, 503, retries);
  await errorPage.goto(`${origin}/control-room-foundation`);
  const errorDialog = await openDetail(errorPage);
  await errorDialog.getByTestId('draft-detail-error').waitFor();
  await errorDialog.getByText('Dettaglio draft non disponibile').waitFor();
  await errorDialog.getByRole('button', { name: 'Riprova' }).click();
  await errorDialog.getByTestId('draft-detail-error').waitFor();
  assert.equal(retries.count, 2);
  await errorPage.getByTestId('drafts-section').getByText('2 di 2 draft visibili').waitFor();
  await errorContext.close();

  const emptyContext = await accessContext(browser);
  const emptyPage = await emptyContext.newPage();
  await mockBaseApis(emptyPage, { ...snapshotFixture, drafts: [] });
  await emptyPage.goto(`${origin}/control-room-foundation`);
  await emptyPage.getByTestId('empty-draft-detail').waitFor();
  await emptyContext.close();

  const mobileContext = await accessContext(browser, { viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mockBaseApis(mobilePage);
  await mockDetail(mobilePage);
  await mobilePage.goto(`${origin}/control-room-foundation`);
  await mobilePage.getByRole('button', { name: 'Apri navigazione' }).click();
  const mobileNavigation = mobilePage.getByRole('dialog').getByRole('navigation', { name: 'Navigazione Control Room' });
  await mobileNavigation.getByRole('link', { name: 'Dettaglio draft' }).waitFor();
  await mobilePage.keyboard.press('Escape');
  const mobileDialog = await openDetail(mobilePage);
  await mobileDialog.getByTestId('draft-detail-ready').waitFor();
  await mobileContext.close();

  console.log('Control Room draft detail proxy, strict contract, on-demand loading and read-only UI smoke passed.');
} catch (error) {
  console.error(error);
  console.error(logs.join('').slice(-12_000));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await stopWrangler();
}
