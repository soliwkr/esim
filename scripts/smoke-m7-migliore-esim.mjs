import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { rm } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const port = Number(process.env.M7_MIGLIORE_ESIM_SMOKE_PORT || 8811);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const stateRoot = '.wrangler/m7-migliore-esim-smoke';
const canonicalPath = '/migliore-esim';
const previewPath = '/astro-foundation/articoli/migliore-esim';

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
      MAINTENANCE_TOKEN: 'm7-migliore-esim-smoke-token',
      AI_GATEWAY_TOKEN: 'm7-migliore-esim-smoke-ai-token',
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
  throw new Error(`Timed out waiting for migliore-esim runtime.\n${runtime.logs.join('')}`);
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

function assertArticleJsonLd(html, expectedUrl) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const jsonLd = scripts.filter((script) => /type=["']application\/ld\+json["']/i.test(script[1]));
  assert.equal(jsonLd.length, 1);
  const documents = JSON.parse(jsonLd[0][2]);
  const entries = Array.isArray(documents) ? documents : [documents];
  const article = entries.find((entry) => entry?.['@type'] === 'Article');
  assert.ok(article);
  assert.equal(article.headline, 'Qual è la migliore eSIM per viaggiare?');
  assert.equal(article.mainEntityOfPage, expectedUrl);
  assert.equal(article.dateModified, '2026-07-28T00:00:00.000Z');
}

function assertCoreCopy(html) {
  assert.match(html, /<title>Migliore eSIM per viaggiare: criteri e confronto \| Senza Roaming<\/title>/);
  assert.match(html, /<h1>Qual è la migliore eSIM per viaggiare\?<\/h1>/);
  assert.match(html, /Senza verifiche datate non esiste un vincitore universale/);
  assert.match(html, /I criteri che cambiano davvero la scelta/);
  assert.match(html, /Destinazione/);
  assert.match(html, /Durata/);
  assert.match(html, /Hotspot/);
  assert.match(html, /Installazione/);
  assert.match(html, /Attivazione/);
  assert.match(html, /Fair use/);
  assert.match(html, /Chiamate e SMS/);
  assert.match(html, /Prezzi e condizioni hanno una data/);
  assert.match(html, /Nessuna classifica automatica o raccomandazione provider-specifica/);
  assert.match(html, /I link ai provider non sono attualmente remunerati/);
  assert.doesNotMatch(html, /Airalo o Holafly: quale scegliere/);
}

function assertCanonicalLinks(html) {
  for (const href of [
    '/',
    '/destinazioni',
    '/guide',
    '/confronti',
    '/esim-estero',
    '/esim-come-funziona',
    '/esim-telefoni-compatibili',
  ]) {
    assert.match(html, new RegExp(`href="${href.replaceAll('/', '\\/')}"`));
  }
  assert.doesNotMatch(html, /href="\/astro-foundation(?:\/|\")/);
}

function assertPreviewLinks(html) {
  for (const href of [
    '/astro-foundation',
    '/astro-foundation/destinazioni',
    '/astro-foundation/guide',
    '/astro-foundation/confronti',
    '/astro-foundation/articoli/esim-estero',
    '/astro-foundation/articoli/esim-come-funziona',
    '/astro-foundation/articoli/esim-telefoni-compatibili',
  ]) {
    assert.match(html, new RegExp(`href="${href.replaceAll('/', '\\/')}"`));
  }
}

async function verifyHttp() {
  const canonicalResponse = await fetch(`${origin}${canonicalPath}`);
  const canonicalHtml = await canonicalResponse.text();
  assert.equal(canonicalResponse.status, 200);
  assertCoreCopy(canonicalHtml);
  assertCanonicalLinks(canonicalHtml);
  assertArticleJsonLd(canonicalHtml, 'https://senzaroaming.it/migliore-esim');

  const previewResponse = await fetch(`${origin}${previewPath}`);
  const previewHtml = await previewResponse.text();
  assert.equal(previewResponse.status, 200);
  assert.match(previewResponse.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(previewResponse.headers.get('cache-control') || '', /no-store/);
  assertCoreCopy(previewHtml);
  assertPreviewLinks(previewHtml);
  assertArticleJsonLd(previewHtml, 'https://senzaroaming.it/astro-foundation/articoli/migliore-esim');

  executeSql("UPDATE pages SET status='review' WHERE slug='esim-come-funziona';");
  const filteredResponse = await fetch(`${origin}${canonicalPath}`);
  const filteredHtml = await filteredResponse.text();
  assert.equal(filteredResponse.status, 200);
  assert.doesNotMatch(filteredHtml, /href="\/esim-come-funziona"/);
  assert.match(filteredHtml, /href="\/esim-estero"/);

  executeSql("UPDATE pages SET status='review' WHERE slug='migliore-esim';");
  for (const path of [canonicalPath, previewPath]) {
    const hiddenResponse = await fetch(`${origin}${path}`);
    const hiddenHtml = await hiddenResponse.text();
    assert.equal(hiddenResponse.status, 404);
    assert.doesNotMatch(hiddenHtml, /Qual è la migliore eSIM per viaggiare/);
    assert.match(hiddenResponse.headers.get('x-robots-tag') || '', /noindex/);
  }
}

async function verifyBrowser() {
  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    await desktop.goto(`${origin}${canonicalPath}`);
    await desktop.getByRole('heading', { level: 1, name: 'Qual è la migliore eSIM per viaggiare?' }).waitFor();
    assert.equal(await desktop.getByRole('heading', { level: 1 }).count(), 1);
    assert.equal(await desktop.locator('[data-m7-migliore-esim-links]').count(), 1);
    assert.equal(
      await desktop.getByRole('link', { name: 'Scegli la destinazione' }).first().getAttribute('href'),
      '/destinazioni',
    );
    assert.equal(
      await desktop.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      true,
    );
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`${origin}${previewPath}`);
    await mobile.getByRole('heading', { level: 1, name: 'Qual è la migliore eSIM per viaggiare?' }).waitFor();
    const tableWrap = mobile.locator('.article-table-wrap');
    assert.equal(await tableWrap.count(), 1);
    assert.equal(await tableWrap.evaluate((element) => element.scrollWidth > element.clientWidth), true);
    assert.equal(
      await mobile.getByRole('link', { name: 'Verifica se il telefono supporta eSIM' }).first().getAttribute('href'),
      '/astro-foundation/articoli/esim-telefoni-compatibili',
    );
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      true,
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
  runtime = startRuntime();
  await waitForRuntime(runtime);
  await verifyBrowser();
  await verifyHttp();
  console.log('M7 migliore-esim alignment smoke passed.');
} finally {
  if (runtime) await stopRuntime(runtime);
  await rm(stateRoot, { recursive: true, force: true });
}
