import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';

const port = Number(process.env.PUBLIC_SHELL_SMOKE_PORT || 8797);
const origin = `http://127.0.0.1:${port}`;
const configPath = 'apps/web/dist/server/wrangler.json';
const logs = [];

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
  throw new Error('Timed out waiting for the public-shell workerd runtime.');
}

const wrangler = spawn(
  process.execPath,
  [
    'node_modules/wrangler/bin/wrangler.js',
    'dev',
    '--config', configPath,
    '--persist-to', '.wrangler/state',
    '--port', String(port),
    '--ip', '127.0.0.1'
  ],
  {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: 'public-shell-smoke-token',
      AI_GATEWAY_TOKEN: 'public-shell-smoke-ai-token',
      ASTRO_TELEMETRY_DISABLED: '1'
    },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe']
  }
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
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000))
  ]);
  if (graceful) return;
  signalWrangler('SIGKILL');
  await Promise.race([
    once(wrangler, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 5_000))
  ]);
}

let browser;

try {
  await waitForRuntime(wrangler);

  const previewResponse = await fetch(`${origin}/astro-foundation`);
  const previewHtml = await previewResponse.text();
  assert.equal(previewResponse.status, 200);
  assert.match(previewResponse.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(previewResponse.headers.get('cache-control') || '', /no-store/);
  assert.match(previewResponse.headers.get('x-content-type-options') || '', /nosniff/);
  assert.match(previewHtml, /data-public-shell="astro-preview"/);
  assert.match(previewHtml, /Trova la eSIM giusta prima di partire\./);
  assert.match(previewHtml, /<link rel="canonical" href="https:\/\/senzaroaming\.it\/astro-foundation"/);
  assert.match(previewHtml, /<meta name="robots" content="noindex,nofollow"/);
  assert.match(previewHtml, /aria-label="Navigazione principale"/);
  assert.match(previewHtml, /href="#contenuto">Vai al contenuto/);
  assert.doesNotMatch(previewHtml, /<astro-island/);

  const rootResponse = await fetch(`${origin}/`);
  const rootHtml = await rootResponse.text();
  assert.equal(rootResponse.status, 200);
  assert.doesNotMatch(rootHtml, /data-public-shell="astro-preview"/);
  assert.match(rootHtml, /Trova la eSIM giusta prima di partire\./);

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
  await desktopPage.goto(`${origin}/astro-foundation`);
  await desktopPage.getByRole('heading', { level: 1, name: 'Trova la eSIM giusta prima di partire.' }).waitFor();
  await desktopPage.getByRole('navigation', { name: 'Navigazione principale' }).waitFor();
  await desktopPage.getByRole('heading', { name: 'La pagina arriva dopo le prove.' }).waitFor();
  assert.equal(await desktopPage.locator('astro-island').count(), 0);
  assert.equal(await desktopPage.locator('script').count(), 0);
  await desktopPage.keyboard.press('Tab');
  assert.equal(await desktopPage.evaluate(() => document.activeElement?.textContent?.trim()), 'Vai al contenuto');
  assert.equal(await desktopPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  assert.deepEqual(desktopConsole, []);
  await desktopContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  const mobileConsole = [];
  mobilePage.on('console', (message) => {
    if (message.type() === 'error') mobileConsole.push(message.text());
  });
  await mobilePage.goto(`${origin}/astro-foundation`);
  const menuSummary = mobilePage.getByText('Apri menu', { exact: true });
  await menuSummary.waitFor();
  await menuSummary.click();
  await mobilePage.getByRole('navigation', { name: 'Navigazione mobile' }).getByRole('link', { name: 'Destinazioni' }).waitFor();
  assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  assert.deepEqual(mobileConsole, []);
  await mobileContext.close();

  console.log('Public Astro shell smoke passed.');
} catch (error) {
  console.error(logs.join(''));
  throw error;
} finally {
  if (browser) await browser.close();
  await stopWrangler();
}
