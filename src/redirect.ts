import type { Env, ProviderRow } from './types';
import { affiliateLinks } from './utils';

export async function redirectProvider(env: Env, request: Request, providerSlug: string): Promise<Response> {
  const provider = await env.DB.prepare("SELECT slug,name,official_url,affiliate_disclosure,active FROM providers WHERE slug=? AND active=1").bind(providerSlug).first<ProviderRow>();
  if (!provider) return new Response('Provider non disponibile', { status: 404 });

  const requestUrl = new URL(request.url);
  const links = affiliateLinks(env);
  const target = links[provider.slug] || provider.official_url;
  let destination: URL;
  try {
    destination = new URL(target);
    if (destination.protocol !== 'https:') throw new Error('Protocollo non sicuro');
  } catch {
    return new Response('Destinazione non configurata', { status: 503 });
  }

  await env.DB.prepare("INSERT INTO outbound_clicks(page_slug,provider_slug,placement,monetized) VALUES(?,?,?,?)")
    .bind(requestUrl.searchParams.get('page'), provider.slug, requestUrl.searchParams.get('placement') || 'unknown', links[provider.slug] ? 1 : 0)
    .run();

  return new Response(null, { status: 302, headers: { location: destination.toString(), 'cache-control': 'no-store', 'x-robots-tag': 'noindex,nofollow' } });
}
