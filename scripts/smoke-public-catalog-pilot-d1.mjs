import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { readFile, rm, writeFile } from 'node:fs/promises';

const port = Number(process.env.PUBLIC_CATALOG_PILOT_D1_PORT || 8841);
const origin = `http://127.0.0.1:${port}`;
const serverDirectory = 'apps/web/dist/server';
const builtConfigPath = `${serverDirectory}/wrangler.json`;
const entryPath = `${serverDirectory}/catalog-pilot-d1-entry.ts`;
const configPath = `${serverDirectory}/catalog-pilot-d1-wrangler.json`;
const stateRoot = '.wrangler/public-catalog-pilot-d1-smoke';

function wrangler(args) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], {
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`Wrangler command failed:\n${result.stdout}\n${result.stderr}`);
  }
}

function startRuntime() {
  const logs = [];
  const child = spawn(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js',
    'dev',
    '--config', configPath,
    '--persist-to', stateRoot,
    '--port', String(port),
    '--ip', '127.0.0.1',
  ], {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: 'catalog-pilot-d1-smoke-token',
      AI_GATEWAY_TOKEN: 'catalog-pilot-d1-smoke-ai-token',
      ASTRO_TELEMETRY_DISABLED: '1',
    },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const record = (chunk) => {
    const value = chunk.toString();
    logs.push(value);
    process.stdout.write(value);
  };
  child.stdout.on('data', record);
  child.stderr.on('data', record);
  return { child, logs };
}

async function waitForRuntime(runtime, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (runtime.child.exitCode !== null) {
      throw new Error(`wrangler dev exited with ${runtime.child.exitCode}\n${runtime.logs.join('')}`);
    }
    try {
      const response = await fetch(`${origin}/audit`);
      if (response.ok) return response;
      const body = await response.text();
      if (response.status >= 500) throw new Error(`Audit endpoint failed: ${response.status} ${body}`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Audit endpoint failed:')) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for catalog pilot D1 runtime.\n${runtime.logs.join('')}`);
}

function signalRuntime(runtime, signal) {
  if (runtime.child.exitCode !== null || !runtime.child.pid) return;
  if (process.platform === 'win32') runtime.child.kill(signal);
  else process.kill(-runtime.child.pid, signal);
}

async function stopRuntime(runtime) {
  if (runtime.child.exitCode !== null) return;
  const exited = once(runtime.child, 'exit');
  signalRuntime(runtime, 'SIGTERM');
  const graceful = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (graceful) return;
  signalRuntime(runtime, 'SIGKILL');
  await Promise.race([once(runtime.child, 'exit'), new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

let runtime;
try {
  await rm(stateRoot, { recursive: true, force: true });
  const builtConfig = JSON.parse(await readFile(builtConfigPath, 'utf8'));
  builtConfig.main = 'catalog-pilot-d1-entry.ts';
  await writeFile(configPath, `${JSON.stringify(builtConfig, null, 2)}\n`, 'utf8');
  await writeFile(entryPath, `
import {
  auditPublicCatalogPilot,
  loadPublicCatalogPilotSnapshot,
} from '../../../../src/public-catalog-pilot';

export { Last30DaysContainer, RecentDemandWorkflow } from './entry.mjs';

type Env = { DB: D1Database };

type Counts = {
  briefs: number;
  bundles: number;
  drafts: number;
  pages: number;
  published: number;
  review: number;
};

async function counts(database: D1Database): Promise<Counts> {
  const row = await database.prepare(\`
    SELECT
      (SELECT COUNT(*) FROM editorial_briefs) AS briefs,
      (SELECT COUNT(*) FROM page_evidence_bundles) AS bundles,
      (SELECT COUNT(*) FROM editorial_review_drafts) AS drafts,
      (SELECT COUNT(*) FROM pages) AS pages,
      (SELECT COUNT(*) FROM pages WHERE status='published') AS published,
      (SELECT COUNT(*) FROM pages WHERE status='review') AS review
  \`).first<Record<string, number>>();
  return {
    briefs: Number(row?.briefs || 0),
    bundles: Number(row?.bundles || 0),
    drafts: Number(row?.drafts || 0),
    pages: Number(row?.pages || 0),
    published: Number(row?.published || 0),
    review: Number(row?.review || 0),
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname !== '/audit') return new Response('Not found', { status: 404 });
    const before = await counts(env.DB);
    const snapshot = await loadPublicCatalogPilotSnapshot(env.DB);
    const report = auditPublicCatalogPilot(snapshot, new Date('2026-07-24T12:00:00.000Z'));
    const after = await counts(env.DB);
    return Response.json({ before, after, report, snapshotCounts: {
      briefs: snapshot.briefs.length,
      bundles: snapshot.bundles.length,
      drafts: snapshot.drafts.length,
      pages: snapshot.pages.length,
      claims: snapshot.claims.length,
    } }, { headers: { 'cache-control': 'no-store' } });
  },
} satisfies ExportedHandler<Env>;
`, 'utf8');

  wrangler(['d1', 'migrations', 'apply', 'DB', '--local', '--config', configPath, '--persist-to', stateRoot]);
  runtime = startRuntime();
  const response = await waitForRuntime(runtime);
  const result = await response.json();

  assert.deepEqual(result.after, result.before, 'The read-only audit must not change editorial counts or page states.');
  assert.equal(result.snapshotCounts.briefs, result.before.briefs);
  assert.equal(result.snapshotCounts.bundles, result.before.bundles);
  assert.equal(result.snapshotCounts.drafts, result.before.drafts);
  assert.equal(result.snapshotCounts.pages, result.before.pages);
  assert.equal(result.report.schemaVersion, 1);
  assert.ok(result.report.selectedCount <= 4);
  assert.equal(result.report.selected.every((candidate) => candidate.pageStatus === 'review'), true);
  assert.equal(response.headers.get('cache-control'), 'no-store');

  console.log('Public catalog pilot D1 smoke passed: real migrations load successfully and the audit performs no mutation.');
} finally {
  if (runtime) await stopRuntime(runtime);
  await Promise.all([
    rm(entryPath, { force: true }),
    rm(configPath, { force: true }),
    rm(stateRoot, { recursive: true, force: true }),
  ]);
}
