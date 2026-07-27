import type { PublicConsentResolution } from './public-consent';

export type PublicMeasurementEnvironment = {
  GTM_ID?: string;
  GA4_MEASUREMENT_ID?: string;
};

export type PublicMeasurementConfig = Readonly<{
  gtmId: string;
  ga4MeasurementId: string;
}>;

export type PublicMeasurementResolution =
  | Readonly<{ kind: 'disabled' }>
  | Readonly<{
      kind: 'invalid';
      reason: 'incomplete' | 'invalid_gtm_id' | 'invalid_ga4_measurement_id' | 'consent_unavailable';
    }>
  | Readonly<{ kind: 'enabled'; config: PublicMeasurementConfig }>;

export type PublicMeasurementRouteClass = 'home' | 'listing' | 'trust' | 'article';

export type PublicMeasurementPageType =
  | 'home'
  | 'destination_listing'
  | 'guide_listing'
  | 'comparison_listing'
  | 'method'
  | 'transparency'
  | 'privacy'
  | 'destination'
  | 'guide'
  | 'comparison';

export type PublicMeasurementPageContextInput = Readonly<{
  routeClass: string;
  pageType: string;
  contentSlug?: string;
}>;

export type PublicMeasurementPageContext = Readonly<{
  routeClass: PublicMeasurementRouteClass;
  pageType: PublicMeasurementPageType;
  contentSlug: string;
  renderMode: 'canonical';
  siteLanguage: 'it';
}>;

export type PublicMeasurementPageContextResolution =
  | Readonly<{ kind: 'invalid'; reason: 'invalid_route_class' | 'invalid_page_type' | 'invalid_combination' | 'invalid_content_slug' }>
  | Readonly<{ kind: 'enabled'; context: PublicMeasurementPageContext }>;

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;
const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;
const CONTENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const PAGE_TYPES_BY_ROUTE_CLASS = Object.freeze({
  home: Object.freeze(['home']),
  listing: Object.freeze(['destination_listing', 'guide_listing', 'comparison_listing']),
  trust: Object.freeze(['method', 'transparency', 'privacy']),
  article: Object.freeze(['destination', 'guide', 'comparison']),
} as const);

function normalized(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function resolvePublicMeasurementConfig(
  env: PublicMeasurementEnvironment,
  consent: PublicConsentResolution,
): PublicMeasurementResolution {
  const gtmId = normalized(env.GTM_ID).toUpperCase();
  const ga4MeasurementId = normalized(env.GA4_MEASUREMENT_ID).toUpperCase();

  if (!gtmId && !ga4MeasurementId) return Object.freeze({ kind: 'disabled' });
  if (!gtmId || !ga4MeasurementId) return Object.freeze({ kind: 'invalid', reason: 'incomplete' });
  if (!GTM_ID_PATTERN.test(gtmId)) return Object.freeze({ kind: 'invalid', reason: 'invalid_gtm_id' });
  if (!GA4_MEASUREMENT_ID_PATTERN.test(ga4MeasurementId)) {
    return Object.freeze({ kind: 'invalid', reason: 'invalid_ga4_measurement_id' });
  }
  if (consent.kind !== 'enabled') return Object.freeze({ kind: 'invalid', reason: 'consent_unavailable' });

  return Object.freeze({
    kind: 'enabled',
    config: Object.freeze({ gtmId, ga4MeasurementId }),
  });
}

export function resolvePublicMeasurementPageContext(
  input: PublicMeasurementPageContextInput,
): PublicMeasurementPageContextResolution {
  const routeClass = normalized(input.routeClass) as PublicMeasurementRouteClass;
  const pageType = normalized(input.pageType) as PublicMeasurementPageType;
  const contentSlug = normalized(input.contentSlug);

  if (!(routeClass in PAGE_TYPES_BY_ROUTE_CLASS)) {
    return Object.freeze({ kind: 'invalid', reason: 'invalid_route_class' });
  }

  const allowedPageTypes = PAGE_TYPES_BY_ROUTE_CLASS[routeClass] as readonly string[];
  const knownPageType = Object.values(PAGE_TYPES_BY_ROUTE_CLASS).some((types) =>
    (types as readonly string[]).includes(pageType),
  );
  if (!knownPageType) return Object.freeze({ kind: 'invalid', reason: 'invalid_page_type' });
  if (!allowedPageTypes.includes(pageType)) {
    return Object.freeze({ kind: 'invalid', reason: 'invalid_combination' });
  }

  if (routeClass === 'article') {
    if (!CONTENT_SLUG_PATTERN.test(contentSlug)) {
      return Object.freeze({ kind: 'invalid', reason: 'invalid_content_slug' });
    }
  } else if (contentSlug) {
    return Object.freeze({ kind: 'invalid', reason: 'invalid_content_slug' });
  }

  return Object.freeze({
    kind: 'enabled',
    context: Object.freeze({
      routeClass,
      pageType,
      contentSlug,
      renderMode: 'canonical',
      siteLanguage: 'it',
    }),
  });
}

function serializeInlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    const codePoint = character.codePointAt(0);
    return codePoint === undefined ? '' : `\\u${codePoint.toString(16).padStart(4, '0')}`;
  });
}

export function publicMeasurementBootstrapScript(
  config: PublicMeasurementConfig,
  context: PublicMeasurementPageContext,
): string {
  const payload = serializeInlineJson({
    gtm_id: config.gtmId,
    ga4_measurement_id: config.ga4MeasurementId,
    event_schema_version: '1',
    route_class: context.routeClass,
    page_type: context.pageType,
    content_slug: context.contentSlug,
    render_mode: context.renderMode,
    site_language: context.siteLanguage,
  });

  return `(function(w,d,s,l,c){if(w.__SENZA_ROAMING_MEASUREMENT_V1__)return;w.__SENZA_ROAMING_MEASUREMENT_V1__=true;c.page_location=w.location.origin+w.location.pathname;w[l]=w[l]||[];w[l].push({sr_ga4_measurement_id:c.ga4_measurement_id,route_class:c.route_class,page_type:c.page_type,content_slug:c.content_slug,render_mode:c.render_mode,site_language:c.site_language,page_location:c.page_location});w[l].push({'gtm.start':Date.now(),event:'gtm.js'});var j=d.createElement(s),f=d.getElementsByTagName(s)[0];j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(c.gtm_id);f.parentNode.insertBefore(j,f);w[l].push({event:'sr_page_view_ready',event_schema_version:c.event_schema_version,route_class:c.route_class,page_type:c.page_type,content_slug:c.content_slug,render_mode:c.render_mode,site_language:c.site_language,page_location:c.page_location});})(window,document,'script','dataLayer',${payload});`;
}
