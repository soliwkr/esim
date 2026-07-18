import backend, { Last30DaysContainer, RecentDemandWorkflow } from '../../../../src/index';
import type { Env } from '../../../../src/types';

export { Last30DaysContainer, RecentDemandWorkflow };

type AstroHandler = { fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> };

function isBackendRoute(pathname: string): boolean {
  return pathname.startsWith('/api/') || pathname.startsWith('/go/') || pathname === '/robots.txt' || pathname === '/sitemap.xml' || pathname === '/favicon.svg';
}

async function loadAstroHandler(): Promise<AstroHandler> {
  // Replaced by the Cloudflare adapter build output in real preview/deploy.
  return await import('../../dist/_worker.js/index.js') as AstroHandler;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (isBackendRoute(url.pathname)) return backend.fetch(request, env);
    const astro = await loadAstroHandler();
    return astro.fetch(request, env, ctx);
  }
};
