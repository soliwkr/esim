import type { Env } from './types';

type Obj = Record<string, unknown>;

type RunSummary = {
  workflow: string | null;
  scheduledBy: string | null;
  reason: string;
  completed: number;
  results: Array<{
    query: string;
    mode: string;
    sources: string[];
    runId: number | null;
    duplicate: boolean;
    signalsReceived: number;
    signalsInserted: number;
  }>;
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

function obj(value: unknown): Obj | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Obj : null;
}

function str(value: unknown, max = 1000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function int(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isInteger(value) ? value : fallback;
}

function bool(value: unknown): boolean {
  return value === true;
}

function parseObject(value: unknown): Obj | null {
  if (obj(value)) return obj(value);
  if (typeof value !== 'string') return null;
  try { return obj(JSON.parse(value)); } catch { return null; }
}

function stringify(value: unknown): string {
  try { return JSON.stringify(value ?? null); } catch { return 'null'; }
}

function safeSources(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => str(item, 80)).filter(Boolean).slice(0, 10)
    : [];
}

function summarizeOutput(value: unknown): RunSummary {
  const output = obj(value) || {};
  const rawResults = Array.isArray(output.results) ? output.results : [];
  const results = rawResults.slice(0, 6).flatMap((raw) => {
    const item = obj(raw);
    if (!item) return [];
    const ingest = parseObject(item.ingest) || parseObject(item.ingestJson) || {};
    return [{
      query: str(item.query, 500),
      mode: str(item.mode, 40) || 'research',
      sources: safeSources(item.sources),
      runId: int(ingest.runId, 0) || null,
      duplicate: bool(ingest.duplicate),
      signalsReceived: Math.max(0, int(ingest.signalsReceived, int(ingest.signals, 0))),
      signalsInserted: Math.max(0, int(ingest.signalsInserted, int(ingest.signals, 0)))
    }];
  });

  return {
    workflow: str(output.workflow, 120) || null,
    scheduledBy: str(output.scheduledBy, 120) || null,
    reason: str(output.reason, 200),
    completed: Math.max(0, int(output.completed, results.length)),
    results
  };
}

function publicStatus(value: unknown): {
  status: string;
  error: { name: string; message: string } | null;
  output: RunSummary;
  rollback: { outcome: string; error: { name: string; message: string } | null } | null;
} {
  const statusObject = obj(value) || {};
  const error = obj(statusObject.error);
  const rollbackObject = obj(statusObject.rollback);
  const rollbackError = rollbackObject ? obj(rollbackObject.error) : null;

  return {
    status: str(statusObject.status, 40) || 'unknown',
    error: error ? {
      name: str(error.name, 120) || 'WorkflowError',
      message: str(error.message, 1500) || 'Workflow execution failed'
    } : null,
    output: summarizeOutput(statusObject.output),
    rollback: rollbackObject ? {
      outcome: str(rollbackObject.outcome, 40) || 'unknown',
      error: rollbackError ? {
        name: str(rollbackError.name, 120) || 'RollbackError',
        message: str(rollbackError.message, 1500) || 'Rollback failed'
      } : null
    } : null
  };
}

function terminal(status: string): boolean {
  return status === 'complete' || status === 'errored' || status === 'terminated';
}

export async function recordQueuedRun(
  env: Env,
  instanceId: string,
  queries: unknown,
  reason: string
): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO recent_demand_workflow_runs(
      instance_id,trigger_type,reason,queries_json,status,created_at,updated_at
    ) VALUES(?,?,?,?, 'queued',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(instance_id) DO UPDATE SET
      trigger_type=excluded.trigger_type,
      reason=excluded.reason,
      queries_json=excluded.queries_json,
      status='queued',
      error_name=NULL,
      error_message=NULL,
      completed_at=NULL,
      updated_at=CURRENT_TIMESTAMP
  `).bind(instanceId, 'manual', reason, stringify(Array.isArray(queries) ? queries : [])).run();
}

export async function markRunRunning(
  env: Env,
  instanceId: string,
  triggerType: 'manual' | 'scheduled',
  reason: string,
  queries: unknown
): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO recent_demand_workflow_runs(
      instance_id,trigger_type,reason,queries_json,status,started_at,created_at,updated_at
    ) VALUES(?,?,?,?, 'running',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(instance_id) DO UPDATE SET
      trigger_type=excluded.trigger_type,
      reason=excluded.reason,
      queries_json=excluded.queries_json,
      status='running',
      started_at=COALESCE(recent_demand_workflow_runs.started_at,CURRENT_TIMESTAMP),
      completed_at=NULL,
      error_name=NULL,
      error_message=NULL,
      updated_at=CURRENT_TIMESTAMP
  `).bind(instanceId, triggerType, reason, stringify(Array.isArray(queries) ? queries : [])).run();
}

export async function markRunComplete(
  env: Env,
  instanceId: string,
  resultCount: number,
  signalCount: number,
  outputSummary: unknown
): Promise<void> {
  await env.DB.prepare(`
    UPDATE recent_demand_workflow_runs SET
      status='complete',
      completed_at=CURRENT_TIMESTAMP,
      result_count=?,
      signal_count=?,
      output_summary_json=?,
      error_name=NULL,
      error_message=NULL,
      updated_at=CURRENT_TIMESTAMP
    WHERE instance_id=?
  `).bind(
    Math.max(0, resultCount),
    Math.max(0, signalCount),
    stringify(outputSummary),
    instanceId
  ).run();
}

export async function markRunFailed(env: Env, instanceId: string, error: unknown): Promise<void> {
  const candidate = error instanceof Error ? error : new Error(String(error || 'Workflow execution failed'));
  await env.DB.prepare(`
    UPDATE recent_demand_workflow_runs SET
      status='errored',
      completed_at=CURRENT_TIMESTAMP,
      error_name=?,
      error_message=?,
      updated_at=CURRENT_TIMESTAMP
    WHERE instance_id=?
  `).bind(candidate.name.slice(0, 120), candidate.message.slice(0, 1500), instanceId).run();
}

async function syncStatus(env: Env, instanceId: string, rawStatus: unknown): Promise<ReturnType<typeof publicStatus>> {
  const live = publicStatus(rawStatus);
  const summary = live.output;
  const signalCount = summary.results.reduce((total, result) => total + result.signalsInserted, 0);
  const queries = summary.results.map((result) => ({
    query: result.query,
    mode: result.mode,
    sources: result.sources
  }));
  const triggerType = summary.scheduledBy ? 'scheduled' : 'manual';

  await env.DB.prepare(`
    INSERT INTO recent_demand_workflow_runs(
      instance_id,trigger_type,reason,queries_json,status,started_at,completed_at,
      result_count,signal_count,error_name,error_message,output_summary_json,created_at,updated_at
    ) VALUES(
      ?,?,?,?,?,
      CASE WHEN ? IN ('running','waiting','paused','waitingForPause','complete','errored','terminated') THEN CURRENT_TIMESTAMP ELSE NULL END,
      CASE WHEN ? IN ('complete','errored','terminated') THEN CURRENT_TIMESTAMP ELSE NULL END,
      ?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
    )
    ON CONFLICT(instance_id) DO UPDATE SET
      trigger_type=excluded.trigger_type,
      reason=CASE WHEN excluded.reason<>'' THEN excluded.reason ELSE recent_demand_workflow_runs.reason END,
      queries_json=CASE WHEN excluded.queries_json<>'[]' THEN excluded.queries_json ELSE recent_demand_workflow_runs.queries_json END,
      status=excluded.status,
      started_at=COALESCE(recent_demand_workflow_runs.started_at,excluded.started_at),
      completed_at=CASE WHEN excluded.completed_at IS NOT NULL THEN excluded.completed_at ELSE recent_demand_workflow_runs.completed_at END,
      result_count=excluded.result_count,
      signal_count=excluded.signal_count,
      error_name=excluded.error_name,
      error_message=excluded.error_message,
      output_summary_json=excluded.output_summary_json,
      updated_at=CURRENT_TIMESTAMP
  `).bind(
    instanceId,
    triggerType,
    summary.reason,
    stringify(queries),
    live.status,
    live.status,
    live.status,
    summary.completed,
    signalCount,
    live.error?.name || null,
    live.error?.message || null,
    stringify(summary)
  ).run();

  return live;
}

async function readRun(env: Env, instanceId: string): Promise<Record<string, unknown> | null> {
  const row = await env.DB.prepare(`
    SELECT instance_id,workflow_name,trigger_type,reason,queries_json,status,started_at,
           completed_at,result_count,signal_count,error_name,error_message,
           output_summary_json,created_at,updated_at
    FROM recent_demand_workflow_runs
    WHERE instance_id=?
  `).bind(instanceId).first<Record<string, unknown>>();
  if (!row) return null;
  return {
    ...row,
    queries: parseObject(row.queries_json) || (() => {
      try { return JSON.parse(String(row.queries_json || '[]')); } catch { return []; }
    })(),
    outputSummary: parseObject(row.output_summary_json) || {},
    queries_json: undefined,
    output_summary_json: undefined
  };
}

export async function getResearchRunStatus(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const instanceId = str(url.searchParams.get('instanceId') || url.searchParams.get('id'), 100);
  if (!instanceId) return json({ ok: false, error: 'instance_id_required' }, 400);

  let instance;
  try {
    instance = await env.RECENT_DEMAND_WORKFLOW.get(instanceId);
  } catch {
    return json({ ok: false, error: 'workflow_instance_not_found', instanceId }, 404);
  }

  const live = await syncStatus(env, instanceId, await instance.status());
  const run = await readRun(env, instanceId);
  return json({ ok: true, instanceId, live, run });
}

export async function listResearchRuns(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const status = str(url.searchParams.get('status'), 40);
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '30', 10) || 30));
  const clauses: string[] = [];
  const bindings: unknown[] = [];
  if (status) { clauses.push('status=?'); bindings.push(status); }
  bindings.push(limit);

  const rows = await env.DB.prepare(`
    SELECT instance_id,workflow_name,trigger_type,reason,queries_json,status,started_at,
           completed_at,result_count,signal_count,error_name,error_message,
           output_summary_json,created_at,updated_at
    FROM recent_demand_workflow_runs
    ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(...bindings).all<Record<string, unknown>>();

  const runs = rows.results.map((row) => {
    let queries: unknown = [];
    let outputSummary: unknown = {};
    try { queries = JSON.parse(String(row.queries_json || '[]')); } catch { queries = []; }
    try { outputSummary = JSON.parse(String(row.output_summary_json || '{}')); } catch { outputSummary = {}; }
    return {
      instanceId: row.instance_id,
      workflowName: row.workflow_name,
      triggerType: row.trigger_type,
      reason: row.reason,
      queries,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      resultCount: row.result_count,
      signalCount: row.signal_count,
      error: row.error_name ? { name: row.error_name, message: row.error_message } : null,
      outputSummary,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      terminal: terminal(String(row.status || ''))
    };
  });

  return json({ ok: true, count: runs.length, runs });
}
