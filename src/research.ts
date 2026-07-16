import type { Env } from './types';

type JsonRecord = Record<string, unknown>;

type NormalizedSignal = {
  signalKey: string;
  signalType: 'question' | 'complaint' | 'comparison' | 'recommendation' | 'trend' | 'content_gap';
  topic: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string | null;
  engagement: JsonRecord;
  relevanceScore: number | null;
  momentum: string | null;
  corroborationCount: number;
  clusterTitle: string;
};

type NormalizedRun = {
  schemaVersion: string;
  kind: 'research' | 'discovery' | 'comparison';
  query: string;
  generatedAt: string;
  windowDays: number;
  sourceStatus: unknown;
  warnings: unknown[];
  signals: NormalizedSignal[];
};

const SIGNAL_STATUSES = new Set(['new', 'reviewed', 'accepted', 'dismissed', 'converted']);
const SIGNAL_TYPES = new Set(['question', 'complaint', 'comparison', 'recommendation', 'trend', 'content_gap']);

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

function record(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null;
}

function text(value: unknown, max = 4000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function integer(value: unknown, fallback = 0): number {
  const parsed = finite(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : fallback;
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function safeJson(value: unknown): string {
  try { return JSON.stringify(value ?? null); } catch { return 'null'; }
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('');
}

function classify(title: string, summary: string): NormalizedSignal['signalType'] {
  const value = `${title} ${summary}`.toLocaleLowerCase('it');
  if (/\b(vs\.?|versus|confronto|paragone|meglio di|better than)\b/.test(value)) return 'comparison';
  if (/\b(non funziona|problema|problemi|errore|truffa|scam|rimborso|refund|lento|slow|hotspot|throttl|fair use|assistenza|supporto|bloccato|failed|failure)\b/.test(value)) return 'complaint';
  if (title.includes('?') || /\b(come|quale|quanto|quando|perché|perche|dove|posso|conviene|how|which|what|when|why|can i|does)\b/.test(value)) return 'question';
  if (/\b(migliore|migliori|consiglio|consigli|recommend|best|worth it|conviene)\b/.test(value)) return 'recommendation';
  if (/\b(manca|nessuna guida|non trovo|content gap|unanswered|no answer)\b/.test(value)) return 'content_gap';
  return 'trend';
}

function normalizeScore(value: unknown): number | null {
  const score = finite(value);
  return score !== null && score >= 0 && score <= 1 ? score : null;
}

async function normalizeStandard(payload: JsonRecord): Promise<NormalizedRun> {
  const query = text(payload.query, 300) || 'ricerca senza titolo';
  const clusters = array(payload.clusters).map(record);
  const signals: NormalizedSignal[] = [];

  for (const raw of array(payload.results).slice(0, 100)) {
    const item = record(raw);
    if (!item) continue;
    const title = text(item.title, 500) || text(item.summary, 160) || 'Segnale senza titolo';
    const summary = text(item.summary, 5000);
    const source = text(item.source, 80) || 'unknown';
    const url = text(item.url, 2000);
    const candidateId = text(item.candidate_id, 300);
    const clusterIndex = integer(item.cluster, -1);
    const cluster = clusterIndex >= 0 ? clusters[clusterIndex] : null;
    const clusterTitle = cluster ? text(cluster.title, 300) : '';
    const signalKey = await sha256([query, candidateId, source, url, title].join('|'));

    signals.push({
      signalKey,
      signalType: classify(title, summary),
      topic: query,
      title,
      summary,
      source,
      url,
      publishedAt: text(item.published_at, 80) || null,
      engagement: record(item.engagement) || {},
      relevanceScore: normalizeScore(item.relevance_score),
      momentum: null,
      corroborationCount: cluster ? array(cluster.sources).length : 0,
      clusterTitle
    });
  }

  return {
    schemaVersion: text(payload.schema_version, 30) || 'unknown',
    kind: 'research',
    query,
    generatedAt: text(payload.generated_at, 80) || new Date().toISOString(),
    windowDays: Math.min(365, Math.max(1, integer(payload.window_days, 30))),
    sourceStatus: record(payload.source_status) || {},
    warnings: array(payload.warnings),
    signals
  };
}

async function normalizeDiscovery(payload: JsonRecord): Promise<NormalizedRun> {
  const domain = text(payload.domain, 300);
  const query = domain || 'discovery recente';
  const signals: NormalizedSignal[] = [];

  for (const raw of array(payload.results).slice(0, 100)) {
    const item = record(raw);
    if (!item) continue;
    const topic = text(item.topic, 300) || query;
    const summary = text(item.why_spiking, 5000);
    const sourceNames = array(item.sources).map((source) => text(source, 80)).filter(Boolean);
    const evidenceUrls = array(item.evidence_urls).map((url) => text(url, 2000)).filter(Boolean);
    const title = topic;
    const signalKey = await sha256(['discovery', topic, evidenceUrls[0] || '', text(item.momentum, 80)].join('|'));
    const velocityScore = finite(item.velocity_score);

    signals.push({
      signalKey,
      signalType: 'trend',
      topic,
      title,
      summary,
      source: sourceNames.length > 1 ? 'multi-source' : sourceNames[0] || 'discovery',
      url: evidenceUrls[0] || '',
      publishedAt: null,
      engagement: {
        native: record(item.engagement) || {},
        velocityScore,
        evidenceUrls
      },
      relevanceScore: null,
      momentum: text(item.momentum, 80) || null,
      corroborationCount: Math.max(integer(item.corroboration_count, 0), sourceNames.length),
      clusterTitle: topic
    });
  }

  return {
    schemaVersion: text(payload.schema_version, 30) || 'unknown',
    kind: 'discovery',
    query,
    generatedAt: text(payload.generated_at, 80) || new Date().toISOString(),
    windowDays: Math.min(365, Math.max(1, integer(payload.window_days, 30))),
    sourceStatus: record(payload.source_status) || {},
    warnings: array(payload.warnings),
    signals
  };
}

async function normalizeComparison(payload: JsonRecord): Promise<NormalizedRun> {
  const entities = array(payload.entities).map((entity) => text(entity, 200)).filter(Boolean);
  const combined: NormalizedSignal[] = [];
  const statuses: JsonRecord = {};
  let generatedAt = new Date().toISOString();
  let windowDays = 30;

  for (const raw of array(payload.reports)) {
    const envelope = record(raw);
    const report = envelope ? record(envelope.report) : null;
    if (!report) continue;
    const entity = text(envelope?.entity, 200) || text(report.query, 200);
    const normalized = await normalizeStandard(report);
    generatedAt = normalized.generatedAt;
    windowDays = normalized.windowDays;
    statuses[entity || `report-${combined.length + 1}`] = normalized.sourceStatus;
    for (const signal of normalized.signals) {
      combined.push({ ...signal, topic: entity || signal.topic, signalType: 'comparison' });
    }
  }

  return {
    schemaVersion: text(payload.schema_version, 30) || 'unknown',
    kind: 'comparison',
    query: entities.join(' vs ') || 'confronto recente',
    generatedAt,
    windowDays,
    sourceStatus: statuses,
    warnings: array(payload.warnings),
    signals: combined.slice(0, 100)
  };
}

async function normalizePayload(payload: JsonRecord): Promise<NormalizedRun> {
  if (payload.comparison === true) return normalizeComparison(payload);
  if (text(payload.kind, 30) === 'discovery') return normalizeDiscovery(payload);
  return normalizeStandard(payload);
}

export async function ingestResearch(request: Request, env: Env): Promise<Response> {
  const contentLength = integer(Number(request.headers.get('content-length')), 0);
  if (contentLength > 2_000_000) return json({ ok: false, error: 'payload_too_large' }, 413);

  let raw: unknown;
  try { raw = await request.json<unknown>(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
  const wrapper = record(raw);
  const payload = wrapper && record(wrapper.payload) ? record(wrapper.payload)! : wrapper;
  if (!payload) return json({ ok: false, error: 'object_payload_required' }, 400);

  const normalized = await normalizePayload(payload);
  if (!/^\d+\.\d+$/.test(normalized.schemaVersion)) {
    return json({ ok: false, error: 'unsupported_schema_version', schemaVersion: normalized.schemaVersion }, 400);
  }

  const payloadHash = await sha256(safeJson(payload));
  const existing = await env.DB.prepare('SELECT id,result_count FROM research_runs WHERE payload_hash=?')
    .bind(payloadHash).first<{ id: number; result_count: number }>();
  if (existing) return json({ ok: true, duplicate: true, runId: existing.id, signals: existing.result_count });

  const run = await env.DB.prepare(`
    INSERT INTO research_runs(
      source_system,schema_version,run_kind,query,generated_at,window_days,
      source_status_json,result_count,warning_count,payload_hash
    ) VALUES('last30days',?,?,?,?,?,?,?,?,?)
    RETURNING id
  `).bind(
    normalized.schemaVersion,
    normalized.kind,
    normalized.query,
    normalized.generatedAt,
    normalized.windowDays,
    safeJson(normalized.sourceStatus),
    normalized.signals.length,
    normalized.warnings.length,
    payloadHash
  ).first<{ id: number }>();

  if (!run) return json({ ok: false, error: 'research_run_insert_failed' }, 500);

  const statements = normalized.signals.map((signal) => env.DB.prepare(`
    INSERT OR IGNORE INTO research_signals(
      run_id,signal_key,signal_type,topic,title,summary,source,url,published_at,
      engagement_json,relevance_score,momentum,corroboration_count,cluster_title
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    run.id,
    signal.signalKey,
    signal.signalType,
    signal.topic,
    signal.title,
    signal.summary,
    signal.source,
    signal.url,
    signal.publishedAt,
    safeJson(signal.engagement),
    signal.relevanceScore,
    signal.momentum,
    signal.corroborationCount,
    signal.clusterTitle
  ));

  let inserted = 0;
  if (statements.length) {
    const results = await env.DB.batch(statements);
    inserted = results.reduce((total, result) => total + Number(result.meta.changes || 0), 0);
  }

  await env.DB.prepare(`
    INSERT OR IGNORE INTO maintenance_queue(
      dedupe_key,task_type,entity_type,entity_key,priority,payload_json
    ) VALUES(?,?,?,?,?,?)
  `).bind(
    `research-review:${payloadHash}`,
    'editorial_review',
    'page',
    `research:${run.id}`,
    normalized.kind === 'discovery' ? 75 : 65,
    safeJson({ reason: 'recent_demand_signals', runId: run.id, query: normalized.query, inserted })
  ).run();

  return json({
    ok: true,
    duplicate: false,
    runId: run.id,
    kind: normalized.kind,
    query: normalized.query,
    signalsReceived: normalized.signals.length,
    signalsInserted: inserted
  }, 201);
}

export async function listResearchSignals(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const requestedStatus = text(url.searchParams.get('status'), 30) || 'new';
  const requestedType = text(url.searchParams.get('type'), 30);
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '30', 10) || 30));
  if (!SIGNAL_STATUSES.has(requestedStatus)) return json({ ok: false, error: 'invalid_status' }, 400);
  if (requestedType && !SIGNAL_TYPES.has(requestedType)) return json({ ok: false, error: 'invalid_type' }, 400);

  const clauses = ['s.status=?'];
  const bindings: unknown[] = [requestedStatus];
  if (requestedType) {
    clauses.push('s.signal_type=?');
    bindings.push(requestedType);
  }
  bindings.push(limit);

  const result = await env.DB.prepare(`
    SELECT s.id,s.run_id,s.signal_type,s.topic,s.title,s.summary,s.source,s.url,
           s.published_at,s.engagement_json,s.relevance_score,s.momentum,
           s.corroboration_count,s.cluster_title,s.status,s.notes,s.created_at,
           r.query AS run_query,r.run_kind,r.generated_at
    FROM research_signals s
    JOIN research_runs r ON r.id=s.run_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY COALESCE(s.relevance_score,0) DESC,s.corroboration_count DESC,s.created_at DESC
    LIMIT ?
  `).bind(...bindings).all<Record<string, unknown>>();

  return json({
    ok: true,
    count: result.results.length,
    signals: result.results.map((item) => ({
      ...item,
      engagement: (() => { try { return JSON.parse(String(item.engagement_json || '{}')); } catch { return {}; } })(),
      engagement_json: undefined
    }))
  });
}

export async function updateResearchSignals(request: Request, env: Env): Promise<Response> {
  let raw: unknown;
  try { raw = await request.json<unknown>(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
  const body = record(raw);
  const status = text(body?.status, 30);
  const notes = text(body?.notes, 4000);
  const ids = array(body?.signalIds)
    .map((value) => finite(value))
    .filter((value): value is number => value !== null && Number.isInteger(value) && value > 0)
    .slice(0, 100);

  if (!SIGNAL_STATUSES.has(status) || status === 'new') return json({ ok: false, error: 'invalid_action_status' }, 400);
  if (!ids.length) return json({ ok: false, error: 'signalIds_required' }, 400);

  const placeholders = ids.map(() => '?').join(',');
  const result = await env.DB.prepare(`
    UPDATE research_signals
    SET status=?,notes=CASE WHEN ?<>'' THEN ? ELSE notes END,updated_at=CURRENT_TIMESTAMP
    WHERE id IN (${placeholders})
  `).bind(status, notes, notes, ...ids).run();

  return json({ ok: true, status, updated: Number(result.meta.changes || 0) });
}
