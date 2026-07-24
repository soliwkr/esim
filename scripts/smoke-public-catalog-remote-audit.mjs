import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createAccessTestCredentials } from './access-test-token.mjs';

const port = Number(process.env.PUBLIC_CATALOG_REMOTE_AUDIT_PORT || 8797);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const statePath = '.wrangler/state';
const maintenanceToken = 'catalog-remote-audit-maintenance-token';
const access = createAccessTestCredentials();
const accessHeaders = { 'cf-access-jwt-assertion': access.token };
const auditPath = '/control-room-foundation/api/catalog-pilot-audit';
const snapshotPath = '/control-room-foundation/api/snapshot';
const logs = [];

function record(chunk) {
  const value = chunk.toString();
  logs.push(value);
  process.stdout.write(value);
}

function startRuntime() {
  const child = spawn(
    process.execPath,
    [
      'node_modules/wrangler/bin/wrangler.js',
      'dev',
      '--config', configPath,
      '--persist-to', statePath,
      '--port', String(port),
      '--ip', '127.0.0.1',
      '--var', `CF_ACCESS_TEAM_DOMAIN:${access.issuer}`,
      '--var', `CF_ACCESS_AUD:${access.audience}`,
      '--var', `CF_ACCESS_TEST_JWKS:${access.jwks}`,
    ],
    {
      env: {
        ...process.env,
        MAINTENANCE_TOKEN: maintenanceToken,
        AI_GATEWAY_TOKEN: 'catalog-remote-audit-ai-token',
        ASTRO_TELEMETRY_DISABLED: '1',
      },
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  child.stdout.on('data', record);
  child.stderr.on('data', record);
  return child;
}

async function waitForRuntime(child, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`wrangler dev exited with ${child.exitCode}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {
      // workerd is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for catalog remote audit runtime.\n${logs.join('')}`);
}

function signalRuntime(child, signal) {
  if (child.exitCode !== null || !child.pid) return;
  if (process.platform === 'win32') child.kill(signal);
  else process.kill(-child.pid, signal);
}

async function stopRuntime(child) {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  signalRuntime(child, 'SIGTERM');
  const graceful = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (graceful) return;
  signalRuntime(child, 'SIGKILL');
  await Promise.race([once(child, 'exit'), new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

function editorialFingerprint(snapshot) {
  return JSON.stringify({
    briefs: snapshot.briefs,
    claims: snapshot.claims,
    evidenceBundles: snapshot.evidenceBundles,
    drafts: snapshot.drafts,
    queue: snapshot.queue,
    audit: snapshot.audit,
  });
}

let runtime;
try {
  runtime = startRuntime();
  await waitForRuntime(runtime);

  const anonymous = await fetch(`${origin}${auditPath}`);
  assert.equal(anonymous.status, 403);

  const wrongMethod = await fetch(`${origin}${auditPath}`, {
    method: 'POST',
    headers: accessHeaders,
  });
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get('allow'), 'GET');
  assert.match(wrongMethod.headers.get('cache-control') || '', /no-store/);
  assert.match(wrongMethod.headers.get('x-robots-tag') || '', /noindex/);

  const beforeResponse = await fetch(`${origin}${snapshotPath}`, { headers: accessHeaders });
  assert.equal(beforeResponse.status, 200);
  const before = await beforeResponse.json();
  assert.equal(before.ok, true);

  const auditResponse = await fetch(`${origin}${auditPath}`, { headers: accessHeaders });
  const auditBodyText = await auditResponse.text();
  const audit = JSON.parse(auditBodyText);

  assert.equal(auditResponse.status, 200);
  assert.equal(audit.ok, true);
  assert.equal(audit.report.schemaVersion, 1);
  assert.ok(Number.isInteger(audit.report.candidateCount));
  assert.ok(Number.isInteger(audit.report.selectedCount));
  assert.ok(audit.report.selectedCount >= 0 && audit.report.selectedCount <= 4);
  assert.equal(Array.isArray(audit.report.selected), true);
  assert.equal(Array.isArray(audit.report.excluded), true);
  assert.equal(audit.report.selected.every((candidate) => candidate.pageStatus === 'review'), true);
  assert.match(auditResponse.headers.get('cache-control') || '', /no-store/);
  assert.match(auditResponse.headers.get('x-robots-tag') || '', /noindex/);
  assert.equal(auditResponse.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(auditBodyText.includes(maintenanceToken), false);
  assert.equal(auditBodyText.includes(access.token), false);
  assert.equal(/authorization|bearer\s+/i.test(auditBodyText), false);

  const afterResponse = await fetch(`${origin}${snapshotPath}`, { headers: accessHeaders });
  assert.equal(afterResponse.status, 200);
  const after = await afterResponse.json();
  assert.equal(after.ok, true);
  assert.equal(editorialFingerprint(after), editorialFingerprint(before));

  console.log('Private public-catalog remote audit smoke passed: Access, GET-only, safe payload and no editorial mutation.');
} catch (error) {
  console.error(error);
  console.error(logs.join('').slice(-12_000));
  process.exitCode = 1;
} finally {
  await stopRuntime(runtime);
}
