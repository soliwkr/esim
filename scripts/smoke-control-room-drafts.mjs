import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { createAccessTestCredentials } from './access-test-token.mjs';

const port = Number(process.env.CONTROL_ROOM_DRAFTS_SMOKE_PORT || 8792);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const maintenanceToken = 'runtime-smoke-control-room-drafts-token';
const access = createAccessTestCredentials();
const accessHeaders = { 'cf-access-jwt-assertion': access.token };
const snapshotProxyPath = '/control-room-foundation/api/snapshot';
const logs = [];

const [fixture, healthFixture, componentSource, contractSource] = await Promise.all([
  readFile('tests/fixtures/control-room-snapshot.json', 'utf8').then(JSON.parse),
  readFile('tests/fixtures/control-room-health.json', 'utf8').then(JSON.parse),
  readFile('apps/web/src/components/control-room/DraftDecisions.tsx', 'utf8'),
  readFile('apps/web/src/lib/draft-contract.ts', 'utf8')
]);

assert.doesNotMatch(componentSource, /\bfetch\s*\(|XMLHttpRequest|sessionStorage|localStorage|Authorization|Bearer/i);
assert.doesNotMatch(componentSource, /method\s*:\s*['"`](?:POST|PUT|PATCH|DELETE)['"`]/i);
assert.match(componentSource, /Approved draft ≠ published page/);
assert.match(componentSource, /Gap del contratto corrente/);
assert.match(contractSource, /parseDraftDecisionRecords/);
assert.match(contractSource, /changes_requested/);
assert.match(contractSource, /positiveIntegerArray/);

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

async function expectInvalidDraftSection(browser, drafts) {
  const context = await accessContext(browser);
  const page = await context.newPage();
  await mockApis(page, { ...fixture, drafts });
  await page.goto(`${origin}/control-room-foundation`);
  await page.getByTestId('draft-contract-error').waitFor();
  await page.getByText('Contratto draft non valido').waitFor();
  await context.close();
}

let browser;

try {
  await waitForRuntime(wrangler);

  const realProxyResponse = await fetch(`${origin}${snapshotProxyPath}`, { headers: accessHeaders });
  const realProxySnapshot = await realProxyResponse.json();
  assert.equal(realProxyResponse.status, 200);
  assert.ok(Array.isArray(realProxySnapshot.drafts));
  for (const draft of realProxySnapshot.drafts) {
    assert.equal(typeof draft.id, 'number');
    assert.equal(typeof draft.evidence_bundle_id, 'number');
    assert.equal(typeof draft.review_notes, 'string');
    assert.equal(typeof draft.created_at, 'string');
    assert.ok(Array.isArray(draft.used_claim_ids));
    assert.ok(Array.isArray(draft.excluded_claim_ids));
  }

  browser = await chromium.launch({ headless: true });

  const context = await accessContext(browser, { viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await mockApis(page);
  const mutationRequests = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') mutationRequests.push(`${request.method()} ${request.url()}`);
  });

  await page.goto(`${origin}/control-room-foundation`);
  const drafts = page.getByTestId('drafts-section');
  await drafts.getByText('Draft, preview e revisione').waitFor();
  await drafts.getByText('2 di 2 draft visibili').waitFor();
  await drafts.getByTestId('draft-guardrail').getByText('Approved draft ≠ published page').waitFor();
  await drafts.getByText('eSIM in Cina: dichiarazioni dei provider e limiti delle prove').waitFor();
  await drafts.getByText('Versione legacy sostituita').waitFor();

  const openButton = drafts.getByRole('button', { name: 'Apri draft 202' });
  await openButton.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.getByText('Draft #202').waitFor();
  await dialog.getByText('#31', { exact: true }).waitFor();
  await dialog.getByText('#701 · eSIM in Cina: funzionano davvero senza VPN?').waitFor();
  await dialog.getByText('77', { exact: true }).waitFor();
  await dialog.getByText('No', { exact: true }).waitFor();
  await dialog.getByText('Approvato editorialmente; la pagina materializzata resta in review.').waitFor();
  await dialog.getByText('Non esposto nello snapshot').waitFor();
  await dialog.getByTestId('draft-contract-gap').getByText('Gap del contratto corrente').waitFor();
  await dialog.getByText('#101', { exact: true }).waitFor();
  await dialog.getByText('#102', { exact: true }).waitFor();
  await dialog.getByText('#103', { exact: true }).waitFor();
  await page.keyboard.press('Escape');

  await choose(page, 'Filtra per stato draft', 'approved');
  await drafts.getByText('1 di 2 draft visibili').waitFor();
  assert.equal(await drafts.getByText('Versione legacy sostituita').count(), 0);

  await choose(page, 'Filtra per stato draft', 'Tutti gli stati');
  await choose(page, 'Filtra per renderer', 'editorial-page-draft-v1');
  await drafts.getByText('Versione legacy sostituita').waitFor();
  assert.equal(await drafts.getByText('eSIM in Cina: dichiarazioni dei provider e limiti delle prove').count(), 0);

  await choose(page, 'Filtra per renderer', 'Tutti i renderer');
  await choose(page, 'Filtra per revisione', 'Con decisione di revisione');
  await drafts.getByText('eSIM in Cina: dichiarazioni dei provider e limiti delle prove').waitFor();
  assert.equal(await drafts.getByText('Versione legacy sostituita').count(), 0);

  await choose(page, 'Filtra per revisione', 'Senza decisione di revisione');
  await drafts.getByText('Versione legacy sostituita').waitFor();

  assert.equal(await drafts.getByRole('button', { name: /approv|genera|rigenera|pubblic|rifiut/i }).count(), 0);
  assert.deepEqual(mutationRequests, []);
  await context.close();

  await expectInvalidDraftSection(browser, [{ ...fixture.drafts[0], status: 'published' }]);
  await expectInvalidDraftSection(browser, [{ ...fixture.drafts[0], used_claim_ids: [101, 'invalid'] }]);
  await expectInvalidDraftSection(browser, [{ ...fixture.drafts[0], reviewed_at: 'not-a-date' }]);

  const emptyContext = await accessContext(browser);
  const emptyPage = await emptyContext.newPage();
  await mockApis(emptyPage, { ...fixture, drafts: [] });
  await emptyPage.goto(`${origin}/control-room-foundation`);
  await emptyPage.getByTestId('empty-drafts').waitFor();
  await emptyContext.close();

  const mobileContext = await accessContext(browser, { viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mockApis(mobilePage);
  await mobilePage.goto(`${origin}/control-room-foundation`);
  await mobilePage.getByText('Draft, preview e revisione').waitFor();
  await mobilePage.getByRole('button', { name: 'Apri navigazione' }).focus();
  await mobilePage.keyboard.press('Enter');
  const mobileNavigation = mobilePage.getByRole('dialog').getByRole('navigation', { name: 'Navigazione Control Room' });
  await mobileNavigation.getByRole('link', { name: 'Draft e decisioni' }).waitFor();
  await mobilePage.keyboard.press('Escape');
  await mobilePage.getByRole('button', { name: 'Apri draft 202' }).click();
  await mobilePage.getByRole('dialog').getByText('Draft #202').waitFor();
  await mobileContext.close();

  console.log('Control Room draft inventory, review decisions, contract gaps and guardrails smoke passed.');
} catch (error) {
  console.error(error);
  console.error(logs.join('').slice(-12_000));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await stopWrangler();
}
