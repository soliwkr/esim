import { handle } from '@astrojs/cloudflare/handler';
import backendWorker from '../../../src/index';

export { Last30DaysContainer } from '../../../src/last30days-container';
export { RecentDemandWorkflow } from '../../../src/recent-demand-workflow';

function isAstroRequest(pathname: string): boolean {
  return pathname === '/astro-foundation' || pathname.startsWith('/astro-foundation/');
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (isAstroRequest(new URL(request.url).pathname)) {
      return handle(request, env, ctx);
    }

    return backendWorker.fetch(request, env);
  }
} satisfies ExportedHandler<Env>;
