import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { rm } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const basePort = Number(process.env.PUBLIC_LISTING_SMOKE_PORT || 8801);
const configPath = 'apps/web/dist/server/wrangler.json';
const stateRoot = '.wrangler/public-listing-smoke';
const populatedState = `${stateRoot}/populated`;
const emptyState = `${stateRoot}/empty`;

const listings = [
  {
    type: 'destination',
    segment: 'destinazioni',
    seoTitle: 'eSIM per destinazione: guide per Paese',
    title: 'eSIM per destinazione: scegli il Paese',
    criteriaTitle: 'Prima il Paese, poi le condizioni reali.',
    curatedSlugs: [],
    cardTitle: 'Guide eSIM per Paese',
    emptyMessage: 'Non ci sono ancora destinazioni pubblicate.',
    cluster: 'Destinazioni',
  },
  {
    type: 'guide',
    segment: 'guide',
    seoTitle: 'Guide eSIM: compatibilità, attivazione e uso',
    title: 'Guide eSIM: come funzionano, si installano e si usano',
    criteriaTitle: 'Parti dal problema, non dal provider.',
    curatedSlugs: ['esim-come-funziona', 'esim-telefoni-compatibili', 'esim-estero'],
    cardTitle: 'Tutte le guide pubblicate',
    emptyMessage: 'Non ci sono ancora guide pubblicate.',
    cluster: 'Guide',
  },
  {
    type: 'comparison',
    segment: 'confronti',
    seoTitle: 'Confronti eSIM e provider: differenze e criteri',
    title: 'Confronti eSIM: provider, piani e limiti',
    criteriaTitle: 'Confronta ciò che cambia davvero.',
    curatedSlugs: ['migliore-esim'],
    cardTitle: 'Confronti pubblicati',
    emptyMessage: 'Non ci sono ancora confronti pubblicati.',
    cluster: 'Confronti',
  },
];

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

function executeSql(state, command) {
  wrangler(['d1', 'execute', 'DB', '--local', '--persist-to', state, '--command', command]);
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function pageInsert({ slug, pageType, title, cluster, status, featured, updatedAt }) {
  return `INSERT INTO pages (
    slug,page_type,title,meta_description,eyebrow,h1,direct_answer,intro,
    primary_keyword,cluster,search_intent,status,featured,source_checked_at,published_at,updated_at
  ) VALUES (
    ${quote(slug)},${quote(pageType)},${quote(title)},${quote(`Descrizione ${title}`)},
    'Listing smoke',${quote(title)},${quote(`Risposta ${title}`)},${quote(`Introduzione ${title}`)},
    ${quote(slug)},${quote(cluster)},'informational',${quote(status)},${featured},
    '2099-01-01T00:00:00Z',${status === 'published' ? quote(updatedAt) : 'NULL'},${quote(updatedAt)}
  );`;
}

function seedPopulated(state) {
  const statements = ["UPDATE pages SET status='archived', featured=0;"];
  for (const listing of listings) {
    for (let index = 1; index <= 3; index += 1) {
      statements.push(pageInsert({
        slug: `smoke-listing-${listing.type}-${index}`,
        pageType: listing.type,
        title: `Listing ${listing.type} ${index}`,
        cluster: listing.cluster,
        status: 'published',
        featured: index === 2 ? 1 : 0,
        updatedAt: `2099-0${index}-${String(index).padStart(2, '0')}T12:00:00Z`,
      }));
    }
    statements.push(pageInsert({
      slug: `smoke-listing-${listing.type}-review`,
      pageType: listing.type,
      title: `Listing ${listing.type} review hidden`,
      cluster: listing.cluster,
      status: 'review',
      featured: 1,
      updatedAt: '2100-01-01T12:00:00Z',
    }));
  }
  statements.push(pageInsert({
    slug: 'smoke-listing-guide-draft',
    pageType: 'guide',
    title: 'Listing guide draft hidden',
    cluster: 'Guide',
    status: 'draft',
    featured: 1,
    updatedAt: '2100-02-01T12:00:00Z',
  }));
  executeSql(state, statements.join('\n'));
}

function sectionHtml(html, id) {
  const match = html.match(new RegExp(`<section[^>]*data-public-catalog="${id}"[^>]*>[\\s\\S]*?<\\/section>`));
  assert.ok(match, `Missing catalog section ${id}`);
  return match[0];
}

function assertOrder(html, titles) {
  let previous = -1;
  for (const title of titles) {
    const position = html.indexOf(title);
    assert.ok(position > previous, `${title} is missing or out of order`);
    previous = position;
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function startRuntime(state, port) {
  const logs = [];
  const child = spawn(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js', 'dev', '--config', configPath,
    '--persist-to', state, '--port', String(port), '--ip', '127.0.0.1',
  ], {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: 'public-listing-smoke-token',
      AI_GATEWAY_TOKEN: 'public-listing-smoke-ai-token',
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
  throw new Error(`Listing runtime timed out.\n${runtime.logs.join('')}`);
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
  if (await Promise.race([exited.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 5_000))])) return;
  signal(runtime, 'SIGKILL');
  await Promise.race([once(runtime.child, 'exit'), new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

function assertCuratedLinks(html, listing, mode) {
  if (listing.curatedSlugs.length === 0) {
    assert.doesNotMatch(html, new RegExp(`data-listing-curated-links="${listing.type}"`));
    return;
  }

  assert.match(html, new RegExp(`data-listing-curated-links="${listing.type}"`));
  for (const slug of listing.curatedSlugs) {
    const expected = mode === 'preview' ? `/astro-foundation/articoli/${slug}` : `/${slug}`;
    assert.match(html, new RegExp(`href="${escapeRegex(expected)}"`));
  }
}

function assertListingBody(html, listing, mode) {
  const catalog = sectionHtml(html, `listing-${listing.type}`);
  assert.match(html, new RegExp(`data-public-listing="${listing.type}"`));
  assert.match(html, new RegExp(`data-public-render-mode="${mode}"`));
  assert.match(html, new RegExp(`<h1 id="listing-title">${escapeRegex(listing.title)}</h1>`));
  assert.match(html, new RegExp(escapeRegex(listing.criteriaTitle)));
  assert.match(html, new RegExp(escapeRegex(listing.cardTitle)));
  assertCuratedLinks(html, listing, mode);
  assert.doesNotMatch(html, /<astro-island|<script(?:\s|>)/i);
  assertOrder(catalog, [
    `Listing ${listing.type} 2`,
    `Listing ${listing.type} 3`,
    `Listing ${listing.type} 1`,
  ]);
  assert.equal((catalog.match(new RegExp(`data-page-type="${listing.type}"`, 'g')) || []).length, 3);
  assert.doesNotMatch(catalog, new RegExp(`Listing ${listing.type} review hidden`));
  assert.doesNotMatch(catalog, /Listing guide draft hidden/);
  return catalog;
}

async function verifyPopulated() {
  const origin = `http://127.0.0.1:${basePort}`;
  const runtime = startRuntime(populatedState, basePort);
  let browser;
  try {
    await waitForRuntime(runtime, origin);

    for (const listing of listings) {
      const previewPath = `/astro-foundation/${listing.segment}`;
      const previewResponse = await fetch(`${origin}${previewPath}`);
      const previewHtml = await previewResponse.text();
      const previewCatalog = assertListingBody(previewHtml, listing, 'preview');
      assert.equal(previewResponse.status, 200);
      assert.match(previewResponse.headers.get('x-robots-tag') || '', /noindex/);
      assert.match(previewResponse.headers.get('cache-control') || '', /no-store/);
      assert.match(previewHtml, new RegExp(`<title>${escapeRegex(listing.seoTitle)} preview \\| Senza Roaming<\\/title>`));
      assert.match(previewHtml, new RegExp(`<link rel="canonical" href="https:\/\/senzaroaming\\.it${escapeRegex(previewPath)}"`));
      assert.match(previewCatalog, new RegExp(`href="\/astro-foundation\/articoli\/smoke-listing-${listing.type}-2"`));
      for (const expected of listings) assert.match(previewHtml, new RegExp(`href="\/astro-foundation\/${expected.segment}"`));

      const canonicalPath = `/${listing.segment}`;
      const canonicalResponse = await fetch(`${origin}${canonicalPath}`);
      const canonicalHtml = await canonicalResponse.text();
      const canonicalCatalog = assertListingBody(canonicalHtml, listing, 'canonical');
      assert.equal(canonicalResponse.status, 200);
      assert.match(canonicalResponse.headers.get('cache-control') || '', /public,max-age=300/);
      assert.equal(canonicalResponse.headers.get('x-robots-tag'), null);
      assert.match(canonicalHtml, new RegExp(`<title>${escapeRegex(listing.seoTitle)} \\| Senza Roaming<\\/title>`));
      assert.match(canonicalHtml, new RegExp(`<link rel="canonical" href="https:\/\/senzaroaming\\.it${canonicalPath}"`));
      assert.match(canonicalHtml, /index,follow,max-image-preview:large/);
      assert.match(canonicalCatalog, new RegExp(`href="\/smoke-listing-${listing.type}-2"`));
      assert.doesNotMatch(canonicalHtml, /astro-foundation/);
      for (const expected of listings) assert.match(canonicalHtml, new RegExp(`href="\/${expected.segment}"`));
    }

    const previewHomepage = await (await fetch(`${origin}/astro-foundation`)).text();
    for (const listing of listings) assert.match(previewHomepage, new RegExp(`href="\/astro-foundation\/${listing.segment}"`));
    assert.match(previewHomepage, /href="\/astro-foundation\/articoli\/smoke-listing-guide-2"/);

    const canonicalHomepage = await (await fetch(`${origin}/`)).text();
    for (const listing of listings) assert.match(canonicalHomepage, new RegExp(`href="\/${listing.segment}"`));
    assert.match(canonicalHomepage, /href="\/smoke-listing-guide-2"/);
    assert.doesNotMatch(canonicalHomepage, /astro-foundation/);

    const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
    assert.doesNotMatch(sitemap, /astro-foundation|smoke-listing-guide-review|smoke-listing-guide-draft/);
    assert.match(sitemap, /smoke-listing-guide-2/);

    const unknownResponse = await fetch(`${origin}/astro-foundation/provider`);
    assert.equal(unknownResponse.status, 404);

    browser = await chromium.launch({ headless: true });
    const desktop = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    await desktop.goto(`${origin}/destinazioni`);
    await desktop.getByRole('heading', { level: 1, name: listings[0].title }).waitFor();
    assert.equal(
      await desktop.locator('[data-public-catalog="listing-destination"] .catalog-grid').evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
      ),
      3,
    );
    const routeNavigation = desktop.getByRole('navigation', { name: 'Sezioni del catalogo' });
    assert.equal(await routeNavigation.getByRole('link', { name: /Destinazioni/ }).getAttribute('aria-current'), 'page');
    await routeNavigation.getByRole('link', { name: /Confronti/ }).click();
    await desktop.getByRole('heading', { level: 1, name: listings[2].title }).waitFor();
    assert.equal(new URL(desktop.url()).pathname, '/confronti');
    assert.equal(await desktop.locator('[data-listing-curated-links="comparison"] a').count(), 1);
    assert.equal(await desktop.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    assert.equal(await desktop.locator('script').count(), 0);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`${origin}/guide`);
    await mobile.getByRole('heading', { level: 1, name: listings[1].title }).waitFor();
    assert.equal(
      await mobile.locator('[data-public-catalog="listing-guide"] .catalog-grid').evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
      ),
      1,
    );
    assert.equal(await mobile.locator('[data-listing-curated-links="guide"] a').count(), 3);
    await mobile.getByText('Apri menu', { exact: true }).click();
    const mobileGuide = mobile.getByRole('navigation', { name: 'Navigazione mobile' }).getByRole('link', { name: 'Guide' });
    assert.equal(await mobileGuide.getAttribute('href'), '/guide');
    assert.equal(await mobileGuide.getAttribute('aria-current'), 'page');
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    assert.equal(await mobile.locator('script').count(), 0);
    await mobile.close();
  } finally {
    if (browser) await browser.close();
    await stopRuntime(runtime);
  }
}

async function verifyEmpty() {
  const port = basePort + 1;
  const origin = `http://127.0.0.1:${port}`;
  const runtime = startRuntime(emptyState, port);
  let browser;
  try {
    await waitForRuntime(runtime, origin);
    for (const listing of listings) {
      for (const pathname of [`/astro-foundation/${listing.segment}`, `/${listing.segment}`]) {
        const response = await fetch(`${origin}${pathname}`);
        const html = await response.text();
        assert.equal(response.status, 200);
        assert.match(html, new RegExp(escapeRegex(listing.emptyMessage)));
        assert.equal((html.match(/<article class="catalog-card"/g) || []).length, 0);
        assertCuratedLinks(html, listing, pathname.startsWith('/astro-foundation') ? 'preview' : 'canonical');
      }
    }
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${origin}/confronti`);
    assert.equal(await page.getByRole('status').count(), 1);
    assert.equal(await page.locator('[data-listing-curated-links="comparison"] a').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    await page.close();
  } finally {
    if (browser) await browser.close();
    await stopRuntime(runtime);
  }
}

try {
  await rm(stateRoot, { recursive: true, force: true });
  migrate(populatedState);
  seedPopulated(populatedState);
  migrate(emptyState);
  executeSql(emptyState, "UPDATE pages SET status='archived', featured=0;");
  await verifyPopulated();
  await verifyEmpty();
  console.log('Public listing preview and active canonical Astro smoke passed.');
} finally {
  await rm(stateRoot, { recursive: true, force: true });
}
