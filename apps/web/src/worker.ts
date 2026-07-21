import { handle } from '@astrojs/cloudflare/handler';
import backendWorker from '../../../src/index';
import { requireCloudflareAccess } from './lib/cloudflare-access';

export { Last30DaysContainer } from '../../../src/last30days-container';
export { RecentDemandWorkflow } from '../../../src/recent-demand-workflow';

const CONTROL_ROOM_SNAPSHOT_PATH = '/control-room-foundation/api/snapshot';

function isControlRoomRequest(pathname: string): boolean {
  return pathname === '/control-room-foundation'
    || pathname.startsWith('/control-room-foundation/');
}

function isAstroRequest(pathname: string): boolean {
  return pathname === '/astro-foundation'
    || pathname.startsWith('/astro-foundation/')
    || isControlRoomRequest(pathname);
}

function privateJson(data: unknown, status: number, extraHeaders: HeadersInit = {}): Response {
  return Response.json(data, {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-robots-tag': 'noindex, nofollow',
      ...extraHeaders
    }
  });
}

async function controlRoomSnapshot(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return privateJson({ ok: false, error: 'method_not_allowed' }, 405, { allow: 'GET' });
  }

  if (!env.MAINTENANCE_TOKEN) {
    return privateJson({ ok: false, error: 'control_room_snapshot_unavailable' }, 503);
  }

  const upstreamUrl = new URL('/api/maintenance/control-room', request.url);
  const upstreamRequest = new Request(upstreamUrl, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${env.MAINTENANCE_TOKEN}`
    }
  });
  const upstream = await backendWorker.fetch(upstreamRequest, env);
  const headers = new Headers(upstream.headers);
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-robots-tag', 'noindex, nofollow');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const pathname = new URL(request.url).pathname;

    if (isControlRoomRequest(pathname)) {
      const accessError = await requireCloudflareAccess(request, env);
      if (accessError) return accessError;
    }

    if (pathname === CONTROL_ROOM_SNAPSHOT_PATH) {
      return controlRoomSnapshot(request, env);
    }

    if (isAstroRequest(pathname)) {
      return handle(request, env, ctx);
    }

    return backendWorker.fetch(request, env);
  }
} satisfies ExportedHandler<Env>;
