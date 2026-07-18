import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const port = Number(process.env.RUNTIME_SMOKE_PORT || 8788);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const entryPath = 'apps/web/dist/server/entry.mjs';
const maintenanceToken = 'runtime-smoke-token';
const logs = [];

function record(chunk) {
  const value = chunk.toString();
  logs.push(value);
  process.stdout.write(value);
}

async function verifyBuildContract() {
  const [configRaw, entry] = await Promise.all([
    readFile(configPath, 'utf8'),
    readFile(entryPath, 'utf8')
  ]);
  const config = JSON.parse(configRaw);

  assert.equal(config.main, 'entry.mjs');
  assert.equal(config.workflows?.[0]?.class_name, 'RecentDemandWorkflow');
  assert.equal(config.containers?.[0]?.class_name, 'Last30DaysContainer');
  assert.match(entry, /export \{ Last30DaysContainer, RecentDemandWorkflow,/);
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
  ['node_modules/wrangler/bin/wrangler.js', 'dev', '--config', configPath, '--port', String(port), '--ip', '127.0.0.1'],
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

  const healthResponse = await fetch(`${origin}/api/health`);
  const health = await healthResponse.json();
  assert.equal(healthResponse.status, 200);
  assert.equal(health.ok, true);
  assert.equal(health.recentDemandWorkflow, 'enabled');
  assert.equal(health.last30DaysContainer, 'enabled');
  assert.equal(health.affiliateMode, 'disabled');

  await expectNotFound('/api/maintenance/publish');
  await expectNotFound('/api/maintenance/pages/publish');
  await expectNotFound('/api/publish');

  console.log('Astro/Cloudflare runtime smoke passed.');
} catch (error) {
  console.error(error);
  console.error(logs.join('').slice(-12_000));
  process.exitCode = 1;
} finally {
  await stopWrangler();
}
