import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { readFile, rm, writeFile } from 'node:fs/promises';

const basePort = Number(process.env.PUBLIC_SEO_ENDPOINT_SMOKE_PORT || 8831);
const serverDirectory = 'apps/web/dist/server';
const builtConfigPath = `${serverDirectory}/wrangler.json`;
const builtEntryPath = `${serverDirectory}/entry.mjs`;
const parityEntryPath = `${serverDirectory}/seo-endpoint-parity-entry.mjs`;
const parityConfigPath = `${serverDirectory}/seo-endpoint-parity-wrangler.json`;
const stateRoot = '.wrangler/public-seo-endpoint-smoke';
const populatedState = `${stateRoot}/populated`;
const emptyState = `${stateRoot}/empty`;
const invalidState = `${stateRoot}/invalid`;
const canonicalBase = 'https://senzaroaming.it';
const staticPaths = ['/', '/destinazioni', '/guide', '/confronti', '/metodo', '/trasparenza', '/privacy'];
const robotsDocument = `User-agent: *\nAllow: /\nDisallow: /go/\nDisallow: /control-room\nDisallow: /api/maintenance/\nSitemap: ${canonicalBase}/sitemap.xml\n`;

function runWrangler(args) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], {
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`Wrangler command failed:\n${result.stdout}\n${result.stderr}`);
  }
}

function migrate(statePath) {
  runWrangler(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', statePath]);
}

function executeSql(statePath, sql) {
  runWrangler(['d1', 'execute', 'DB', '--local', '--persist-to', statePath, '--command', sql]);
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function pageInsert({
  slug,
  title,
  pageType = 'guide',
  status = 'published',
  updatedAt = '2099-01-01T12:00:00Z',
}) {
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

function seedPopulated(statePath) {
  executeSql(statePath, [
    "UPDATE pages SET status='archived', featured=0;",
    pageInsert({
      slug: 'zulu-guide',
      title: 'Zulu guide',
      pageType: 'guide',
      updatedAt: '2099-03-30T23:15:00Z',
    }),
    pageInsert({
      slug: 'alpha-destination',
      title: 'Alpha destination',
      pageType: 'destination',
      updatedAt: '2099-01-02 10:30:00',
    }),
    pageInsert({
      slug: 'middle-provider',
      title: 'Middle provider',
      pageType: 'provider',
      updatedAt: '2099-02-15T09:00:00+01:00',
    }),
    pageInsert({
      slug: 'beta-comparison',
      title: 'Beta comparison',
      pageType: 'comparison',
      updatedAt: '2099-01-20',
    }),
    pageInsert({
      slug: 'review-hidden',
      title: 'Review hidden',
      status: 'review',
      updatedAt: '2100-01-01T12:00:00Z',
    }),
    pageInsert({
      slug: 'draft-hidden',
      title: 'Draft hidden',
      status: 'draft',
      updatedAt: '2100-01-02T12:00:00Z',
    }),
    pageInsert({
      slug: 'archived-hidden',
      title: 'Archived hidden',
      status: 'archived',
      updatedAt: '2100-01-03T12:00:00Z',
    }),
  ].join('\n'));
}

function seedEmpty(statePath) {
  executeSql(statePath, "UPDATE pages SET status='archived', featured=0;");
}

function seedInvalid(statePath) {
  executeSql(statePath, [
    "UPDATE pages SET status='archived', featured=0;",
    pageInsert({
      slug: 'robots.txt',
      title: 'Invalid reserved sitemap row',
      updatedAt: '2099-04-01T12:00:00Z',
    }),
  ].join('\n'));
}

async function prepareParityRuntime() {
  const [configRaw, builtEntry, workerSource, routePolicySource] = await Promise.all([
    readFile(builtConfigPath, 'utf8'),
    readFile(builtEntryPath, 'utf8'),
    readFile('apps/web/src/worker.ts', 'utf8'),
    readFile('src/public-route-policy.ts', 'utf8'),
  ]);

  assert.match(builtEntry, /createPublicWorker/);
  assert.match(builtEntry, /currentPublicRouteDecision/);
  assert.match(workerSource, /export default createPublicWorker\(activePublicRouteDecision\)/);
  assert.match(routePolicySource, /activePublicRouteDecision = currentPublicRouteDecision/);

  const wrapper = `import {
  Last30DaysContainer,
  RecentDemandWorkflow,
  createPublicWorker,
  currentPublicRouteDecision,
} from './entry.mjs';

const decide = (pathname) => {
  const route = currentPublicRouteDecision(pathname);
  return route.kind === 'seo-endpoint'
    ? Object.freeze({ ...route, owner: 'astro' })
    : route;
};

export { Last30DaysContainer, RecentDemandWorkflow };
export default createPublicWorker(decide);
`;
  await writeFile(parityEntryPath, wrapper, 'utf8');

  const config = JSON.parse(configRaw);
  config.main = 'seo-endpoint-parity-entry.mjs';
  config.assets = config.assets || {};
  config.assets.run_worker_first = [...new Set([
    ...(config.assets.run_worker_first || []),
    '/sitemap.xml',
    '/sitemap.xml/*',
    '/robots.txt',
    '/robots.txt/*',
  ])];
  await writeFile(parityConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

function startRuntime(configPath, statePath, port) {
  const logs = [];
  const child = spawn(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js',
    'dev',
    '--config', configPath,
    '--persist-to', statePath,
    '--port', String(port),
    '--ip', '127.0.0.1',
  ], {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: 'seo-endpoint-parity-token',
      AI_GATEWAY_TOKEN: 'seo-endpoint-parity-ai-token',
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
    if (runtime.child.exitCode !== null) {
      throw new Error(`wrangler dev exited with ${runtime.child.exitCode}\n${runtime.logs.join('')}`);
    }
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {
      // workerd is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for SEO endpoint parity runtime.\n${runtime.logs.join('')}`);
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
  await Promise.race([
    once(runtime.child, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
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

async function collectEndpointSnapshot(origin) {
  const [
    sitemap,
    sitemapQuery,
    sitemapSlash,
    sitemapHead,
    robots,
    robotsQuery,
    robotsSlash,
    robotsHead,
    home,
    health,
  ] = await Promise.all([
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
  return {
    sitemap,
    sitemapQuery,
    sitemapSlash,
    sitemapHead,
    robots,
    robotsQuery,
    robotsSlash,
    robotsHead,
    home,
    health,
  };
}

function assertSuccessHeaders(snapshot, contentType) {
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

function assertValidPopulated(snapshot) {
  for (const value of [snapshot.sitemap, snapshot.sitemapQuery, snapshot.sitemapSlash]) {
    assertSuccessHeaders(value, 'application/xml;charset=UTF-8');
    assert.equal(value.body, snapshot.sitemap.body);
  }
  assertSuccessHeaders(snapshot.sitemapHead, 'application/xml;charset=UTF-8');
  assert.equal(snapshot.sitemapHead.body, '');

  const entries = parseSitemap(snapshot.sitemap.body);
  assert.deepEqual(
    entries.slice(0, staticPaths.length).map((entry) => entry.loc),
    staticPaths.map((pathname) => `${canonicalBase}${pathname}`),
  );
  assert.deepEqual(entries.slice(staticPaths.length), [
    { loc: `${canonicalBase}/alpha-destination`, lastmod: '2099-01-02' },
    { loc: `${canonicalBase}/beta-comparison`, lastmod: '2099-01-20' },
    { loc: `${canonicalBase}/middle-provider`, lastmod: '2099-02-15' },
    { loc: `${canonicalBase}/zulu-guide`, lastmod: '2099-03-30' },
  ]);
  assert.equal(new Set(entries.map((entry) => entry.loc)).size, entries.length);
  for (const entry of entries.slice(0, staticPaths.length)) assert.equal(entry.lastmod, null);
  assert.doesNotMatch(snapshot.sitemap.body, /astro-foundation|review-hidden|draft-hidden|archived-hidden|\/404|\/api\/|\/go\/|control-room/);

  for (const value of [snapshot.robots, snapshot.robotsQuery, snapshot.robotsSlash]) {
    assertSuccessHeaders(value, 'text/plain;charset=UTF-8');
    assert.equal(value.body, robotsDocument);
  }
  assertSuccessHeaders(snapshot.robotsHead, 'text/plain;charset=UTF-8');
  assert.equal(snapshot.robotsHead.body, '');
  assert.equal(snapshot.robots.body.endsWith('\n'), true);
  assert.doesNotMatch(snapshot.robots.body, /astro-foundation|token|secret/i);

  assert.equal(snapshot.home.status, 200);
  assert.match(snapshot.home.body, /<section class="hero">/);
  assert.doesNotMatch(snapshot.home.body, /data-public-homepage="canonical"/);
  assert.equal(snapshot.health.status, 200);
  const health = JSON.parse(snapshot.health.body);
  assert.equal(health.controlRoomVersion, 3);
}

function assertValidEmpty(snapshot) {
  assertValidPopulated({
    ...snapshot,
    sitemap: snapshot.sitemap,
    sitemapQuery: snapshot.sitemapQuery,
    sitemapSlash: snapshot.sitemapSlash,
    sitemapHead: snapshot.sitemapHead,
  });
  const entries = parseSitemap(snapshot.sitemap.body);
  assert.equal(entries.length, staticPaths.length);
  assert.deepEqual(entries.map((entry) => entry.loc), staticPaths.map((pathname) => `${canonicalBase}${pathname}`));
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
    assertSuccessHeaders(value, 'text/plain;charset=UTF-8');
    assert.equal(value.body, robotsDocument);
  }
  assertSuccessHeaders(snapshot.robotsHead, 'text/plain;charset=UTF-8');
  assert.equal(snapshot.robotsHead.body, '');
}

function assertEquivalent(legacy, astro, mode) {
  for (const key of [
    'sitemap', 'sitemapQuery', 'sitemapSlash', 'sitemapHead',
    'robots', 'robotsQuery', 'robotsSlash', 'robotsHead',
  ]) {
    assert.deepEqual(astro[key], legacy[key], `${mode}: legacy/Astro drift for ${key}`);
  }
}

async function runSnapshot(configPath, statePath, port) {
  const runtime = startRuntime(configPath, statePath, port);
  const origin = `http://127.0.0.1:${port}`;
  try {
    await waitForRuntime(runtime, origin);
    return await collectEndpointSnapshot(origin);
  } finally {
    await stopRuntime(runtime);
  }
}

async function verifyState(name, statePath, assertion, portOffset) {
  const legacy = await runSnapshot(builtConfigPath, statePath, basePort + portOffset);
  assertion(legacy);
  const astro = await runSnapshot(parityConfigPath, statePath, basePort + portOffset + 1);
  assertion(astro);
  assertEquivalent(legacy, astro, name);
}

try {
  await rm(stateRoot, { recursive: true, force: true });
  await prepareParityRuntime();

  for (const statePath of [populatedState, emptyState, invalidState]) migrate(statePath);
  seedPopulated(populatedState);
  seedEmpty(emptyState);
  seedInvalid(invalidState);

  await verifyState('populated', populatedState, assertValidPopulated, 0);
  await verifyState('empty', emptyState, assertValidEmpty, 2);
  await verifyState('invalid', invalidState, assertInvalid, 4);

  console.log('Public SEO endpoint parity smoke passed: legacy and Astro endpoints are equivalent while live ownership remains backend.');
} finally {
  await Promise.all([
    rm(parityEntryPath, { force: true }),
    rm(parityConfigPath, { force: true }),
    rm(stateRoot, { recursive: true, force: true }),
  ]);
}
