import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const tempDirectory = await mkdtemp(path.join(tmpdir(), 'senza-roaming-seo-endpoint-contract-'));
const policyPath = path.join(tempDirectory, 'public-route-policy.mjs');
const endpointPath = path.join(tempDirectory, 'public-seo-endpoints.mjs');

function compile(source, fileName) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName,
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.deepEqual(
    errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
    [],
    `${fileName} must transpile without diagnostics.`,
  );
  return result.outputText;
}

function fakeDb(results) {
  return {
    prepare(sql) {
      assert.match(sql, /WHERE status='published'/);
      assert.match(sql, /ORDER BY slug ASC/);
      assert.match(sql, /LIMIT \?/);
      return {
        bind(limit) {
          assert.equal(Number.isInteger(limit), true);
          assert.ok(limit > 0);
          return {
            async all() {
              return { results };
            },
          };
        },
      };
    },
  };
}

try {
  const [policySource, endpointSource] = await Promise.all([
    readFile('src/public-route-policy.ts', 'utf8'),
    readFile('src/public-seo-endpoints.ts', 'utf8'),
  ]);
  await writeFile(policyPath, compile(policySource, 'src/public-route-policy.ts'), 'utf8');
  const endpointModule = compile(endpointSource, 'src/public-seo-endpoints.ts')
    .replace("from './public-route-policy';", "from './public-route-policy.mjs';");
  await writeFile(endpointPath, endpointModule, 'utf8');

  const endpoints = await import(`${pathToFileURL(endpointPath).href}?v=${Date.now()}`);
  const {
    canonicalPublicSiteBase,
    escapePublicXml,
    loadPublicSitemapEntries,
    publicRobotsDocument,
    publicRobotsResponse,
    publicSitemapLastmod,
    publicSitemapResponse,
    serializePublicSitemap,
  } = endpoints;

  assert.equal(canonicalPublicSiteBase('https://senzaroaming.it/'), 'https://senzaroaming.it');
  for (const value of [
    'http://senzaroaming.it',
    'https://senzaroaming.it/path',
    'https://senzaroaming.it?query=1',
    '/relative',
  ]) {
    assert.throws(() => canonicalPublicSiteBase(value));
  }

  assert.equal(publicSitemapLastmod('2099-03-04'), '2099-03-04');
  assert.equal(publicSitemapLastmod('2099-03-04 12:30:00'), '2099-03-04');
  assert.equal(publicSitemapLastmod('2099-03-04T12:30:00Z'), '2099-03-04');
  assert.equal(publicSitemapLastmod('2099-03-04T12:30:00+02:00'), '2099-03-04');
  for (const value of ['2099-02-30', 'not-a-date', '', null]) {
    assert.throws(() => publicSitemapLastmod(value));
  }

  assert.equal(
    escapePublicXml(`&<>"'`),
    '&amp;&lt;&gt;&quot;&apos;',
  );

  const entries = await loadPublicSitemapEntries(fakeDb([
    { slug: 'alpha-guide', updated_at: '2099-01-02 10:00:00' },
    { slug: 'provider-page', updated_at: '2099-01-03T10:00:00Z' },
  ]), 'https://senzaroaming.it');
  assert.equal(entries.length, 9);
  assert.deepEqual(
    entries.slice(0, 7).map((entry) => entry.loc),
    [
      'https://senzaroaming.it/',
      'https://senzaroaming.it/destinazioni',
      'https://senzaroaming.it/guide',
      'https://senzaroaming.it/confronti',
      'https://senzaroaming.it/metodo',
      'https://senzaroaming.it/trasparenza',
      'https://senzaroaming.it/privacy',
    ],
  );
  assert.deepEqual(entries.slice(7), [
    { loc: 'https://senzaroaming.it/alpha-guide', lastmod: '2099-01-02' },
    { loc: 'https://senzaroaming.it/provider-page', lastmod: '2099-01-03' },
  ]);
  assert.equal(Object.isFrozen(entries), true);

  const sitemap = serializePublicSitemap(entries);
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  assert.match(sitemap, /<loc>https:\/\/senzaroaming\.it\/alpha-guide<\/loc><lastmod>2099-01-02<\/lastmod>/);
  assert.equal((sitemap.match(/<url>/g) || []).length, 9);
  assert.doesNotMatch(sitemap, /astro-foundation|control-room|\/api\/|\/go\/|\/404/);

  assert.throws(() => serializePublicSitemap([{ loc: 'http://example.test/insecure' }]));
  assert.throws(() => serializePublicSitemap([{ loc: 'https://example.test/path?query=1' }]));
  assert.throws(() => serializePublicSitemap([{ loc: 'https://example.test/path#fragment' }]));

  for (const results of [
    [{ slug: 'robots.txt', updated_at: '2099-01-01' }],
    [{ slug: '.env', updated_at: '2099-01-01' }],
    [{ slug: 'valid-slug', updated_at: 'not-a-date' }],
    [
      { slug: 'duplicate-slug', updated_at: '2099-01-01' },
      { slug: 'duplicate-slug', updated_at: '2099-01-02' },
    ],
  ]) {
    await assert.rejects(() => loadPublicSitemapEntries(fakeDb(results), 'https://senzaroaming.it'));
  }

  const validResponse = await publicSitemapResponse(fakeDb([
    { slug: 'valid-slug', updated_at: '2099-01-01' },
  ]), 'https://senzaroaming.it');
  assert.equal(validResponse.status, 200);
  assert.equal(validResponse.headers.get('content-type'), 'application/xml;charset=UTF-8');
  assert.equal(validResponse.headers.get('cache-control'), 'public,max-age=3600');
  assert.match(await validResponse.text(), /valid-slug/);

  const invalidResponse = await publicSitemapResponse(fakeDb([
    { slug: 'config.json', updated_at: '2099-01-01' },
  ]), 'https://senzaroaming.it');
  assert.equal(invalidResponse.status, 500);
  assert.equal(invalidResponse.headers.get('cache-control'), 'no-store');
  const invalidBody = await invalidResponse.text();
  assert.equal(invalidBody, 'Errore interno');
  assert.doesNotMatch(invalidBody, /config\.json|urlset|<url>/);

  const robots = 'User-agent: *\nAllow: /\nDisallow: /go/\nDisallow: /control-room\nDisallow: /api/maintenance/\nSitemap: https://senzaroaming.it/sitemap.xml\n';
  assert.equal(publicRobotsDocument('https://senzaroaming.it/'), robots);
  assert.doesNotMatch(robots, /astro-foundation|control-room-foundation|token|secret/i);
  const robotsResponse = publicRobotsResponse('https://senzaroaming.it');
  assert.equal(robotsResponse.status, 200);
  assert.equal(robotsResponse.headers.get('content-type'), 'text/plain;charset=UTF-8');
  assert.equal(robotsResponse.headers.get('cache-control'), 'public,max-age=3600');
  assert.equal(await robotsResponse.text(), robots);

  console.log('Public SEO endpoint contract smoke passed: builders are deterministic, published-only and fail-closed.');
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}
