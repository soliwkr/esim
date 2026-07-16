import type { Env } from './types';
import { siteBase } from './utils';
import { article, favicon, home, listing, sitemap, staticPage } from './pages';
import { redirectProvider } from './redirect';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, '');
    try {
      if (path === '') return home(env);
      if (path === 'destinazioni') return listing(env, 'destination');
      if (path === 'guide') return listing(env, 'guide');
      if (path === 'confronti') return listing(env, 'comparison');
      if (path === 'privacy' || path === 'trasparenza' || path === 'metodo') return staticPage(env, path);
      if (path === 'sitemap.xml') return sitemap(env);
      if (path === 'favicon.svg') return favicon();
      if (path === 'robots.txt') return new Response(`User-agent: *\nAllow: /\nDisallow: /go/\nSitemap: ${siteBase(env)}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain;charset=UTF-8', 'cache-control': 'public,max-age=3600' } });
      if (path === 'api/health') return Response.json({ ok: true, site: env.SITE_NAME, affiliateMode: env.AFFILIATE_MODE || 'disabled' });
      if (path.startsWith('go/')) return redirectProvider(env, request, path.slice(3));
      return article(env, path);
    } catch (error) {
      console.error(error);
      return new Response('Errore interno', { status: 500 });
    }
  }
};
