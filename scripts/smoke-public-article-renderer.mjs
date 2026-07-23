import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { rm } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const port = Number(process.env.PUBLIC_ARTICLE_SMOKE_PORT || 8803);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const stateRoot = '.wrangler/public-article-smoke';
const articleSlug = 'smoke-public-article';
const relatedSlug = 'smoke-related-article';

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

function migrate() {
  wrangler(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', stateRoot]);
}

function executeSql(command) {
  wrangler(['d1', 'execute', 'DB', '--local', '--persist-to', stateRoot, '--command', command]);
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function pageInsert({
  slug,
  status,
  title,
  cluster = 'Smoke article cluster',
  featured = 0,
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
    ${sqlString(slug)},'guide',${sqlString(title)},${sqlString(`Meta description ${title}`)},
    ${sqlString('Guida verificata')},${sqlString(title)},${sqlString(`Risposta diretta ${title}`)},
    ${sqlString(`Introduzione ${title}`)},${sqlString(JSON.stringify(content))},
    ${sqlString(JSON.stringify(faq))},${sqlString(JSON.stringify(sources))},
    ${sqlString('smoke article')},${sqlString(cluster)},'informational',${sqlString(status)},
    ${featured},'2099-06-01T08:00:00Z',
    ${status === 'published' ? sqlString(updatedAt) : 'NULL'},${sqlString(updatedAt)}
  );`;
}

function seed() {
  const blocks = [
    { type: 'paragraph', text: 'Paragrafo pubblico con testo <script>alert(1)</script> da mostrare come testo.' },
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
    {
      type: 'callout',
      title: 'Limite delle evidenze',
      text: 'Questa pagina riporta dichiarazioni ufficiali e non un test indipendente sul campo.',
    },
  ];
  const faq = [
    { question: 'La eSIM si attiva da sola?', answer: 'No. Segui sempre le istruzioni ufficiali del provider.' },
  ];
  const sources = [
    { label: 'Fonte ufficiale sicura', url: 'https://example.com/official-source' },
    { label: 'Fonte HTTP da scartare', url: 'http://example.com/insecure-source' },
  ];

  executeSql([
    "UPDATE pages SET status='archived', featured=0;",
    pageInsert({
      slug: articleSlug,
      status: 'published',
      title: 'Articolo pubblico smoke',
      featured: 1,
      content: blocks,
      faq,
      sources,
      updatedAt: '2099-06-15T12:00:00Z',
    }),
    pageInsert({
      slug: relatedSlug,
      status: 'published',
      title: 'Articolo correlato smoke',
      content: [{ type: 'paragraph', text: 'Contenuto correlato pubblicato.' }],
      updatedAt: '2099-06-14T12:00:00Z',
    }),
    pageInsert({
      slug: 'smoke-other-cluster',
      status: 'published',
      title: 'Altro cluster nascosto dai correlati',
      cluster: 'Other cluster',
      content: [{ type: 'paragraph', text: 'Altro contenuto.' }],
    }),
    pageInsert({
      slug: 'smoke-review-article',
      status: 'review',
      title: 'Articolo review da non esporre',
      featured: 1,
      content: [{ type: 'paragraph', text: 'Testo review segreto.' }],
    }),
    pageInsert({
      slug: 'smoke-draft-article',
      status: 'draft',
      title: 'Articolo draft da non esporre',
      featured: 1,
      content: [{ type: 'paragraph', text: 'Testo draft segreto.' }],
    }),
    pageInsert({
      slug: 'smoke-invalid-article',
      status: 'published',
      title: 'Fatto invalido da non mostrare',
      content: { not: 'an array' },
    }),
  ].join('\n'));
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
      MAINTENANCE_TOKEN: 'public-article-smoke-token',
      AI_GATEWAY_TOKEN: 'public-article-smoke-ai-token',
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
      throw new Error(`wrangler dev exited with code ${runtime.child.exitCode}\n${runtime.logs.join('')}`);
    }
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {
      // workerd is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for article preview runtime.\n${runtime.logs.join('')}`);
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

async function verifyHttp() {
  const previewPath = `/astro-foundation/articoli/${articleSlug}`;
  const response = await fetch(`${origin}${previewPath}`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(response.headers.get('cache-control') || '', /no-store/);
  assert.match(html, /data-public-article="smoke-public-article"/);
  assert.match(html, /<h1>Articolo pubblico smoke<\/h1>/);
  assert.match(html, /Risposta diretta Articolo pubblico smoke/);
  assert.match(html, /<h2>Come preparare il telefono<\/h2>/);
  assert.match(html, /<ul>[\s\S]*Controlla la compatibilità/);
  assert.match(html, /<ol>[\s\S]*Apri le impostazioni/);
  assert.match(html, /<table>/);
  assert.match(html, /<details>/);
  assert.match(html, /Fonte ufficiale sicura/);
  assert.match(html, /href="https:\/\/example\.com\/official-source"/);
  assert.doesNotMatch(html, /href="http:\/\/example\.com\/insecure-source"/);
  assert.doesNotMatch(html, /Fonte HTTP da scartare/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script(?:\s|>)/i);
  assert.doesNotMatch(html, /<astro-island/i);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/senzaroaming\.it\/astro-foundation\/articoli\/smoke-public-article"/,
  );
  assert.match(html, /href="\/astro-foundation\/articoli\/smoke-related-article"/);
  assert.doesNotMatch(html, /Altro cluster nascosto dai correlati/);
  assert.doesNotMatch(html, /Articolo review da non esporre|Articolo draft da non esporre/);

  for (const slug of ['smoke-review-article', 'smoke-draft-article', 'smoke-missing-article']) {
    const hiddenResponse = await fetch(`${origin}/astro-foundation/articoli/${slug}`);
    const hiddenHtml = await hiddenResponse.text();
    assert.equal(hiddenResponse.status, 404, `${slug} should be hidden`);
    assert.doesNotMatch(hiddenHtml, /Testo review segreto|Testo draft segreto/);
    assert.match(hiddenResponse.headers.get('x-robots-tag') || '', /noindex/);
  }

  const invalidResponse = await fetch(`${origin}/astro-foundation/articoli/smoke-invalid-article`);
  const invalidHtml = await invalidResponse.text();
  assert.equal(invalidResponse.status, 500);
  assert.match(invalidHtml, /La pagina pubblicata non supera la validazione/);
  assert.doesNotMatch(invalidHtml, /Fatto invalido da non mostrare/);
  assert.match(invalidResponse.headers.get('cache-control') || '', /no-store/);

  const legacyResponse = await fetch(`${origin}/${articleSlug}`);
  const legacyHtml = await legacyResponse.text();
  assert.equal(legacyResponse.status, 200);
  assert.match(legacyHtml, /Articolo pubblico smoke/);
  assert.match(legacyHtml, /href="\/smoke-related-article"/);
  assert.doesNotMatch(legacyHtml, /astro-foundation\/articoli\/smoke-related-article/);

  const listingResponse = await fetch(`${origin}/astro-foundation/guide`);
  const listingHtml = await listingResponse.text();
  assert.equal(listingResponse.status, 200);
  assert.match(listingHtml, /href="\/astro-foundation\/articoli\/smoke-public-article"/);
  assert.doesNotMatch(listingHtml, /href="\/smoke-public-article"/);

  const homepageResponse = await fetch(`${origin}/astro-foundation`);
  const homepageHtml = await homepageResponse.text();
  assert.equal(homepageResponse.status, 200);
  assert.match(homepageHtml, /href="\/astro-foundation\/articoli\/smoke-public-article"/);

  const legacyListingResponse = await fetch(`${origin}/guide`);
  const legacyListingHtml = await legacyListingResponse.text();
  assert.equal(legacyListingResponse.status, 200);
  assert.match(legacyListingHtml, /href="\/smoke-public-article"/);
  assert.doesNotMatch(legacyListingHtml, /astro-foundation\/articoli/);

  const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
  const sitemap = await sitemapResponse.text();
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemap, /smoke-public-article/);
  assert.doesNotMatch(sitemap, /astro-foundation\/articoli|smoke-review-article|smoke-draft-article/);
}

async function verifyBrowser() {
  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    await desktop.goto(`${origin}/astro-foundation/articoli/${articleSlug}`);
    await desktop.getByRole('heading', { level: 1, name: 'Articolo pubblico smoke' }).waitFor();
    assert.equal(await desktop.getByRole('heading', { level: 1 }).count(), 1);
    assert.equal(await desktop.locator('script').count(), 0);
    await desktop.keyboard.press('Tab');
    assert.equal(await desktop.locator('.skip-link').evaluate((element) => element === document.activeElement), true);
    assert.equal(await desktop.getByRole('link', { name: 'Fonte ufficiale sicura' }).count(), 1);
    assert.equal(await desktop.getByRole('link', { name: 'Fonte HTTP da scartare' }).count(), 0);
    await desktop.getByRole('button', { name: 'La eSIM si attiva da sola?' }).click();
    assert.equal(await desktop.getByText('No. Segui sempre le istruzioni ufficiali del provider.').isVisible(), true);
    assert.equal(
      await desktop.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      true,
    );
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`${origin}/astro-foundation/articoli/${articleSlug}`);
    await mobile.getByRole('heading', { level: 1, name: 'Articolo pubblico smoke' }).waitFor();
    const tableWrap = mobile.locator('.article-table-wrap');
    assert.equal(await tableWrap.count(), 1);
    assert.equal(
      await tableWrap.evaluate((element) => element.scrollWidth > element.clientWidth),
      true,
    );
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      true,
    );
    assert.equal(
      await mobile.getByRole('link', { name: 'Articolo correlato smoke' }).getAttribute('href'),
      `/astro-foundation/articoli/${relatedSlug}`,
    );
    await mobile.close();
  } finally {
    await browser.close();
  }
}

let runtime;
try {
  await rm(stateRoot, { recursive: true, force: true });
  migrate();
  seed();
  runtime = startRuntime();
  await waitForRuntime(runtime);
  await verifyHttp();
  await verifyBrowser();
  console.log('Public Astro article renderer smoke passed.');
} finally {
  if (runtime) await stopRuntime(runtime);
  await rm(stateRoot, { recursive: true, force: true });
}
