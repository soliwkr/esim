export type PublicConsentEnvironment = {
  CMP_PROVIDER?: string;
  CMP_EMBED_ID?: string;
};

export type PublicConsentConfig = Readonly<{
  provider: 'iubenda';
  embedId: string;
}>;

export type PublicConsentResolution =
  | Readonly<{ kind: 'disabled' }>
  | Readonly<{
      kind: 'invalid';
      reason: 'incomplete' | 'unsupported_provider' | 'invalid_embed_id';
    }>
  | Readonly<{ kind: 'enabled'; config: PublicConsentConfig }>;

const IUBENDA_EMBED_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const IUBENDA_EMBED_ORIGIN = 'https://embeds.iubenda.com/widgets';

function normalized(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function resolvePublicConsentConfig(env: PublicConsentEnvironment): PublicConsentResolution {
  const provider = normalized(env.CMP_PROVIDER).toLowerCase();
  const embedId = normalized(env.CMP_EMBED_ID).toLowerCase();

  if (!provider && !embedId) return Object.freeze({ kind: 'disabled' });
  if (!provider || !embedId) return Object.freeze({ kind: 'invalid', reason: 'incomplete' });
  if (provider !== 'iubenda') return Object.freeze({ kind: 'invalid', reason: 'unsupported_provider' });
  if (!IUBENDA_EMBED_ID_PATTERN.test(embedId)) {
    return Object.freeze({ kind: 'invalid', reason: 'invalid_embed_id' });
  }

  return Object.freeze({
    kind: 'enabled',
    config: Object.freeze({ provider: 'iubenda', embedId }),
  });
}

export function iubendaEmbedUrl(config: PublicConsentConfig): string {
  return `${IUBENDA_EMBED_ORIGIN}/${config.embedId}.js`;
}
