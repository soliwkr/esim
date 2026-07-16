import type { Env } from './types';
import { ingestResearch, listResearchSignals, updateResearchSignals } from './research';

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

export async function recentDemandApi(request: Request, env: Env, path: string): Promise<Response> {
  if (!env.MAINTENANCE_TOKEN) return json({ ok: false, error: 'maintenance_api_disabled' }, 503);
  if (request.headers.get('authorization') !== `Bearer ${env.MAINTENANCE_TOKEN}`) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  if (request.method === 'POST' && path === 'api/maintenance/research-ingest') {
    return ingestResearch(request, env);
  }
  if (request.method === 'GET' && path === 'api/maintenance/research-signals') {
    return listResearchSignals(request, env);
  }
  if (request.method === 'POST' && path === 'api/maintenance/research-signal-action') {
    return updateResearchSignals(request, env);
  }

  return json({ ok: false, error: 'research_route_not_found' }, 404);
}
