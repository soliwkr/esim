import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const artifactDir = 'production-verification';
const siteUrl = (process.env.SENZA_ROAMING_SITE_URL || 'https://senzaroaming.it').replace(/\/$/, '');
const pageUrl = `${siteUrl}/control-room-foundation`;
const snapshotUrl = `${pageUrl}/api/snapshot`;
const requiredEnv = [
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'CF_ACCESS_CLIENT_ID',
  'CF_ACCESS_CLIENT_SECRET',
];

for (const name of requiredEnv) {
  assert.ok(process.env[name]?.trim(), `${name} is required`);
}

await mkdir(artifactDir, { recursive: true });

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', ...(options.env || {}) },
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(' ')} failed with status ${result.status}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }

  return { stdout: result.stdout, stderr: result.stderr };
}

function parseJsonOutput(raw) {
  const text = raw.trim();
  for (const marker of ['[', '{']) {
    const index = text.indexOf(marker);
    if (index >= 0) {
      try {
        return JSON.parse(text.slice(index));
      } catch {
        // Try the other marker before failing.
      }
    }
  }
  throw new Error(`Could not parse Wrangler JSON output:\n${text.slice(0, 2000)}`);
}

function resultRows(payload) {
  const blocks = Array.isArray(payload) ? payload : [payload];
  return blocks.flatMap((block) => {
    if (Array.isArray(block?.results)) return block.results;
    if (Array.isArray(block?.result?.results)) return block.result.results;
    return [];
  });
}

function d1Query(sql) {
  const { stdout } = run(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js',
    'd1', 'execute', 'DB',
    '--remote',
    '--config', 'wrangler.production.jsonc',
    '--command', sql,
    '--json',
  ]);
  return resultRows(parseJsonOutput(stdout));
}

function statusMap(rows) {
  return Object.fromEntries(rows.map((row) => [String(row.status), Number(row.count)]));
}

const d1List = parseJsonOutput(run(process.execPath, [
  'node_modules/wrangler/bin/wrangler.js',
  'd1', 'list', '--json',
]).stdout);
const databases = Array.isArray(d1List) ? d1List : d1List.result || d1List.databases || [];
const database = databases.find((item) => item?.name === 'senza-roaming');
const databaseId = database && (database.uuid || database.id || database.database_id);
assert.ok(databaseId, 'Could not resolve the production D1 database ID');
process.env.D1_DATABASE_ID = String(databaseId);
process.env.SENZA_ROAMING_SITE_URL = siteUrl;
run(process.execPath, ['scripts/build-production-config.mjs']);

const publicationBefore = Number(d1Query("SELECT COUNT(*) AS count FROM pages WHERE status='published';")[0]?.count);
const briefStatusesBefore = statusMap(d1Query('SELECT status, COUNT(*) AS count FROM editorial_briefs GROUP BY status ORDER BY status;'));
assert.ok(Number.isInteger(publicationBefore) && publicationBefore >= 0, 'Invalid publication count before migration');

const migrationResult = run(process.execPath, [
  'node_modules/wrangler/bin/wrangler.js',
  'd1', 'migrations', 'apply', 'DB',
  '--remote',
  '--config', 'wrangler.production.jsonc',
]);
await writeFile(
  `${artifactDir}/migration-apply.log`,
  `${migrationResult.stdout}\n${migrationResult.stderr}`.trim() + '\n',
  'utf8',
);

const migrationRows = d1Query("SELECT name FROM d1_migrations WHERE name='0020_editorial_brief_decisions.sql';");
assert.equal(migrationRows.length, 1, 'Migration 0020 is not recorded in remote D1');

const tableRows = d1Query("SELECT name FROM sqlite_master WHERE type='table' AND name='editorial_brief_events';");
assert.equal(tableRows.length, 1, 'editorial_brief_events table is missing');

const columnRows = d1Query("SELECT name FROM pragma_table_info('editorial_briefs') WHERE name IN ('decision_actor','decided_at') ORDER BY name;");
assert.deepEqual(columnRows.map((row) => row.name), ['decided_at', 'decision_actor']);

const expectedTriggers = [
  'trg_editorial_brief_decision_audit',
  'trg_editorial_brief_events_append_only_delete',
  'trg_editorial_brief_events_append_only_update',
  'trg_editorial_brief_status_transition',
];
const triggerRows = d1Query(`SELECT name FROM sqlite_master WHERE type='trigger' AND name IN (${expectedTriggers.map((name) => `'${name}'`).join(',')}) ORDER BY name;`);
assert.deepEqual(triggerRows.map((row) => row.name), expectedTriggers);

const publicationAfter = Number(d1Query("SELECT COUNT(*) AS count FROM pages WHERE status='published';")[0]?.count);
const briefStatusesAfter = statusMap(d1Query('SELECT status, COUNT(*) AS count FROM editorial_briefs GROUP BY status ORDER BY status;'));
assert.equal(publicationAfter, publicationBefore, 'Migration changed the number of published pages');
assert.deepEqual(briefStatusesAfter, briefStatusesBefore, 'Migration changed editorial brief statuses');

const accessHeaders = {
  'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
  'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET,
};

const anonymousResponse = await fetch(pageUrl, { redirect: 'manual' });
assert.ok([302, 401, 403].includes(anonymousResponse.status), `Anonymous Control Room status was ${anonymousResponse.status}`);

async function authenticatedGet(url, accept = 'text/html') {
  return fetch(url, {
    headers: { ...accessHeaders, Accept: accept },
    redirect: 'manual',
  });
}

const pageResponse = await authenticatedGet(pageUrl);
assert.equal(pageResponse.status, 200, `Authenticated Control Room status was ${pageResponse.status}`);
assert.match(pageResponse.headers.get('cache-control') || '', /no-store/i);
assert.match(pageResponse.headers.get('x-robots-tag') || '', /noindex/i);
const pageHtml = await pageResponse.text();
assert.match(pageHtml, /<title>Control Room · Senza Roaming<\/title>/);
assert.match(pageHtml, /<astro-island/);

const snapshotResponse = await authenticatedGet(snapshotUrl, 'application/json');
assert.equal(snapshotResponse.status, 200, `Authenticated snapshot status was ${snapshotResponse.status}`);
assert.match(snapshotResponse.headers.get('cache-control') || '', /no-store/i);
assert.match(snapshotResponse.headers.get('x-robots-tag') || '', /noindex/i);
const snapshot = await snapshotResponse.json();
assert.equal(snapshot.ok, true);
assert.equal(snapshot.capabilities?.publicationAutomation, false);

let browser;
let nonGetRequests = [];
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    extraHTTPHeaders: accessHeaders,
  });
  const page = await context.newPage();
  page.on('request', (request) => {
    if (request.method() !== 'GET') {
      nonGetRequests.push({ method: request.method(), url: request.url() });
    }
  });

  let loaded = false;
  let lastError;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const response = await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30_000 });
      assert.equal(response?.status(), 200);
      await page.getByRole('heading', { name: 'Decisione brief' }).waitFor({ state: 'visible', timeout: 15_000 });
      await page.getByText('Decisione ≠ conversione ≠ pubblicazione').waitFor({ state: 'visible', timeout: 15_000 });
      loaded = true;
      break;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
  if (!loaded) throw lastError || new Error('Control Room did not become ready');

  await page.getByText('Decisioni operative', { exact: true }).waitFor({ state: 'visible' });
  const proposedCards = page.locator('[data-testid^="brief-decision-"]');
  const proposedCount = await proposedCards.count();
  if (proposedCount === 0) {
    await page.getByText('Nessun brief proposto da decidere').waitFor({ state: 'visible' });
  } else {
    await page.getByRole('button', { name: /^Accetta brief / }).first().waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /^Rifiuta brief / }).first().waitFor({ state: 'visible' });
  }

  assert.equal(await page.getByRole('button', { name: /pubblica/i }).count(), 0, 'A publication button is present');
  assert.deepEqual(nonGetRequests, [], `Unexpected non-GET browser requests: ${JSON.stringify(nonGetRequests)}`);

  await page.screenshot({ path: `${artifactDir}/control-room-foundation.png`, fullPage: true });
  await context.close();
} finally {
  await browser?.close();
}

const summary = {
  verifiedAt: new Date().toISOString(),
  siteUrl,
  mergeCommit: '15ea0445790ec35ad13606762d263c328cdb826c',
  migration: '0020_editorial_brief_decisions.sql',
  migrationRecorded: true,
  publicationCountBefore: publicationBefore,
  publicationCountAfter: publicationAfter,
  briefStatusesBefore,
  briefStatusesAfter,
  anonymousControlRoomStatus: anonymousResponse.status,
  authenticatedControlRoomStatus: pageResponse.status,
  authenticatedSnapshotStatus: snapshotResponse.status,
  publicationAutomation: snapshot.capabilities?.publicationAutomation,
  browserNonGetRequests: nonGetRequests,
  realBriefDecisionsExecuted: 0,
};
await writeFile(`${artifactDir}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(summary, null, 2));
