import { handle } from '@astrojs/cloudflare/handler';
import backendWorker from '../../../src/index';
import { handleControlRoomBriefDecision } from '../../../src/editorial-brief-decisions';
import { cloudflareAccessActor, requireCloudflareAccess } from './lib/cloudflare-access';

export { Last30DaysContainer } from '../../../src/last30days-container';
export { RecentDemandWorkflow } from '../../../src/recent-demand-workflow';

const CONTROL_ROOM_SNAPSHOT_PATH = '/control-room-foundation/api/snapshot';
const CONTROL_ROOM_DRAFT_DETAIL_PATH = '/control-room-foundation/api/draft-detail';
const CONTROL_ROOM_BRIEF_DECISION_PATH = '/control-room-foundation/api/brief-decision';

function isControlRoomRequest(pathname: string): boolean {
  return pathname === '/control-room-foundation'
    || pathname.startsWith('/control-room-foundation/');
}

function isAstroRequest(pathname: string): boolean {
  return pathname === '/astro-foundation'
    || pathname.startsWith('/astro-foundation/')
    || isControlRoomRequest(pathname);
}

function privateJson(data: unknown, status: number, extraHeaders?: HeadersInit): Response {
  const headers = new Headers(extraHeaders);
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-robots-tag', 'noindex, nofollow');

  return Response.json(data, { status, headers });
}

function privateUpstream(upstream: Response): Response {
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
  return privateUpstream(await backendWorker.fetch(upstreamRequest, env));
}

async function controlRoomDraftDetail(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return privateJson({ ok: false, error: 'method_not_allowed' }, 405, { allow: 'GET' });
  }

  if (!env.MAINTENANCE_TOKEN) {
    return privateJson({ ok: false, error: 'control_room_draft_detail_unavailable' }, 503);
  }

  const draftId = Number.parseInt(new URL(request.url).searchParams.get('draftId') || '0', 10);
  if (!Number.isInteger(draftId) || draftId <= 0) {
    return privateJson({ ok: false, error: 'draftId_required' }, 400);
  }

  const upstreamUrl = new URL('/api/maintenance/editorial-draft-grounding', request.url);
  upstreamUrl.searchParams.set('draftId', String(draftId));
  const upstreamRequest = new Request(upstreamUrl, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${env.MAINTENANCE_TOKEN}`
    }
  });
  return privateUpstream(await backendWorker.fetch(upstreamRequest, env));
}

async function controlRoomBriefDecision(request: Request, env: Env): Promise<Response> {
  if (!env.MAINTENANCE_TOKEN) {
    return privateJson({ ok: false, error: 'control_room_brief_decision_unavailable' }, 503);
  }

  try {
    return handleControlRoomBriefDecision(request, env, cloudflareAccessActor(request));
  } catch {
    return privateJson({ ok: false, error: 'verified_actor_required' }, 403);
  }
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

    if (pathname === CONTROL_ROOM_DRAFT_DETAIL_PATH) {
      return controlRoomDraftDetail(request, env);
    }

    if (pathname === CONTROL_ROOM_BRIEF_DECISION_PATH) {
      return controlRoomBriefDecision(request, env);
    }

    if (isAstroRequest(pathname)) {
      return handle(request, env, ctx);
    }

    return backendWorker.fetch(request, env);
  }
} satisfies ExportedHandler<Env>;
