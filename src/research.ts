import type { Env } from './types';

type Obj = Record<string, unknown>;
type SignalType = 'question' | 'complaint' | 'comparison' | 'recommendation' | 'trend' | 'content_gap';

type Signal = {
  key: string;
  type: SignalType;
  topic: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string | null;
  engagement: Obj;
  relevance: number | null;
  momentum: string | null;
  corroboration: number;
  cluster: string;
};

type Run = {
  schemaVersion: string;
  kind: 'research' | 'discovery' | 'comparison';
  query: string;
  generatedAt: string;
  windowDays: number;
  sourceStatus: unknown;
  warnings: unknown[];
  signals: Signal[];
};

const STATUSES = new Set(['new', 'reviewed', 'accepted', 'dismissed', 'converted']);
const TYPES = new Set<SignalType>(['question', 'complaint', 'comparison', 'recommendation', 'trend', 'content_gap']);

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

function int(value: unknown, fallback = 0): number {
  const parsed = num(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : fallback;
}

function stringify(value: unknown): string {
  try { return JSON.stringify(value ?? null); } catch { return 'null'; }
}

function parseJson(value: unknown): unknown {
  try { return JSON.parse(String(value || '{}')); } catch { return {}; }
}

async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('');
}

function classify(title: string, summary: string): SignalType {
  const value = `${title} ${summary}`.toLocaleLowerCase('it');
  if (/\b(vs\.?|versus|confronto|paragone|meglio di|better than)\b/.test(value)) return 'comparison';
  if (/\b(non funziona|problema|problemi|errore|truffa|scam|rimborso|refund|lento|slow|hotspot|throttl|fair use|assistenza|supporto|bloccato|failed|failure)\b/.test(value)) return 'complaint';
  if (title.includes('?') || /\b(come|quale|quanto|quando|perché|perche|dove|posso|conviene|how|which|what|when|why|can i|does)\b/.test(value)) return 'question';
  if (/\b(migliore|migliori|consiglio|consigli|recommend|best|worth it|conviene)\b/.test(value)) return 'recommendation';
  if (/\b(manca|nessuna guida|non trovo|content gap|unanswered|no answer)\b/.test(value)) return 'content_gap';
  return 'trend';
}

function score(value: unknown): number | null {
  const parsed = num(value);
  return parsed !== null && parsed >= 0 && parsed <= 1 ? parsed : null;
}

async function standard(payload: Obj): Promise<Run> {
  const query = str(payload.query, 300) || 'ricerca senza titolo';
  const clusters = arr(payload.clusters).map(obj);
  const signals: Signal[] = [];

  for (const raw of arr(payload.results).slice(0, 100)) {
    const item = obj(raw);
    if (!item) continue;
    const title = str(item.title, 500) || str(item.summary, 160) || 'Segnale senza titolo';
    const summary = str(item.summary, 5000);
    const source = str(item.source, 80) || 'unknown';
    const url = str(item.url, 2000);
    const candidateId = str(item.candidate_id, 300);
    const clusterIndex = int(item.cluster, -1);
    const cluster = clusterIndex >= 0 ? clusters[clusterIndex] : null;
    signals.push({
      key: await hash([query, candidateId, source, url, title].join('|')),
      type: classify(title, summary),
      topic: query,
      title,
      summary,
      source,
      url,
      publishedAt: str(item.published_at, 80) || null,
      engagement: obj(item.engagement) || {},
      relevance: score(item.relevance_score),
      momentum: null,
      corroboration: cluster ? arr(cluster.sources).length : 0,
      cluster: cluster ? str(cluster.title, 300) : ''
    });
  }

  return {
    schemaVersion: str(payload.schema_version, 30) || 'unknown',
    kind: 'research',
    query,
    generatedAt: str(payload.generated_at, 80) || new Date().toISOString(),
    windowDays: Math.min(365, Math.max(1, int(payload.window_days, 30))),
    sourceStatus: obj(payload.source_status) || {},
    warnings: arr(payload.warnings),
    signals
  };
}

async function discovery(payload: Obj): Promise<Run> {
  const query = str(payload.domain, 300) || 'discovery recente';
  const signals: Signal[] = [];

  for (const raw of arr(payload.results).slice(0, 100)) {
    const item = obj(raw);
    if (!item) continue;
    const topic = str(item.topic, 300) || query;
    const summary = str(item.why_spiking, 5000);
    const sources = arr(item.sources).map((value) => str(value, 80)).filter(Boolean);
    const urls = arr(item.evidence_urls).map((value) => str(value, 2000)).filter(Boolean);
    const momentum = str(item.momentum, 80) || null;
    signals.push({
      key: await hash(['discovery', topic, urls[0] || '', momentum || ''].join('|')),
      type: 'trend',
      topic,
      title: topic,
      summary,
      source: sources.length > 1 ? 'multi-source' : sources[0] || 'discovery',
      url: urls[0] || '',
      publishedAt: null,
      engagement: { native: obj(item.engagement) || {}, velocityScore: num(item.velocity_score), evidenceUrls: urls },
      relevance: null,
      momentum,
      corroboration: Math.max(int(item.corroboration_count, 0), sources.length),
      cluster: topic
    });
  }

  return {
    schemaVersion: str(payload.schema_version, 30) || 'unknown',
    kind: 'discovery',
    query,
    generatedAt: str(payload.generated_at, 80) || new Date().toISOString(),
    windowDays: Math.min(365, Math.max(1, int(payload.window_days, 30))),
    sourceStatus: obj(payload.source_status) || {},
    warnings: arr(payload.warnings),
    signals
  };
}

async function comparison(payload: Obj): Promise<Run> {
  const entities = arr(payload.entities).map((value) => str(value, 200)).filter(Boolean);
  const signals: Signal[] = [];
  const sourceStatus: Obj = {};
  let generatedAt = new Date().toISOString();
  let windowDays = 30;

  for (const raw of arr(payload.reports)) {
    const envelope = obj(raw);
    const report = envelope ? obj(envelope.report) : null;
    if (!report) continue;
    const entity = str(envelope?.entity, 200) || str(report.query, 200) || `entità-${signals.length + 1}`;
    const normalized = await standard(report);
    generatedAt = normalized.generatedAt;
    windowDays = normalized.windowDays;
    sourceStatus[entity] = normalized.sourceStatus;
    signals.push(...normalized.signals.map((signal) => ({ ...signal, topic: entity, type: 'comparison' as const })));
  }

  return {
    schemaVersion: str(payload.schema_version, 30) || 'unknown',
    kind: 'comparison',
    query: entities.join(' vs ') || 'confronto recente',
    generatedAt,
    windowDays,
    sourceStatus,
    warnings: arr(payload.warnings),
    signals: signals.slice(0, 100)
  };
}

async function normalize(payload: Obj): Promise<Run> {
  if (payload.comparison === true) return comparison(payload);
  if (str(payload.kind, 30) === 'discovery') return discovery(payload);
  return standard(payload);
}

export async function ingestResearch(request: Request, env: Env): Promise<Response> {
  const length = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(length) && length > 2_000_000) return json({ ok: false, error: 'payload_too_large' }, 413);

  let raw: unknown;
  try { raw = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
  const wrapper = obj(raw);
  const payload = wrapper && obj(wrapper.payload) ? obj(wrapper.payload)! : wrapper;
  if (!payload) return json({ ok: false, error: 'object_payload_required' }, 400);

  const run = await normalize(payload);
  if (!/^\d+\.\d+$/.test(run.schemaVersion)) {
    return json({ ok: false, error: 'unsupported_schema_version', schemaVersion: run.schemaVersion }, 400);
  }

  const payloadHash = await hash(stringify(payload));
  const existing = await env.DB.prepare('SELECT id,result_count FROM research_runs WHERE payload_hash=?')
    .bind(payloadHash).first<{ id: number; result_count: number }>();
  if (existing) return json({ ok: true, duplicate: true, runId: existing.id, signals: existing.result_count });

  const insertedRun = await env.DB.prepare(`
    INSERT INTO research_runs(
      source_system,schema_version,run_kind,query,generated_at,window_days,
      source_status_json,result_count,warning_count,payload_hash
    ) VALUES('last30days',?,?,?,?,?,?,?,?,?) RETURNING id
  `).bind(
    run.schemaVersion, run.kind, run.query, run.generatedAt, run.windowDays,
    stringify(run.sourceStatus), run.signals.length, run.warnings.length, payloadHash
  ).first<{ id: number }>();
  if (!insertedRun) return json({ ok: false, error: 'research_run_insert_failed' }, 500);

  const statements = run.signals.map((signal) => env.DB.prepare(`
    INSERT OR IGNORE INTO research_signals(
      run_id,signal_key,signal_type,topic,title,summary,source,url,published_at,
      engagement_json,relevance_score,momentum,corroboration_count,cluster_title
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    insertedRun.id, signal.key, signal.type, signal.topic, signal.title, signal.summary,
    signal.source, signal.url, signal.publishedAt, stringify(signal.engagement), signal.relevance,
    signal.momentum, signal.corroboration, signal.cluster
  ));

  let inserted = 0;
  if (statements.length) {
    const results = await env.DB.batch(statements);
    inserted = results.reduce((total, result) => total + Number(result.meta?.changes || 0), 0);
  }

  await env.DB.prepare(`
    INSERT OR IGNORE INTO maintenance_queue(
      dedupe_key,task_type,entity_type,entity_key,priority,payload_json
    ) VALUES(?,?,?,?,?,?)
  `).bind(
    `research-review:${payloadHash}`, 'editorial_review', 'page', `research:${insertedRun.id}`,
    run.kind === 'discovery' ? 75 : 65,
    stringify({ reason: 'recent_demand_signals', runId: insertedRun.id, query: run.query, inserted })
  ).run();

  return json({
    ok: true,
    duplicate: false,
    runId: insertedRun.id,
    kind: run.kind,
    query: run.query,
    signalsReceived: run.signals.length,
    signalsInserted: inserted
  }, 201);
}

export async function listResearchSignals(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const status = str(url.searchParams.get('status'), 30) || 'new';
  const type = str(url.searchParams.get('type'), 30);
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '30', 10) || 30));
  if (!STATUSES.has(status)) return json({ ok: false, error: 'invalid_status' }, 400);
  if (type && !TYPES.has(type as SignalType)) return json({ ok: false, error: 'invalid_type' }, 400);

  const clauses = ['s.status=?'];
  const bindings: unknown[] = [status];
  if (type) { clauses.push('s.signal_type=?'); bindings.push(type); }
  bindings.push(limit);

  const rows = await env.DB.prepare(`
    SELECT s.id,s.run_id,s.signal_type,s.topic,s.title,s.summary,s.source,s.url,
           s.published_at,s.engagement_json,s.relevance_score,s.momentum,
           s.corroboration_count,s.cluster_title,s.status,s.notes,s.created_at,
           r.query AS run_query,r.run_kind,r.generated_at
    FROM research_signals s JOIN research_runs r ON r.id=s.run_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY COALESCE(s.relevance_score,0) DESC,s.corroboration_count DESC,s.created_at DESC
    LIMIT ?
  `).bind(...bindings).all<Record<string, unknown>>();

  return json({
    ok: true,
    count: rows.results.length,
    signals: rows.results.map((row) => {
      const { engagement_json, ...rest } = row;
      return { ...rest, engagement: parseJson(engagement_json) };
    })
  });
}

export async function updateResearchSignals(request: Request, env: Env): Promise<Response> {
  let raw: unknown;
  try { raw = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
  const body = obj(raw);
  const status = str(body?.status, 30);
  const notes = str(body?.notes, 4000);
  const ids = arr(body?.signalIds)
    .map(num)
    .filter((value): value is number => value !== null && Number.isInteger(value) && value > 0)
    .slice(0, 100);

  if (!STATUSES.has(status) || status === 'new') return json({ ok: false, error: 'invalid_action_status' }, 400);
  if (!ids.length) return json({ ok: false, error: 'signalIds_required' }, 400);

  const placeholders = ids.map(() => '?').join(',');
  const result = await env.DB.prepare(`
    UPDATE research_signals
    SET status=?,notes=CASE WHEN ?<>'' THEN ? ELSE notes END,updated_at=CURRENT_TIMESTAMP
    WHERE id IN (${placeholders})
  `).bind(status, notes, notes, ...ids).run();

  return json({ ok: true, status, updated: Number(result.meta?.changes || 0) });
}
