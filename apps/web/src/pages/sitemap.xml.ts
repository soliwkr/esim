import { env } from 'cloudflare:workers';
import { publicSitemapResponse } from '../../../../src/public-seo-endpoints';
import { siteBase } from '../../../../src/utils';

export async function GET(): Promise<Response> {
  return publicSitemapResponse(env.DB, siteBase(env));
}

export async function HEAD(): Promise<Response> {
  const response = await publicSitemapResponse(env.DB, siteBase(env));
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
