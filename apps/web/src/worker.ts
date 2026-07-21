import { handle } from '@astrojs/cloudflare/handler';
import backendWorker from '../../../src/index';
import { requireCloudflareAccess } from './lib/cloudflare-access';

export { Last30DaysContainer } from '../../../src/last30days-container';
export { RecentDemandWorkflow } from '../../../src/recent-demand-workflow';

function isControlRoomRequest(pathname: string): boolean {
  return pathname === '/control-room-foundation'
    || pathname.startsWith('/control-room-foundation/');
}

function isAstroRequest(pathname: string): boolean {
  return pathname === '/astro-foundation'
    || pathname.startsWith('/astro-foundation/')
    || isControlRoomRequest(pathname);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const pathname = new URL(request.url).pathname;

    if (isControlRoomRequest(pathname)) {
      const accessError = await requireCloudflareAccess(request, env);
      if (accessError) return accessError;
    }

    if (isAstroRequest(pathname)) {
      return handle(request, env, ctx);
    }

    return backendWorker.fetch(request, env);
  }
} satisfies ExportedHandler<Env>;
