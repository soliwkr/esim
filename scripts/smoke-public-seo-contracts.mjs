import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { rm } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const port = Number(process.env.PUBLIC_SEO_SMOKE_PORT || 8805);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const stateRoot = '.wrangler/public-seo-contract-smoke';
const articleSlug = 'seo-contract-article';
const reviewSlug = 'seo-contract-review';
const draftSlug = 'seo-contract-draft';
const providerSlug = 'seo-contract-provider';
const articleTitle = 'Titolo </script> con <example>, virgolette "doppie" e l’eSIM già pronta';
const articleDescription = 'Descrizione </script> con <example>, apostrofi e caratteri italiani: è, à, ò.';
const faqQuestion = 'Posso scrivere </script> e <example> nella domanda?';
const faqAnswer = 'Sì: resta testo, con l’eSIM già pronta e nessun elemento eseguibile.';

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

function pageInsert({ slug, status, title, description, faq = [], content = [], featured = 0 }) {
  return `INSERT INTO pages (
    slug,page_type,title,meta_description,eyebrow,h1,direct_answer,intro,
    content_json,faq_json,source_links_json,primary_keyword,cluster,search_intent,
    status,featured,source_checked_at,published_at,updated_at
  ) VALUES (
    ${sqlString(slug)},'guide',${sqlString(title)},${sqlString(description)},
    ${sqlString('Contratto SEO')},${sqlString(title)},${sqlString(`Risposta diretta: ${title}`)},
    ${sqlString(`Introduzione: ${description}`)},${sqlString(JSON.stringify(content))},
    ${sqlString(JSON.stringify(faq))},${sqlString(JSON.stringify([
      { label: 'Fonte SEO ufficiale', url: 'https://example.com/seo-source' },
    ]))},${sqlString('contratto seo')},${sqlString('SEO contract cluster')},'informational',
    ${sqlString(status)},${featured},'2099-07-01T08:00:00Z',
    ${status === 'published' ? sqlString('2099-07-02T12:34:56Z') : 'NULL'},'2099-07-02T12:34:56Z'
  );`;
}

function seed() {
  const content = [{
    type: 'paragraph',
    text: 'Contenuto visibile </script> con <example>, virgolette, apostrofi e accenti italiani.',
  }];
  const faq = [{ question: faqQuestion, answer: faqAnswer }];

  executeSql([
    "UPDATE pages SET status='archived', featured=0;",
    pageInsert({
      slug: articleSlug,
      status: 'published',
      title: articleTitle,
      description: articleDescription,
      content,
      faq,
      featured: 1,
    }),
    pageInsert({
      slug: reviewSlug,
      status: 'review',
      title: 'SEO review segreto',
      description: 'Descrizione review da non esporre.',
      content: [{ type: 'paragraph', text: 'Testo review segreto.' }],
    }),
    pageInsert({
      slug: draftSlug,
      status: 'draft',
      title: 'SEO draft segreto',
      description: 'Descrizione draft da non esporre.',
      content: [{ type: 'paragraph', text: 'Testo draft segreto.' }],
    }),
    `INSERT INTO providers(slug,name,official_url,affiliate_disclosure,active)
      VALUES(${sqlString(providerSlug)},'SEO Contract Provider','https://provider.example/landing','Nessuna affiliazione attiva',1)
      ON CONFLICT(slug) DO UPDATE SET
        name=excluded.name,official_url=excluded.official_url,
        affiliate_disclosure=excluded.affiliate_disclosure,active=excluded.active;`,
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
      MAINTENANCE_TOKEN: 'public-seo-contract-smoke-token',
      AI_GATEWAY_TOKEN: 'public-seo-contract-smoke-ai-token',
      AFFILIATE_MODE: 'disabled',
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
  throw new Error(`Timed out waiting for SEO contract runtime.\n${runtime.logs.join('')}`);
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

function extractJsonLd(html) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, 'Only one JSON-LD script is allowed.');
  assert.match(scripts[0][1], /type=["']application\/ld\+json["']/i);
  assert.doesNotMatch(scripts[0][1], /\bsrc\s*=/i);
  assert.doesNotMatch(scripts[0][2], /<\/script>/i);
  assert.match(scripts[0][2], /\\u003c\/script>/i);
  assert.match(scripts[0][2], /\\u003cexample>/i);
  const parsed = JSON.parse(scripts[0][2]);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function schemaByType(documents, type) {
  const document = documents.find((item) => item?.['@type'] === type);
  assert.ok(document, `Missing ${type} JSON-LD document.`);
  return document;
}

async function browserSeoSnapshot(page, path) {
  const response = await page.goto(`${origin}${path}`);
  assert.ok(response);
  const snapshot = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
    ogType: document.querySelector('meta[property="og:type"]')?.getAttribute('content') ?? '',
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? '',
    ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '',
    ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? '',
    scripts: [...document.querySelectorAll('script')].map((script) => ({
      type: script.getAttribute('type') ?? '',
      src: script.getAttribute('src'),
      text: script.textContent ?? '',
    })),
  }));
  assert.equal(snapshot.scripts.length, 1);
  assert.equal(snapshot.scripts[0].type, 'application/ld+json');
  assert.equal(snapshot.scripts[0].src, null);
  return {
    status: response.status(),
    ...snapshot,
    schema: JSON.parse(snapshot.scripts[0].text),
  };
}

function normalizedArticle(document) {
  return {
    type: document['@type'],
    headline: document.headline,
    description: document.description,
    dateModified: document.dateModified,
    author: document.author,
  };
}

function normalizedFaq(document) {
  return document.mainEntity.map((item) => ({
    type: item['@type'],
    name: item.name,
    answerType: item.acceptedAnswer?.['@type'],
    answer: item.acceptedAnswer?.text,
  }));
}

async function verifyArticleContracts(browser) {
  const legacyPath = `/${articleSlug}`;
  const previewPath = `/astro-foundation/articoli/${articleSlug}`;
  const legacyResponse = await fetch(`${origin}${legacyPath}`);
  const legacyHtml = await legacyResponse.text();
  const previewResponse = await fetch(`${origin}${previewPath}`);
  const previewHtml = await previewResponse.text();

  assert.equal(legacyResponse.status, 200);
  assert.equal(previewResponse.status, 200);
  assert.equal(legacyResponse.headers.get('x-robots-tag'), null);
  assert.match(legacyResponse.headers.get('cache-control') || '', /public/);
  assert.match(previewResponse.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(previewResponse.headers.get('cache-control') || '', /no-store/);
  assert.doesNotMatch(legacyHtml, /<example>|<\/script><script/i);
  assert.doesNotMatch(previewHtml, /<example>|<\/script><script/i);
  assert.match(legacyHtml, /&lt;example&gt;/);
  assert.match(previewHtml, /&lt;example&gt;/);

  const legacyRawSchema = extractJsonLd(legacyHtml);
  const previewRawSchema = extractJsonLd(previewHtml);
  assert.equal(schemaByType(legacyRawSchema, 'Article').headline, articleTitle);
  assert.equal(schemaByType(previewRawSchema, 'FAQPage').mainEntity[0].name, faqQuestion);

  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const legacyPage = await context.newPage();
  const previewPage = await context.newPage();
  const legacy = await browserSeoSnapshot(legacyPage, legacyPath);
  const preview = await browserSeoSnapshot(previewPage, previewPath);

  assert.equal(legacy.status, 200);
  assert.equal(preview.status, 200);
  assert.equal(legacy.title, articleTitle);
  assert.equal(preview.title, articleTitle);
  assert.equal(legacy.description, articleDescription);
  assert.equal(preview.description, articleDescription);
  assert.equal(legacy.ogType, 'article');
  assert.equal(preview.ogType, 'article');
  assert.equal(legacy.ogTitle, preview.ogTitle);
  assert.equal(legacy.ogDescription, preview.ogDescription);
  assert.equal(legacy.robots, 'index,follow,max-image-preview:large');
  assert.equal(preview.robots, 'noindex,nofollow');
  assert.equal(legacy.canonical, `https://senzaroaming.it/${articleSlug}`);
  assert.equal(preview.canonical, `https://senzaroaming.it/astro-foundation/articoli/${articleSlug}`);
  assert.equal(legacy.ogUrl, legacy.canonical);
  assert.equal(preview.ogUrl, preview.canonical);

  const legacyDocuments = Array.isArray(legacy.schema) ? legacy.schema : [legacy.schema];
  const previewDocuments = Array.isArray(preview.schema) ? preview.schema : [preview.schema];
  const legacyArticle = schemaByType(legacyDocuments, 'Article');
  const previewArticle = schemaByType(previewDocuments, 'Article');
  const legacyFaq = schemaByType(legacyDocuments, 'FAQPage');
  const previewFaq = schemaByType(previewDocuments, 'FAQPage');

  assert.deepEqual(normalizedArticle(legacyArticle), normalizedArticle(previewArticle));
  assert.deepEqual(normalizedFaq(legacyFaq), normalizedFaq(previewFaq));
  assert.equal(legacyArticle.mainEntityOfPage, legacy.canonical);
  assert.equal(previewArticle.mainEntityOfPage, preview.canonical);
  assert.equal(legacyArticle.dateModified, '2099-07-02T12:34:56.000Z');
  assert.deepEqual(legacyArticle.author, { '@type': 'Organization', name: 'Senza Roaming' });
  assert.equal(legacyFaq.mainEntity[0].name, faqQuestion);
  assert.equal(legacyFaq.mainEntity[0].acceptedAnswer.text, faqAnswer);
  assert.equal(await legacyPage.locator('script:not([type="application/ld+json"])').count(), 0);
  assert.equal(await previewPage.locator('script:not([type="application/ld+json"])').count(), 0);
  assert.equal(await previewPage.locator('astro-island').count(), 0);
  assert.equal(await previewPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  assert.equal(await previewPage.locator('text=Contenuto visibile </script> con <example>').count(), 1);

  await context.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`${origin}${previewPath}`);
  await mobile.getByRole('heading', { level: 1, name: articleTitle }).waitFor();
  assert.equal(await mobile.locator('script[type="application/ld+json"]').count(), 1);
  assert.equal(await mobile.locator('script:not([type="application/ld+json"])').count(), 0);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  await mobile.close();
}

async function verifyHomepageContracts(browser) {
  const legacyPage = await browser.newPage();
  const previewPage = await browser.newPage();
  const legacy = await browserSeoSnapshot(legacyPage, '/');
  const preview = await browserSeoSnapshot(previewPage, '/astro-foundation');

  assert.equal(legacy.status, 200);
  assert.equal(preview.status, 200);
  assert.equal(legacy.title, preview.title);
  assert.equal(legacy.description, preview.description);
  assert.equal(legacy.ogType, 'website');
  assert.equal(preview.ogType, 'website');
  assert.equal(legacy.ogTitle, preview.ogTitle);
  assert.equal(legacy.ogDescription, preview.ogDescription);
  assert.equal(legacy.canonical, 'https://senzaroaming.it/');
  assert.equal(preview.canonical, 'https://senzaroaming.it/astro-foundation');
  assert.equal(legacy.robots, 'index,follow,max-image-preview:large');
  assert.equal(preview.robots, 'noindex,nofollow');

  const legacyDocuments = Array.isArray(legacy.schema) ? legacy.schema : [legacy.schema];
  const previewDocuments = Array.isArray(preview.schema) ? preview.schema : [preview.schema];
  const legacyWebsite = schemaByType(legacyDocuments, 'WebSite');
  const previewWebsite = schemaByType(previewDocuments, 'WebSite');
  assert.equal(legacyWebsite.name, previewWebsite.name);
  assert.equal(legacyWebsite.url, legacy.canonical);
  assert.equal(previewWebsite.url, preview.canonical);
  assert.equal(await legacyPage.locator('script:not([type="application/ld+json"])').count(), 0);
  assert.equal(await previewPage.locator('script:not([type="application/ld+json"])').count(), 0);

  await legacyPage.close();
  await previewPage.close();
}

async function verifyRoutingRegressions() {
  const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
  const sitemap = await sitemapResponse.text();
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemap, new RegExp(`<loc>https://senzaroaming\\.it/${articleSlug}</loc>`));
  assert.doesNotMatch(sitemap, /astro-foundation|seo-contract-review|seo-contract-draft/);
  for (const staticPath of ['/', '/destinazioni', '/guide', '/confronti', '/metodo', '/trasparenza', '/privacy']) {
    assert.match(sitemap, new RegExp(`<loc>https://senzaroaming\\.it${staticPath === '/' ? '/' : staticPath}</loc>`));
  }

  const robotsResponse = await fetch(`${origin}/robots.txt`);
  const robots = await robotsResponse.text();
  assert.equal(robotsResponse.status, 200);
  assert.match(robots, /Disallow: \/go\//);
  assert.match(robots, /Disallow: \/control-room/);
  assert.match(robots, /Disallow: \/api\/maintenance\//);
  assert.match(robots, /Sitemap: https:\/\/senzaroaming\.it\/sitemap\.xml/);
  assert.doesNotMatch(robots, /astro-foundation/);

  const redirectResponse = await fetch(
    `${origin}/go/${providerSlug}?page=${articleSlug}&placement=seo-smoke`,
    { redirect: 'manual' },
  );
  assert.equal(redirectResponse.status, 302);
  assert.equal(redirectResponse.headers.get('location'), 'https://provider.example/landing');
  assert.match(redirectResponse.headers.get('cache-control') || '', /no-store/);
  assert.match(redirectResponse.headers.get('x-robots-tag') || '', /noindex/);

  const previewRedirect = await fetch(`${origin}/astro-foundation/go/${providerSlug}`, { redirect: 'manual' });
  assert.equal(previewRedirect.status, 404);
  assert.notEqual(previewRedirect.headers.get('location'), 'https://provider.example/landing');

  const missingProvider = await fetch(`${origin}/go/seo-provider-missing`, { redirect: 'manual' });
  assert.equal(missingProvider.status, 404);

  const canonicalMissing = await fetch(`${origin}/seo-contract-missing`);
  assert.equal(canonicalMissing.status, 404);
  assert.match(canonicalMissing.headers.get('x-robots-tag') || '', /noindex/);

  for (const slug of [reviewSlug, draftSlug, 'seo-contract-missing']) {
    const response = await fetch(`${origin}/astro-foundation/articoli/${slug}`);
    const html = await response.text();
    assert.equal(response.status, 404);
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
    assert.doesNotMatch(html, /Testo review segreto|Testo draft segreto/);
  }

  const fileProbe = await fetch(`${origin}/.env`);
  assert.equal(fileProbe.status, 404);
  assert.match(fileProbe.headers.get('x-robots-tag') || '', /noindex/);
}

let runtime;
let browser;
try {
  await rm(stateRoot, { recursive: true, force: true });
  migrate();
  seed();
  runtime = startRuntime();
  await waitForRuntime(runtime);
  browser = await chromium.launch({ headless: true });
  await verifyArticleContracts(browser);
  await verifyHomepageContracts(browser);
  await verifyRoutingRegressions();
  console.log('Public SEO contract smoke passed.');
} finally {
  if (browser) await browser.close();
  if (runtime) await stopRuntime(runtime);
  await rm(stateRoot, { recursive: true, force: true });
}
