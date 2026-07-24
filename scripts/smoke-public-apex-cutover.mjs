import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { readFile, rm } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { createAccessTestCredentials } from './access-test-token.mjs';

const port = Number(process.env.PUBLIC_APEX_CUTOVER_SMOKE_PORT || 8841);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const statePath = '.wrangler/public-apex-cutover-smoke';
const publishedSlug = 'apex-cutover-published';
const reviewSlug = 'apex-cutover-review';
const draftSlug = 'apex-cutover-draft';
const missingSlug = 'apex-cutover-missing';
const providerSlug = 'apex-cutover-provider';
const access = createAccessTestCredentials();
const logs = [];

function record(chunk) {
  const value = chunk.toString();
  logs.push(value);
  process.stdout.write(value);
}

function runWrangler(args) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], {
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`Wrangler command failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function pageInsert({ slug, title, status = 'published', pageType = 'guide', featured = 0 }) {
  const content = [{ type: 'paragraph', text: `Contenuto verificato per ${title}.` }];
  const faq = [{ question: `Domanda su ${title}?`, answer: `Risposta verificata per ${title}.` }];
  const sources = [{ label: 'Fonte ufficiale cutover', url: 'https://example.com/apex-cutover-source' }];
  const updatedAt = '2099-07-24T12:00:00Z';

  return `INSERT INTO pages (
    slug,page_type,title,meta_description,eyebrow,h1,direct_answer,intro,
    content_json,faq_json,source_links_json,primary_keyword,cluster,search_intent,
    status,featured,source_checked_at,published_at,updated_at
  ) VALUES (
    ${quote(slug)},${quote(pageType)},${quote(title)},${quote(`Meta ${title}`)},
    'Cutover verificato',${quote(title)},${quote(`Risposta diretta ${title}`)},${quote(`Introduzione ${title}`)},
    ${quote(JSON.stringify(content))},${quote(JSON.stringify(faq))},${quote(JSON.stringify(sources))},
    ${quote(slug)},'Apex cutover','informational',${quote(status)},${featured},'2099-07-24T08:00:00Z',
    ${status === 'published' ? quote(updatedAt) : 'NULL'},${quote(updatedAt)}
  );`;
}

function migrateAndSeed() {
  runWrangler(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', statePath]);
  const sql = [
    "UPDATE pages SET status='archived', featured=0;",
    pageInsert({ slug: publishedSlug, title: 'Articolo pubblicato sul nuovo design', featured: 1 }),
    pageInsert({ slug: reviewSlug, title: 'Contenuto review da non esporre', status: 'review', featured: 1 }),
    pageInsert({ slug: draftSlug, title: 'Contenuto draft da non esporre', status: 'draft', featured: 1 }),
    `INSERT INTO providers(slug,name,official_url,affiliate_disclosure,active)
      VALUES(${quote(providerSlug)},'Provider cutover','https://provider.example/apex-cutover','Nessuna affiliazione attiva',1)
      ON CONFLICT(slug) DO UPDATE SET
        name=excluded.name,official_url=excluded.official_url,
        affiliate_disclosure=excluded.affiliate_disclosure,active=excluded.active;`,
  ].join('\n');
  runWrangler(['d1', 'execute', 'DB', '--local', '--persist-to', statePath, '--command', sql]);
}

async function verifyBuildContract() {
  const [configRaw, policySource, workerSource, entry] = await Promise.all([
    readFile(configPath, 'utf8'),
    readFile('src/public-route-policy.ts', 'utf8'),
    readFile('apps/web/src/worker.ts', 'utf8'),
    readFile('apps/web/dist/server/entry.mjs', 'utf8'),
  ]);
  const config = JSON.parse(configRaw);
  const workerFirst = config.assets?.run_worker_first;

  assert.ok(Array.isArray(workerFirst), 'run_worker_first must remain an explicit pattern list.');
  assert.ok(workerFirst.includes('/*'), 'The apex cutover must run the Worker first for dynamic canonical paths.');
  assert.ok(workerFirst.includes('!/_astro/*'), 'Astro build assets must remain asset-first.');
  assert.ok(workerFirst.includes('/control-room-foundation'));
  assert.match(policySource, /export const activePublicRouteDecision = targetPublicRouteDecision;/);
  assert.match(policySource, /Rollback: export const activePublicRouteDecision = currentPublicRouteDecision;/);
  assert.match(workerSource, /export default createPublicWorker\(activePublicRouteDecision\)/);
  assert.match(entry, /targetPublicRouteDecision/);
}

function startRuntime() {
  const child = spawn(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js',
    'dev',
    '--config', configPath,
    '--persist-to', statePath,
    '--port', String(port),
    '--ip', '127.0.0.1',
    '--var', `CF_ACCESS_TEAM_DOMAIN:${access.issuer}`,
    '--var', `CF_ACCESS_AUD:${access.audience}`,
    '--var', `CF_ACCESS_TEST_JWKS:${access.jwks}`,
  ], {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: 'apex-cutover-maintenance-token',
      AI_GATEWAY_TOKEN: 'apex-cutover-ai-token',
      AFFILIATE_MODE: 'disabled',
      ASTRO_TELEMETRY_DISABLED: '1',
    },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', record);
  child.stderr.on('data', record);
  return child;
}

async function waitForRuntime(child, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Runtime exited with ${child.exitCode}.\n${logs.join('')}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {
      // workerd is starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Apex cutover runtime timed out.\n${logs.join('')}`);
}

function signal(child, name) {
  if (child.exitCode !== null || !child.pid) return;
  if (process.platform === 'win32') child.kill(name);
  else process.kill(-child.pid, name);
}

async function stopRuntime(child) {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  signal(child, 'SIGTERM');
  const graceful = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (graceful) return;
  signal(child, 'SIGKILL');
  await Promise.race([once(child, 'exit'), new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

function canonicalDocuments(html) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, 'Canonical public pages must contain JSON-LD only.');
  assert.match(scripts[0][1], /type=["']application\/ld\+json["']/i);
  const value = JSON.parse(scripts[0][2]);
  return Array.isArray(value) ? value : [value];
}

function assertCanonicalResponse(response, html, pathname) {
  assert.equal(response.status, 200, `${pathname} must resolve through the active Astro renderer.`);
  assert.match(response.headers.get('cache-control') || '', /public,max-age=300/);
  assert.equal(response.headers.get('x-robots-tag'), null);
  assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large"/);
  assert.match(html, new RegExp(`<link rel="canonical" href="https://senzaroaming\\.it${pathname === '/' ? '/' : pathname}"`));
  assert.doesNotMatch(html, /Preview Astro|data-public-shell="astro-preview"|\/astro-foundation/);
  assert.doesNotMatch(html, /<astro-island/i);
  assert.equal((html.match(/<script\b/gi) || []).length, (html.match(/type="application\/ld\+json"/gi) || []).length);
}

async function verifyRuntime() {
  const homeResponse = await fetch(`${origin}/`);
  const home = await homeResponse.text();
  assertCanonicalResponse(homeResponse, home, '/');
  assert.match(home, /data-public-homepage="canonical"/);
  assert.match(home, new RegExp(`href="/${publishedSlug}"`));
  assert.doesNotMatch(home, /Contenuto review da non esporre|Contenuto draft da non esporre/);
  assert.equal(canonicalDocuments(home).find((item) => item?.['@type'] === 'WebSite')?.url, 'https://senzaroaming.it/');

  const assetHref = home.match(/href="([^"?#]*\/_astro\/[^"?#]+\.css)"/)?.[1];
  assert.ok(assetHref, 'The canonical homepage must reference an Astro CSS asset.');
  const assetResponse = await fetch(new URL(assetHref, origin));
  assert.equal(assetResponse.status, 200);
  assert.match(assetResponse.headers.get('content-type') || '', /text\/css/);

  for (const [pathname, heading] of [
    ['/guide', 'Guide pratiche sulle eSIM'],
    ['/destinazioni', 'eSIM per destinazione'],
    ['/confronti', 'Confronti tra eSIM e provider'],
    ['/metodo', 'La pagina arriva dopo le prove.'],
    ['/trasparenza', 'Una commissione non decide la classifica.'],
    ['/privacy', 'Raccogliere meno, spiegare meglio.'],
  ]) {
    const response = await fetch(`${origin}${pathname}?cutover=1`);
    const html = await response.text();
    assertCanonicalResponse(response, html, pathname);
    assert.match(html, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  const articleResponse = await fetch(`${origin}/${publishedSlug}`);
  const article = await articleResponse.text();
  assertCanonicalResponse(articleResponse, article, `/${publishedSlug}`);
  assert.match(article, /<h1>Articolo pubblicato sul nuovo design<\/h1>/);
  const articleSchema = canonicalDocuments(article).find((item) => item?.['@type'] === 'Article');
  assert.equal(articleSchema?.mainEntityOfPage, `https://senzaroaming.it/${publishedSlug}`);

  for (const pathname of [`/${reviewSlug}`, `/${draftSlug}`, `/${missingSlug}`, '/missing/path', '/.env', '/config.json']) {
    const response = await fetch(`${origin}${pathname}`);
    const html = await response.text();
    assert.equal(response.status, 404, `${pathname} must remain unavailable after cutover.`);
    assert.match(response.headers.get('cache-control') || '', /no-store/);
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
    assert.doesNotMatch(html, /Contenuto review da non esporre|Contenuto draft da non esporre/);
    assert.match(html, /href="\/guide"/);
  }

  const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
  const sitemap = await sitemapResponse.text();
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemap, new RegExp(publishedSlug));
  assert.doesNotMatch(sitemap, new RegExp(`${reviewSlug}|${draftSlug}|astro-foundation`));

  const robotsResponse = await fetch(`${origin}/robots.txt`);
  const robots = await robotsResponse.text();
  assert.equal(robotsResponse.status, 200);
  assert.match(robots, /Sitemap: https:\/\/senzaroaming\.it\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/go\//);
  assert.doesNotMatch(robots, /astro-foundation/);

  const healthResponse = await fetch(`${origin}/api/health`);
  const health = await healthResponse.json();
  assert.equal(healthResponse.status, 200);
  assert.equal(health.ok, true);
  assert.equal(health.affiliateMode, 'disabled');

  const providerResponse = await fetch(`${origin}/go/${providerSlug}?page=${publishedSlug}&placement=cutover-smoke`, {
    redirect: 'manual',
  });
  assert.equal(providerResponse.status, 302);
  assert.equal(providerResponse.headers.get('location'), 'https://provider.example/apex-cutover');
  assert.match(providerResponse.headers.get('cache-control') || '', /no-store/);
  assert.match(providerResponse.headers.get('x-robots-tag') || '', /noindex/);

  const anonymousControlRoom = await fetch(`${origin}/control-room-foundation`);
  assert.equal(anonymousControlRoom.status, 403);

  const legacyControlRoom = await fetch(`${origin}/control-room`);
  assert.equal(legacyControlRoom.status, 200);
  assert.doesNotMatch(await legacyControlRoom.text(), /data-public-homepage="canonical"/);

  const previewResponse = await fetch(`${origin}/astro-foundation`);
  const preview = await previewResponse.text();
  assert.equal(previewResponse.status, 200);
  assert.match(previewResponse.headers.get('cache-control') || '', /no-store/);
  assert.match(previewResponse.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(preview, /data-public-shell="astro-preview"/);

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    await desktop.goto(`${origin}/`);
    await desktop.getByRole('heading', { level: 1, name: 'Trova la eSIM giusta prima di partire.' }).waitFor();
    assert.equal(await desktop.locator('script:not([type="application/ld+json"])').count(), 0);
    assert.equal(await desktop.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`${origin}/${publishedSlug}`);
    await mobile.getByRole('heading', { level: 1, name: 'Articolo pubblicato sul nuovo design' }).waitFor();
    await mobile.getByRole('button', { name: 'Domanda su Articolo pubblicato sul nuovo design?' }).click();
    assert.equal(await mobile.getByText('Risposta verificata per Articolo pubblicato sul nuovo design.').isVisible(), true);
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    await mobile.close();
  } finally {
    await browser.close();
  }
}

let runtime;
try {
  await rm(statePath, { recursive: true, force: true });
  await verifyBuildContract();
  migrateAndSeed();
  runtime = startRuntime();
  await waitForRuntime(runtime);
  await verifyRuntime();
  console.log('Active apex cutover smoke passed: Astro owns canonical routes while backend boundaries remain intact.');
} catch (error) {
  console.error(error);
  console.error(logs.join('').slice(-12_000));
  process.exitCode = 1;
} finally {
  await stopRuntime(runtime);
  await rm(statePath, { recursive: true, force: true });
}
