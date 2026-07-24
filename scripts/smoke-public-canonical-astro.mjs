import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const basePort = Number(process.env.PUBLIC_CANONICAL_ASTRO_SMOKE_PORT || 8811);
const serverDir = 'apps/web/dist/server';
const builtConfigPath = `${serverDir}/wrangler.json`;
const wrapperPath = `${serverDir}/canonical-parity-entry.mjs`;
const parityConfigPath = `${serverDir}/canonical-parity-wrangler.json`;
const stateRoot = '.wrangler/public-canonical-astro-smoke';
const populatedState = `${stateRoot}/populated`;
const emptyState = `${stateRoot}/empty`;
const articleSlug = 'canonical-smoke-article';
const relatedSlug = 'canonical-smoke-related';
const reviewSlug = 'canonical-smoke-review';
const draftSlug = 'canonical-smoke-draft';
const invalidSlug = 'canonical-smoke-invalid';
const missingSlug = 'canonical-smoke-missing';

function runWrangler(args) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], {
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`Wrangler failed:\n${result.stdout}\n${result.stderr}`);
}

function migrate(state) {
  runWrangler(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', state]);
}

function executeSql(state, sql) {
  runWrangler(['d1', 'execute', 'DB', '--local', '--persist-to', state, '--command', sql]);
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function pageRow({
  slug,
  title,
  pageType = 'guide',
  status = 'published',
  featured = 0,
  cluster = 'Canonical smoke cluster',
  content = [],
  faq = [],
  sources = [],
  updatedAt = '2099-06-15T12:00:00Z',
}) {
  return `INSERT INTO pages (
    slug,page_type,title,meta_description,eyebrow,h1,direct_answer,intro,
    content_json,faq_json,source_links_json,primary_keyword,cluster,search_intent,
    status,featured,source_checked_at,published_at,updated_at
  ) VALUES (
    ${quote(slug)},${quote(pageType)},${quote(title)},${quote(`Meta description ${title}`)},
    'Guida verificata',${quote(title)},${quote(`Risposta diretta ${title}`)},${quote(`Introduzione ${title}`)},
    ${quote(JSON.stringify(content))},${quote(JSON.stringify(faq))},${quote(JSON.stringify(sources))},
    ${quote(slug)},${quote(cluster)},'informational',${quote(status)},${featured},'2099-06-01T08:00:00Z',
    ${status === 'published' ? quote(updatedAt) : 'NULL'},${quote(updatedAt)}
  );`;
}

function seedPopulated(state) {
  const blocks = [
    { type: 'paragraph', text: 'Paragrafo canonico con <script>alert(1)</script> mostrato soltanto come testo.' },
    { type: 'heading', text: 'Come preparare il telefono' },
    { type: 'bullets', items: ['Controlla la compatibilità', 'Conserva il QR code'] },
    { type: 'steps', items: ['Apri le impostazioni', 'Aggiungi il piano dati'] },
    {
      type: 'table',
      headers: ['Passaggio', 'Controllo', 'Esito'],
      rows: [
        ['Prima', 'Compatibilità', 'Verificata'],
        ['Dopo', 'Connessione', 'Da controllare sul posto'],
      ],
    },
    { type: 'callout', title: 'Limite delle evidenze', text: 'Le fonti ufficiali non diventano test indipendenti.' },
  ];
  const faq = [{ question: 'La eSIM si attiva da sola?', answer: 'No. Segui le istruzioni ufficiali del provider.' }];
  const sources = [
    { label: 'Fonte ufficiale canonica', url: 'https://example.com/canonical-source' },
    { label: 'Fonte HTTP da scartare', url: 'http://example.com/insecure-source' },
  ];
  const statements = ["UPDATE pages SET status='archived', featured=0;"];

  for (let index = 1; index <= 10; index += 1) {
    statements.push(pageRow({
      slug: `canonical-featured-${index}`,
      title: `Canonical featured ${index}`,
      featured: 1,
      updatedAt: `2099-01-${String(index).padStart(2, '0')}T12:00:00Z`,
    }));
  }
  statements.push(pageRow({
    slug: articleSlug,
    title: 'Articolo canonico smoke',
    featured: 1,
    content: blocks,
    faq,
    sources,
    updatedAt: '2099-07-20T12:00:00Z',
  }));
  statements.push(pageRow({
    slug: relatedSlug,
    title: 'Articolo correlato canonico',
    featured: 1,
    content: [{ type: 'paragraph', text: 'Contenuto correlato pubblicato.' }],
    updatedAt: '2099-07-19T12:00:00Z',
  }));
  for (let index = 1; index <= 7; index += 1) {
    statements.push(pageRow({
      slug: `canonical-destination-${index}`,
      pageType: 'destination',
      title: `Canonical destination ${index}`,
      cluster: 'Destinazioni',
      updatedAt: `2099-02-${String(index).padStart(2, '0')}T12:00:00Z`,
    }));
  }
  statements.push(pageRow({
    slug: 'canonical-comparison',
    pageType: 'comparison',
    title: 'Canonical comparison',
    cluster: 'Confronti',
    updatedAt: '2099-03-10T12:00:00Z',
  }));
  statements.push(pageRow({
    slug: reviewSlug,
    title: 'Testo review segreto',
    status: 'review',
    featured: 1,
    content: [{ type: 'paragraph', text: 'Contenuto review da non esporre.' }],
    updatedAt: '2100-01-01T12:00:00Z',
  }));
  statements.push(pageRow({
    slug: draftSlug,
    title: 'Testo draft segreto',
    status: 'draft',
    featured: 1,
    content: [{ type: 'paragraph', text: 'Contenuto draft da non esporre.' }],
    updatedAt: '2100-01-02T12:00:00Z',
  }));
  statements.push(pageRow({
    slug: invalidSlug,
    title: 'Fatto invalido da non mostrare',
    content: { not: 'an array' },
    updatedAt: '2099-05-01T12:00:00Z',
  }));
  executeSql(state, statements.join('\n'));
}

async function prepareParityRuntime() {
  const [configRaw, entry, workerSource, policySource] = await Promise.all([
    readFile(builtConfigPath, 'utf8'),
    readFile(`${serverDir}/entry.mjs`, 'utf8'),
    readFile('apps/web/src/worker.ts', 'utf8'),
    readFile('src/public-route-policy.ts', 'utf8'),
  ]);
  assert.match(entry, /createPublicWorker/);
  assert.match(entry, /currentPublicRouteDecision/);
  assert.match(workerSource, /export default createPublicWorker\(activePublicRouteDecision\)/);
  assert.match(policySource, /activePublicRouteDecision = currentPublicRouteDecision/);

  await writeFile(wrapperPath, `import {
  Last30DaysContainer,
  RecentDemandWorkflow,
  createPublicWorker,
  currentPublicRouteDecision,
} from './entry.mjs';

const astroKinds = new Set(['canonical-static', 'canonical-article', 'public-404']);
const decide = (pathname) => {
  const route = currentPublicRouteDecision(pathname);
  return astroKinds.has(route.kind) ? Object.freeze({ ...route, owner: 'astro' }) : route;
};

export { Last30DaysContainer, RecentDemandWorkflow };
export default createPublicWorker(decide);
`, 'utf8');

  const config = JSON.parse(configRaw);
  config.main = 'canonical-parity-entry.mjs';
  const directPaths = [
    '/', '/destinazioni', '/guide', '/confronti', '/metodo', '/trasparenza', '/privacy', '/404',
    `/${articleSlug}`, `/${relatedSlug}`, `/${reviewSlug}`, `/${draftSlug}`, `/${invalidSlug}`, `/${missingSlug}`,
    '/.env', '/config.json', '/missing/path',
  ];
  config.assets = config.assets || {};
  config.assets.run_worker_first = [...new Set([...(config.assets.run_worker_first || []), ...directPaths])];
  await writeFile(parityConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

function startRuntime(state, port) {
  const logs = [];
  const child = spawn(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js', 'dev', '--config', parityConfigPath,
    '--persist-to', state, '--port', String(port), '--ip', '127.0.0.1',
  ], {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: 'canonical-parity-token',
      AI_GATEWAY_TOKEN: 'canonical-parity-ai-token',
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
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {
      // workerd is starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Canonical runtime timed out.\n${runtime.logs.join('')}`);
}

function signal(runtime, name) {
  if (runtime.child.exitCode !== null || !runtime.child.pid) return;
  if (process.platform === 'win32') runtime.child.kill(name);
  else process.kill(-runtime.child.pid, name);
}

async function stopRuntime(runtime) {
  if (runtime.child.exitCode !== null) return;
  const exited = once(runtime.child, 'exit');
  signal(runtime, 'SIGTERM');
  const graceful = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (graceful) return;
  signal(runtime, 'SIGKILL');
  await Promise.race([once(runtime.child, 'exit'), new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

function catalogSection(html, id) {
  const match = html.match(new RegExp(`<section[^>]*data-public-catalog="${id}"[^>]*>[\\s\\S]*?<\\/section>`));
  assert.ok(match, `Missing catalog ${id}`);
  return match[0];
}

function jsonLd(html) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.match(scripts[0][1], /type=["']application\/ld\+json["']/i);
  assert.doesNotMatch(scripts[0][1], /\bsrc\s*=/i);
  const value = JSON.parse(scripts[0][2]);
  return Array.isArray(value) ? value : [value];
}

function assertCanonical(response, html, path) {
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') || '', /public,max-age=300/);
  assert.equal(response.headers.get('x-robots-tag'), null);
  assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large"/);
  const canonical = path === '/' ? '/' : path;
  assert.match(html, new RegExp(`<link rel="canonical" href="https://senzaroaming\\.it${canonical}"`));
  assert.doesNotMatch(html, /Preview Astro|data-public-shell="astro-preview"|\/astro-foundation/);
  assert.doesNotMatch(html, /<astro-island/i);
  assert.equal((html.match(/<script\b/gi) || []).length, (html.match(/type="application\/ld\+json"/gi) || []).length);
}

async function verifyPopulated(origin) {
  const homeResponse = await fetch(`${origin}/`);
  const home = await homeResponse.text();
  assertCanonical(homeResponse, home, '/');
  assert.match(home, /data-public-homepage="canonical"/);
  assert.match(home, /href="\/destinazioni"/);
  assert.match(home, new RegExp(`href="/${articleSlug}"`));
  assert.doesNotMatch(home, /Testo review segreto|Testo draft segreto|Canonical featured 1(?:<|&)/);
  assert.equal((catalogSection(home, 'featured-guides').match(/class="catalog-card"/g) || []).length, 9);
  assert.equal((catalogSection(home, 'main-destinations').match(/class="catalog-card"/g) || []).length, 6);
  assert.equal(jsonLd(home).find((item) => item?.['@type'] === 'WebSite')?.url, 'https://senzaroaming.it/');

  for (const [path, title] of [
    ['/destinazioni', 'eSIM per destinazione'],
    ['/guide', 'Guide pratiche sulle eSIM'],
    ['/confronti', 'Confronti tra eSIM e provider'],
  ]) {
    const response = await fetch(`${origin}${path}`);
    const html = await response.text();
    assertCanonical(response, html, path);
    assert.match(html, new RegExp(`<h1 id="listing-title">${title}</h1>`));
    assert.match(html, /data-public-render-mode="canonical"/);
    assert.doesNotMatch(html, /Testo review segreto|Testo draft segreto/);
  }

  for (const [path, heading] of [
    ['/metodo', 'La pagina arriva dopo le prove.'],
    ['/trasparenza', 'Una commissione non decide la classifica.'],
    ['/privacy', 'Raccogliere meno, spiegare meglio.'],
  ]) {
    const response = await fetch(`${origin}${path}`);
    const html = await response.text();
    assertCanonical(response, html, path);
    assert.match(html, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(html, /In questa preview|Preview isolata|route pubblica attuale non cambia/i);
  }

  const articleResponse = await fetch(`${origin}/${articleSlug}`);
  const article = await articleResponse.text();
  assertCanonical(articleResponse, article, `/${articleSlug}`);
  assert.match(article, /<h1>Articolo canonico smoke<\/h1>/);
  assert.match(article, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(article, /Fonte ufficiale canonica/);
  assert.doesNotMatch(article, /Fonte HTTP da scartare|Contratto della preview/);
  assert.match(article, new RegExp(`href="/${relatedSlug}"`));
  const documents = jsonLd(article);
  assert.equal(documents.find((item) => item?.['@type'] === 'Article')?.mainEntityOfPage, `https://senzaroaming.it/${articleSlug}`);
  assert.equal(documents.find((item) => item?.['@type'] === 'FAQPage')?.mainEntity?.[0]?.name, 'La eSIM si attiva da sola?');

  for (const path of ['/404', `/${reviewSlug}`, `/${draftSlug}`, `/${missingSlug}`, '/.env', '/config.json', '/missing/path']) {
    const response = await fetch(`${origin}${path}`);
    const html = await response.text();
    assert.equal(response.status, 404, `${path} must be 404`);
    assert.match(response.headers.get('cache-control') || '', /no-store/);
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
    assert.match(html, /<link rel="canonical" href="https:\/\/senzaroaming\.it\/404"/);
    assert.doesNotMatch(html, /Testo review segreto|Testo draft segreto/);
    assert.match(html, /href="\/destinazioni"/);
    assert.match(html, /href="\/guide"/);
  }

  const invalidResponse = await fetch(`${origin}/${invalidSlug}`);
  const invalid = await invalidResponse.text();
  assert.equal(invalidResponse.status, 500);
  assert.match(invalidResponse.headers.get('cache-control') || '', /no-store/);
  assert.match(invalidResponse.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(invalid, /La pagina pubblicata non supera la validazione/);
  assert.doesNotMatch(invalid, /Fatto invalido da non mostrare/);

  const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
  const sitemap = await sitemapResponse.text();
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemap, new RegExp(articleSlug));
  assert.doesNotMatch(sitemap, /astro-foundation|canonical-smoke-review|canonical-smoke-draft/);
  const robotsResponse = await fetch(`${origin}/robots.txt`);
  assert.equal(robotsResponse.status, 200);
  assert.doesNotMatch(await robotsResponse.text(), /astro-foundation|data-public-render-mode/);

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    await desktop.goto(`${origin}/`);
    await desktop.getByRole('heading', { level: 1, name: 'Trova la eSIM giusta prima di partire.' }).waitFor();
    assert.equal(await desktop.locator('[data-public-catalog="featured-guides"] .catalog-card').count(), 9);
    assert.equal(await desktop.locator('script:not([type="application/ld+json"])').count(), 0);
    await desktop.keyboard.press('Tab');
    assert.equal(await desktop.evaluate(() => document.activeElement?.textContent?.trim()), 'Vai al contenuto');
    assert.equal(await desktop.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`${origin}/${articleSlug}`);
    await mobile.getByRole('heading', { level: 1, name: 'Articolo canonico smoke' }).waitFor();
    await mobile.getByRole('button', { name: 'La eSIM si attiva da sola?' }).click();
    assert.equal(await mobile.getByText('No. Segui le istruzioni ufficiali del provider.').isVisible(), true);
    assert.equal(await mobile.getByRole('link', { name: 'Articolo correlato canonico' }).getAttribute('href'), `/${relatedSlug}`);
    assert.equal(await mobile.locator('script:not([type="application/ld+json"])').count(), 0);
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    const tableWrap = mobile.locator('.article-table-wrap');
    assert.equal(await tableWrap.count(), 1);
    assert.equal(await tableWrap.evaluate((element) => element.scrollWidth > element.clientWidth), true);
    await mobile.close();
  } finally {
    await browser.close();
  }
}

async function verifyEmpty(origin) {
  const homeResponse = await fetch(`${origin}/`);
  const home = await homeResponse.text();
  assertCanonical(homeResponse, home, '/');
  assert.match(home, /I contenuti sono in preparazione\./);

  const guideResponse = await fetch(`${origin}/guide`);
  const guide = await guideResponse.text();
  assertCanonical(guideResponse, guide, '/guide');
  assert.match(guide, /Non ci sono ancora guide pubblicate\./);

  const missingResponse = await fetch(`${origin}/${articleSlug}`);
  const missing = await missingResponse.text();
  assert.equal(missingResponse.status, 404);
  assert.match(missing, /Questa pagina non è partita\./);
  assert.match(missingResponse.headers.get('x-robots-tag') || '', /noindex/);
}

let populatedRuntime;
let emptyRuntime;
try {
  await rm(stateRoot, { recursive: true, force: true });
  await prepareParityRuntime();
  migrate(populatedState);
  migrate(emptyState);
  seedPopulated(populatedState);
  executeSql(emptyState, "UPDATE pages SET status='archived', featured=0;");

  const populatedOrigin = `http://127.0.0.1:${basePort}`;
  populatedRuntime = startRuntime(populatedState, basePort);
  await waitForRuntime(populatedRuntime, populatedOrigin);
  await verifyPopulated(populatedOrigin);
  await stopRuntime(populatedRuntime);
  populatedRuntime = undefined;

  const emptyOrigin = `http://127.0.0.1:${basePort + 1}`;
  emptyRuntime = startRuntime(emptyState, basePort + 1);
  await waitForRuntime(emptyRuntime, emptyOrigin);
  await verifyEmpty(emptyOrigin);

  console.log('Canonical Astro parity smoke passed: direct renderer verified, production route matrix unchanged.');
} finally {
  if (populatedRuntime) await stopRuntime(populatedRuntime);
  if (emptyRuntime) await stopRuntime(emptyRuntime);
  await Promise.all([
    rm(wrapperPath, { force: true }),
    rm(parityConfigPath, { force: true }),
    rm(stateRoot, { recursive: true, force: true }),
  ]);
}
