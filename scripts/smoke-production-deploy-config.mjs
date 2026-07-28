import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyProductionDeployPreflight } from './preflight-production-deploy.mjs';
import {
  applyProductionConsentConfig,
  resolveProductionConsentConfig,
} from './prepare-production-consent-config.mjs';
import {
  D1_DATABASE_ID_PLACEHOLDER,
  applyProductionD1Binding,
  resolveProductionD1DatabaseId,
} from './prepare-production-d1-binding.mjs';
import {
  applyProductionMeasurementConfig,
  resolveProductionMeasurementConfig,
} from './prepare-production-measurement-config.mjs';
import {
  PRODUCTION_CANONICAL_PATHS,
  PRODUCTION_PREVIEW_PATHS,
  PRODUCTION_SITE_ORIGIN,
  normalizeProductionSiteOrigin,
  resolveProductionSiteOrigin,
  verifyProductionLive,
} from './smoke-production-live.mjs';

const databaseId = '11111111-2222-3333-4444-555555555555';
const otherDatabaseId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const consentEmbedId = '11111111-2222-4333-8444-555555555555';
const gtmId = 'GTM-TEST123';
const ga4MeasurementId = 'G-TEST123';

assert.equal(
  resolveProductionD1DatabaseId([
    { name: 'another-database', uuid: otherDatabaseId },
    { name: 'senza-roaming', uuid: databaseId },
  ]),
  databaseId,
);

assert.equal(
  resolveProductionD1DatabaseId({ result: [{ name: 'senza-roaming', uuid: databaseId }] }),
  databaseId,
);

assert.throws(() => resolveProductionD1DatabaseId([]), /found 0/);
assert.throws(
  () =>
    resolveProductionD1DatabaseId([
      { name: 'senza-roaming', uuid: databaseId },
      { name: 'senza-roaming', uuid: otherDatabaseId },
    ]),
  /found 2/,
);
assert.throws(
  () => resolveProductionD1DatabaseId([{ name: 'senza-roaming', uuid: 'not-a-uuid' }]),
  /valid UUID/,
);

const original = {
  name: 'senza-roaming',
  vars: { CMP_PROVIDER: 'iubenda', GTM_ID: '' },
  d1_databases: [
    {
      binding: 'DB',
      database_name: 'senza-roaming',
      database_id: D1_DATABASE_ID_PLACEHOLDER,
      migrations_dir: 'migrations',
    },
  ],
};

const configured = applyProductionD1Binding(original, databaseId);
assert.equal(configured.d1_databases[0].database_id, databaseId);
assert.equal(original.d1_databases[0].database_id, D1_DATABASE_ID_PLACEHOLDER);
assert.notEqual(configured, original);
assert.deepEqual(configured.vars, original.vars);

assert.equal(
  applyProductionD1Binding(
    {
      ...original,
      d1_databases: [{ ...original.d1_databases[0], database_id: databaseId }],
    },
    databaseId,
  ).d1_databases[0].database_id,
  databaseId,
);

assert.throws(() => applyProductionD1Binding(original, 'invalid'), /valid UUID/);
assert.throws(
  () =>
    applyProductionD1Binding(
      {
        ...original,
        d1_databases: [{ ...original.d1_databases[0], database_id: otherDatabaseId }],
      },
      databaseId,
    ),
  /unexpected database_id/,
);
assert.throws(
  () => applyProductionD1Binding({ ...original, d1_databases: [] }, databaseId),
  /found 0/,
);
assert.throws(
  () =>
    applyProductionD1Binding(
      {
        ...original,
        d1_databases: [original.d1_databases[0], structuredClone(original.d1_databases[0])],
      },
      databaseId,
    ),
  /found 2/,
);

const sourceConfig = {
  vars: {
    CMP_PROVIDER: '',
    CMP_EMBED_ID: '',
    GTM_ID: '',
    GA4_MEASUREMENT_ID: '',
    AFFILIATE_MODE: 'disabled',
  },
};
const productionEnvironment = {
  CMP_PROVIDER: 'iubenda',
  CMP_EMBED_ID: consentEmbedId,
  GTM_ID: gtmId,
  GA4_MEASUREMENT_ID: ga4MeasurementId,
};
const productionConsent = resolveProductionConsentConfig(productionEnvironment);
const productionMeasurement = resolveProductionMeasurementConfig(productionEnvironment);

assert.deepEqual(verifyProductionDeployPreflight(sourceConfig, productionEnvironment), {
  affiliateMode: 'disabled',
});
assert.throws(
  () => verifyProductionDeployPreflight(sourceConfig, {}),
  /configuration is incomplete/,
);
assert.throws(
  () =>
    verifyProductionDeployPreflight(
      { vars: { ...sourceConfig.vars, AFFILIATE_MODE: 'enabled' } },
      productionEnvironment,
    ),
  /AFFILIATE_MODE=disabled/,
);

const consentConfig = applyProductionConsentConfig(sourceConfig, productionConsent);
const measurementConfig = applyProductionMeasurementConfig(
  consentConfig,
  productionMeasurement,
  productionConsent,
);
assert.equal(measurementConfig.vars.CMP_PROVIDER, 'iubenda');
assert.equal(measurementConfig.vars.CMP_EMBED_ID, consentEmbedId);
assert.equal(measurementConfig.vars.GTM_ID, gtmId);
assert.equal(measurementConfig.vars.GA4_MEASUREMENT_ID, ga4MeasurementId);
assert.equal(measurementConfig.vars.AFFILIATE_MODE, 'disabled');
assert.equal(sourceConfig.vars.CMP_PROVIDER, '');
assert.equal(sourceConfig.vars.GTM_ID, '');

const workflow = await readFile('.github/workflows/deploy-production.yml', 'utf8');
const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const workflowTriggers = workflow.match(/^on:\n((?:(?:[ \t].*)?\n)*)/m)?.[1] ?? '';
assert.match(workflow, /^\s{2}workflow_dispatch:/m);
assert.notEqual(workflowTriggers, '');
assert.doesNotMatch(workflowTriggers, /^  (?!workflow_dispatch:)[a-zA-Z_]+:/m);
assert.doesNotMatch(workflowTriggers, /^\s{4}inputs:/m);
assert.doesNotMatch(workflowTriggers, /\bsite_url\b/);
assert.doesNotMatch(workflow, /\binputs\.site_url\b/);
assert.deepEqual(
  workflow.match(/^  SENZA_ROAMING_SITE_URL:.*$/gm),
  [`  SENZA_ROAMING_SITE_URL: ${PRODUCTION_SITE_ORIGIN}`],
);
assert.match(workflow, /\brun: npm ci\b/);
assert.doesNotMatch(workflow, /\bnpm install\b/);
assert.match(workflow, /playwright install --with-deps chromium/);
assert.match(workflow, /\brun: npm run deploy\b/);
assert.match(workflow, /\brun: npm run smoke:production-live\b/);
assert.match(workflow, /wrangler secret list --name senza-roaming --format json/);
assert.doesNotMatch(workflow, /\bwrangler deploy\b/);
assert.doesNotMatch(
  workflow,
  /\bd1 (?:create|delete|execute|migrations apply)\b|\bdb:migrate:remote\b/,
);
assert.doesNotMatch(workflow, /wrangler\.production\.jsonc/);
for (const variableName of [
  'CLOUDFLARE_ACCOUNT_ID',
  'CMP_PROVIDER',
  'CMP_EMBED_ID',
  'GTM_ID',
  'GA4_MEASUREMENT_ID',
]) {
  assert.match(
    workflow,
    new RegExp(`secrets\\.${variableName}\\s*\\|\\|\\s*vars\\.${variableName}`),
  );
}

const deployScript = packageJson.scripts.deploy;
assert.match(deployScript, /^npm run preflight:production-deploy && npm run build && /);
assert.match(deployScript, /prepare-production-consent-config\.mjs/);
assert.match(deployScript, /prepare-production-measurement-config\.mjs/);
assert.match(deployScript, /prepare-production-d1-binding\.mjs/);
assert.match(deployScript, /wrangler deploy --config apps\/web\/dist\/server\/wrangler\.json$/);
assert.doesNotMatch(deployScript, /\bd1 create\b|\bmigrations apply\b|\bdb:migrate:remote\b/);

assert.equal(normalizeProductionSiteOrigin('https://example.test/'), 'https://example.test');
assert.equal(resolveProductionSiteOrigin(PRODUCTION_SITE_ORIGIN), PRODUCTION_SITE_ORIGIN);
assert.throws(
  () => resolveProductionSiteOrigin('https://example.test'),
  /must be exactly https:\/\/senzaroaming\.it/,
);
assert.throws(() => resolveProductionSiteOrigin(undefined), /must be set/);

const siteOrigin = 'https://example.test';
const verification = { consent: productionConsent, measurement: productionMeasurement };
const responseByPath = new Map();

for (const pathname of PRODUCTION_CANONICAL_PATHS) {
  const expectedCanonical = new URL(pathname, `${siteOrigin}/`).toString();
  const disclosure =
    pathname === '/migliore-esim'
      ? '<p>I link ai provider non sono attualmente remunerati.</p>'
      : '';
  responseByPath.set(
    pathname,
    new Response(
      [
        '<!doctype html><html><head>',
        `<script type="text/javascript" src="https://embeds.iubenda.com/widgets/${consentEmbedId}.js"></script>`,
        `<script type="text/plain" class="_iub_cs_activate" data-iub-purposes="4">`,
        `window.dataLayer=[{"gtm_id":"${gtmId}","ga4_measurement_id":"${ga4MeasurementId}","event":"sr_page_view_ready"}];`,
        '</script>',
        `<link rel="canonical" href="${expectedCanonical}">`,
        '</head><body>',
        disclosure,
        '</body></html>',
      ].join(''),
      { status: 200, headers: { 'cache-control': 'public,max-age=300' } },
    ),
  );
}

for (const pathname of PRODUCTION_PREVIEW_PATHS) {
  const expectedCanonical = new URL(pathname, `${siteOrigin}/`).toString();
  responseByPath.set(
    pathname,
    new Response(
      `<!doctype html><link rel="canonical" href="${expectedCanonical}"><meta name="robots" content="noindex,nofollow">`,
      {
        status: 200,
        headers: {
          'cache-control': 'no-store',
          'x-robots-tag': 'noindex, nofollow',
        },
      },
    ),
  );
}

for (const pathname of [
  '/esim-cina-senza-vpn',
  '/astro-foundation/articoli/esim-cina-senza-vpn',
]) {
  responseByPath.set(pathname, new Response('Not found', { status: 404 }));
}

responseByPath.set(
  '/sitemap.xml',
  new Response(
    [
      '<?xml version="1.0"?>',
      '<urlset>',
      ...PRODUCTION_CANONICAL_PATHS.map(
        (pathname) => `<url><loc>${new URL(pathname, `${siteOrigin}/`)}</loc></url>`,
      ),
      '</urlset>',
    ].join(''),
    { status: 200, headers: { 'content-type': 'application/xml' } },
  ),
);
responseByPath.set(
  '/robots.txt',
  new Response(
    `User-agent: *\nDisallow: /control-room\nDisallow: /api/\nSitemap: ${siteOrigin}/sitemap.xml\n`,
    { status: 200, headers: { 'content-type': 'text/plain' } },
  ),
);
responseByPath.set('/control-room-foundation', new Response('', { status: 403 }));
responseByPath.set('/control-room', new Response('', { status: 302 }));

await verifyProductionLive({
  siteOrigin,
  verification,
  fetchImpl: async (input) => {
    const pathname = new URL(input).pathname;
    const response = responseByPath.get(pathname);
    if (!response) throw new Error(`Unexpected fixture request: ${pathname}`);
    return response.clone();
  },
});

console.log('Production deploy configuration smoke passed.');
