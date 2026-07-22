import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { createAccessTestCredentials } from './access-test-token.mjs';

const port = Number(process.env.CONTROL_ROOM_BRIEF_DECISION_SMOKE_PORT || 8795);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const maintenanceToken = 'runtime-smoke-control-room-brief-decision-token';
const access = createAccessTestCredentials();
const accessHeaders = { 'cf-access-jwt-assertion': access.token };
const decisionPath = '/control-room-foundation/api/brief-decision';
const snapshotPath = '/control-room-foundation/api/snapshot';
const logs = [];

const [fixture, healthFixture, panelSource, clientSource, backendSource, workerSource, migrationSource] = await Promise.all([
  readFile('tests/fixtures/control-room-snapshot.json', 'utf8').then(JSON.parse),
  readFile('tests/fixtures/control-room-health.json', 'utf8').then(JSON.parse),
  readFile('apps/web/src/components/control-room/BriefDecisionPanel.tsx', 'utf8'),
  readFile('apps/web/src/lib/brief-decision-api.ts', 'utf8'),
  readFile('src/editorial-brief-decisions.ts', 'utf8'),
  readFile('apps/web/src/worker.ts', 'utf8'),
  readFile('migrations/0020_editorial_brief_decisions.sql', 'utf8'),
]);

assert.doesNotMatch(`${panelSource}\n${clientSource}`, /sessionStorage|localStorage|Authorization|Bearer/);
assert.doesNotMatch(panelSource, /\bfetch\s*\(|XMLHttpRequest/);
assert.equal((clientSource.match(/method:\s*"POST"/g) || []).length, 1);
assert.match(panelSource, /Decisione ≠ conversione ≠ pubblicazione/);
assert.match(panelSource, /dismissalReasonMissing/);
assert.match(backendSource, /publicationTriggered: false/);
assert.match(backendSource, /before\.brief\.status !== 'proposed'/);
assert.match(workerSource, /cloudflareAccessActor\(request\)/);
assert.match(migrationSource, /trg_editorial_brief_status_transition/);
assert.match(migrationSource, /trg_editorial_brief_decision_audit/);
assert.match(migrationSource, /editorial_brief_events_append_only/);

function record(chunk) {
  const value = chunk.toString();
  logs.push(value);
  process.stdout.write(value);
}

function executeD1(sql) {
  const result = spawnSync(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js',
    'd1', 'execute', 'DB',
    '--config', configPath,
    '--local',
    '--persist-to', '.wrangler/state',
    '--command', sql,
  ], {
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
  });

  if (result.status !== 0) {
    throw new Error(`D1 seed failed\n${result.stdout}\n${result.stderr}`);
  }
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

function signalWrangler(child, signal) {
  if (child.exitCode !== null || !child.pid) return;
  if (process.platform === 'win32') child.kill(signal);
  else process.kill(-child.pid, signal);
}

async function stopWrangler(child) {
  if (child.exitCode !== null) return;
  const exited = once(child, 'exit');
  signalWrangler(child, 'SIGTERM');
  const graceful = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (graceful) return;
  signalWrangler(child, 'SIGKILL');
  await Promise.race([once(child, 'exit'), new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

async function postDecision(briefId, action, notes, headers = accessHeaders) {
  const response = await fetch(`${origin}${decisionPath}`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ briefId, action, notes }),
  });
  const body = await response.json();
  return { response, body };
}

function updatedFixture(action) {
  return {
    ...fixture,
    overview: {
      ...fixture.overview,
      briefs_proposed: Math.max(0, fixture.overview.briefs_proposed - 1),
      briefs_accepted: action === 'accepted' ? fixture.overview.briefs_accepted + 1 : fixture.overview.briefs_accepted,
    },
    briefs: fixture.briefs.map((brief) => brief.id === 702 ? {
      ...brief,
      status: action,
      notes: action === 'accepted' ? 'Fixture accepted' : 'Fixture dismissed',
      updated_at: '2026-07-22T12:00:00.000Z',
    } : brief),
  };
}

function accessContext(browser, options = {}) {
  return browser.newContext({
    ...options,
    extraHTTPHeaders: { ...accessHeaders, ...(options.extraHTTPHeaders || {}) },
  });
}

const seedBase = 850_000_000 + Math.floor(Date.now() % 100_000_000);
const runId = seedBase;
const acceptBriefId = seedBase + 1;
const dismissBriefId = seedBase + 2;
const acceptQueueId = seedBase + 3;
const dismissQueueId = seedBase + 4;
const seedSuffix = `${seedBase}`;

executeD1(`
  INSERT INTO ai_editorial_runs(
    id,run_key,model,prompt_version,reason,status,completed_at
  ) VALUES(
    ${runId},'brief-decision-smoke-run-${seedSuffix}','fixture-model','editorial-brief-v1',
    'brief_decision_smoke','complete',CURRENT_TIMESTAMP
  );

  INSERT INTO editorial_briefs(
    id,ai_run_id,brief_key,cluster_title,proposed_title,slug_suggestion,direct_answer,rationale,
    asset_type,search_intent,opportunity_score,evidence_score,quality_flags_json,risks_json,
    required_verifications_json,outline_json,status,notes
  ) VALUES
  (
    ${acceptBriefId},${runId},'brief-decision-accept-${seedSuffix}','Smoke accept cluster',
    'Smoke brief to accept','smoke-brief-accept-${seedSuffix}','Answer','Rationale','guide','informational',
    70,60,'[]','[]','[]','[]','proposed',''
  ),
  (
    ${dismissBriefId},${runId},'brief-decision-dismiss-${seedSuffix}','Smoke dismiss cluster',
    'Smoke brief to dismiss','smoke-brief-dismiss-${seedSuffix}','Answer','Rationale','guide','informational',
    65,55,'[]','[]','[]','[]','proposed',''
  );

  INSERT INTO maintenance_queue(
    id,dedupe_key,task_type,entity_type,entity_key,priority,status,payload_json
  ) VALUES
  (
    ${acceptQueueId},'brief-decision-accept-queue-${seedSuffix}','editorial_review','page',
    'editorial-brief:${acceptBriefId}',70,'pending',json_object('briefId',${acceptBriefId})
  ),
  (
    ${dismissQueueId},'brief-decision-dismiss-queue-${seedSuffix}','editorial_review','page',
    'editorial-brief:${dismissBriefId}',65,'pending',json_object('briefId',${dismissBriefId})
  );
`);

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

let browser;

try {
  await waitForRuntime(wrangler);

  const anonymous = await postDecision(acceptBriefId, 'accepted', 'Anonymous attempt', {});
  assert.equal(anonymous.response.status, 403);

  const wrongMethod = await fetch(`${origin}${decisionPath}`, { headers: accessHeaders });
  assert.equal(wrongMethod.status, 405);
  assert.match(wrongMethod.headers.get('cache-control') || '', /no-store/);
  assert.match(wrongMethod.headers.get('x-robots-tag') || '', /noindex/);

  const invalid = await postDecision(0, 'accepted', 'Invalid');
  assert.equal(invalid.response.status, 400);

  const accepted = await postDecision(
    acceptBriefId,
    'accepted',
    'Accepted by the real brief decision smoke. No conversion or publication.',
  );
  assert.equal(accepted.response.status, 200);
  assert.equal(accepted.body.ok, true);
  assert.equal(accepted.body.idempotent, false);
  assert.equal(accepted.body.publicationTriggered, false);
  assert.equal(accepted.body.brief.id, acceptBriefId);
  assert.equal(accepted.body.brief.status, 'accepted');
  assert.equal(accepted.body.decision.action, 'accepted');
  assert.equal(accepted.body.decision.actor, 'runtime-smoke@example.test');

  const acceptedRetry = await postDecision(acceptBriefId, 'accepted', 'Retry with different text');
  assert.equal(acceptedRetry.response.status, 200);
  assert.equal(acceptedRetry.body.idempotent, true);
  assert.equal(acceptedRetry.body.decision.id, accepted.body.decision.id);
  assert.equal(acceptedRetry.body.decision.notes, accepted.body.decision.notes);

  const conflicting = await postDecision(acceptBriefId, 'dismissed', 'Opposite decision');
  assert.equal(conflicting.response.status, 409);
  assert.equal(conflicting.body.error, 'brief_decision_conflict');

  const missingDismissalReason = await postDecision(dismissBriefId, 'dismissed', '');
  assert.equal(missingDismissalReason.response.status, 400);
  assert.equal(missingDismissalReason.body.error, 'dismissal_reason_required');

  const dismissed = await postDecision(
    dismissBriefId,
    'dismissed',
    'Dismissed by the real brief decision smoke because evidence is insufficient.',
  );
  assert.equal(dismissed.response.status, 200);
  assert.equal(dismissed.body.ok, true);
  assert.equal(dismissed.body.publicationTriggered, false);
  assert.equal(dismissed.body.brief.status, 'dismissed');
  assert.equal(dismissed.body.decision.actor, 'runtime-smoke@example.test');

  const snapshotResponse = await fetch(`${origin}${snapshotPath}`, { headers: accessHeaders });
  const snapshot = await snapshotResponse.json();
  assert.equal(snapshotResponse.status, 200);
  assert.equal(snapshot.briefs.find((brief) => brief.id === acceptBriefId)?.status, 'accepted');
  assert.equal(snapshot.briefs.find((brief) => brief.id === dismissBriefId)?.status, 'dismissed');
  assert.ok(snapshot.queue.some((task) => task.entity_key === `editorial-brief:${acceptBriefId}`));
  assert.equal(snapshot.queue.some((task) => task.entity_key === `editorial-brief:${dismissBriefId}`), false);
  assert.equal(snapshot.overview.pages_published, 0);

  browser = await chromium.launch({ headless: true });

  const acceptContext = await accessContext(browser, { viewport: { width: 1280, height: 900 } });
  const acceptPage = await acceptContext.newPage();
  let acceptSnapshotReads = 0;
  let acceptPosts = 0;
  let acceptRequestBody;
  await acceptPage.route('**/api/health', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(healthFixture),
  }));
  await acceptPage.route(`**${snapshotPath}`, (route) => {
    assert.equal(route.request().method(), 'GET');
    acceptSnapshotReads += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(acceptSnapshotReads === 1 ? fixture : updatedFixture('accepted')),
    });
  });
  await acceptPage.route(`**${decisionPath}`, async (route) => {
    assert.equal(route.request().method(), 'POST');
    assert.equal(route.request().headers().authorization, undefined);
    acceptPosts += 1;
    acceptRequestBody = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        action: 'accepted',
        idempotent: false,
        publicationTriggered: false,
        brief: {
          id: 702,
          status: 'accepted',
          notes: acceptRequestBody.notes,
          decision_actor: 'runtime-smoke@example.test',
          decided_at: '2026-07-22T12:00:00.000Z',
          updated_at: '2026-07-22T12:00:00.000Z',
        },
        decision: {
          id: 9001,
          brief_id: 702,
          action: 'accepted',
          actor: 'runtime-smoke@example.test',
          notes: acceptRequestBody.notes,
          created_at: '2026-07-22T12:00:00.000Z',
        },
      }),
    });
  });

  await acceptPage.goto(`${origin}/control-room-foundation`);
  await acceptPage.getByText('Decisione brief', { exact: true }).waitFor();
  await acceptPage.getByRole('button', { name: 'Accetta brief 702' }).click();
  await acceptPage.getByRole('alertdialog').getByText('Accetta brief #702').waitFor();
  assert.equal(acceptPosts, 0);
  await acceptPage.getByRole('alertdialog').getByRole('button', { name: 'Conferma' }).click();
  await acceptPage.getByText('Nessun brief proposto da decidere').waitFor();
  assert.equal(acceptPosts, 1);
  assert.equal(acceptSnapshotReads >= 2, true);
  assert.deepEqual(Object.keys(acceptRequestBody).sort(), ['action', 'briefId', 'notes']);
  assert.equal(acceptRequestBody.briefId, 702);
  assert.equal(acceptRequestBody.action, 'accepted');
  assert.equal(typeof acceptRequestBody.actor, 'undefined');
  await acceptContext.close();

  const dismissContext = await accessContext(browser, { viewport: { width: 390, height: 844 } });
  const dismissPage = await dismissContext.newPage();
  let dismissPosts = 0;
  await dismissPage.route('**/api/health', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(healthFixture),
  }));
  await dismissPage.route(`**${snapshotPath}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(dismissPosts === 0 ? fixture : updatedFixture('dismissed')),
  }));
  await dismissPage.route(`**${decisionPath}`, async (route) => {
    dismissPosts += 1;
    const body = route.request().postDataJSON();
    assert.equal(body.action, 'dismissed');
    assert.equal(body.notes, 'Evidence gap non risolto.');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        action: 'dismissed',
        idempotent: false,
        publicationTriggered: false,
        brief: {
          id: 702,
          status: 'dismissed',
          notes: body.notes,
          decision_actor: 'runtime-smoke@example.test',
          decided_at: '2026-07-22T12:00:00.000Z',
          updated_at: '2026-07-22T12:00:00.000Z',
        },
        decision: {
          id: 9002,
          brief_id: 702,
          action: 'dismissed',
          actor: 'runtime-smoke@example.test',
          notes: body.notes,
          created_at: '2026-07-22T12:00:00.000Z',
        },
      }),
    });
  });

  await dismissPage.goto(`${origin}/control-room-foundation`);
  await dismissPage.getByRole('button', { name: 'Rifiuta brief 702' }).click();
  const dismissDialog = dismissPage.getByRole('alertdialog');
  const confirmButton = dismissDialog.getByRole('button', { name: 'Conferma' });
  await dismissDialog.getByText('Rifiuta brief #702').waitFor();
  assert.equal(await confirmButton.isDisabled(), true);
  assert.equal(dismissPosts, 0);
  await dismissDialog.getByLabel('Motivo del rifiuto').fill('Evidence gap non risolto.');
  assert.equal(await confirmButton.isEnabled(), true);
  await confirmButton.click();
  await dismissPage.getByText('Nessun brief proposto da decidere').waitFor();
  assert.equal(dismissPosts, 1);
  await dismissContext.close();

  console.log('Control Room brief decision smoke passed.');
  console.log('- Access actor derived server-side and never accepted from the browser');
  console.log('- proposed -> accepted|dismissed enforced with append-only audit');
  console.log('- retry idempotency, conflict and dismissal reason verified');
  console.log('- explicit confirmation, snapshot reload and zero publication verified');
} finally {
  if (browser) await browser.close();
  await stopWrangler(wrangler);
}
