import type { Env } from './types';

type Obj = Record<string, unknown>;
type Eligibility = 'eligible' | 'filtered' | 'all';

const STATUSES = new Set(['new', 'reviewed', 'accepted', 'dismissed', 'converted']);
const TYPES = new Set(['question', 'complaint', 'comparison', 'recommendation', 'trend', 'content_gap']);
const ELIGIBILITIES = new Set<Eligibility>(['eligible', 'filtered', 'all']);

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

function obj(value: unknown): Obj | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Obj : null;
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown, max = 4000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseFlags(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    return Array.isArray(parsed)
      ? parsed.map((item) => str(item, 80)).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function parseJson(value: unknown): unknown {
  try { return JSON.parse(String(value || '{}')); } catch { return {}; }
}

function qualityFlags(row: Record<string, unknown>): string[] {
  const flags = parseFlags(row.quality_flags_json);
  const relevance = typeof row.relevance_score === 'number' ? row.relevance_score : null;
  const corroboration = Number(row.corroboration_count || 0);
  const text = `${String(row.title || '')} ${String(row.summary || '')}`.toLocaleLowerCase('it');

  if (relevance !== null && relevance <= 0) flags.push('zero_relevance');
  else if (relevance !== null && relevance < 0.35) flags.push('low_relevance');
  if (corroboration < 2) flags.push('uncorroborated');
  if (
    /\b(sponsor(?:ed|izzato|izzata)?|partnership|affiliat(?:e|o|a)|coupon|codice sconto|promo(?:zione)?|use code)\b/.test(text)
    || (/\b(offerta|sconto)\b/.test(text) && /\b(link|codice|coupon|acquista|piano)\b/.test(text))
  ) {
    flags.push('promotional_or_sponsored');
  }

  return [...new Set(flags)];
}

export async function listQualifiedResearchSignals(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const status = str(url.searchParams.get('status'), 30) || 'new';
  const type = str(url.searchParams.get('type'), 30);
  const eligibility = (str(url.searchParams.get('eligibility'), 30) || 'eligible') as Eligibility;
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '30', 10) || 30));

  if (!STATUSES.has(status)) return json({ ok: false, error: 'invalid_status' }, 400);
  if (type && !TYPES.has(type)) return json({ ok: false, error: 'invalid_type' }, 400);
  if (!ELIGIBILITIES.has(eligibility)) return json({ ok: false, error: 'invalid_eligibility' }, 400);

  const clauses = ['s.status=?'];
  const bindings: unknown[] = [status];
  if (type) { clauses.push('s.signal_type=?'); bindings.push(type); }
  if (eligibility === 'eligible') clauses.push('s.eligible_for_editorial=1');
  if (eligibility === 'filtered') clauses.push('s.eligible_for_editorial=0');
  bindings.push(limit);

  const rows = await env.DB.prepare(`
    SELECT s.id,s.run_id,s.signal_type,s.topic,s.title,s.summary,s.source,s.url,
           s.published_at,s.engagement_json,s.relevance_score,s.momentum,
           s.corroboration_count,s.cluster_title,s.status,s.notes,s.created_at,
           s.freshness_days,s.quality_flags_json,s.eligible_for_editorial,
           r.query AS run_query,r.run_kind,r.generated_at,r.window_days
    FROM research_signals s
    JOIN research_runs r ON r.id=s.run_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY s.eligible_for_editorial DESC,COALESCE(s.relevance_score,0) DESC,
             s.corroboration_count DESC,s.created_at DESC
    LIMIT ?
  `).bind(...bindings).all<Record<string, unknown>>();

  return json({
    ok: true,
    eligibility,
    count: rows.results.length,
    signals: rows.results.map((row) => {
      const { engagement_json, quality_flags_json, eligible_for_editorial, ...rest } = row;
      return {
        ...rest,
        eligible: Number(eligible_for_editorial) === 1,
        quality_flags: qualityFlags(row),
        engagement: parseJson(engagement_json)
      };
    })
  });
}

export async function updateQualifiedResearchSignals(request: Request, env: Env): Promise<Response> {
  let raw: unknown;
  try { raw = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
  const body = obj(raw);
  const status = str(body?.status, 30);
  const notes = str(body?.notes, 4000);
  const overrideQualityGate = body?.overrideQualityGate === true;
  const ids = arr(body?.signalIds)
    .map(num)
    .filter((value): value is number => value !== null && Number.isInteger(value) && value > 0)
    .slice(0, 100);

  if (!STATUSES.has(status) || status === 'new') return json({ ok: false, error: 'invalid_action_status' }, 400);
  if (!ids.length) return json({ ok: false, error: 'signalIds_required' }, 400);

  const placeholders = ids.map(() => '?').join(',');
  const selected = await env.DB.prepare(`
    SELECT id,eligible_for_editorial,quality_flags_json
    FROM research_signals WHERE id IN (${placeholders})
  `).bind(...ids).all<Record<string, unknown>>();

  if (selected.results.length !== ids.length) {
    return json({ ok: false, error: 'one_or_more_signals_not_found' }, 404);
  }

  const blocked = selected.results.filter((row) => Number(row.eligible_for_editorial) === 0);
  if (blocked.length && (status === 'accepted' || status === 'converted') && !overrideQualityGate) {
    return json({
      ok: false,
      error: 'ineligible_signals_require_quality_override',
      blockedSignalIds: blocked.map((row) => Number(row.id))
    }, 409);
  }

  if (blocked.length && overrideQualityGate) {
    const overrides = blocked.map((row) => {
      const flags = [...new Set([...parseFlags(row.quality_flags_json), 'manual_quality_override'])];
      return env.DB.prepare(`
        UPDATE research_signals
        SET eligible_for_editorial=1,quality_flags_json=?,updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).bind(JSON.stringify(flags), Number(row.id));
    });
    await env.DB.batch(overrides);
  }

  const result = await env.DB.prepare(`
    UPDATE research_signals
    SET status=?,notes=CASE WHEN ?<>'' THEN ? ELSE notes END,updated_at=CURRENT_TIMESTAMP
    WHERE id IN (${placeholders})
  `).bind(status, notes, notes, ...ids).run();

  return json({
    ok: true,
    status,
    qualityGateOverridden: blocked.length > 0 && overrideQualityGate,
    updated: Number(result.meta?.changes || 0)
  });
}

export async function getResearchQualitySummary(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '10', 10) || 10));

  const totals = await env.DB.prepare(`
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN eligible_for_editorial=1 THEN 1 ELSE 0 END) AS eligible,
           SUM(CASE WHEN eligible_for_editorial=0 THEN 1 ELSE 0 END) AS filtered,
           SUM(CASE WHEN status='new' AND eligible_for_editorial=1 THEN 1 ELSE 0 END) AS awaiting_review
    FROM research_signals
  `).first<Record<string, unknown>>();

  const runs = await env.DB.prepare(`
    SELECT id,run_kind,query,generated_at,window_days,result_count,
           eligible_count,filtered_count,warning_count,created_at
    FROM research_runs
    ORDER BY generated_at DESC, id DESC
    LIMIT ?
  `).bind(limit).all<Record<string, unknown>>();

  return json({
    ok: true,
    totals: {
      total: Number(totals?.total || 0),
      eligible: Number(totals?.eligible || 0),
      filtered: Number(totals?.filtered || 0),
      awaitingReview: Number(totals?.awaiting_review || 0)
    },
    runs: runs.results
  });
}
