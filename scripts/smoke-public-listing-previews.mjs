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
    canonicalPath: '/destinazioni',
    title: 'eSIM per destinazione',
    cardTitle: 'Destinazioni pubblicate',
    emptyMessage: 'Non ci sono ancora destinazioni pubblicate.',
    cluster: 'Destinazioni',
  },
  {
    type: 'guide',
    segment: 'guide',
    canonicalPath: '/guide',
    title: 'Guide pratiche sulle eSIM',
    cardTitle: 'Guide pubblicate',
    emptyMessage: 'Non ci sono ancora guide pubblicate.',
    cluster: 'Guide',
  },
  {
    type: 'comparison',
    segment: 'confronti',
    canonicalPath: '/confronti',
    title: 'Confronti tra eSIM e provider',
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
  if (result.status !== 0) {
    throw new Error(`Wrangler command failed:\n${result.stdout}\n${result.stderr}`);
  }
}

function migrate(persistPath) {
  wrangler(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', persistPath]);
}

function executeSql(persistPath, command) {
  wrangler(['d1', 'execute', 'DB', '--local', '--persist-to', persistPath, '--command', command]);
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function pageInsert({
  slug,
  pageType,
  title,
  cluster,
  status,
  featured,
  updatedAt,
}) {
  return `INSERT INTO pages (
    slug,page_type,title,meta_description,eyebrow,h1,direct_answer,intro,
    primary_keyword,cluster,search_intent,status,featured,source_checked_at,published_at,updated_at
  ) VALUES (
    ${sqlString(slug)},${sqlString(pageType)},${sqlString(title)},${sqlString(`Descrizione ${title}`)},
    ${sqlString('Listing smoke')},${sqlString(title)},${sqlString(`Risposta ${title}`)},
    ${sqlString(`Introduzione ${title}`)},${sqlString(slug)},${sqlString(cluster)},
    ${sqlString('informational')},${sqlString(status)},${featured},
    ${sqlString('2099-01-01T00:00:00Z')},
    ${status === 'published' ? sqlString(updatedAt) : 'NULL'},${sqlString(updatedAt)}
  );`;
}

function seedPopulatedCatalog(persistPath) {
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

  executeSql(persistPath, statements.join('\n'));
}

function hideMigratedCatalog(persistPath) {
  executeSql(persistPath, "UPDATE pages SET status='archived', featured=0;");
}

function sectionHtml(html, id) {
  const match = html.match(
    new RegExp(`<section[^>]*data-public-catalog="${id}"[^>]*>[\\s\\S]*?<\\/section>`),
  );
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

function startRuntime(persistPath, runtimePort) {
  const logs = [];
  const child = spawn(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js',
    'dev',
    '--config', configPath,
    '--persist-to', persistPath,
    '--port', String(runtimePort),
    '--ip', '127.0.0.1',
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
  throw new Error(`Timed out waiting for listing preview runtime.\n${runtime.logs.join('')}`);
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

async function verifyPopulatedListings() {
  const origin = `http://127.0.0.1:${basePort}`;
  const runtime = startRuntime(populatedState, basePort);
  let browser;

  try {
    await waitForRuntime(runtime, origin);

    for (const listing of listings) {
      const previewPath = `/astro-foundation/${listing.segment}`;
      const response = await fetch(`${origin}${previewPath}`);
      const html = await response.text();
      const catalog = sectionHtml(html, `listing-${listing.type}`);

      assert.equal(response.status, 200, `${previewPath} did not resolve`);
      assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
      assert.match(response.headers.get('cache-control') || '', /no-store/);
      assert.match(html, new RegExp(`data-public-listing="${listing.type}"`));
      assert.match(html, new RegExp(`<h1 id="listing-title">${escapeRegex(listing.title)}</h1>`));
      assert.match(
        html,
        new RegExp(`<link rel="canonical" href="https:\\/\\/senzaroaming\\.it${escapeRegex(previewPath)}"`),
      );
      assert.match(html, new RegExp(listing.cardTitle));
      assert.doesNotMatch(html, /<astro-island|<script(?:\s|>)/i);

      assertOrder(catalog, [
        `Listing ${listing.type} 2`,
        `Listing ${listing.type} 3`,
        `Listing ${listing.type} 1`,
      ]);
      assert.equal(
        (catalog.match(new RegExp(`data-page-type="${listing.type}"`, 'g')) || []).length,
        3,
      );
      assert.doesNotMatch(catalog, new RegExp(`Listing ${listing.type} review hidden`));
      assert.doesNotMatch(catalog, /Listing guide draft hidden/);
      assert.match(
        catalog,
        new RegExp(`href="\\/astro-foundation\\/articoli\\/smoke-listing-${listing.type}-2"`),
      );

      for (const expected of listings) {
        assert.match(html, new RegExp(`href="\\/astro-foundation\\/${expected.segment}"`));
      }

      const legacyResponse = await fetch(`${origin}${listing.canonicalPath}`);
      const legacyHtml = await legacyResponse.text();
      assert.equal(legacyResponse.status, 200);
      assert.doesNotMatch(legacyHtml, /data-public-listing=/);
      assertOrder(legacyHtml, [
        `Listing ${listing.type} 2`,
        `Listing ${listing.type} 3`,
        `Listing ${listing.type} 1`,
      ]);
      assert.doesNotMatch(legacyHtml, new RegExp(`Listing ${listing.type} review hidden`));
      assert.match(legacyHtml, new RegExp(`href="\\/smoke-listing-${listing.type}-2"`));
      assert.doesNotMatch(legacyHtml, /astro-foundation\/articoli/);
    }

    const homepageResponse = await fetch(`${origin}/astro-foundation`);
    const homepage = await homepageResponse.text();
    assert.equal(homepageResponse.status, 200);
    for (const listing of listings) {
      assert.match(homepage, new RegExp(`href="\\/astro-foundation\\/${listing.segment}"`));
    }
    assert.match(homepage, /href="\/astro-foundation\/articoli\/smoke-listing-guide-2"/);

    const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
    const sitemap = await sitemapResponse.text();
    assert.equal(sitemapResponse.status, 200);
    assert.doesNotMatch(sitemap, /astro-foundation|smoke-listing-guide-review/);
    assert.match(sitemap, /smoke-listing-guide-2/);

    const unknownResponse = await fetch(`${origin}/astro-foundation/provider`);
    const unknownHtml = await unknownResponse.text();
    assert.equal(unknownResponse.status, 404);
    assert.doesNotMatch(unknownHtml, /data-public-listing=/);

    browser = await chromium.launch({ headless: true });

    const desktop = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    await desktop.goto(`${origin}/astro-foundation/destinazioni`);
    await desktop.getByRole('heading', { level: 1, name: listings[0].title }).waitFor();
    assert.equal(
      await desktop.locator('[data-public-catalog="listing-destination"] .catalog-grid').evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
      ),
      3,
    );
    const routeNavigation = desktop.getByRole('navigation', { name: 'Sezioni del catalogo preview' });
    assert.equal(
      await routeNavigation.getByRole('link', { name: /Destinazioni/ }).getAttribute('aria-current'),
      'page',
    );
    await routeNavigation.getByRole('link', { name: /Confronti/ }).click();
    await desktop.getByRole('heading', { level: 1, name: listings[2].title }).waitFor();
    assert.equal(new URL(desktop.url()).pathname, '/astro-foundation/confronti');
    await desktop.keyboard.press('Tab');
    assert.equal(
      await desktop.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      true,
    );
    assert.equal(await desktop.locator('script').count(), 0);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`${origin}/astro-foundation/guide`);
    await mobile.getByRole('heading', { level: 1, name: listings[1].title }).waitFor();
    assert.equal(
      await mobile.locator('[data-public-catalog="listing-guide"] .catalog-grid').evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
      ),
      1,
    );
    await mobile.getByText('Apri menu', { exact: true }).click();
    const mobileGuide = mobile
      .getByRole('navigation', { name: 'Navigazione mobile' })
      .getByRole('link', { name: 'Guide' });
    assert.equal(await mobileGuide.getAttribute('href'), '/astro-foundation/guide');
    assert.equal(await mobileGuide.getAttribute('aria-current'), 'page');
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      true,
    );
    assert.equal(await mobile.locator('script').count(), 0);
    await mobile.close();
  } finally {
    if (browser) await browser.close();
    await stopRuntime(runtime);
  }
}

async function verifyEmptyListings() {
  const emptyPort = basePort + 1;
  const origin = `http://127.0.0.1:${emptyPort}`;
  const runtime = startRuntime(emptyState, emptyPort);
  let browser;

  try {
    await waitForRuntime(runtime, origin);

    for (const listing of listings) {
      const response = await fetch(`${origin}/astro-foundation/${listing.segment}`);
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(html, new RegExp(escapeRegex(listing.emptyMessage)));
      assert.equal((html.match(/<article class="catalog-card"/g) || []).length, 0);
    }

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${origin}/astro-foundation/confronti`);
    assert.equal(await page.getByRole('status').count(), 1);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      true,
    );
    await page.close();
  } finally {
    if (browser) await browser.close();
    await stopRuntime(runtime);
  }
}

try {
  await rm(stateRoot, { recursive: true, force: true });
  migrate(populatedState);
  seedPopulatedCatalog(populatedState);
  migrate(emptyState);
  hideMigratedCatalog(emptyState);
  await verifyPopulatedListings();
  await verifyEmptyListings();
  console.log('Public Astro listing preview smoke passed.');
} finally {
  await rm(stateRoot, { recursive: true, force: true });
}
