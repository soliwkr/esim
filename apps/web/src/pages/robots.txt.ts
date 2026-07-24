import { env } from 'cloudflare:workers';
import { publicRobotsResponse } from '../../../../src/public-seo-endpoints';
import { siteBase } from '../../../../src/utils';

export function GET(): Response {
  return publicRobotsResponse(siteBase(env));
}

export function HEAD(): Response {
  const response = publicRobotsResponse(siteBase(env));
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
