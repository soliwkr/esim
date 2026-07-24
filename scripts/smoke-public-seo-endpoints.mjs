import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { readFile, rm } from 'node:fs/promises';

const basePort = Number(process.env.PUBLIC_SEO_ENDPOINT_SMOKE_PORT || 8831);
const configPath = 'apps/web/dist/server/wrangler.json';
const stateRoot = '.wrangler/public-seo-endpoint-smoke';
const populatedState = `${stateRoot}/populated`;
const emptyState = `${stateRoot}/empty`;
const invalidState = `${stateRoot}/invalid`;
const canonicalBase = 'https://senzaroaming.it';
const staticPaths = ['/', '/destinazioni', '/guide', '/confronti', '/metodo', '/trasparenza', '/privacy'];
const robotsDocument = `User-agent: *\nAllow: /\nDisallow: /go/\nDisallow: /control-room\nDisallow: /api/maintenance/\nSitemap: ${canonicalBase}/sitemap.xml\n`;

function wrangler(args) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], {
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`Wrangler command failed:\n${result.stdout}\n${result.stderr}`);
}

function migrate(state) {
  wrangler(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', state]);
}

function executeSql(state, sql) {
  wrangler(['d1', 'execute', 'DB', '--local', '--persist-to', state, '--command', sql]);
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function pageInsert({ slug, title, pageType = 'guide', status = 'published', updatedAt = '2099-01-01T12:00:00Z' }) {
  return `INSERT INTO pages (
    slug,page_type,title,meta_description,eyebrow,h1,direct_answer,intro,
    content_json,faq_json,source_links_json,primary_keyword,cluster,search_intent,
    status,featured,source_checked_at,published_at,updated_at
  ) VALUES (
    ${quote(slug)},${quote(pageType)},${quote(title)},${quote(`Meta ${title}`)},
    'SEO endpoint smoke',${quote(title)},${quote(`Risposta ${title}`)},${quote(`Introduzione ${title}`)},
    '[]','[]','[]',${quote(slug)},'SEO endpoint parity','informational',${quote(status)},0,
    '2099-01-01T08:00:00Z',${status === 'published' ? quote(updatedAt) : 'NULL'},${quote(updatedAt)}
  );`;
}

function seedPopulated(state) {
  executeSql(state, [
    "UPDATE pages SET status='archived', featured=0;",
    pageInsert({ slug: 'zulu-guide', title: 'Zulu guide', updatedAt: '2099-03-30T23:15:00Z' }),
    pageInsert({ slug: 'alpha-destination', title: 'Alpha destination', pageType: 'destination', updatedAt: '2099-01-02 10:30:00' }),
    pageInsert({ slug: 'middle-provider', title: 'Middle provider', pageType: 'provider', updatedAt: '2099-02-15T09:00:00+01:00' }),
    pageInsert({ slug: 'beta-comparison', title: 'Beta comparison', pageType: 'comparison', updatedAt: '2099-01-20' }),
    pageInsert({ slug: 'review-hidden', title: 'Review hidden', status: 'review', updatedAt: '2100-01-01T12:00:00Z' }),
    pageInsert({ slug: 'draft-hidden', title: 'Draft hidden', status: 'draft', updatedAt: '2100-01-02T12:00:00Z' }),
    pageInsert({ slug: 'archived-hidden', title: 'Archived hidden', status: 'archived', updatedAt: '2100-01-03T12:00:00Z' }),
  ].join('\n'));
}

function seedInvalid(state) {
  executeSql(state, [
    "UPDATE pages SET status='archived', featured=0;",
    pageInsert({ slug: 'robots.txt', title: 'Invalid reserved sitemap row', updatedAt: '2099-04-01T12:00:00Z' }),
  ].join('\n'));
}

async function verifyBuildContract() {
  const [configRaw, entry, workerSource, policySource] = await Promise.all([
    readFile(configPath, 'utf8'),
    readFile('apps/web/dist/server/entry.mjs', 'utf8'),
    readFile('apps/web/src/worker.ts', 'utf8'),
    readFile('src/public-route-policy.ts', 'utf8'),
  ]);
  assert.deepEqual(JSON.parse(configRaw).assets?.run_worker_first, ['/*', '!/_astro/*']);
  assert.match(entry, /targetPublicRouteDecision/);
  assert.match(workerSource, /export default createPublicWorker\(activePublicRouteDecision\)/);
  assert.match(policySource, /activePublicRouteDecision = targetPublicRouteDecision/);
}

function startRuntime(state, port) {
  const logs = [];
  const child = spawn(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js', 'dev', '--config', configPath,
    '--persist-to', state, '--port', String(port), '--ip', '127.0.0.1',
  ], {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: 'seo-endpoint-active-token',
      AI_GATEWAY_TOKEN: 'seo-endpoint-active-ai-token',
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

async function waitForRuntime(runtime, origin, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (runtime.child.exitCode !== null) throw new Error(`Runtime exited.\n${runtime.logs.join('')}`);
    try {
      if ((await fetch(`${origin}/api/health`)).ok) return;
    } catch {
      // workerd is starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`SEO endpoint runtime timed out.\n${runtime.logs.join('')}`);
}

function signal(runtime, name) {
  if (runtime.child.exitCode !== null || !runtime.child.pid) return;
  if (process.platform === 'win32') runtime.child.kill(name);
  else process.kill(-runtime.child.pid, name);
}

async function stopRuntime(runtime) {
  if (!runtime || runtime.child.exitCode !== null) return;
  const exited = once(runtime.child, 'exit');
  signal(runtime, 'SIGTERM');
  if (await Promise.race([exited.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 5_000))])) return;
  signal(runtime, 'SIGKILL');
  await Promise.race([once(runtime.child, 'exit'), new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

async function responseSnapshot(origin, pathname, method = 'GET') {
  const response = await fetch(`${origin}${pathname}`, { method });
  return {
    status: response.status,
    contentType: response.headers.get('content-type'),
    cacheControl: response.headers.get('cache-control'),
    robotsTag: response.headers.get('x-robots-tag'),
    body: await response.text(),
  };
}

async function collect(origin) {
  const [sitemap, sitemapQuery, sitemapSlash, sitemapHead, robots, robotsQuery, robotsSlash, robotsHead, home, health] = await Promise.all([
    responseSnapshot(origin, '/sitemap.xml'),
    responseSnapshot(origin, '/sitemap.xml?cache=1'),
    responseSnapshot(origin, '/sitemap.xml/'),
    responseSnapshot(origin, '/sitemap.xml', 'HEAD'),
    responseSnapshot(origin, '/robots.txt'),
    responseSnapshot(origin, '/robots.txt?cache=1'),
    responseSnapshot(origin, '/robots.txt/'),
    responseSnapshot(origin, '/robots.txt', 'HEAD'),
    responseSnapshot(origin, '/'),
    responseSnapshot(origin, '/api/health'),
  ]);
  return { sitemap, sitemapQuery, sitemapSlash, sitemapHead, robots, robotsQuery, robotsSlash, robotsHead, home, health };
}

function assertSuccess(snapshot, contentType) {
  assert.equal(snapshot.status, 200);
  assert.equal(snapshot.contentType, contentType);
  assert.equal(snapshot.cacheControl, 'public,max-age=3600');
  assert.equal(snapshot.robotsTag, null);
}

function parseSitemap(xml) {
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<\/urlset>$/);
  const entries = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)]
    .map((match) => ({ loc: match[1], lastmod: match[2] || null }));
  assert.equal(entries.length, (xml.match(/<url>/g) || []).length);
  return entries;
}

function assertCommon(snapshot) {
  for (const value of [snapshot.sitemap, snapshot.sitemapQuery, snapshot.sitemapSlash]) {
    assertSuccess(value, 'application/xml;charset=UTF-8');
    assert.equal(value.body, snapshot.sitemap.body);
  }
  assertSuccess(snapshot.sitemapHead, 'application/xml;charset=UTF-8');
  assert.equal(snapshot.sitemapHead.body, '');

  for (const value of [snapshot.robots, snapshot.robotsQuery, snapshot.robotsSlash]) {
    assertSuccess(value, 'text/plain;charset=UTF-8');
    assert.equal(value.body, robotsDocument);
  }
  assertSuccess(snapshot.robotsHead, 'text/plain;charset=UTF-8');
  assert.equal(snapshot.robotsHead.body, '');
  assert.doesNotMatch(snapshot.robots.body, /astro-foundation|token|secret/i);

  assert.equal(snapshot.home.status, 200);
  assert.match(snapshot.home.body, /data-public-homepage="canonical"/);
  assert.match(snapshot.home.body, /index,follow,max-image-preview:large/);
  assert.doesNotMatch(snapshot.home.body, /data-public-shell="astro-preview"/);
  assert.equal(snapshot.health.status, 200);
  assert.equal(JSON.parse(snapshot.health.body).controlRoomVersion, 3);
}

function assertEntries(snapshot, dynamicEntries) {
  const entries = parseSitemap(snapshot.sitemap.body);
  assert.deepEqual(entries.slice(0, staticPaths.length).map((entry) => entry.loc), staticPaths.map((pathname) => `${canonicalBase}${pathname}`));
  assert.deepEqual(entries.slice(staticPaths.length), dynamicEntries);
  assert.equal(new Set(entries.map((entry) => entry.loc)).size, entries.length);
  for (const entry of entries.slice(0, staticPaths.length)) assert.equal(entry.lastmod, null);
  assert.doesNotMatch(snapshot.sitemap.body, /astro-foundation|review-hidden|draft-hidden|archived-hidden|\/404|\/api\/|\/go\/|control-room/);
}

function assertPopulated(snapshot) {
  assertCommon(snapshot);
  assertEntries(snapshot, [
    { loc: `${canonicalBase}/alpha-destination`, lastmod: '2099-01-02' },
    { loc: `${canonicalBase}/beta-comparison`, lastmod: '2099-01-20' },
    { loc: `${canonicalBase}/middle-provider`, lastmod: '2099-02-15' },
    { loc: `${canonicalBase}/zulu-guide`, lastmod: '2099-03-30' },
  ]);
}

function assertEmpty(snapshot) {
  assertCommon(snapshot);
  assertEntries(snapshot, []);
  assert.equal(parseSitemap(snapshot.sitemap.body).length, staticPaths.length);
}

function assertInvalid(snapshot) {
  for (const value of [snapshot.sitemap, snapshot.sitemapQuery, snapshot.sitemapSlash]) {
    assert.equal(value.status, 500);
    assert.equal(value.contentType, 'text/plain;charset=UTF-8');
    assert.equal(value.cacheControl, 'no-store');
    assert.equal(value.body, 'Errore interno');
    assert.doesNotMatch(value.body, /robots\.txt|urlset|<url>/);
  }
  assert.equal(snapshot.sitemapHead.status, 500);
  assert.equal(snapshot.sitemapHead.cacheControl, 'no-store');
  assert.equal(snapshot.sitemapHead.body, '');
  for (const value of [snapshot.robots, snapshot.robotsQuery, snapshot.robotsSlash]) {
    assertSuccess(value, 'text/plain;charset=UTF-8');
    assert.equal(value.body, robotsDocument);
  }
  assertSuccess(snapshot.robotsHead, 'text/plain;charset=UTF-8');
  assert.equal(snapshot.home.status, 200);
  assert.match(snapshot.home.body, /data-public-homepage="canonical"/);
  assert.equal(snapshot.health.status, 200);
}

async function verifyState(state, port, assertion) {
  const runtime = startRuntime(state, port);
  const origin = `http://127.0.0.1:${port}`;
  try {
    await waitForRuntime(runtime, origin);
    assertion(await collect(origin));
  } finally {
    await stopRuntime(runtime);
  }
}

try {
  await rm(stateRoot, { recursive: true, force: true });
  await verifyBuildContract();
  for (const state of [populatedState, emptyState, invalidState]) migrate(state);
  seedPopulated(populatedState);
  executeSql(emptyState, "UPDATE pages SET status='archived', featured=0;");
  seedInvalid(invalidState);

  await verifyState(populatedState, basePort, assertPopulated);
  await verifyState(emptyState, basePort + 1, assertEmpty);
  await verifyState(invalidState, basePort + 2, assertInvalid);

  console.log('Public SEO endpoint smoke passed against active Astro ownership.');
} finally {
  await rm(stateRoot, { recursive: true, force: true });
}
