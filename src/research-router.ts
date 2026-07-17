import type { Env } from './types';
import { ingestResearch, listResearchSignals, updateResearchSignals } from './research';
import {
  getResearchRunStatus,
  listResearchRuns,
  markRunFailed,
  recordQueuedRun
} from './research-runs';

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

async function readObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

async function runnerHealth(env: Env): Promise<Response> {
  const container = env.LAST30DAYS_CONTAINER.getByName('senza-roaming-radar');
  const upstream = await container.fetch('http://last30days.internal/health');
  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

async function startWorkflow(request: Request, env: Env): Promise<Response> {
  const body = await readObject(request);
  if (!body) return json({ ok: false, error: 'object_payload_required' }, 400);

  const queries = body.queries;
  if (queries !== undefined && (!Array.isArray(queries) || queries.length < 1 || queries.length > 6)) {
    return json({ ok: false, error: 'queries_must_contain_1_to_6_items' }, 400);
  }

  const instanceId = `manual-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}-${crypto.randomUUID().slice(0, 8)}`;
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 200) : 'manual_recent_demand';
  await recordQueuedRun(env, instanceId, queries, reason);

  try {
    const instance = await env.RECENT_DEMAND_WORKFLOW.create({
      id: instanceId,
      params: { queries, reason }
    });

    return json({
      ok: true,
      workflow: 'senza-roaming-recent-demand',
      instanceId: instance.id,
      status: await instance.status()
    }, 202);
  } catch (error) {
    await markRunFailed(env, instanceId, error);
    return json({ ok: false, error: 'workflow_create_failed', instanceId }, 502);
  }
}

export async function recentDemandApi(request: Request, env: Env, path: string): Promise<Response> {
  if (!env.MAINTENANCE_TOKEN) return json({ ok: false, error: 'maintenance_api_disabled' }, 503);
  if (request.headers.get('authorization') !== `Bearer ${env.MAINTENANCE_TOKEN}`) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  if (request.method === 'GET' && path === 'api/maintenance/research-runner-health') {
    return runnerHealth(env);
  }
  if (request.method === 'GET' && path === 'api/maintenance/research-runs') {
    return listResearchRuns(request, env);
  }
  if (request.method === 'GET' && path === 'api/maintenance/research-run-status') {
    return getResearchRunStatus(request, env);
  }
  if (request.method === 'POST' && path === 'api/maintenance/research-run') {
    return startWorkflow(request, env);
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
