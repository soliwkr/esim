import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createAccessTestCredentials } from './access-test-token.mjs';

const port = Number(process.env.RUNTIME_SMOKE_PORT || 8788);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const entryPath = 'apps/web/dist/server/entry.mjs';
const maintenanceToken = 'runtime-smoke-token';
const access = createAccessTestCredentials();
const accessHeaders = { 'cf-access-jwt-assertion': access.token };
const logs = [];

function record(chunk) {
  const value = chunk.toString();
  logs.push(value);
  process.stdout.write(value);
}

async function verifyBuildContract() {
  const [configRaw, entry, backendRouter, customEntrypoint, accessGuard, controlRoomIsland] = await Promise.all([
    readFile(configPath, 'utf8'),
    readFile(entryPath, 'utf8'),
    readFile('src/index.ts', 'utf8'),
    readFile('apps/web/src/worker.ts', 'utf8'),
    readFile('apps/web/src/lib/cloudflare-access.ts', 'utf8'),
    readFile('apps/web/src/components/control-room/ControlRoomApp.tsx', 'utf8')
  ]);
  const config = JSON.parse(configRaw);

  assert.equal(config.main, 'entry.mjs');
  assert.equal(config.workflows?.[0]?.class_name, 'RecentDemandWorkflow');
  assert.equal(config.containers?.[0]?.class_name, 'Last30DaysContainer');
  assert.match(entry, /export \{ Last30DaysContainer, RecentDemandWorkflow,/);
  assert.doesNotMatch(`${backendRouter}\n${customEntrypoint}`, /['"`]\/?api\/publish(?:\/|['"`])/);
  assert.doesNotMatch(controlRoomIsland, /method\s*:\s*['"`](?:POST|PUT|PATCH|DELETE)['"`]/i);
  assert.match(customEntrypoint, /requireCloudflareAccess/);
  assert.match(accessGuard, /cf-access-jwt-assertion/i);
  assert.ok(config.assets?.run_worker_first?.includes('/control-room-foundation'));
}

async function waitForRuntime(child, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`wrangler dev exited with code ${child.exitCode}`);
    }
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

async function expectNotFound(path) {
  const response = await fetch(`${origin}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${maintenanceToken}`,
      'content-type': 'application/json'
    },
    body: '{}'
  });
  assert.equal(response.status, 404, `${path} unexpectedly resolved with ${response.status}`);
}

await verifyBuildContract();

const wrangler = spawn(
  process.execPath,
  ['node_modules/wrangler/bin/wrangler.js', 'dev', '--config', configPath, '--persist-to', '.wrangler/state', '--port', String(port), '--ip', '127.0.0.1'],
  {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: maintenanceToken,
      AI_GATEWAY_TOKEN: 'runtime-smoke-ai-token',
      CF_ACCESS_TEAM_DOMAIN: access.issuer,
      CF_ACCESS_AUD: access.audience,
      CF_ACCESS_TEST_JWKS: access.jwks,
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
  if (process.platform === 'win32') {
    wrangler.kill(signal);
  } else {
    process.kill(-wrangler.pid, signal);
  }
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
  await Promise.race([
    once(wrangler, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 5_000))
  ]);
}

try {
  await waitForRuntime(wrangler);

  const pageResponse = await fetch(`${origin}/astro-foundation`);
  const page = await pageResponse.text();
  assert.equal(pageResponse.status, 200);
  assert.match(page, /Astro e backend condividono lo stesso Worker\./);
  assert.match(page, /<astro-island/);
  assert.match(page, /noindex,nofollow/);

  const anonymousControlRoom = await fetch(`${origin}/control-room-foundation`);
  assert.equal(anonymousControlRoom.status, 403);
  assert.equal((await anonymousControlRoom.json()).error, 'cloudflare_access_required');

  const invalidControlRoom = await fetch(`${origin}/control-room-foundation`, {
    headers: { 'cf-access-jwt-assertion': `${access.token}invalid` }
  });
  assert.equal(invalidControlRoom.status, 403);
  assert.equal((await invalidControlRoom.json()).error, 'cloudflare_access_invalid');

  const controlRoomResponse = await fetch(`${origin}/control-room-foundation`, { headers: accessHeaders });
  const controlRoomPage = await controlRoomResponse.text();
  assert.equal(controlRoomResponse.status, 200);
  assert.match(controlRoomResponse.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(controlRoomResponse.headers.get('cache-control') || '', /no-store/);
  assert.equal((controlRoomPage.match(/<astro-island/g) || []).length, 1);
  assert.doesNotMatch(controlRoomPage, new RegExp(maintenanceToken));
  assert.doesNotMatch(controlRoomPage, new RegExp(access.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  const healthResponse = await fetch(`${origin}/api/health`);
  const health = await healthResponse.json();
  assert.equal(healthResponse.status, 200);
  assert.equal(health.ok, true);
  assert.equal(health.recentDemandWorkflow, 'enabled');
  assert.equal(health.last30DaysContainer, 'enabled');
  assert.equal(health.affiliateMode, 'disabled');

  const anonymousSnapshot = await fetch(`${origin}/api/maintenance/control-room`);
  assert.equal(anonymousSnapshot.status, 401);
  const snapshotResponse = await fetch(`${origin}/api/maintenance/control-room`, {
    headers: { authorization: `Bearer ${maintenanceToken}` }
  });
  const snapshot = await snapshotResponse.json();
  assert.equal(snapshotResponse.status, 200);
  assert.equal(snapshot.ok, true);
  assert.ok(Array.isArray(snapshot.claims));
  assert.ok(Array.isArray(snapshot.drafts));

  await expectNotFound('/api/maintenance/publish');
  await expectNotFound('/api/maintenance/pages/publish');

  console.log('Astro/Cloudflare runtime and Access guard smoke passed.');
} catch (error) {
  console.error(error);
  console.error(logs.join('').slice(-12_000));
  process.exitCode = 1;
} finally {
  await stopWrangler();
}
