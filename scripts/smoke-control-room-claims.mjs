import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { createAccessTestCredentials } from './access-test-token.mjs';

const port = Number(process.env.CONTROL_ROOM_CLAIMS_SMOKE_PORT || 8790);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const maintenanceToken = 'runtime-smoke-control-room-claims-token';
const access = createAccessTestCredentials();
const accessHeaders = { 'cf-access-jwt-assertion': access.token };
const snapshotProxyPath = '/control-room-foundation/api/snapshot';
const logs = [];

async function verifyStaticContract() {
  const [claimsComponent, controlRoomApiClient] = await Promise.all([
    readFile('apps/web/src/components/control-room/ClaimsSources.tsx', 'utf8'),
    readFile('apps/web/src/lib/control-room-api.ts', 'utf8')
  ]);

  assert.doesNotMatch(claimsComponent, /method\s*:\s*['"`](?:POST|PUT|PATCH|DELETE)['"`]/i);
  assert.doesNotMatch(claimsComponent, /\bfetch\s*\(/);
  assert.doesNotMatch(claimsComponent, /sessionStorage|Authorization|Bearer|env\.DB|\bD1\b/i);
  assert.match(claimsComponent, /Claim, fonti e scadenze/);
  assert.match(claimsComponent, /Stato temporale, non stato canonico/);
  assert.match(claimsComponent, /Fonte ed evidenza restano distinte/);
  assert.match(claimsComponent, /Filtra per scadenza/);
  assert.match(controlRoomApiClient, /function parseClaims/);
  assert.match(controlRoomApiClient, /required_source_kinds: requireStringArray/);
  assert.match(controlRoomApiClient, /valid_until: requireNullableTimestamp/);
  assert.match(controlRoomApiClient, /trust_level: requireNullableNumber/);
}

await verifyStaticContract();

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

let browser;

try {
  await waitForRuntime(wrangler);
  browser = await chromium.launch({ headless: true });

  const context = await accessContext(browser, { viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await mockApis(page);
  const mutationRequests = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') mutationRequests.push(`${request.method()} ${request.url()}`);
  });

  await page.goto(`${origin}/control-room-foundation`);
  await page.getByText('Claim, fonti e scadenze').waitFor();
  await page.getByText('3 di 3 claim visibili').waitFor();

  const claimButton = page.getByRole('button', { name: 'Apri claim 101' });
  await claimButton.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.getByText('Claim #101').waitFor();
  await dialog.getByText('Fonte ed evidenza restano distinte').waitFor();
  await dialog.getByText('Stato temporale, non stato canonico').waitFor();
  await dialog.getByRole('link', { name: 'Apri fonte' }).waitFor();
  assert.equal(await dialog.getByRole('link', { name: 'Apri fonte' }).getAttribute('href'), 'https://example.test/provider');
  await page.keyboard.press('Escape');

  await page.getByRole('combobox', { name: 'Filtra per scadenza' }).click();
  await page.getByRole('option', { name: 'Scaduta' }).click();
  await page.getByText('La dichiarazione sul routing era verificata ma la sua finestra di validità è scaduta.').waitFor();
  assert.equal(await page.getByText('Il piano di test include la condivisione dati.').count(), 0);

  await page.getByRole('combobox', { name: 'Filtra per scadenza' }).click();
  await page.getByRole('option', { name: 'Tutte le scadenze' }).click();
  await page.getByRole('combobox', { name: 'Filtra per fonte' }).click();
  await page.getByRole('option', { name: 'Senza fonte' }).click();
  await page.getByText('La velocità dichiarata è ancora da verificare.').waitFor();
  assert.equal(await page.getByText('Fonte ufficiale fixture').count(), 0);

  await page.getByRole('combobox', { name: 'Filtra per fonte' }).click();
  await page.getByRole('option', { name: 'Tutte le fonti' }).click();
  await page.getByRole('combobox', { name: 'Filtra per brief' }).click();
  await page.getByRole('option', { name: 'Brief #702' }).click();
  await page.getByText('La velocità dichiarata è ancora da verificare.').waitFor();

  await page.getByRole('combobox', { name: 'Filtra per verifica' }).click();
  await page.getByRole('option', { name: 'Senza verifica' }).click();
  await page.getByText('1 di 3 claim visibili').waitFor();

  await page.getByRole('combobox', { name: 'Filtra per stato', exact: true }).click();
  await page.getByRole('option', { name: 'verified' }).click();
  await page.getByTestId('empty-claim-filter').waitFor();

  assert.equal(await page.getByRole('button', { name: /pubblic/i }).count(), 0);
  assert.deepEqual(mutationRequests, []);
  await context.close();

  const invalidContext = await accessContext(browser);
  const invalidPage = await invalidContext.newPage();
  await mockApis(invalidPage, {
    ...fixture,
    claims: [{ ...fixture.claims[0], trust_level: 'high' }]
  });
  await invalidPage.goto(`${origin}/control-room-foundation`);
  await invalidPage.getByTestId('snapshot-error').waitFor();
  await invalidPage.getByText('Contratto snapshot non valido').waitFor();
  await invalidContext.close();

  const mobileContext = await accessContext(browser, { viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mockApis(mobilePage);
  await mobilePage.goto(`${origin}/control-room-foundation`);
  await mobilePage.getByText('Claim, fonti e scadenze').waitFor();
  await mobilePage.getByRole('button', { name: 'Apri navigazione' }).focus();
  await mobilePage.keyboard.press('Enter');
  const mobileNavigation = mobilePage.getByRole('dialog').getByRole('navigation', { name: 'Navigazione Control Room' });
  await mobileNavigation.getByRole('link', { name: 'Claim e fonti' }).waitFor();
  await mobilePage.keyboard.press('Escape');
  await mobileContext.close();

  console.log('Control Room claims, sources, expiry, filters and contract smoke passed.');
} catch (error) {
  console.error(error);
  console.error(logs.join('').slice(-12_000));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await stopWrangler();
}
