import type { Env } from './types';
import { siteBase } from './utils';
import { article, favicon, home, listing, notFound, sitemap, staticPage } from './pages';
import { redirectProvider } from './redirect';
import { maintenanceApi } from './maintenance';
import { recentDemandApi } from './research-router';
import { aiGatewaySmoke } from './ai';
import { editorialAiApi } from './editorial-ai';

export { Last30DaysContainer } from './last30days-container';
export { RecentDemandWorkflow } from './recent-demand-workflow';

function looksLikeFileProbe(path: string): boolean {
  return /(^|\/)\.|(^|\/)[^/]+\.(?:bak|config|env|ini|js|json|log|map|php|properties|py|sql|txt|ya?ml)$/i.test(path);
}

function canonicalHostRedirect(url: URL, env: Env): Response | null {
  let canonical: URL;
  try {
    canonical = new URL(siteBase(env));
  } catch {
    return null;
  }

  if (url.hostname !== `www.${canonical.hostname}`) return null;

  const target = new URL(url.toString());
  target.protocol = canonical.protocol;
  target.host = canonical.host;

  return new Response(null, {
    status: 308,
    headers: {
      location: target.toString(),
      'cache-control': 'public,max-age=86400'
    }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, '');
    try {
      const hostRedirect = canonicalHostRedirect(url, env);
      if (hostRedirect) return hostRedirect;
      if (path === '') return home(env);
      if (path === 'destinazioni') return listing(env, 'destination');
      if (path === 'guide') return listing(env, 'guide');
      if (path === 'confronti') return listing(env, 'comparison');
      if (path === 'privacy' || path === 'trasparenza' || path === 'metodo') return staticPage(env, path);
      if (path === 'sitemap.xml') return sitemap(env);
      if (path === 'favicon.svg') return favicon();
      if (path === 'robots.txt') return new Response(`User-agent: *\nAllow: /\nDisallow: /go/\nDisallow: /api/maintenance/\nSitemap: ${siteBase(env)}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain;charset=UTF-8', 'cache-control': 'public,max-age=3600' } });
      if (path === 'api/health') return Response.json({ ok: true, site: env.SITE_NAME, affiliateMode: env.AFFILIATE_MODE || 'disabled', maintenanceApi: env.MAINTENANCE_TOKEN ? 'enabled' : 'disabled', aiGateway: env.AI_GATEWAY_TOKEN ? 'enabled' : 'disabled', recentDemandWorkflow: env.RECENT_DEMAND_WORKFLOW ? 'enabled' : 'disabled' });
      if (path === 'api/maintenance/ai-smoke') return aiGatewaySmoke(request, env);
      if (path.startsWith('api/maintenance/editorial-')) return editorialAiApi(request, env, path);
      if (path.startsWith('api/maintenance/research-')) return recentDemandApi(request, env, path);
      if (path.startsWith('api/maintenance/')) return maintenanceApi(request, env, path);
      if (path.startsWith('go/')) return redirectProvider(env, request, path.slice(3));
      if (looksLikeFileProbe(path)) return notFound(env);
      return article(env, path);
    } catch (error) {
      console.error(error);
      return new Response('Errore interno', { status: 500 });
    }
  }
};
