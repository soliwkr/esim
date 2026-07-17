import type { Env } from './types';

type Obj = Record<string, unknown>;

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

function str(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function parseJson(value: unknown, fallback: unknown): unknown {
  try { return JSON.parse(String(value ?? '')); } catch { return fallback; }
}

function priorityBand(score: number): 'high' | 'medium' | 'low' {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export async function editorialPriorityApi(request: Request, env: Env): Promise<Response> {
  if (!env.MAINTENANCE_TOKEN) return json({ ok: false, error: 'maintenance_api_disabled' }, 503);
  if (request.headers.get('authorization') !== `Bearer ${env.MAINTENANCE_TOKEN}`) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }
  if (request.method !== 'GET') return json({ ok: false, error: 'method_not_allowed' }, 405);

  const url = new URL(request.url);
  const status = str(url.searchParams.get('status'), 30) || 'proposed';
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '30', 10) || 30));
  const allowed = new Set(['proposed', 'accepted', 'dismissed', 'converted', 'all']);
  if (!allowed.has(status)) return json({ ok: false, error: 'invalid_brief_status' }, 400);

  const where = status === 'all' ? '' : 'WHERE b.status=?';
  const statement = env.DB.prepare(`
    SELECT b.id,b.ai_run_id,b.cluster_title,b.proposed_title,b.asset_type,b.search_intent,
           b.opportunity_score,b.evidence_score,b.priority_score,b.score_explanation_json,
           b.quality_flags_json,b.status,b.notes,b.created_at,b.updated_at,
           r.model,r.prompt_version,
           q.status AS queue_status,q.priority AS queue_priority
    FROM editorial_briefs b
    JOIN ai_editorial_runs r ON r.id=b.ai_run_id
    LEFT JOIN maintenance_queue q ON q.entity_key=('editorial-brief:' || b.id)
    ${where}
    ORDER BY b.priority_score DESC,b.opportunity_score DESC,b.evidence_score DESC,b.created_at DESC
    LIMIT ?
  `);

  const rows = status === 'all'
    ? await statement.bind(limit).all<Obj>()
    : await statement.bind(status, limit).all<Obj>();

  const briefs = rows.results.map((row) => {
    const priorityScore = Number(row.priority_score || 0);
    return {
      id: Number(row.id),
      aiRunId: Number(row.ai_run_id),
      clusterTitle: row.cluster_title,
      proposedTitle: row.proposed_title,
      assetType: row.asset_type,
      searchIntent: row.search_intent,
      opportunityScore: Number(row.opportunity_score || 0),
      evidenceScore: Number(row.evidence_score || 0),
      priorityScore,
      priorityBand: priorityBand(priorityScore),
      scoreExplanation: parseJson(row.score_explanation_json, {}),
      qualityFlags: parseJson(row.quality_flags_json, []),
      status: row.status,
      notes: row.notes,
      queueStatus: row.queue_status || null,
      queuePriority: row.queue_priority === null || row.queue_priority === undefined
        ? null
        : Number(row.queue_priority),
      model: row.model,
      promptVersion: row.prompt_version,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });

  return json({
    ok: true,
    status,
    formulaVersion: 'priority-v1',
    count: briefs.length,
    briefs
  });
}
