import type { Env } from './types';

type SourceRow = {
  id: number;
  entity_type: string;
  entity_key: string;
  freshness_days: number;
};

type MaintenanceTask = {
  id: number;
  task_type: string;
  entity_type: string;
  entity_key: string;
  source_id: number | null;
  priority: number;
  status: string;
  due_at: string;
  payload_json: string;
  attempts: number;
  max_attempts: number;
  locked_by: string | null;
};

type ClaimInput = {
  fieldName?: unknown;
  value?: unknown;
  status?: unknown;
  confidence?: unknown;
  validUntil?: unknown;
  evidence?: unknown;
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { 'cache-control': 'no-store' }
  });
}

function authorized(request: Request, env: Env): Response | null {
  if (!env.MAINTENANCE_TOKEN) {
    return json({ ok: false, error: 'maintenance_api_disabled' }, 503);
  }
  if (request.headers.get('authorization') !== `Bearer ${env.MAINTENANCE_TOKEN}`) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }
  return null;
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json<unknown>();
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function shortText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  return result ? result.slice(0, max) : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

async function status(env: Env): Promise<Response> {
  const sources = await env.DB.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) AS errors
    FROM source_registry
  `).first<{ total: number; active: number; errors: number }>();

  const due = await env.DB.prepare(`
    SELECT COUNT(*) AS total
    FROM maintenance_due_sources
    WHERE is_due=1
  `).first<{ total: number }>();

  const queue = await env.DB.prepare(`
    SELECT
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status='processing' THEN 1 ELSE 0 END) AS processing,
      SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed
    FROM maintenance_queue
  `).first<{ pending: number; processing: number; failed: number; completed: number }>();

  const pages = await env.DB.prepare(`
    SELECT
      SUM(CASE WHEN status='review' THEN 1 ELSE 0 END) AS review,
      SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published
    FROM pages
  `).first<{ review: number; published: number }>();

  const nextTasks = await env.DB.prepare(`
    SELECT id,task_type,entity_type,entity_key,source_id,priority,status,due_at,
           payload_json,attempts,max_attempts,locked_by
    FROM maintenance_queue
    WHERE status IN ('pending','processing','failed')
    ORDER BY CASE status WHEN 'processing' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
             priority DESC,due_at ASC,id ASC
    LIMIT 20
  `).all<MaintenanceTask>();

  return json({
    ok: true,
    generatedAt: new Date().toISOString(),
    sources: {
      total: Number(sources?.total || 0),
      active: Number(sources?.active || 0),
      errors: Number(sources?.errors || 0),
      due: Number(due?.total || 0)
    },
    queue: {
      pending: Number(queue?.pending || 0),
      processing: Number(queue?.processing || 0),
      failed: Number(queue?.failed || 0),
      completed: Number(queue?.completed || 0)
    },
    pages: {
      review: Number(pages?.review || 0),
      published: Number(pages?.published || 0)
    },
    nextTasks: nextTasks.results.map((task) => ({
      ...task,
      payload: safePayload(task.payload_json)
    }))
  });
}

function safePayload(value: string): unknown {
  try { return JSON.parse(value); } catch { return {}; }
}

async function enqueueDue(env: Env): Promise<Response> {
  const result = await env.DB.prepare(`
    INSERT OR IGNORE INTO maintenance_queue(
      dedupe_key,task_type,entity_type,entity_key,source_id,priority,due_at,payload_json
    )
    SELECT
      'refresh-source:' || id || ':' || strftime('%Y-%m-%d',CURRENT_TIMESTAMP),
      'refresh_source',entity_type,entity_key,id,
      CASE trust_level WHEN 5 THEN 90 WHEN 4 THEN 80 ELSE 60 END,
      CURRENT_TIMESTAMP,
      json_object('reason','freshness_expired','sourceUrl',url)
    FROM maintenance_due_sources
    WHERE is_due=1
  `).run();

  return json({ ok: true, enqueued: Number(result.meta.changes || 0) });
}

async function claimTask(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const workerId = shortText(body?.workerId, 80);
  if (!workerId) return json({ ok: false, error: 'workerId_required' }, 400);

  const task = await env.DB.prepare(`
    UPDATE maintenance_queue
    SET status='processing',locked_at=CURRENT_TIMESTAMP,locked_by=?,
        attempts=attempts+1,updated_at=CURRENT_TIMESTAMP
    WHERE id=(
      SELECT id FROM maintenance_queue
      WHERE status='pending' AND due_at<=CURRENT_TIMESTAMP AND attempts<max_attempts
      ORDER BY priority DESC,due_at ASC,id ASC
      LIMIT 1
    )
    RETURNING id,task_type,entity_type,entity_key,source_id,priority,status,due_at,
              payload_json,attempts,max_attempts,locked_by
  `).bind(workerId).first<MaintenanceTask>();

  return json({
    ok: true,
    task: task ? { ...task, payload: safePayload(task.payload_json) } : null
  });
}

async function failTask(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const taskId = finiteNumber(body?.taskId);
  const error = shortText(body?.error, 2000);
  if (!taskId || !Number.isInteger(taskId) || !error) {
    return json({ ok: false, error: 'taskId_and_error_required' }, 400);
  }

  const task = await env.DB.prepare(`
    UPDATE maintenance_queue
    SET status=CASE WHEN attempts<max_attempts THEN 'pending' ELSE 'failed' END,
        due_at=CASE WHEN attempts<max_attempts THEN datetime(CURRENT_TIMESTAMP,'+15 minutes') ELSE due_at END,
        locked_at=NULL,locked_by=NULL,last_error=?,updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND status='processing'
    RETURNING id,status,attempts,max_attempts,due_at
  `).bind(error, taskId).first<Record<string, unknown>>();

  if (!task) return json({ ok: false, error: 'processing_task_not_found' }, 404);
  return json({ ok: true, task });
}

async function recordSourceCheck(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const sourceId = finiteNumber(body?.sourceId);
  const taskId = finiteNumber(body?.taskId);
  const httpStatus = finiteNumber(body?.httpStatus);
  const contentHash = shortText(body?.contentHash, 256);
  const etag = shortText(body?.etag, 512);
  const lastModified = shortText(body?.lastModified, 512);
  const notes = shortText(body?.notes, 4000) || '';
  const changed = body?.changed === true;
  const claims = Array.isArray(body?.claims) ? body.claims as ClaimInput[] : [];

  if (!sourceId || !Number.isInteger(sourceId)) {
    return json({ ok: false, error: 'sourceId_required' }, 400);
  }
  if (httpStatus !== null && (!Number.isInteger(httpStatus) || httpStatus < 100 || httpStatus > 599)) {
    return json({ ok: false, error: 'invalid_httpStatus' }, 400);
  }

  const source = await env.DB.prepare(`
    SELECT id,entity_type,entity_key,freshness_days
    FROM source_registry WHERE id=?
  `).bind(sourceId).first<SourceRow>();
  if (!source) return json({ ok: false, error: 'source_not_found' }, 404);

  const statements: D1PreparedStatement[] = [];
  statements.push(env.DB.prepare(`
    UPDATE source_registry
    SET status=CASE WHEN ? BETWEEN 200 AND 399 OR ? IS NULL THEN 'active' ELSE 'error' END,
        last_checked_at=CURRENT_TIMESTAMP,
        last_changed_at=CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE last_changed_at END,
        content_hash=COALESCE(?,content_hash),
        http_etag=COALESCE(?,http_etag),
        http_last_modified=COALESCE(?,http_last_modified),
        last_http_status=?,
        consecutive_failures=CASE WHEN ? BETWEEN 200 AND 399 OR ? IS NULL THEN 0 ELSE consecutive_failures+1 END,
        notes=CASE WHEN ?<>'' THEN ? ELSE notes END,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(httpStatus, httpStatus, changed ? 1 : 0, contentHash, etag, lastModified,
    httpStatus, httpStatus, httpStatus, notes, notes, sourceId));

  const defaultValidUntil = new Date(Date.now() + source.freshness_days * 86_400_000).toISOString();
  let acceptedClaims = 0;

  for (const input of claims.slice(0, 100)) {
    const fieldName = shortText(input.fieldName, 120);
    if (!fieldName) continue;
    const statusValue = input.status === 'conflict' || input.status === 'stale' || input.status === 'missing'
      ? input.status
      : 'verified';
    const confidenceValue = finiteNumber(input.confidence);
    const confidence = confidenceValue === null ? 1 : Math.min(1, Math.max(0, confidenceValue));
    const validUntil = shortText(input.validUntil, 40) || defaultValidUntil;
    const evidence = shortText(input.evidence, 4000) || '';
    const valueJson = JSON.stringify(input.value ?? null);

    statements.push(env.DB.prepare(`
      INSERT INTO claim_verifications(
        entity_type,entity_key,field_name,value_json,source_id,verification_status,
        confidence,checked_at,valid_until,evidence,updated_at
      ) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(entity_type,entity_key,field_name,source_id) DO UPDATE SET
        value_json=excluded.value_json,
        verification_status=excluded.verification_status,
        confidence=excluded.confidence,
        checked_at=CURRENT_TIMESTAMP,
        valid_until=excluded.valid_until,
        evidence=excluded.evidence,
        updated_at=CURRENT_TIMESTAMP
    `).bind(source.entity_type, source.entity_key, fieldName, valueJson, sourceId,
      statusValue, confidence, validUntil, evidence));
    acceptedClaims += 1;
  }

  if (taskId && Number.isInteger(taskId)) {
    statements.push(env.DB.prepare(`
      UPDATE maintenance_queue
      SET status='completed',completed_at=CURRENT_TIMESTAMP,locked_at=NULL,locked_by=NULL,
          last_error=NULL,updated_at=CURRENT_TIMESTAMP
      WHERE id=? AND source_id=? AND status='processing'
    `).bind(taskId, sourceId));
  }

  if (changed) {
    statements.push(env.DB.prepare(`
      INSERT OR IGNORE INTO maintenance_queue(
        dedupe_key,task_type,entity_type,entity_key,source_id,priority,payload_json
      ) VALUES(?,?,?,?,?,85,json_object('reason','source_changed'))
    `).bind(
      `editorial-review:${sourceId}:${new Date().toISOString().slice(0, 10)}`,
      'editorial_review',source.entity_type,source.entity_key,sourceId
    ));
  }

  await env.DB.batch(statements);
  return json({ ok: true, sourceId, changed, claimsRecorded: acceptedClaims });
}

export async function maintenanceApi(
  request: Request,
  env: Env,
  path: string
): Promise<Response> {
  const authError = authorized(request, env);
  if (authError) return authError;

  if (request.method === 'GET' && path === 'api/maintenance/status') return status(env);
  if (request.method === 'POST' && path === 'api/maintenance/enqueue-due') return enqueueDue(env);
  if (request.method === 'POST' && path === 'api/maintenance/claim-task') return claimTask(request, env);
  if (request.method === 'POST' && path === 'api/maintenance/source-check') return recordSourceCheck(request, env);
  if (request.method === 'POST' && path === 'api/maintenance/task-failure') return failTask(request, env);

  return json({ ok: false, error: 'maintenance_route_not_found' }, 404);
}
