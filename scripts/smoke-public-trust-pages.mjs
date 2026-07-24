import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';

const port = Number(process.env.PUBLIC_TRUST_SMOKE_PORT || 8798);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const logs = [];

const trustPages = [
  {
    slug: 'metodo',
    heading: 'La pagina arriva dopo le prove.',
    marker: 'metodo',
  },
  {
    slug: 'trasparenza',
    heading: 'Una commissione non decide la classifica.',
    marker: 'trasparenza',
  },
  {
    slug: 'privacy',
    heading: 'Raccogliere meno, spiegare meglio.',
    marker: 'privacy',
  },
];

function record(chunk) {
  const value = chunk.toString();
  logs.push(value);
  process.stdout.write(value);
}

async function waitForRuntime(child, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`wrangler dev exited with code ${child.exitCode}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {
      // workerd is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error('Timed out waiting for the public trust-page workerd runtime.');
}

const wrangler = spawn(
  process.execPath,
  [
    'node_modules/wrangler/bin/wrangler.js',
    'dev',
    '--config', configPath,
    '--persist-to', '.wrangler/state',
    '--port', String(port),
    '--ip', '127.0.0.1',
  ],
  {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: 'public-trust-smoke-token',
      AI_GATEWAY_TOKEN: 'public-trust-smoke-ai-token',
      ASTRO_TELEMETRY_DISABLED: '1',
    },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

wrangler.stdout.on('data', record);
wrangler.stderr.on('data', record);

function signalWrangler(signal) {
  if (wrangler.exitCode !== null || !wrangler.pid) return;
  if (process.platform === 'win32') wrangler.kill(signal);
  else process.kill(-wrangler.pid, signal);
}

async function stopWrangler() {
  if (wrangler.exitCode !== null) return;
  const exited = once(wrangler, 'exit');
  signalWrangler('SIGTERM');
  const graceful = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (graceful) return;
  signalWrangler('SIGKILL');
  await Promise.race([once(wrangler, 'exit'), new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

let browser;

try {
  await waitForRuntime(wrangler);

  for (const page of trustPages) {
    const previewPath = `/astro-foundation/${page.slug}`;
    const previewResponse = await fetch(`${origin}${previewPath}`);
    const previewHtml = await previewResponse.text();

    assert.equal(previewResponse.status, 200, `${previewPath} did not resolve`);
    assert.match(previewResponse.headers.get('x-robots-tag') || '', /noindex/);
    assert.match(previewResponse.headers.get('cache-control') || '', /no-store/);
    assert.match(previewResponse.headers.get('x-content-type-options') || '', /nosniff/);
    assert.match(previewHtml, new RegExp(`data-public-trust-page="${page.marker}"`));
    assert.match(previewHtml, /data-public-render-mode="preview"/);
    assert.match(previewHtml, new RegExp(page.heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(previewHtml, new RegExp(`<link rel="canonical" href="https:\/\/senzaroaming\\.it${previewPath}"`));
    assert.match(previewHtml, /<meta name="robots" content="noindex,nofollow"/);
    assert.match(previewHtml, /aria-label="Pagine di fiducia preview"/);
    assert.match(previewHtml, /href="\/astro-foundation" aria-label="Senza Roaming, torna alla home"/);
    assert.doesNotMatch(previewHtml, /<astro-island/);
    assert.doesNotMatch(previewHtml, /<script(?:\s|>)/i);

    const canonicalPath = `/${page.slug}`;
    const canonicalResponse = await fetch(`${origin}${canonicalPath}`);
    const canonicalHtml = await canonicalResponse.text();
    assert.equal(canonicalResponse.status, 200, `${canonicalPath} did not resolve`);
    assert.match(canonicalResponse.headers.get('cache-control') || '', /public,max-age=300/);
    assert.equal(canonicalResponse.headers.get('x-robots-tag'), null);
    assert.match(canonicalHtml, new RegExp(`data-public-trust-page="${page.marker}"`));
    assert.match(canonicalHtml, /data-public-render-mode="canonical"/);
    assert.match(canonicalHtml, new RegExp(page.heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(canonicalHtml, new RegExp(`<link rel="canonical" href="https:\/\/senzaroaming\\.it${canonicalPath}"`));
    assert.match(canonicalHtml, /<meta name="robots" content="index,follow,max-image-preview:large"/);
    assert.match(canonicalHtml, /aria-label="Pagine di fiducia"/);
    assert.match(canonicalHtml, /href="\/" aria-label="Senza Roaming, torna alla home"/);
    assert.doesNotMatch(canonicalHtml, /Preview isolata|In questa preview|\/astro-foundation/i);
    assert.doesNotMatch(canonicalHtml, /<astro-island/);
    assert.doesNotMatch(canonicalHtml, /<script(?:\s|>)/i);
  }

  const shellResponse = await fetch(`${origin}/astro-foundation`);
  const shellHtml = await shellResponse.text();
  assert.equal(shellResponse.status, 200);
  assert.match(shellHtml, /href="\/astro-foundation\/metodo">Leggi il metodo/);
  assert.match(shellHtml, /href="\/astro-foundation\/trasparenza">Trasparenza/);
  assert.match(shellHtml, /href="\/astro-foundation\/privacy">Privacy/);

  const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
  const sitemap = await sitemapResponse.text();
  assert.equal(sitemapResponse.status, 200);
  assert.doesNotMatch(sitemap, /astro-foundation/);

  browser = await chromium.launch({ headless: true });

  const desktopContext = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  const desktopConsole = [];
  desktopPage.on('console', (message) => {
    if (message.type() === 'error') desktopConsole.push(message.text());
  });
  await desktopPage.goto(`${origin}/metodo`);
  await desktopPage.getByRole('heading', { level: 1, name: trustPages[0].heading }).waitFor();
  const trustNavigation = desktopPage.getByRole('navigation', { name: 'Pagine di fiducia' });
  await trustNavigation.waitFor();
  assert.equal(await trustNavigation.getByRole('link', { name: /Metodo editoriale/ }).getAttribute('aria-current'), 'page');
  await desktopPage.keyboard.press('Tab');
  assert.equal(await desktopPage.evaluate(() => document.activeElement?.textContent?.trim()), 'Vai al contenuto');
  assert.equal(await desktopPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  assert.equal(await desktopPage.locator('script').count(), 0);
  assert.deepEqual(desktopConsole, []);

  await trustNavigation.getByRole('link', { name: /Trasparenza/ }).click();
  await desktopPage.getByRole('heading', { level: 1, name: trustPages[1].heading }).waitFor();
  assert.equal(new URL(desktopPage.url()).pathname, '/trasparenza');
  await desktopContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  const mobileConsole = [];
  mobilePage.on('console', (message) => {
    if (message.type() === 'error') mobileConsole.push(message.text());
  });
  await mobilePage.goto(`${origin}/privacy`);
  await mobilePage.getByRole('heading', { level: 1, name: trustPages[2].heading }).waitFor();
  const menuSummary = mobilePage.getByText('Apri menu', { exact: true });
  await menuSummary.click();
  const mobileMethod = mobilePage.getByRole('navigation', { name: 'Navigazione mobile' }).getByRole('link', { name: 'Metodo' });
  assert.equal(await mobileMethod.getAttribute('href'), '/metodo');
  assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  assert.equal(await mobilePage.locator('script').count(), 0);
  assert.deepEqual(mobileConsole, []);
  await mobileContext.close();

  console.log('Public trust-page preview and active canonical Astro smoke passed.');
} catch (error) {
  console.error(logs.join(''));
  throw error;
} finally {
  if (browser) await browser.close();
  await stopWrangler();
}
