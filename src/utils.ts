import type { Env } from './types';

const escapeMap: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
};

export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => escapeMap[character] ?? character);
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function siteBase(env: Env): string {
  return (env.SITE_URL || 'https://example.com').replace(/\/$/, '');
}

export function affiliateLinks(env: Env): Record<string, string> {
  if (env.AFFILIATE_MODE !== 'enabled' || !env.AFFILIATE_LINKS_JSON) return {};
  const raw = safeJsonParse<Record<string, unknown>>(env.AFFILIATE_LINKS_JSON, {});
  const links: Record<string, string> = {};
  for (const [provider, value] of Object.entries(raw)) {
    if (typeof value !== 'string') continue;
    try {
      const url = new URL(value);
      if (url.protocol === 'https:') links[provider] = url.toString();
    } catch {
      // Ignore invalid destinations.
    }
  }
  return links;
}

export function affiliateEnabled(env: Env): boolean {
  return Object.keys(affiliateLinks(env)).length > 0;
}
