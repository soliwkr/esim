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
  const [
    configRaw,
    entry,
    backendRouter,
    customEntrypoint,
    accessGuard,
    researchNormalizer,
    researchTopic,
    publicPage,
    publicLayout,
    controlRoomApiClient,
  ] = await Promise.all([
    readFile(configPath, 'utf8'),
    readFile(entryPath, 'utf8'),
    readFile('src/index.ts', 'utf8'),
    readFile('apps/web/src/worker.ts', 'utf8'),
    readFile('apps/web/src/lib/cloudflare-access.ts', 'utf8'),
    readFile('src/research.ts', 'utf8'),
    readFile('src/research-topic.ts', 'utf8'),
    readFile('apps/web/src/pages/astro-foundation.astro', 'utf8'),
    readFile('apps/web/src/layouts/PublicLayout.astro', 'utf8'),
    readFile('apps/web/src/lib/control-room-api.ts', 'utf8'),
  ]);

  const config = JSON.parse(configRaw);
  const workerFirst = config.assets?.run_worker_first;

  assert.equal(config.main, 'entry.mjs');
  assert.equal(config.workflows?.[0]?.class_name, 'RecentDemandWorkflow');
  assert.equal(config.containers?.[0]?.class_name, 'Last30DaysContainer');
  assert.ok(Array.isArray(workerFirst));
  assert.ok(workerFirst.includes('/*'));
  assert.ok(workerFirst.includes('!/_astro/*'));
  assert.match(entry, /export \{ Last30DaysContainer, RecentDemandWorkflow,/);
  assert.match(entry, /targetPublicRouteDecision/);
  assert.match(customEntrypoint, /export default createPublicWorker\(activePublicRouteDecision\)/);
  assert.match(customEntrypoint, /control-room-foundation\/api\/catalog-pilot-audit/);
  assert.doesNotMatch(`${backendRouter}\n${customEntrypoint}`, /['"`]\/?api\/publish(?:\/|['"`])/);
  assert.doesNotMatch(controlRoomApiClient, /Authorization|Bearer|sessionStorage/i);
  assert.match(controlRoomApiClient, /control-room-foundation\/api\/snapshot/);
  assert.match(researchNormalizer, /extractTopicAnchors/);
  assert.match(researchNormalizer, /topic_anchors_json/);
  assert.match(researchTopic, /GENERIC_QUERY_TERMS/);
  assert.match(researchTopic, /kind === 'discovery'/);
  assert.match(customEntrypoint, /requireCloudflareAccess/);
  assert.match(customEntrypoint, /MAINTENANCE_TOKEN/);
  assert.match(accessGuard, /cf-access-jwt-assertion/i);
  assert.match(publicPage, /data-public-shell="astro-preview"/);
  assert.match(publicPage, /noindex, nofollow/);
  assert.doesNotMatch(publicPage, /client:(?:load|idle|visible|media|only)/);
  assert.match(publicLayout, /<link rel="canonical"/);
  assert.match(publicLayout, /Vai al contenuto/);
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

async function expectNotFound(path, maxAttempts = 5) {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(`${origin}${path}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${maintenanceToken}`,
        'content-type': 'application/json',
      },
      body: '{}',
    });
    lastStatus = response.status;
    if (lastStatus === 404) return;
    if (lastStatus !== 503) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.equal(lastStatus, 404, `${path} unexpectedly resolved with ${lastStatus}`);
}

await verifyBuildContract();

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
    '--var', `CF_ACCESS_TEST_JWKS:${access.jwks}`,
  ],
  {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: maintenanceToken,
      AI_GATEWAY_TOKEN: 'runtime-smoke-ai-token',
      ASTRO_TELEMETRY_DISABLED: '1',
    },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  },
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
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (graceful) return;
  signalWrangler('SIGKILL');
  await Promise.race([once(wrangler, 'exit'), new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

try {
  await waitForRuntime(wrangler);

  const canonicalResponse = await fetch(`${origin}/`);
  const canonicalPage = await canonicalResponse.text();
  assert.equal(canonicalResponse.status, 200);
  assert.match(canonicalResponse.headers.get('cache-control') || '', /public/);
  assert.equal(canonicalResponse.headers.get('x-robots-tag'), null);
  assert.match(canonicalPage, /data-public-homepage="canonical"/);
  assert.match(canonicalPage, /index,follow,max-image-preview:large/);
  assert.doesNotMatch(canonicalPage, /data-public-shell="astro-preview"/);

  const previewResponse = await fetch(`${origin}/astro-foundation`);
  const previewPage = await previewResponse.text();
  assert.equal(previewResponse.status, 200);
  assert.match(previewResponse.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(previewResponse.headers.get('cache-control') || '', /no-store/);
  assert.match(previewPage, /data-public-shell="astro-preview"/);
  assert.doesNotMatch(previewPage, /<astro-island/);

  const anonymousControlRoom = await fetch(`${origin}/control-room-foundation`);
  assert.equal(anonymousControlRoom.status, 403);
  assert.equal((await anonymousControlRoom.json()).error, 'cloudflare_access_required');

  const controlRoomResponse = await fetch(`${origin}/control-room-foundation`, { headers: accessHeaders });
  const controlRoomPage = await controlRoomResponse.text();
  assert.equal(controlRoomResponse.status, 200);
  assert.match(controlRoomResponse.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(controlRoomResponse.headers.get('cache-control') || '', /no-store/);
  assert.equal((controlRoomPage.match(/<astro-island/g) || []).length, 1);
  assert.doesNotMatch(controlRoomPage, new RegExp(maintenanceToken));

  const snapshotProxyPath = '/control-room-foundation/api/snapshot';
  const anonymousProxy = await fetch(`${origin}${snapshotProxyPath}`);
  assert.equal(anonymousProxy.status, 403);
  const proxyResponse = await fetch(`${origin}${snapshotProxyPath}`, { headers: accessHeaders });
  const proxyText = await proxyResponse.text();
  assert.equal(proxyResponse.status, 200);
  assert.match(proxyResponse.headers.get('cache-control') || '', /no-store/);
  assert.match(proxyResponse.headers.get('x-robots-tag') || '', /noindex/);
  assert.doesNotMatch(proxyText, new RegExp(maintenanceToken));
  const proxySnapshot = JSON.parse(proxyText);
  assert.equal(proxySnapshot.ok, true);
  for (const key of ['researchRuns', 'signals', 'briefs', 'claims', 'evidenceBundles', 'drafts', 'queue', 'audit']) {
    assert.ok(Array.isArray(proxySnapshot[key]), `Missing ${key} array`);
  }

  const proxyMutation = await fetch(`${origin}${snapshotProxyPath}`, {
    method: 'POST',
    headers: accessHeaders,
  });
  assert.equal(proxyMutation.status, 405);
  assert.equal(proxyMutation.headers.get('allow'), 'GET');

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
    headers: { authorization: `Bearer ${maintenanceToken}` },
  });
  const snapshot = await snapshotResponse.json();
  assert.equal(snapshotResponse.status, 200);
  assert.equal(snapshot.ok, true);

  const researchPayload = {
    schema_version: '1.0',
    query: 'Holafly recent experiences',
    generated_at: '2026-07-20T05:03:00.000Z',
    window_days: 30,
    source_status: {},
    warnings: [],
    clusters: [],
    results: [
      {
        candidate_id: 'runtime-topic-mismatch-positive-score',
        title: 'Recent experience at a live comedy show',
        summary: 'The result contains no provider name or travel-connectivity evidence.',
        source: 'reddit',
        url: 'https://example.test/runtime-topic-mismatch-positive-score',
        published_at: '2026-07-03T02:00:00.000Z',
        engagement: {},
        relevance_score: 0.2,
      },
      {
        candidate_id: 'runtime-holafly-low-positive',
        title: 'Holafly recent experience in Japan',
        summary: 'A traveller reports activation and hotspot behaviour for the Holafly eSIM.',
        source: 'reddit',
        url: 'https://example.test/runtime-holafly-low-positive',
        published_at: '2026-07-04T02:00:00.000Z',
        engagement: {},
        relevance_score: 0.2,
      },
    ],
  };

  const ingestResponse = await fetch(`${origin}/api/maintenance/research-ingest`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${maintenanceToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(researchPayload),
  });
  const ingest = await ingestResponse.json();
  assert.ok([200, 201].includes(ingestResponse.status));
  assert.equal(ingest.ok, true);

  const signalsResponse = await fetch(
    `${origin}/api/maintenance/research-signals?eligibility=all&limit=100`,
    { headers: { authorization: `Bearer ${maintenanceToken}` } },
  );
  const signals = await signalsResponse.json();
  assert.equal(signalsResponse.status, 200);
  const ingestedSignals = signals.signals.filter((signal) => Number(signal.run_id) === Number(ingest.runId));
  const mismatchSignal = ingestedSignals.find((signal) => signal.title === researchPayload.results[0].title);
  const relevantSignal = ingestedSignals.find((signal) => signal.title === researchPayload.results[1].title);
  assert.ok(mismatchSignal);
  assert.ok(relevantSignal);
  assert.equal(mismatchSignal.eligible, false);
  assert.ok(mismatchSignal.quality_flags.includes('topic_mismatch'));
  assert.equal(relevantSignal.eligible, true);
  assert.equal(relevantSignal.quality_flags.includes('topic_mismatch'), false);

  await expectNotFound('/api/maintenance/publish');
  await expectNotFound('/api/maintenance/pages/publish');

  console.log('Astro/Cloudflare runtime, active apex ownership, Access, topic gate and backend boundaries smoke passed.');
} catch (error) {
  console.error(error);
  console.error(logs.join('').slice(-12_000));
  process.exitCode = 1;
} finally {
  await stopWrangler();
}
