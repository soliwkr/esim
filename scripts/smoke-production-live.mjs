import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { resolveProductionConsentConfig } from './prepare-production-consent-config.mjs';
import { resolveProductionMeasurementConfig } from './prepare-production-measurement-config.mjs';

export const PRODUCTION_CANONICAL_PATHS = Object.freeze([
  '/',
  '/destinazioni',
  '/guide',
  '/confronti',
  '/migliore-esim',
]);

export const PRODUCTION_PREVIEW_PATHS = Object.freeze([
  '/astro-foundation',
  '/astro-foundation/destinazioni',
  '/astro-foundation/guide',
  '/astro-foundation/confronti',
  '/astro-foundation/articoli/migliore-esim',
]);

export const PRODUCTION_SITE_ORIGIN = 'https://senzaroaming.it';

const REVIEW_ONLY_PATHS = Object.freeze([
  '/esim-cina-senza-vpn',
  '/astro-foundation/articoli/esim-cina-senza-vpn',
]);

export const ACCESS_PROTECTED_CONTROL_ROOM_PATHS = Object.freeze([
  '/control-room-foundation',
]);

function contract(condition, message) {
  if (!condition) throw new Error(message);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function occurrenceCount(value, pattern) {
  return value.match(pattern)?.length ?? 0;
}

function canonicalUrl(siteOrigin, pathname) {
  return new URL(pathname, `${siteOrigin}/`).toString();
}

export function productionLiveVerificationConfig(environment = process.env) {
  const consent = resolveProductionConsentConfig(environment);
  const measurement = resolveProductionMeasurementConfig(environment);
  return Object.freeze({ consent, measurement });
}

export function normalizeProductionSiteOrigin(value) {
  const url = new URL(value);
  contract(url.protocol === 'https:', 'Production site URL must use HTTPS.');
  contract(!url.username && !url.password, 'Production site URL must not contain credentials.');
  contract(!url.search && !url.hash, 'Production site URL must not contain a query or fragment.');
  contract(url.pathname === '/' || url.pathname === '', 'Production site URL must not contain a path.');
  return url.origin;
}

export function resolveProductionSiteOrigin(value) {
  contract(
    typeof value === 'string' && value.trim().length > 0,
    'SENZA_ROAMING_SITE_URL must be set for the production smoke.',
  );
  const siteOrigin = normalizeProductionSiteOrigin(value);
  contract(
    siteOrigin === PRODUCTION_SITE_ORIGIN,
    `Production smoke origin must be exactly ${PRODUCTION_SITE_ORIGIN}.`,
  );
  return siteOrigin;
}

export function assertCanonicalSnapshot(snapshot, pathname, siteOrigin, verification) {
  contract(snapshot.status === 200, `${pathname} must return HTTP 200.`);
  contract(
    snapshot.headers.get('cache-control')?.includes('public'),
    `${pathname} must use public canonical caching.`,
  );
  contract(
    !snapshot.headers.get('x-robots-tag')?.toLowerCase().includes('noindex'),
    `${pathname} must not be noindex.`,
  );

  const expectedCanonical = canonicalUrl(siteOrigin, pathname);
  const canonicalPattern = new RegExp(
    `<link[^>]+rel=["']canonical["'][^>]+href=["']${escapeRegExp(expectedCanonical)}["']`,
    'i',
  );
  contract(canonicalPattern.test(snapshot.body), `${pathname} must expose its canonical URL.`);
  contract(
    !/href=["']\/astro-foundation(?:\/|["'])/i.test(snapshot.body),
    `${pathname} must not link into the preview namespace.`,
  );

  const embedUrl = `https://embeds.iubenda.com/widgets/${verification.consent.embedId}.js`;
  contract(
    occurrenceCount(snapshot.body, new RegExp(escapeRegExp(embedUrl), 'g')) === 1,
    `${pathname} must contain exactly one configured CMP embed.`,
  );

  const blockedMeasurementScripts =
    snapshot.body.match(
      /<script(?=[^>]*type=["']text\/plain["'])(?=[^>]*class=["']_iub_cs_activate["'])(?=[^>]*data-iub-purposes=["']4["'])[^>]*>[\s\S]*?<\/script>/gi,
    ) ?? [];
  contract(
    blockedMeasurementScripts.length === 1,
    `${pathname} must contain exactly one consent-gated measurement bootstrap.`,
  );
  const measurementScript = blockedMeasurementScripts[0];
  contract(
    measurementScript.includes(`"gtm_id":"${verification.measurement.gtmId}"`),
    `${pathname} must use the configured GTM container.`,
  );
  contract(
    measurementScript.includes(
      `"ga4_measurement_id":"${verification.measurement.ga4MeasurementId}"`,
    ),
    `${pathname} must use the configured GA4 stream.`,
  );
  contract(
    measurementScript.includes('sr_page_view_ready'),
    `${pathname} must preserve the bounded page-view readiness event.`,
  );
  contract(
    snapshot.body.indexOf(embedUrl) < snapshot.body.indexOf(measurementScript),
    `${pathname} must load the CMP before the inert measurement bootstrap.`,
  );
  contract(
    !/<script[^>]+src=["'][^"']*googletagmanager\.com/i.test(snapshot.body),
    `${pathname} must not load GTM before consent.`,
  );
  contract(
    !/<noscript[^>]*>[\s\S]*googletagmanager/i.test(snapshot.body),
    `${pathname} must not contain a pre-consent GTM noscript fallback.`,
  );

  if (pathname === '/migliore-esim') {
    contract(
      /i link ai provider non sono attualmente remunerati/i.test(snapshot.body),
      '/migliore-esim must keep the disabled-affiliation disclosure.',
    );
  }
}

export function assertPreviewSnapshot(snapshot, pathname, siteOrigin, verification) {
  contract(snapshot.status === 200, `${pathname} must return HTTP 200.`);
  contract(
    snapshot.headers.get('cache-control')?.toLowerCase().includes('no-store'),
    `${pathname} must be no-store.`,
  );
  contract(
    snapshot.headers.get('x-robots-tag')?.toLowerCase().includes('noindex'),
    `${pathname} must be noindex.`,
  );
  contract(
    snapshot.headers.get('x-robots-tag')?.toLowerCase().includes('nofollow'),
    `${pathname} must be nofollow.`,
  );
  contract(
    /<meta(?=[^>]*name=["']robots["'])(?=[^>]*content=["'][^"']*noindex[^"']*["'])[^>]*>/i.test(
      snapshot.body,
    ),
    `${pathname} must expose noindex in its robots meta.`,
  );
  contract(
    /<meta(?=[^>]*name=["']robots["'])(?=[^>]*content=["'][^"']*nofollow[^"']*["'])[^>]*>/i.test(
      snapshot.body,
    ),
    `${pathname} must expose nofollow in its robots meta.`,
  );

  const expectedCanonical = canonicalUrl(siteOrigin, pathname);
  const canonicalPattern = new RegExp(
    `<link[^>]+rel=["']canonical["'][^>]+href=["']${escapeRegExp(expectedCanonical)}["']`,
    'i',
  );
  contract(canonicalPattern.test(snapshot.body), `${pathname} must self-canonicalize.`);
  contract(
    !snapshot.body.includes('embeds.iubenda.com/widgets/'),
    `${pathname} must exclude the CMP.`,
  );
  contract(
    !snapshot.body.includes('_iub_cs_activate') &&
      !snapshot.body.includes(verification.measurement.gtmId) &&
      !snapshot.body.includes(verification.measurement.ga4MeasurementId),
    `${pathname} must exclude measurement.`,
  );
}

export function assertSitemapSnapshot(snapshot, siteOrigin) {
  contract(snapshot.status === 200, '/sitemap.xml must return HTTP 200.');
  contract(
    snapshot.headers.get('content-type')?.toLowerCase().includes('xml'),
    '/sitemap.xml must return XML.',
  );
  for (const pathname of PRODUCTION_CANONICAL_PATHS) {
    const location = `<loc>${canonicalUrl(siteOrigin, pathname)}</loc>`;
    contract(snapshot.body.includes(location), `/sitemap.xml must include ${pathname}.`);
  }
  contract(
    !/astro-foundation|control-room|esim-cina-senza-vpn|\/api\/|\/go\//i.test(snapshot.body),
    '/sitemap.xml must contain only publishable canonical routes.',
  );
}

export function assertRobotsSnapshot(snapshot, siteOrigin) {
  contract(snapshot.status === 200, '/robots.txt must return HTTP 200.');
  contract(
    snapshot.headers.get('content-type')?.toLowerCase().includes('text/plain'),
    '/robots.txt must return text.',
  );
  contract(
    snapshot.body.includes(`Sitemap: ${canonicalUrl(siteOrigin, '/sitemap.xml')}`),
    '/robots.txt must declare the canonical sitemap.',
  );
  contract(/Disallow:\s*\/control-room/i.test(snapshot.body), '/robots.txt must protect Control Room.');
  contract(/Disallow:\s*\/api\//i.test(snapshot.body), '/robots.txt must protect maintenance APIs.');
}

async function responseSnapshot(fetchImpl, url, options) {
  const response = await fetchImpl(url, options);
  return Object.freeze({
    status: response.status,
    headers: response.headers,
    body: await response.text(),
  });
}

export async function verifyProductionLive({
  siteOrigin,
  verification,
  fetchImpl = fetch,
}) {
  for (const pathname of PRODUCTION_CANONICAL_PATHS) {
    const snapshot = await responseSnapshot(fetchImpl, canonicalUrl(siteOrigin, pathname));
    assertCanonicalSnapshot(snapshot, pathname, siteOrigin, verification);
  }

  for (const pathname of PRODUCTION_PREVIEW_PATHS) {
    const snapshot = await responseSnapshot(fetchImpl, canonicalUrl(siteOrigin, pathname));
    assertPreviewSnapshot(snapshot, pathname, siteOrigin, verification);
  }

  for (const pathname of REVIEW_ONLY_PATHS) {
    const snapshot = await responseSnapshot(fetchImpl, canonicalUrl(siteOrigin, pathname));
    contract(snapshot.status === 404, `${pathname} must remain hidden until published.`);
  }

  assertSitemapSnapshot(
    await responseSnapshot(fetchImpl, canonicalUrl(siteOrigin, '/sitemap.xml')),
    siteOrigin,
  );
  assertRobotsSnapshot(
    await responseSnapshot(fetchImpl, canonicalUrl(siteOrigin, '/robots.txt')),
    siteOrigin,
  );

  for (const pathname of ACCESS_PROTECTED_CONTROL_ROOM_PATHS) {
    const controlRoom = await responseSnapshot(
      fetchImpl,
      canonicalUrl(siteOrigin, pathname),
      { redirect: 'manual' },
    );
    contract(
      [302, 401, 403].includes(controlRoom.status),
      `${pathname} must reject anonymous requests.`,
    );
  }
}

export async function verifyProductionConsentGating({
  siteOrigin,
  verification,
  chromiumLauncher = chromium,
}) {
  const browser = await chromiumLauncher.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    const googleRequests = [];
    let cmpRequests = 0;

    page.on('request', (request) => {
      if (/google-analytics|googletagmanager|doubleclick|googleadservices/i.test(request.url())) {
        googleRequests.push(request.url());
      }
    });
    await page.route('https://embeds.iubenda.com/widgets/**', async (route) => {
      cmpRequests += 1;
      await route.fulfill({
        contentType: 'application/javascript',
        body: `
          window.__srProductionCmpSmokeLoaded = true;
          window.__srGrantMeasurementConsent = function () {
            var blocked = document.querySelector(
              'script._iub_cs_activate[type="text/plain"][data-iub-purposes="4"]'
            );
            if (!blocked) throw new Error('Consent-gated measurement bootstrap is missing.');
            var active = document.createElement('script');
            active.textContent = blocked.textContent;
            blocked.after(active);
          };
          document.addEventListener('click', function (event) {
            var link = event.target.closest && event.target.closest('.iubenda-cs-preferences-link');
            if (!link) return;
            event.preventDefault();
            var dialog = document.createElement('div');
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-label', 'Preferenze cookie smoke');
            document.body.appendChild(dialog);
          });
        `,
      });
    });
    await page.route('https://www.googletagmanager.com/gtm.js**', async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: 'window.__srProductionGtmSmokeLoaded=(window.__srProductionGtmSmokeLoaded||0)+1;',
      });
    });

    await page.goto(`${siteOrigin}/?sr_production_smoke=1#consent`);
    await page.locator('main h1').waitFor();
    await page.waitForFunction(() => window.__srProductionCmpSmokeLoaded === true);

    contract(cmpRequests === 1, 'The configured CMP must load exactly once.');
    contract(googleRequests.length === 0, 'Measurement must not load before consent.');
    contract(
      (await page.locator(
        'script._iub_cs_activate[type="text/plain"][data-iub-purposes="4"]',
      ).count()) === 1,
      'The consent-gated measurement bootstrap must remain inert before consent.',
    );
    contract(
      (await page.locator('.iubenda-cs-preferences-link').count()) >= 1,
      'The CMP preferences control must be present.',
    );

    await page.locator('.iubenda-cs-preferences-link').first().click();
    await page.getByRole('dialog', { name: 'Preferenze cookie smoke' }).waitFor();
    contract(googleRequests.length === 0, 'Opening CMP preferences must not enable measurement.');

    await page.evaluate(() => window.__srGrantMeasurementConsent());
    await page.waitForFunction(() => window.__srProductionGtmSmokeLoaded === 1);
    contract(googleRequests.length === 1, 'Consent must activate GTM exactly once.');
    contract(
      new URL(googleRequests[0]).searchParams.get('id') === verification.measurement.gtmId,
      'Consent must activate the configured GTM container.',
    );

    const measurementState = await page.evaluate(() => ({
      loaded: window.__SENZA_ROAMING_MEASUREMENT_V1__,
      dataLayer: window.dataLayer,
    }));
    contract(measurementState.loaded === true, 'The measurement bootstrap must initialize.');
    const context = measurementState.dataLayer?.find((entry) => entry.sr_ga4_measurement_id);
    contract(
      context?.sr_ga4_measurement_id === verification.measurement.ga4MeasurementId,
      'The configured GA4 stream must be present in the bounded context.',
    );
    contract(
      context?.page_location === `${siteOrigin}/`,
      'Measurement page_location must exclude query strings and fragments.',
    );
    contract(
      measurementState.dataLayer?.filter((entry) => entry.event === 'sr_page_view_ready').length === 1,
      'Consent must emit exactly one bounded page-view readiness event.',
    );

    await page.evaluate(() => window.__srGrantMeasurementConsent());
    await page.waitForTimeout(100);
    contract(googleRequests.length === 1, 'Repeated activation must not reload GTM.');
    contract(
      (await page.evaluate(
        () => window.dataLayer?.filter((entry) => entry.event === 'sr_page_view_ready').length,
      )) === 1,
      'Repeated activation must not duplicate the page-view readiness event.',
    );
  } finally {
    await browser.close();
  }
}

async function main() {
  const siteOrigin = resolveProductionSiteOrigin(process.env.SENZA_ROAMING_SITE_URL);
  const verification = productionLiveVerificationConfig();
  const attempts = 36;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await verifyProductionLive({ siteOrigin, verification });
      await verifyProductionConsentGating({ siteOrigin, verification });
      console.log('Production public, preview, SEO, consent and measurement smoke passed.');
      return;
    } catch (error) {
      if (attempt === attempts) {
        throw new Error(`Production live smoke failed after ${attempts} attempts.`, {
          cause: error,
        });
      }
      console.log(`Production live smoke attempt ${attempt}/${attempts} did not pass yet.`);
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
