import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { createAccessTestCredentials } from './access-test-token.mjs';

const port = Number(process.env.CONTROL_ROOM_QUEUE_AUDIT_SMOKE_PORT || 8793);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const maintenanceToken = 'runtime-smoke-control-room-queue-audit-token';
const access = createAccessTestCredentials();
const accessHeaders = { 'cf-access-jwt-assertion': access.token };
const snapshotProxyPath = '/control-room-foundation/api/snapshot';
const logs = [];

const [fixture, healthFixture, componentSource, apiClientSource] = await Promise.all([
  readFile('tests/fixtures/control-room-snapshot.json', 'utf8').then(JSON.parse),
  readFile('tests/fixtures/control-room-health.json', 'utf8').then(JSON.parse),
  readFile('apps/web/src/components/control-room/QueueAudit.tsx', 'utf8'),
  readFile('apps/web/src/lib/control-room-api.ts', 'utf8')
]);

assert.doesNotMatch(componentSource, /\bfetch\s*\(|XMLHttpRequest|sessionStorage|localStorage|Authorization|Bearer/i);
assert.doesNotMatch(componentSource, /method\s*:\s*['"`](?:POST|PUT|PATCH|DELETE)['"`]/i);
assert.match(componentSource, /Queue status ≠ decisione editoriale/);
assert.match(componentSource, /Audit event ≠ autorizzazione operativa/);
assert.match(apiClientSource, /function parseQueue/);
assert.match(apiClientSource, /function parseAudit/);
assert.match(apiClientSource, /queue:\s*parseQueue\(value\.queue\)/);
assert.match(apiClientSource, /audit:\s*parseAudit\(value\.audit\)/);

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
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

async function expectInvalidSnapshot(browser, snapshot) {
  const context = await accessContext(browser);
  const page = await context.newPage();
  await mockApis(page, snapshot);
  await page.goto(`${origin}/control-room-foundation`);
  await page.getByTestId('snapshot-error').waitFor();
  await page.getByText('Contratto snapshot non valido').waitFor();
  await context.close();
}

let browser;

try {
  await waitForRuntime(wrangler);

  const realProxyResponse = await fetch(`${origin}${snapshotProxyPath}`, { headers: accessHeaders });
  const realProxySnapshot = await realProxyResponse.json();
  assert.equal(realProxyResponse.status, 200);
  assert.ok(Array.isArray(realProxySnapshot.queue));
  assert.ok(Array.isArray(realProxySnapshot.audit));

  browser = await chromium.launch({ headless: true });

  const context = await accessContext(browser, { viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await mockApis(page);
  const mutationRequests = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') mutationRequests.push(`${request.method()} ${request.url()}`);
  });

  await page.goto(`${origin}/control-room-foundation`);

  const queue = page.getByTestId('queue-section');
  await queue.getByText('Coda operativa in sola lettura').waitFor();
  await queue.getByText('4 di 4 task visibili').waitFor();
  await queue.getByTestId('queue-guardrail').getByText('Queue status ≠ decisione editoriale').waitFor();
  await queue.getByText('fixture_review_worker_unavailable').waitFor();

  const taskButton = queue.getByRole('button', { name: 'Apri task queue 803' });
  await taskButton.focus();
  await page.keyboard.press('Enter');
  let dialog = page.getByRole('dialog');
  await dialog.getByText('Task queue #803').waitFor();
  await dialog.getByText('Ultimo errore persistito').waitFor();
  await dialog.getByText('fixture_review_worker_unavailable').waitFor();
  await dialog.getByText('field_grounded_draft_generated').waitFor();
  await dialog.getByTestId('queue-task-guardrail').waitFor();
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });

  await choose(page, 'Filtra queue per stato', 'failed');
  await queue.getByText('1 di 4 task visibili').waitFor();
  await queue.getByRole('row').filter({ hasText: 'editorial_review' }).waitFor();
  assert.equal(await queue.getByRole('row').filter({ hasText: 'editorial-claim:102' }).count(), 0);

  await choose(page, 'Filtra queue per stato', 'Tutti gli stati');
  await choose(page, 'Filtra queue per task type', 'verify_claims');
  await queue.getByText('2 di 4 task visibili').waitFor();

  await choose(page, 'Filtra queue per task type', 'Tutti i task type');
  await choose(page, 'Filtra queue per entity type', 'provider');
  await queue.getByText('1 di 4 task visibili').waitFor();
  await queue.getByText('refresh_source').waitFor();

  await choose(page, 'Filtra queue per entity type', 'Tutte le entità');
  await choose(page, 'Filtra queue per condizione', 'Con lock');
  await queue.getByText('1 di 4 task visibili').waitFor();
  await queue.getByRole('row').filter({ hasText: 'editorial-claim:102' }).waitFor();

  await choose(page, 'Filtra queue per condizione', 'Tutte le condizioni');

  const audit = page.getByTestId('audit-section');
  await audit.getByText('Eventi e traccia operativa').waitFor();
  await audit.getByText('5 di 5 eventi visibili').waitFor();
  await audit.getByTestId('audit-guardrail').getByText('Audit event ≠ autorizzazione operativa').waitFor();

  const auditButton = audit.getByRole('button', { name: 'Apri evento audit 1' });
  await auditButton.focus();
  await page.keyboard.press('Enter');
  dialog = page.getByRole('dialog');
  await dialog.getByRole('heading', { name: 'Evento audit', exact: true }).waitFor();
  await dialog.getByText('draft', { exact: true }).first().waitFor();
  await dialog.getByText('approved', { exact: true }).first().waitFor();
  await dialog.locator('pre').filter({ hasText: '"draftId": 202' }).waitFor();
  await dialog.getByTestId('audit-event-guardrail').waitFor();
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });

  await choose(page, 'Filtra audit per dominio', 'claim');
  await audit.getByText('1 di 5 eventi visibili').waitFor();
  await audit.getByText('claim:101').waitFor();

  await choose(page, 'Filtra audit per dominio', 'Tutti i domini');
  await choose(page, 'Filtra audit per azione', 'completed');
  await audit.getByText('2 di 5 eventi visibili').waitFor();

  await choose(page, 'Filtra audit per azione', 'Tutte le azioni');
  await choose(page, 'Filtra audit per attore', 'fixture-reviewer');
  await audit.getByText('3 di 5 eventi visibili').waitFor();

  assert.equal(await page.getByRole('button', { name: /retry|complete|dismiss|approv|pubblic/i }).count(), 0);
  assert.deepEqual(mutationRequests, []);
  await context.close();

  await expectInvalidSnapshot(browser, {
    ...fixture,
    queue: [{ ...fixture.queue[0], status: 'completed' }]
  });
  await expectInvalidSnapshot(browser, {
    ...fixture,
    queue: [{ ...fixture.queue[0], attempts: '1' }]
  });
  await expectInvalidSnapshot(browser, {
    ...fixture,
    queue: [{ ...fixture.queue[0], payload: undefined }]
  });
  await expectInvalidSnapshot(browser, {
    ...fixture,
    audit: [{ ...fixture.audit[0], created_at: 'invalid-date' }]
  });
  await expectInvalidSnapshot(browser, {
    ...fixture,
    audit: [{ ...fixture.audit[0], details: undefined }]
  });

  const emptyContext = await accessContext(browser);
  const emptyPage = await emptyContext.newPage();
  await mockApis(emptyPage, { ...fixture, queue: [], audit: [] });
  await emptyPage.goto(`${origin}/control-room-foundation`);
  await emptyPage.getByTestId('empty-queue').waitFor();
  await emptyPage.getByTestId('empty-audit').waitFor();
  await emptyContext.close();

  const mobileContext = await accessContext(browser, { viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mockApis(mobilePage);
  await mobilePage.goto(`${origin}/control-room-foundation`);
  await mobilePage.getByText('Coda operativa in sola lettura').waitFor();
  await mobilePage.getByRole('button', { name: 'Apri navigazione' }).focus();
  await mobilePage.keyboard.press('Enter');
  const mobileNavigation = mobilePage.getByRole('dialog').getByRole('navigation', { name: 'Navigazione Control Room' });
  await mobileNavigation.getByRole('link', { name: 'Queue', exact: true }).waitFor();
  await mobileNavigation.getByRole('link', { name: 'Audit', exact: true }).waitFor();
  await mobilePage.keyboard.press('Escape');
  await mobileContext.close();

  console.log('Control Room queue and audit contracts, filters, details and guardrails smoke passed.');
} catch (error) {
  console.error(error);
  console.error(logs.join('').slice(-12_000));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await stopWrangler();
}
