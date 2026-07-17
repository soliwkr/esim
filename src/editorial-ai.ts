import type { Env } from './types';
import { generateVertexJson, missingVertexConfig, VertexGatewayError } from './vertex';

type Obj = Record<string, unknown>;
type AssetType = 'faq' | 'guide' | 'comparison' | 'destination' | 'provider_review' | 'troubleshooting' | 'update' | 'explainer';
type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational' | 'mixed';
type BriefStatus = 'proposed' | 'accepted' | 'dismissed' | 'converted';

type PromptSignal = {
  id: number;
  type: string;
  topic: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string | null;
  relevance: number | null;
  corroboration: number;
  freshnessDays: number | null;
  windowDays: number;
  qualityFlags: string[];
  engagement: unknown;
};

type ModelBrief = {
  clusterTitle?: unknown;
  proposedTitle?: unknown;
  slugSuggestion?: unknown;
  directAnswer?: unknown;
  rationale?: unknown;
  assetType?: unknown;
  searchIntent?: unknown;
  opportunityScore?: unknown;
  evidenceSignalIds?: unknown;
  risks?: unknown;
  requiredVerifications?: unknown;
  outline?: unknown;
};

type ModelResponse = { briefs?: unknown };

type NormalizedBrief = {
  clusterTitle: string;
  proposedTitle: string;
  slugSuggestion: string;
  directAnswer: string;
  rationale: string;
  assetType: AssetType;
  searchIntent: SearchIntent;
  opportunityScore: number;
  evidenceSignalIds: number[];
  evidenceScore: number;
  qualityFlags: string[];
  risks: string[];
  requiredVerifications: string[];
  outline: string[];
};

const PROMPT_VERSION = 'editorial-brief-v1';
const ASSET_TYPES = new Set<AssetType>(['faq', 'guide', 'comparison', 'destination', 'provider_review', 'troubleshooting', 'update', 'explainer']);
const SEARCH_INTENTS = new Set<SearchIntent>(['informational', 'commercial', 'transactional', 'navigational', 'mixed']);
const BRIEF_STATUSES = new Set<BriefStatus>(['accepted', 'dismissed', 'converted']);

const RESPONSE_SCHEMA: Obj = {
  type: 'OBJECT',
  properties: {
    briefs: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          clusterTitle: { type: 'STRING' },
          proposedTitle: { type: 'STRING' },
          slugSuggestion: { type: 'STRING' },
          directAnswer: { type: 'STRING' },
          rationale: { type: 'STRING' },
          assetType: { type: 'STRING', enum: [...ASSET_TYPES] },
          searchIntent: { type: 'STRING', enum: [...SEARCH_INTENTS] },
          opportunityScore: { type: 'INTEGER', minimum: 0, maximum: 100 },
          evidenceSignalIds: { type: 'ARRAY', items: { type: 'INTEGER' } },
          risks: { type: 'ARRAY', items: { type: 'STRING' } },
          requiredVerifications: { type: 'ARRAY', items: { type: 'STRING' } },
          outline: { type: 'ARRAY', items: { type: 'STRING' } }
        },
        required: [
          'clusterTitle', 'proposedTitle', 'slugSuggestion', 'directAnswer', 'rationale',
          'assetType', 'searchIntent', 'opportunityScore', 'evidenceSignalIds',
          'risks', 'requiredVerifications', 'outline'
        ]
      }
    }
  },
  required: ['briefs']
};

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

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function integer(value: unknown, fallback = 0): number {
  const parsed = numberValue(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function uniqueStrings(value: unknown, maxItems = 12, maxLength = 500): string[] {
  return [...new Set(arr(value).map((item) => str(item, maxLength)).filter(Boolean))].slice(0, maxItems);
}

function parseJson(value: unknown, fallback: unknown): unknown {
  try { return JSON.parse(String(value ?? '')); } catch { return fallback; }
}

function parseFlags(value: unknown): string[] {
  return uniqueStrings(parseJson(value, []), 20, 80);
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('');
}

function signalQualityFlags(row: Obj): string[] {
  const flags = parseFlags(row.quality_flags_json);
  const relevance = numberValue(row.relevance_score);
  const corroboration = Number(row.corroboration_count || 0);
  const text = `${String(row.title || '')} ${String(row.summary || '')}`.toLocaleLowerCase('it');

  if (relevance !== null && relevance < 0.35) flags.push('low_relevance');
  if (corroboration < 2) flags.push('uncorroborated');
  if (
    /\b(sponsor(?:ed|izzato|izzata)?|partnership|affiliat(?:e|o|a)|coupon|codice sconto|promo(?:zione)?|use code)\b/.test(text)
    || (/\b(offerta|sconto)\b/.test(text) && /\b(link|codice|coupon|acquista|piano)\b/.test(text))
  ) flags.push('promotional_or_sponsored');

  return [...new Set(flags)];
}

function toPromptSignal(row: Obj): PromptSignal {
  return {
    id: Number(row.id),
    type: str(row.signal_type, 40),
    topic: str(row.topic, 300),
    title: str(row.title, 500),
    summary: str(row.summary, 1200),
    source: str(row.source, 80),
    url: str(row.url, 2000),
    publishedAt: str(row.published_at, 80) || null,
    relevance: numberValue(row.relevance_score),
    corroboration: Math.max(0, integer(row.corroboration_count)),
    freshnessDays: numberValue(row.freshness_days),
    windowDays: Math.max(1, integer(row.window_days, 30)),
    qualityFlags: signalQualityFlags(row),
    engagement: parseJson(row.engagement_json, {})
  };
}

function evidenceScore(signals: PromptSignal[]): number {
  if (!signals.length) return 0;
  const relevance = signals.reduce((total, signal) => total + (signal.relevance ?? 0.3), 0) / signals.length;
  const freshness = signals.reduce((total, signal) => {
    if (signal.freshnessDays === null) return total + 0.5;
    return total + clamp(1 - signal.freshnessDays / Math.max(1, signal.windowDays + 7), 0, 1);
  }, 0) / signals.length;
  const corroboration = signals.reduce((total, signal) => total + Math.min(Math.max(signal.corroboration, 1), 3) / 3, 0) / signals.length;
  const sourceDiversity = Math.min(new Set(signals.map((signal) => signal.source)).size / 2, 1);
  const penalty = signals.some((signal) => signal.qualityFlags.includes('promotional_or_sponsored')) ? 10 : 0;
  return clamp(Math.round(relevance * 35 + freshness * 35 + corroboration * 20 + sourceDiversity * 10 - penalty), 0, 100);
}

function buildPrompt(signals: PromptSignal[]): string {
  return [
    'Sei il motore di intelligence editoriale di Senza Roaming, sito italiano sulle eSIM da viaggio.',
    'Produci esclusivamente JSON conforme allo schema richiesto.',
    '',
    'REGOLE INVIOLABILI:',
    '- Usa soltanto i segnali forniti come evidenza di domanda, linguaggio, dubbi o problemi percepiti.',
    '- Reddit, YouTube e web editoriale NON verificano prezzi, copertura, reti, hotspot, fair use, VPN, rimborsi o condizioni commerciali.',
    '- Non trasformare testimonianze o contenuti sponsorizzati in fatti.',
    '- Ogni brief deve citare almeno un evidenceSignalId presente nell input.',
    '- Raggruppa segnali solo quando descrivono davvero lo stesso bisogno.',
    '- Crea da 1 a 5 brief; con un solo segnale crea normalmente un solo brief.',
    '- opportunityScore misura il valore editoriale potenziale, non la certezza dei fatti.',
    '- directAnswer deve essere prudente e utile, senza inventare dettagli commerciali.',
    '- requiredVerifications deve elencare le verifiche su fonti ufficiali necessarie prima della pubblicazione.',
    '- I brief sono proposte soggette a revisione umana e non autorizzano la pubblicazione.',
    '',
    'SEGNALI IDONEI:',
    JSON.stringify(signals)
  ].join('\n');
}

async function readRequestObject(request: Request): Promise<Obj | null> {
  try {
    const value: unknown = await request.json();
    return obj(value);
  } catch {
    return null;
  }
}

async function loadSignals(env: Env, signalIds: number[], limit: number): Promise<PromptSignal[]> {
  let rows;
  if (signalIds.length) {
    const placeholders = signalIds.map(() => '?').join(',');
    rows = await env.DB.prepare(`
      SELECT s.id,s.signal_type,s.topic,s.title,s.summary,s.source,s.url,s.published_at,
             s.engagement_json,s.relevance_score,s.corroboration_count,s.freshness_days,
             s.quality_flags_json,r.window_days
      FROM research_signals s
      JOIN research_runs r ON r.id=s.run_id
      WHERE s.id IN (${placeholders})
        AND s.eligible_for_editorial=1
        AND s.status IN ('new','reviewed')
      ORDER BY COALESCE(s.relevance_score,0) DESC,s.corroboration_count DESC,s.created_at DESC
    `).bind(...signalIds).all<Obj>();
  } else {
    rows = await env.DB.prepare(`
      SELECT s.id,s.signal_type,s.topic,s.title,s.summary,s.source,s.url,s.published_at,
             s.engagement_json,s.relevance_score,s.corroboration_count,s.freshness_days,
             s.quality_flags_json,r.window_days
      FROM research_signals s
      JOIN research_runs r ON r.id=s.run_id
      WHERE s.eligible_for_editorial=1 AND s.status='new'
      ORDER BY COALESCE(s.relevance_score,0) DESC,s.corroboration_count DESC,s.created_at DESC
      LIMIT ?
    `).bind(limit).all<Obj>();
  }
  return rows.results.map(toPromptSignal);
}

function normalizeBriefs(data: ModelResponse, signals: PromptSignal[]): NormalizedBrief[] {
  const allowedIds = new Set(signals.map((signal) => signal.id));
  const signalMap = new Map(signals.map((signal) => [signal.id, signal]));

  return arr(data.briefs).slice(0, 5).flatMap((raw) => {
    const item = obj(raw) as ModelBrief | null;
    if (!item) return [];

    const evidenceSignalIds = [...new Set(arr(item.evidenceSignalIds)
      .map((value) => integer(value))
      .filter((value) => value > 0 && allowedIds.has(value)))];
    const proposedTitle = str(item.proposedTitle, 300);
    if (!proposedTitle || !evidenceSignalIds.length) return [];

    const assetCandidate = str(item.assetType, 40) as AssetType;
    const intentCandidate = str(item.searchIntent, 40) as SearchIntent;
    const assetType: AssetType = ASSET_TYPES.has(assetCandidate) ? assetCandidate : 'guide';
    const searchIntent: SearchIntent = SEARCH_INTENTS.has(intentCandidate) ? intentCandidate : 'informational';
    const selectedSignals = evidenceSignalIds.map((id) => signalMap.get(id)).filter((signal): signal is PromptSignal => Boolean(signal));
    const qualityFlags = [...new Set(selectedSignals.flatMap((signal) => signal.qualityFlags))];
    const score = evidenceScore(selectedSignals);
    if (score < 50) qualityFlags.push('weak_evidence');

    const requiredVerifications = uniqueStrings(item.requiredVerifications, 12, 500);
    if (
      searchIntent === 'commercial' || searchIntent === 'transactional'
      || assetType === 'comparison' || assetType === 'destination' || assetType === 'provider_review'
    ) {
      requiredVerifications.push('Verificare su fonti ufficiali prezzi, durata, dati, hotspot, fair use, rete, attivazione e rimborsi applicabili.');
    }

    return [{
      clusterTitle: str(item.clusterTitle, 300) || proposedTitle,
      proposedTitle,
      slugSuggestion: slugify(str(item.slugSuggestion, 140) || proposedTitle),
      directAnswer: str(item.directAnswer, 1200),
      rationale: str(item.rationale, 2000),
      assetType,
      searchIntent,
      opportunityScore: clamp(integer(item.opportunityScore, 50), 0, 100),
      evidenceSignalIds,
      evidenceScore: score,
      qualityFlags: [...new Set(qualityFlags)],
      risks: uniqueStrings(item.risks, 12, 500),
      requiredVerifications: [...new Set(requiredVerifications)].slice(0, 12),
      outline: uniqueStrings(item.outline, 12, 500)
    }];
  });
}

function publicBrief(row: Obj): Obj {
  return {
    id: Number(row.id),
    aiRunId: Number(row.ai_run_id),
    clusterTitle: row.cluster_title,
    proposedTitle: row.proposed_title,
    slugSuggestion: row.slug_suggestion,
    directAnswer: row.direct_answer,
    rationale: row.rationale,
    assetType: row.asset_type,
    searchIntent: row.search_intent,
    opportunityScore: Number(row.opportunity_score),
    evidenceScore: Number(row.evidence_score),
    qualityFlags: parseJson(row.quality_flags_json, []),
    risks: parseJson(row.risks_json, []),
    requiredVerifications: parseJson(row.required_verifications_json, []),
    outline: parseJson(row.outline_json, []),
    evidenceSignalIds: parseJson(row.signal_ids_json, []),
    status: row.status,
    notes: row.notes,
    model: row.model,
    promptVersion: row.prompt_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function briefsForRun(env: Env, runId: number): Promise<Obj[]> {
  const rows = await env.DB.prepare(`
    SELECT b.*,r.model,r.prompt_version,
      COALESCE((SELECT json_group_array(signal_id) FROM editorial_brief_signals x WHERE x.brief_id=b.id),'[]') AS signal_ids_json
    FROM editorial_briefs b
    JOIN ai_editorial_runs r ON r.id=b.ai_run_id
    WHERE b.ai_run_id=?
    ORDER BY b.opportunity_score DESC,b.evidence_score DESC,b.id ASC
  `).bind(runId).all<Obj>();
  return rows.results.map(publicBrief);
}

async function analyze(request: Request, env: Env): Promise<Response> {
  const body = await readRequestObject(request);
  if (!body) return json({ ok: false, error: 'object_payload_required' }, 400);

  const missing = missingVertexConfig(env);
  if (missing.length) return json({ ok: false, error: 'ai_gateway_not_configured', missing }, 503);

  const signalIds = [...new Set(arr(body.signalIds)
    .map((value) => integer(value))
    .filter((value) => value > 0))].slice(0, 20);
  const limit = clamp(integer(body.limit, 12), 1, 20);
  const reason = str(body.reason, 200) || 'eligible_recent_demand';
  const force = body.force === true;
  const signals = await loadSignals(env, signalIds, limit);

  if (!signals.length) return json({ ok: false, error: 'no_eligible_signals' }, 409);
  if (signalIds.length && signals.length !== signalIds.length) {
    return json({ ok: false, error: 'signals_not_eligible_or_not_found' }, 409);
  }

  const selectedIds = signals.map((signal) => signal.id).sort((a, b) => a - b);
  const model = env.GOOGLE_VERTEX_MODEL as string;
  const baseRunKey = await sha256(`${PROMPT_VERSION}|${model}|${selectedIds.join(',')}`);
  const existing = await env.DB.prepare('SELECT id,status FROM ai_editorial_runs WHERE run_key=?')
    .bind(baseRunKey).first<{ id: number; status: string }>();

  if (existing?.status === 'complete' && !force) {
    return json({ ok: true, duplicate: true, aiRunId: existing.id, briefs: await briefsForRun(env, existing.id) });
  }
  if (existing?.status === 'running' && !force) {
    return json({ ok: false, error: 'analysis_already_running', aiRunId: existing.id }, 409);
  }

  const runKey = force || existing ? await sha256(`${baseRunKey}|${crypto.randomUUID()}`) : baseRunKey;
  const insertedRun = await env.DB.prepare(`
    INSERT INTO ai_editorial_runs(
      run_key,model,prompt_version,reason,signal_ids_json,signal_count,status
    ) VALUES(?,?,?,?,?,?,'running') RETURNING id
  `).bind(runKey, model, PROMPT_VERSION, reason, JSON.stringify(selectedIds), selectedIds.length)
    .first<{ id: number }>();
  if (!insertedRun) return json({ ok: false, error: 'ai_editorial_run_insert_failed' }, 500);

  try {
    const generated = await generateVertexJson<ModelResponse>(env, buildPrompt(signals), RESPONSE_SCHEMA, {
      temperature: 0.2,
      maxOutputTokens: 4096
    });
    const briefs = normalizeBriefs(generated.data, signals);
    if (!briefs.length) throw new Error('Vertex AI returned no valid editorial briefs');

    const created: Obj[] = [];
    for (const brief of briefs) {
      const briefKey = await sha256(`${PROMPT_VERSION}|${brief.evidenceSignalIds.join(',')}|${brief.clusterTitle}`);
      const inserted = await env.DB.prepare(`
        INSERT OR IGNORE INTO editorial_briefs(
          ai_run_id,brief_key,cluster_title,proposed_title,slug_suggestion,direct_answer,rationale,
          asset_type,search_intent,opportunity_score,evidence_score,quality_flags_json,risks_json,
          required_verifications_json,outline_json
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id
      `).bind(
        insertedRun.id, briefKey, brief.clusterTitle, brief.proposedTitle, brief.slugSuggestion,
        brief.directAnswer, brief.rationale, brief.assetType, brief.searchIntent,
        brief.opportunityScore, brief.evidenceScore, JSON.stringify(brief.qualityFlags),
        JSON.stringify(brief.risks), JSON.stringify(brief.requiredVerifications), JSON.stringify(brief.outline)
      ).first<{ id: number }>();

      const briefId = inserted?.id || Number((await env.DB.prepare('SELECT id FROM editorial_briefs WHERE brief_key=?')
        .bind(briefKey).first<{ id: number }>())?.id || 0);
      if (!briefId) continue;

      await env.DB.batch(brief.evidenceSignalIds.map((signalId) => env.DB.prepare(`
        INSERT OR IGNORE INTO editorial_brief_signals(brief_id,signal_id) VALUES(?,?)
      `).bind(briefId, signalId)));

      await env.DB.prepare(`
        INSERT OR IGNORE INTO maintenance_queue(
          dedupe_key,task_type,entity_type,entity_key,priority,payload_json
        ) VALUES(?,?,?,?,?,?)
      `).bind(
        `editorial-brief:${briefKey}`, 'editorial_review', 'page', `editorial-brief:${briefId}`,
        clamp(brief.opportunityScore, 1, 100),
        JSON.stringify({
          reason: 'ai_editorial_brief', briefId, aiRunId: insertedRun.id,
          signalIds: brief.evidenceSignalIds, opportunityScore: brief.opportunityScore,
          evidenceScore: brief.evidenceScore
        })
      ).run();

      created.push({ id: briefId, ...brief, status: 'proposed' });
    }

    if (!created.length) throw new Error('No editorial briefs could be persisted');

    await env.DB.prepare(`
      UPDATE ai_editorial_runs SET
        status='complete',response_id=?,usage_json=?,brief_count=?,completed_at=CURRENT_TIMESTAMP,
        error_message=NULL,updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(generated.responseId, JSON.stringify(generated.usage), created.length, insertedRun.id).run();

    return json({
      ok: true,
      duplicate: false,
      aiRunId: insertedRun.id,
      model,
      promptVersion: PROMPT_VERSION,
      signalCount: selectedIds.length,
      briefCount: created.length,
      briefs: created
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 2000) : String(error).slice(0, 2000);
    await env.DB.prepare(`
      UPDATE ai_editorial_runs SET status='failed',error_message=?,completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(message, insertedRun.id).run();

    if (error instanceof VertexGatewayError) {
      return json({
        ok: false,
        error: 'ai_gateway_upstream_error',
        aiRunId: insertedRun.id,
        upstreamStatus: error.upstreamStatus,
        detail: error.detail.slice(0, 1200)
      }, 502);
    }
    return json({ ok: false, error: 'editorial_analysis_failed', aiRunId: insertedRun.id, detail: message }, 502);
  }
}

async function listBriefs(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const status = str(url.searchParams.get('status'), 30) || 'proposed';
  const limit = clamp(Number.parseInt(url.searchParams.get('limit') || '30', 10) || 30, 1, 100);
  if (!new Set(['proposed', 'accepted', 'dismissed', 'converted', 'all']).has(status)) {
    return json({ ok: false, error: 'invalid_brief_status' }, 400);
  }

  const where = status === 'all' ? '' : 'WHERE b.status=?';
  const statement = env.DB.prepare(`
    SELECT b.*,r.model,r.prompt_version,
      COALESCE((SELECT json_group_array(signal_id) FROM editorial_brief_signals x WHERE x.brief_id=b.id),'[]') AS signal_ids_json
    FROM editorial_briefs b
    JOIN ai_editorial_runs r ON r.id=b.ai_run_id
    ${where}
    ORDER BY b.opportunity_score DESC,b.evidence_score DESC,b.created_at DESC
    LIMIT ?
  `);
  const rows = status === 'all'
    ? await statement.bind(limit).all<Obj>()
    : await statement.bind(status, limit).all<Obj>();

  return json({ ok: true, status, count: rows.results.length, briefs: rows.results.map(publicBrief) });
}

async function updateBriefs(request: Request, env: Env): Promise<Response> {
  const body = await readRequestObject(request);
  if (!body) return json({ ok: false, error: 'object_payload_required' }, 400);

  const status = str(body.status, 30) as BriefStatus;
  const notes = str(body.notes, 4000);
  const ids = [...new Set(arr(body.briefIds).map((value) => integer(value)).filter((value) => value > 0))].slice(0, 100);
  if (!BRIEF_STATUSES.has(status)) return json({ ok: false, error: 'invalid_brief_action' }, 400);
  if (!ids.length) return json({ ok: false, error: 'briefIds_required' }, 400);

  const placeholders = ids.map(() => '?').join(',');
  const selected = await env.DB.prepare(`SELECT id,status FROM editorial_briefs WHERE id IN (${placeholders})`)
    .bind(...ids).all<Obj>();
  if (selected.results.length !== ids.length) return json({ ok: false, error: 'one_or_more_briefs_not_found' }, 404);
  if (status === 'converted' && selected.results.some((row) => row.status !== 'accepted')) {
    return json({ ok: false, error: 'brief_must_be_accepted_before_conversion' }, 409);
  }

  const result = await env.DB.prepare(`
    UPDATE editorial_briefs
    SET status=?,notes=CASE WHEN ?<>'' THEN ? ELSE notes END,updated_at=CURRENT_TIMESTAMP
    WHERE id IN (${placeholders})
  `).bind(status, notes, notes, ...ids).run();

  if (status === 'dismissed' || status === 'converted') {
    const queueStatus = status === 'dismissed' ? 'cancelled' : 'completed';
    const entityKeys = ids.map((id) => `editorial-brief:${id}`);
    const keyPlaceholders = entityKeys.map(() => '?').join(',');
    await env.DB.prepare(`
      UPDATE maintenance_queue
      SET status=?,completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
      WHERE entity_key IN (${keyPlaceholders}) AND status IN ('pending','processing')
    `).bind(queueStatus, ...entityKeys).run();
  }

  return json({ ok: true, status, updated: Number(result.meta?.changes || 0) });
}

export async function editorialAiApi(request: Request, env: Env, path: string): Promise<Response> {
  if (!env.MAINTENANCE_TOKEN) return json({ ok: false, error: 'maintenance_api_disabled' }, 503);
  if (request.headers.get('authorization') !== `Bearer ${env.MAINTENANCE_TOKEN}`) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  if (request.method === 'POST' && path === 'api/maintenance/editorial-analyze') return analyze(request, env);
  if (request.method === 'GET' && path === 'api/maintenance/editorial-briefs') return listBriefs(request, env);
  if (request.method === 'POST' && path === 'api/maintenance/editorial-brief-action') return updateBriefs(request, env);
  return json({ ok: false, error: 'editorial_ai_route_not_found' }, 404);
}
