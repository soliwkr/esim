import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { rm } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const basePort = Number(process.env.PUBLIC_HOMEPAGE_SMOKE_PORT || 8799);
const configPath = 'apps/web/dist/server/wrangler.json';
const stateRoot = '.wrangler/homepage-candidate-smoke';
const populatedState = `${stateRoot}/populated`;
const emptyState = `${stateRoot}/empty`;

function wrangler(args) {
  const result = spawnSync(
    process.execPath,
    ['node_modules/wrangler/bin/wrangler.js', ...args],
    {
      encoding: 'utf8',
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  if (result.status !== 0) {
    throw new Error(`Wrangler command failed:\n${result.stdout}\n${result.stderr}`);
  }
}

function migrate(persistPath) {
  wrangler(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', persistPath]);
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function pageInsert({ slug, pageType, title, status, featured, updatedAt }) {
  return `INSERT INTO pages (
    slug,page_type,title,meta_description,eyebrow,h1,direct_answer,intro,
    primary_keyword,cluster,search_intent,status,featured,source_checked_at,published_at,updated_at
  ) VALUES (
    ${sqlString(slug)},${sqlString(pageType)},${sqlString(title)},
    ${sqlString(`Descrizione ${title}`)},${sqlString('Smoke test')},${sqlString(title)},
    ${sqlString(`Risposta ${title}`)},${sqlString(`Introduzione ${title}`)},
    ${sqlString(slug)},${sqlString(pageType === 'destination' ? 'Destinazioni' : 'Guide')},
    ${sqlString('informational')},${sqlString(status)},${featured},
    ${sqlString('2099-01-01T00:00:00Z')},
    ${status === 'published' ? sqlString(updatedAt) : 'NULL'},${sqlString(updatedAt)}
  );`;
}

function seedPopulatedCatalog(persistPath) {
  const statements = ["DELETE FROM pages WHERE slug LIKE 'smoke-homepage-%';"];

  for (let index = 1; index <= 10; index += 1) {
    statements.push(pageInsert({
      slug: `smoke-homepage-featured-${index}`,
      pageType: 'guide',
      title: `Homepage featured ${index}`,
      status: 'published',
      featured: 1,
      updatedAt: `2099-01-${String(index).padStart(2, '0')}T12:00:00Z`,
    }));
  }

  statements.push(pageInsert({
    slug: 'smoke-homepage-featured-review',
    pageType: 'guide',
    title: 'Homepage featured review hidden',
    status: 'review',
    featured: 1,
    updatedAt: '2100-01-01T12:00:00Z',
  }));

  for (let index = 1; index <= 7; index += 1) {
    statements.push(pageInsert({
      slug: `smoke-homepage-destination-${index}`,
      pageType: 'destination',
      title: `Homepage destination ${index}`,
      status: 'published',
      featured: 0,
      updatedAt: `2099-02-${String(index).padStart(2, '0')}T12:00:00Z`,
    }));
  }

  statements.push(pageInsert({
    slug: 'smoke-homepage-destination-review',
    pageType: 'destination',
    title: 'Homepage destination review hidden',
    status: 'review',
    featured: 0,
    updatedAt: '2100-02-01T12:00:00Z',
  }));

  statements.push(pageInsert({
    slug: 'smoke-homepage-draft-hidden',
    pageType: 'guide',
    title: 'Homepage draft hidden',
    status: 'draft',
    featured: 1,
    updatedAt: '2100-03-01T12:00:00Z',
  }));

  wrangler([
    'd1', 'execute', 'DB', '--local', '--persist-to', persistPath,
    '--command', statements.join('\n'),
  ]);
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

function startRuntime(persistPath, port) {
  const logs = [];
  const child = spawn(
    process.execPath,
    [
      'node_modules/wrangler/bin/wrangler.js',
      'dev',
      '--config', configPath,
      '--persist-to', persistPath,
      '--port', String(port),
      '--ip', '127.0.0.1',
    ],
    {
      env: {
        ...process.env,
        MAINTENANCE_TOKEN: 'public-homepage-smoke-token',
        AI_GATEWAY_TOKEN: 'public-homepage-smoke-ai-token',
        ASTRO_TELEMETRY_DISABLED: '1',
      },
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

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
  throw new Error(`Timed out waiting for homepage candidate runtime.\n${runtime.logs.join('')}`);
}

function signalRuntime(runtime, signal) {
  const { child } = runtime;
  if (child.exitCode !== null || !child.pid) return;
  if (process.platform === 'win32') child.kill(signal);
  else process.kill(-child.pid, signal);
}

async function stopRuntime(runtime) {
  const { child } = runtime;
  if (child.exitCode !== null) return;
  const exited = once(child, 'exit');
  signalRuntime(runtime, 'SIGTERM');
  const graceful = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (graceful) return;
  signalRuntime(runtime, 'SIGKILL');
  await Promise.race([once(child, 'exit'), new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

async function verifyPopulatedCandidate() {
  const port = basePort;
  const origin = `http://127.0.0.1:${port}`;
  const runtime = startRuntime(populatedState, port);
  let browser;

  try {
    await waitForRuntime(runtime, origin);

    const previewResponse = await fetch(`${origin}/astro-foundation`);
    const previewHtml = await previewResponse.text();
    assert.equal(previewResponse.status, 200);
    assert.match(previewResponse.headers.get('x-robots-tag') || '', /noindex/);
    assert.match(previewResponse.headers.get('cache-control') || '', /no-store/);
    assert.match(previewHtml, /data-homepage-candidate/);
    assert.doesNotMatch(previewHtml, /<astro-island/);
    assert.doesNotMatch(previewHtml, /<script(?:\s|>)/i);

    const featured = sectionHtml(previewHtml, 'featured-guides');
    assertOrder(featured, Array.from({ length: 9 }, (_, index) => `Homepage featured ${10 - index}`));
    assert.doesNotMatch(featured, /Homepage featured 1(?:<|&)/);
    assert.doesNotMatch(featured, /Homepage featured review hidden/);
    assert.doesNotMatch(featured, /Homepage draft hidden/);
    assert.match(featured, /href="\/smoke-homepage-featured-10"/);

    const destinations = sectionHtml(previewHtml, 'main-destinations');
    assertOrder(destinations, Array.from({ length: 6 }, (_, index) => `Homepage destination ${7 - index}`));
    assert.doesNotMatch(destinations, /Homepage destination 1(?:<|&)/);
    assert.doesNotMatch(destinations, /Homepage destination review hidden/);
    assert.match(destinations, /href="\/smoke-homepage-destination-7"/);

    const rootResponse = await fetch(`${origin}/`);
    const rootHtml = await rootResponse.text();
    assert.equal(rootResponse.status, 200);
    assert.doesNotMatch(rootHtml, /data-homepage-candidate/);
    assert.match(rootHtml, /Homepage featured 10/);
    assert.doesNotMatch(rootHtml, /Homepage featured review hidden/);

    const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
    const sitemap = await sitemapResponse.text();
    assert.equal(sitemapResponse.status, 200);
    assert.doesNotMatch(sitemap, /astro-foundation/);
    assert.match(sitemap, /smoke-homepage-featured-10/);
    assert.doesNotMatch(sitemap, /smoke-homepage-featured-review/);

    const missingResponse = await fetch(`${origin}/smoke-homepage-not-found`);
    assert.equal(missingResponse.status, 404);
    assert.match(missingResponse.headers.get('x-robots-tag') || '', /noindex/);

    browser = await chromium.launch({ headless: true });
    const desktop = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    await desktop.goto(`${origin}/astro-foundation`);
    await desktop.getByRole('heading', { name: 'Guide essenziali' }).waitFor();
    assert.equal(await desktop.locator('[data-public-catalog="featured-guides"] .catalog-card').count(), 9);
    assert.equal(await desktop.locator('[data-public-catalog="main-destinations"] .catalog-card').count(), 6);
    const desktopColumns = await desktop.locator('[data-public-catalog="featured-guides"] .catalog-grid').evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
    );
    assert.equal(desktopColumns, 3);
    await desktop.keyboard.press('Tab');
    assert.equal(await desktop.evaluate(() => document.activeElement?.textContent?.trim()), 'Vai al contenuto');
    assert.equal(await desktop.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`${origin}/astro-foundation`);
    await mobile.getByRole('heading', { name: 'Destinazioni principali' }).waitFor();
    const mobileColumns = await mobile.locator('[data-public-catalog="featured-guides"] .catalog-grid').evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
    );
    assert.equal(mobileColumns, 1);
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    await mobile.close();
  } finally {
    if (browser) await browser.close();
    await stopRuntime(runtime);
  }
}

async function verifyEmptyCandidate() {
  const port = basePort + 1;
  const origin = `http://127.0.0.1:${port}`;
  const runtime = startRuntime(emptyState, port);
  let browser;

  try {
    await waitForRuntime(runtime, origin);
    const response = await fetch(`${origin}/astro-foundation`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal((html.match(/I contenuti sono in preparazione\./g) || []).length, 2);
    assert.doesNotMatch(html, /catalog-card/);

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${origin}/astro-foundation`);
    assert.equal(await page.getByRole('status').count(), 2);
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
  seedPopulatedCatalog(populatedState);
  migrate(emptyState);
  await verifyPopulatedCandidate();
  await verifyEmptyCandidate();
  console.log('Public Astro homepage candidate smoke passed.');
} finally {
  await rm(stateRoot, { recursive: true, force: true });
}
