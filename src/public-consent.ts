export type PublicConsentEnvironment = {
  CMP_PROVIDER?: string;
  CMP_SITE_ID?: string;
  CMP_COOKIE_POLICY_ID?: string;
};

export type PublicConsentConfig = Readonly<{
  provider: 'iubenda';
  siteId: string;
  cookiePolicyId: string;
}>;

export type PublicConsentResolution =
  | Readonly<{ kind: 'disabled' }>
  | Readonly<{
      kind: 'invalid';
      reason: 'incomplete' | 'unsupported_provider' | 'invalid_site_id' | 'invalid_cookie_policy_id';
    }>
  | Readonly<{ kind: 'enabled'; config: PublicConsentConfig }>;

const PUBLIC_ID_PATTERN = /^[1-9][0-9]{0,15}$/;

export const IUBENDA_SCRIPT_URL = 'https://cdn.iubenda.com/cs/iubenda_cs.js';

function normalized(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function resolvePublicConsentConfig(env: PublicConsentEnvironment): PublicConsentResolution {
  const provider = normalized(env.CMP_PROVIDER).toLowerCase();
  const siteId = normalized(env.CMP_SITE_ID);
  const cookiePolicyId = normalized(env.CMP_COOKIE_POLICY_ID);

  if (!provider && !siteId && !cookiePolicyId) return Object.freeze({ kind: 'disabled' });
  if (!provider || !siteId || !cookiePolicyId) return Object.freeze({ kind: 'invalid', reason: 'incomplete' });
  if (provider !== 'iubenda') return Object.freeze({ kind: 'invalid', reason: 'unsupported_provider' });
  if (!PUBLIC_ID_PATTERN.test(siteId)) return Object.freeze({ kind: 'invalid', reason: 'invalid_site_id' });
  if (!PUBLIC_ID_PATTERN.test(cookiePolicyId)) {
    return Object.freeze({ kind: 'invalid', reason: 'invalid_cookie_policy_id' });
  }

  return Object.freeze({
    kind: 'enabled',
    config: Object.freeze({ provider: 'iubenda', siteId, cookiePolicyId }),
  });
}

export function iubendaAutoblockingUrl(config: PublicConsentConfig): string {
  return `https://cs.iubenda.com/autoblocking/${config.siteId}.js`;
}

function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

export function serializeIubendaBootstrap(config: PublicConsentConfig): string {
  const iubendaConfiguration = {
    askConsentAtCookiePolicyUpdate: true,
    banner: {
      acceptButtonDisplay: true,
      closeButtonDisplay: false,
      customizeButtonDisplay: true,
      explicitWithdrawal: true,
      listPurposes: true,
      position: 'float-top-center',
      rejectButtonDisplay: true,
    },
    cookiePolicyId: Number(config.cookiePolicyId),
    cookiePolicyInOtherWindow: true,
    countryDetection: false,
    enableGdpr: true,
    floatingPreferencesButtonDisplay: false,
    gdprAppliesGlobally: true,
    googleConsentMode: true,
    lang: 'it',
    perPurposeConsent: true,
    siteId: Number(config.siteId),
  } as const;

  return [
    'var _iub = window._iub = window._iub || [];',
    `_iub.csConfiguration = ${safeJson(iubendaConfiguration)};`,
  ].join('\n');
}
