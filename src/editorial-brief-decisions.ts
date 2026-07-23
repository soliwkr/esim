import type { Env } from './types';

type Obj = Record<string, unknown>;
type BriefDecision = 'accepted' | 'dismissed';

type BriefRow = {
  id: number;
  status: string;
  notes: string;
  decision_actor: string | null;
  decided_at: string | null;
  updated_at: string;
};

type DecisionRow = {
  id: number;
  brief_id: number;
  action: BriefDecision;
  actor: string;
  notes: string;
  created_at: string;
};

function privateJson(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-robots-tag': 'noindex, nofollow'
    }
  });
}

function isObject(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readObject(request: Request): Promise<Obj | null> {
  try {
    const value = await request.json();
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

function positiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function boundedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length <= max ? normalized : null;
}

async function readDecisionState(database: D1Database, briefId: number): Promise<{
  brief: BriefRow | null;
  decision: DecisionRow | null;
}> {
  const row = await database.prepare(`
    SELECT
      b.id,b.status,b.notes,b.decision_actor,b.decided_at,b.updated_at,
      e.id AS event_id,e.action AS event_action,e.actor AS event_actor,
      e.notes AS event_notes,e.created_at AS event_created_at
    FROM editorial_briefs b
    LEFT JOIN editorial_brief_events e ON e.brief_id=b.id
    WHERE b.id=?1
  `).bind(briefId).first<Record<string, unknown>>();

  if (!row) return { brief: null, decision: null };

  const brief: BriefRow = {
    id: Number(row.id),
    status: String(row.status),
    notes: String(row.notes ?? ''),
    decision_actor: row.decision_actor === null ? null : String(row.decision_actor),
    decided_at: row.decided_at === null ? null : String(row.decided_at),
    updated_at: String(row.updated_at)
  };

  const decision = row.event_id === null || row.event_id === undefined ? null : {
    id: Number(row.event_id),
    brief_id: brief.id,
    action: String(row.event_action) as BriefDecision,
    actor: String(row.event_actor),
    notes: String(row.event_notes ?? ''),
    created_at: String(row.event_created_at)
  };

  return { brief, decision };
}

function successfulState(
  state: { brief: BriefRow; decision: DecisionRow },
  action: BriefDecision,
  idempotent: boolean
): Response {
  return privateJson({
    ok: true,
    action,
    idempotent,
    brief: state.brief,
    decision: state.decision,
    publicationTriggered: false
  });
}

export async function handleControlRoomBriefDecision(
  request: Request,
  env: Env,
  verifiedActor: string
): Promise<Response> {
  if (request.method !== 'POST') {
    return privateJson({ ok: false, error: 'method_not_allowed' }, 405);
  }

  const actor = boundedString(verifiedActor, 320);
  if (!actor) return privateJson({ ok: false, error: 'verified_actor_required' }, 403);

  const body = await readObject(request);
  if (!body) return privateJson({ ok: false, error: 'object_payload_required' }, 400);

  const briefId = positiveInteger(body.briefId);
  const action = body.action === 'accepted' || body.action === 'dismissed'
    ? body.action
    : null;
  const notes = boundedString(body.notes ?? '', 2000);

  if (!briefId) return privateJson({ ok: false, error: 'briefId_required' }, 400);
  if (!action) return privateJson({ ok: false, error: 'invalid_brief_decision' }, 400);
  if (notes === null) return privateJson({ ok: false, error: 'brief_decision_notes_too_long' }, 400);
  if (action === 'dismissed' && notes.length === 0) {
    return privateJson({ ok: false, error: 'dismissal_reason_required' }, 400);
  }

  const before = await readDecisionState(env.DB, briefId);
  if (!before.brief) return privateJson({ ok: false, error: 'brief_not_found' }, 404);

  const sameDecision = before.brief.status === action
    || (before.brief.status === 'converted' && action === 'accepted');
  if (sameDecision && before.decision?.action === action) {
    return successfulState({ brief: before.brief, decision: before.decision }, action, true);
  }

  if (before.brief.status !== 'proposed') {
    return privateJson({
      ok: false,
      error: 'brief_decision_conflict',
      currentStatus: before.brief.status,
      requestedAction: action
    }, 409);
  }

  try {
    await env.DB.prepare(`
      UPDATE editorial_briefs
      SET status=?1,
          decision_actor=?2,
          decided_at=CURRENT_TIMESTAMP,
          notes=CASE WHEN ?3<>'' THEN ?3 ELSE notes END,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?4 AND status='proposed'
    `).bind(action, actor, notes, briefId).run();
  } catch (error) {
    console.warn('Brief decision update rejected', error instanceof Error ? error.message : 'unknown');
  }

  const after = await readDecisionState(env.DB, briefId);
  if (!after.brief) return privateJson({ ok: false, error: 'brief_not_found' }, 404);

  const applied = after.decision?.action === action
    && (after.brief.status === action || (after.brief.status === 'converted' && action === 'accepted'));
  if (applied && after.decision) {
    return successfulState({ brief: after.brief, decision: after.decision }, action, false);
  }

  return privateJson({
    ok: false,
    error: 'brief_decision_conflict',
    currentStatus: after.brief.status,
    requestedAction: action
  }, 409);
}
