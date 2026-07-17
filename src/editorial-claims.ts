import type { Env } from './types';

type Obj = Record<string, unknown>;
type CandidateStatus = 'pending' | 'processing' | 'verified' | 'contradicted' | 'insufficient' | 'dismissed';
type VerificationOutcome = 'verified' | 'contradicted' | 'insufficient' | 'dismissed';
type SourceKind = 'official_provider' | 'official_help' | 'official_terms' | 'regulator' | 'manufacturer' | 'first_party_test';

const CANDIDATE_STATUSES = new Set<CandidateStatus>([
  'pending', 'processing', 'verified', 'contradicted', 'insufficient', 'dismissed'
]);
const OUTCOMES = new Set<VerificationOutcome>(['verified', 'contradicted', 'insufficient', 'dismissed']);
const FACTUAL_SOURCE_KINDS = new Set<SourceKind>([
  'official_provider', 'official_help', 'official_terms', 'regulator', 'manufacturer', 'first_party_test'
]);

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

function authorized(request: Request, env: Env): Response | null {
  if (!env.MAINTENANCE_TOKEN) return json({ ok: false, error: 'maintenance_api_disabled' }, 503);
  if (request.headers.get('authorization') !== `Bearer ${env.MAINTENANCE_TOKEN}`) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }
  return null;
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

function integer(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isInteger(value) ? value : fallback;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseJson(value: unknown, fallback: unknown): unknown {
  try { return JSON.parse(String(value ?? '')); } catch { return fallback; }
}

function uniqueStrings(value: unknown, maxItems = 30, maxLength = 1000): string[] {
  return [...new Set(arr(value).map((item) => str(item, maxLength)).filter(Boolean))].slice(0, maxItems);
}

async function readBody(request: Request): Promise<Obj | null> {
  try {
    const value: unknown = await request.json();
    return obj(value);
  } catch {
    return null;
  }
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('');
}

function baseFieldName(text: string): string {
  const normalized = text.toLocaleLowerCase('it');
  if (/instrad|routing|traffico|great firewall|firewall/.test(normalized)) return 'routing_policy';
  if (/vpn|siti? bloccat|servizi? bloccat|accesso a google|social media/.test(normalized)) return 'blocked_services_access';
  if (/roaming|sim local|restrizion|censura/.test(normalized)) return 'roaming_restrictions';
  if (/prezzo|costo|tariff/.test(normalized)) return 'price';
  if (/durata|validit/.test(normalized)) return 'validity';
  if (/\bdati\b|giga|gb\b|data allowance/.test(normalized)) return 'data_allowance';
  if (/hotspot|tethering/.test(normalized)) return 'hotspot_policy';
  if (/fair use|fup|uso corretto/.test(normalized)) return 'fair_use_policy';
  if (/rete|copertura|operatore|network/.test(normalized)) return 'network_coverage';
  if (/attivazione|installazione|qr code/.test(normalized)) return 'activation_policy';
  if (/rimborso|refund/.test(normalized)) return 'refund_policy';
  if (/compatibil|dispositivo|device|telefono/.test(normalized)) return 'compatibility';
  return 'editorial_claim';
}

function fieldNameFor(text: string, index: number, used: Set<string>): string {
  const base = baseFieldName(text);
  let candidate = base === 'editorial_claim' ? `${base}_${index + 1}` : base;
  let suffix = 2;
  while (used.has(candidate)) candidate = `${base}_${suffix++}`;
  used.add(candidate);
  return candidate.slice(0, 120);
}

function claimTextFor(requirement: string): string {
  const stripped = requirement
    .replace(/^(verificare|controllare|confermare|accertare|validare|consultare)\s+/i, '')
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .trim();
  if (!stripped) return requirement;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function sourceKindsFor(text: string): SourceKind[] {
  const normalized = text.toLocaleLowerCase('it');
  const kinds = new Set<SourceKind>();
  if (/provider|pacchett|piano|condizioni|termini|rimborso|prezzo|durata|hotspot|fair use/.test(normalized)) {
    kinds.add('official_provider');
    kinds.add('official_help');
    kinds.add('official_terms');
  }
  if (/routing|instrad|traffico|vpn|firewall|rete|copertura|roaming|restrizion|censura/.test(normalized)) {
    kinds.add('official_help');
    kinds.add('official_terms');
    kinds.add('regulator');
    kinds.add('first_party_test');
  }
  if (/compatibil|dispositivo|telefono|installazione/.test(normalized)) {
    kinds.add('manufacturer');
    kinds.add('official_help');
  }
  if (!kinds.size) {
    kinds.add('official_provider');
    kinds.add('official_help');
    kinds.add('official_terms');
  }
  return [...kinds];
}

function validHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function publicCandidate(row: Obj): Obj {
  const sourceId = row.source_id === null || row.source_id === undefined ? null : Number(row.source_id);
  const verificationId = row.claim_verification_id === null || row.claim_verification_id === undefined
    ? null
    : Number(row.claim_verification_id);
  const taskId = row.task_id === null || row.task_id === undefined ? null : Number(row.task_id);
  return {
    id: Number(row.id),
    briefId: Number(row.brief_id),
    fieldName: row.field_name,
    claimText: row.claim_text,
    verificationQuestion: row.verification_question,
    requiredSourceKinds: parseJson(row.required_source_kinds_json, []),
    status: row.status,
    evidence: row.evidence,
    notes: row.notes,
    brief: {
      title: row.proposed_title,
      slugSuggestion: row.slug_suggestion,
      priorityScore: Number(row.priority_score || 0)
    },
    task: taskId ? {
      id: taskId,
      status: row.queue_status,
      priority: Number(row.queue_priority || 0),
      attempts: Number(row.queue_attempts || 0),
      lastError: row.queue_last_error || null
    } : null,
    source: sourceId ? {
      id: sourceId,
      kind: row.source_kind,
      label: row.source_label,
      url: row.source_url,
      trustLevel: Number(row.source_trust_level || 0),
      lastCheckedAt: row.source_last_checked_at || null
    } : null,
    verification: verificationId ? {
      id: verificationId,
      status: row.verification_status,
      confidence: Number(row.verification_confidence || 0),
      checkedAt: row.verification_checked_at,
      validUntil: row.verification_valid_until || null,
      value: parseJson(row.verification_value_json, null)
    } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function readCandidate(env: Env, candidateId: number): Promise<Obj | null> {
  const row = await env.DB.prepare(`
    SELECT c.*,b.proposed_title,b.slug_suggestion,b.priority_score,
           s.source_kind,s.label AS source_label,s.url AS source_url,
           s.trust_level AS source_trust_level,s.last_checked_at AS source_last_checked_at,
           v.verification_status,v.confidence AS verification_confidence,
           v.checked_at AS verification_checked_at,v.valid_until AS verification_valid_until,
           v.value_json AS verification_value_json,
           q.id AS task_id,q.status AS queue_status,q.priority AS queue_priority,
           q.attempts AS queue_attempts,q.last_error AS queue_last_error
    FROM editorial_claim_candidates c
    JOIN editorial_briefs b ON b.id=c.brief_id
    LEFT JOIN source_registry s ON s.id=c.source_id
    LEFT JOIN claim_verifications v ON v.id=c.claim_verification_id
    LEFT JOIN maintenance_queue q
      ON q.entity_key=('editorial-claim:' || c.id) AND q.task_type='verify_claims'
    WHERE c.id=?
  `).bind(candidateId).first<Obj>();
  return row ? publicCandidate(row) : null;
}

async function convertAcceptedBriefs(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'object_payload_required' }, 400);

  const singleId = integer(body.briefId);
  const ids = [...new Set([
    ...(singleId > 0 ? [singleId] : []),
    ...arr(body.briefIds).map((value) => integer(value)).filter((value) => value > 0)
  ])].slice(0, 20);
  const actor = str(body.actor, 120) || 'human-reviewer';
  if (!ids.length) return json({ ok: false, error: 'briefId_or_briefIds_required' }, 400);

  const placeholders = ids.map(() => '?').join(',');
  const briefs = await env.DB.prepare(`
    SELECT id,status,proposed_title,slug_suggestion,priority_score,required_verifications_json
    FROM editorial_briefs
    WHERE id IN (${placeholders})
    ORDER BY id ASC
  `).bind(...ids).all<Obj>();
  if (briefs.results.length !== ids.length) return json({ ok: false, error: 'one_or_more_briefs_not_found' }, 404);

  const invalid = briefs.results.filter((brief) => brief.status !== 'accepted' && brief.status !== 'converted');
  if (invalid.length) {
    return json({
      ok: false,
      error: 'brief_must_be_accepted_before_conversion',
      blockedBriefIds: invalid.map((brief) => Number(brief.id))
    }, 409);
  }

  const responseCandidates: Obj[] = [];
  let tasksCreated = 0;
  let candidatesCreated = 0;

  for (const brief of briefs.results) {
    const briefId = Number(brief.id);
    const requirements = uniqueStrings(parseJson(brief.required_verifications_json, []), 20, 1000);
    if (!requirements.length) {
      return json({ ok: false, error: 'brief_has_no_required_verifications', briefId }, 409);
    }

    const usedFields = new Set<string>();
    for (const [index, requirement] of requirements.entries()) {
      const fieldName = fieldNameFor(requirement, index, usedFields);
      const claimText = claimTextFor(requirement);
      const sourceKinds = sourceKindsFor(requirement);
      const candidateKey = await sha256(`${briefId}|${fieldName}|${requirement}`);
      const inserted = await env.DB.prepare(`
        INSERT OR IGNORE INTO editorial_claim_candidates(
          brief_id,candidate_key,field_name,claim_text,verification_question,required_source_kinds_json
        ) VALUES(?,?,?,?,?,?) RETURNING id
      `).bind(briefId, candidateKey, fieldName, claimText, requirement, JSON.stringify(sourceKinds))
        .first<{ id: number }>();

      const candidateId = inserted?.id || Number((await env.DB.prepare(
        'SELECT id FROM editorial_claim_candidates WHERE candidate_key=?'
      ).bind(candidateKey).first<{ id: number }>())?.id || 0);
      if (!candidateId) continue;

      if (inserted) {
        candidatesCreated += 1;
        await env.DB.prepare(`
          INSERT INTO editorial_claim_events(candidate_id,action,actor,details_json)
          VALUES(?,'created',?,json_object('briefId',?,'fieldName',?))
        `).bind(candidateId, actor, briefId, fieldName).run();
      }

      const task = await env.DB.prepare(`
        INSERT OR IGNORE INTO maintenance_queue(
          dedupe_key,task_type,entity_type,entity_key,priority,payload_json
        ) VALUES(?,?,?,?,?,?) RETURNING id
      `).bind(
        `editorial-claim:${candidateKey}`,
        'verify_claims',
        'page',
        `editorial-claim:${candidateId}`,
        clamp(Number(brief.priority_score || 50), 1, 100),
        JSON.stringify({
          reason: 'accepted_editorial_brief',
          briefId,
          candidateId,
          fieldName,
          claimText,
          verificationQuestion: requirement,
          requiredSourceKinds: sourceKinds,
          targetSlug: str(brief.slug_suggestion, 140) || `editorial-brief-${briefId}`
        })
      ).first<{ id: number }>();

      if (task?.id) {
        tasksCreated += 1;
        await env.DB.prepare(`
          INSERT INTO editorial_claim_events(candidate_id,action,actor,details_json)
          VALUES(?,'queued',?,json_object('taskId',?))
        `).bind(candidateId, actor, task.id).run();
      }

      const publicRow = await readCandidate(env, candidateId);
      if (publicRow) responseCandidates.push(publicRow);
    }

    await env.DB.prepare(`
      UPDATE editorial_briefs
      SET status='converted',updated_at=CURRENT_TIMESTAMP
      WHERE id=? AND status='accepted'
    `).bind(briefId).run();

    await env.DB.prepare(`
      UPDATE maintenance_queue
      SET status='completed',completed_at=CURRENT_TIMESTAMP,locked_at=NULL,locked_by=NULL,
          last_error=NULL,updated_at=CURRENT_TIMESTAMP
      WHERE entity_key=? AND task_type='editorial_review'
        AND status IN ('pending','processing','failed')
    `).bind(`editorial-brief:${briefId}`).run();
  }

  return json({
    ok: true,
    idempotent: candidatesCreated === 0 && tasksCreated === 0,
    briefIds: ids,
    candidatesCreated,
    tasksCreated,
    candidateCount: responseCandidates.length,
    candidates: responseCandidates
  }, candidatesCreated || tasksCreated ? 201 : 200);
}

async function listCandidates(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const status = (str(url.searchParams.get('status'), 30) || 'all') as CandidateStatus | 'all';
  const briefId = Number.parseInt(url.searchParams.get('briefId') || '0', 10) || 0;
  const limit = clamp(Number.parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1, 100);
  if (status !== 'all' && !CANDIDATE_STATUSES.has(status)) {
    return json({ ok: false, error: 'invalid_candidate_status' }, 400);
  }

  const clauses: string[] = [];
  const bindings: unknown[] = [];
  if (status !== 'all') { clauses.push('c.status=?'); bindings.push(status); }
  if (briefId > 0) { clauses.push('c.brief_id=?'); bindings.push(briefId); }
  bindings.push(limit);

  const rows = await env.DB.prepare(`
    SELECT c.*,b.proposed_title,b.slug_suggestion,b.priority_score,
           s.source_kind,s.label AS source_label,s.url AS source_url,
           s.trust_level AS source_trust_level,s.last_checked_at AS source_last_checked_at,
           v.verification_status,v.confidence AS verification_confidence,
           v.checked_at AS verification_checked_at,v.valid_until AS verification_valid_until,
           v.value_json AS verification_value_json,
           q.id AS task_id,q.status AS queue_status,q.priority AS queue_priority,
           q.attempts AS queue_attempts,q.last_error AS queue_last_error
    FROM editorial_claim_candidates c
    JOIN editorial_briefs b ON b.id=c.brief_id
    LEFT JOIN source_registry s ON s.id=c.source_id
    LEFT JOIN claim_verifications v ON v.id=c.claim_verification_id
    LEFT JOIN maintenance_queue q
      ON q.entity_key=('editorial-claim:' || c.id) AND q.task_type='verify_claims'
    ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
    ORDER BY b.priority_score DESC,c.brief_id ASC,c.id ASC
    LIMIT ?
  `).bind(...bindings).all<Obj>();

  return json({
    ok: true,
    status,
    briefId: briefId || null,
    count: rows.results.length,
    candidates: rows.results.map(publicCandidate)
  });
}

async function resolveSource(
  env: Env,
  body: Obj,
  entityKey: string,
  existingSourceId: number | null
): Promise<{ id: number; kind: SourceKind; freshnessDays: number } | null> {
  const requestedId = integer(body.sourceId) || existingSourceId || 0;
  if (requestedId > 0) {
    const row = await env.DB.prepare(`
      SELECT id,source_kind,freshness_days FROM source_registry WHERE id=?
    `).bind(requestedId).first<Obj>();
    const kind = str(row?.source_kind, 80) as SourceKind;
    if (!row || !FACTUAL_SOURCE_KINDS.has(kind)) return null;
    return { id: Number(row.id), kind, freshnessDays: Number(row.freshness_days || 14) };
  }

  const source = obj(body.source);
  if (!source) return null;
  const kind = str(source.kind, 80) as SourceKind;
  const label = str(source.label, 300);
  const url = validHttpsUrl(str(source.url, 2000));
  if (!FACTUAL_SOURCE_KINDS.has(kind) || !label || !url) return null;

  const trustDefault = kind === 'first_party_test' ? 4 : 5;
  const trustLevel = clamp(integer(source.trustLevel, trustDefault), 1, 5);
  const freshnessDays = clamp(integer(source.freshnessDays, 14), 1, 365);
  const row = await env.DB.prepare(`
    INSERT INTO source_registry(
      entity_type,entity_key,source_kind,label,url,trust_level,freshness_days,status,last_checked_at,notes
    ) VALUES('page',?,?,?,?,?,?,'active',CURRENT_TIMESTAMP,?)
    ON CONFLICT(entity_type,entity_key,url) DO UPDATE SET
      source_kind=excluded.source_kind,label=excluded.label,trust_level=excluded.trust_level,
      freshness_days=excluded.freshness_days,status='active',last_checked_at=CURRENT_TIMESTAMP,
      notes=CASE WHEN excluded.notes<>'' THEN excluded.notes ELSE source_registry.notes END,
      updated_at=CURRENT_TIMESTAMP
    RETURNING id,source_kind,freshness_days
  `).bind(entityKey, kind, label, url, trustLevel, freshnessDays, str(source.notes, 2000))
    .first<Obj>();
  if (!row) return null;
  return { id: Number(row.id), kind, freshnessDays: Number(row.freshness_days || freshnessDays) };
}

async function recordClaimResult(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'object_payload_required' }, 400);

  const candidateId = integer(body.candidateId);
  const outcome = str(body.outcome, 30) as VerificationOutcome;
  const actor = str(body.actor, 120) || 'human-reviewer';
  const evidence = str(body.evidence, 4000);
  const notes = str(body.notes, 4000);
  const taskId = integer(body.taskId);
  if (candidateId <= 0) return json({ ok: false, error: 'candidateId_required' }, 400);
  if (!OUTCOMES.has(outcome)) return json({ ok: false, error: 'invalid_claim_outcome' }, 400);

  const candidate = await env.DB.prepare(`
    SELECT c.*,b.slug_suggestion,b.proposed_title
    FROM editorial_claim_candidates c
    JOIN editorial_briefs b ON b.id=c.brief_id
    WHERE c.id=?
  `).bind(candidateId).first<Obj>();
  if (!candidate) return json({ ok: false, error: 'claim_candidate_not_found' }, 404);

  const currentStatus = str(candidate.status, 30) as CandidateStatus;
  if (['verified', 'contradicted', 'insufficient', 'dismissed'].includes(currentStatus)) {
    if (currentStatus === outcome) {
      return json({ ok: true, duplicate: true, candidate: await readCandidate(env, candidateId) });
    }
    return json({ ok: false, error: 'claim_candidate_already_terminal', currentStatus }, 409);
  }

  const entityKey = str(candidate.slug_suggestion, 140) || `editorial-brief-${candidate.brief_id}`;
  let sourceId: number | null = null;
  let claimVerificationId: number | null = null;

  if (outcome === 'verified' || outcome === 'contradicted') {
    if (!evidence) return json({ ok: false, error: 'evidence_required_for_factual_outcome' }, 400);
    const source = await resolveSource(
      env,
      body,
      entityKey,
      candidate.source_id === null || candidate.source_id === undefined ? null : Number(candidate.source_id)
    );
    if (!source) {
      return json({
        ok: false,
        error: 'approved_factual_source_required',
        allowedSourceKinds: [...FACTUAL_SOURCE_KINDS]
      }, 400);
    }
    sourceId = source.id;

    const confidenceValue = numberValue(body.confidence);
    const confidence = confidenceValue === null
      ? (outcome === 'verified' ? 1 : 0.9)
      : clamp(confidenceValue, 0, 1);
    const defaultValidUntil = new Date(Date.now() + source.freshnessDays * 86_400_000).toISOString();
    const validUntil = str(body.validUntil, 50) || defaultValidUntil;
    const valueJson = JSON.stringify(body.value ?? { claimText: candidate.claim_text });
    const verificationStatus = outcome === 'verified' ? 'verified' : 'conflict';

    const verification = await env.DB.prepare(`
      INSERT INTO claim_verifications(
        entity_type,entity_key,field_name,value_json,source_id,verification_status,
        confidence,checked_at,valid_until,evidence,updated_at
      ) VALUES('page',?,?,?,?,?,?,CURRENT_TIMESTAMP,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(entity_type,entity_key,field_name,source_id) DO UPDATE SET
        value_json=excluded.value_json,verification_status=excluded.verification_status,
        confidence=excluded.confidence,checked_at=CURRENT_TIMESTAMP,valid_until=excluded.valid_until,
        evidence=excluded.evidence,updated_at=CURRENT_TIMESTAMP
      RETURNING id
    `).bind(
      entityKey,
      str(candidate.field_name, 120),
      valueJson,
      sourceId,
      verificationStatus,
      confidence,
      validUntil,
      evidence
    ).first<{ id: number }>();
    claimVerificationId = verification?.id || Number((await env.DB.prepare(`
      SELECT id FROM claim_verifications
      WHERE entity_type='page' AND entity_key=? AND field_name=? AND source_id=?
    `).bind(entityKey, candidate.field_name, sourceId).first<{ id: number }>())?.id || 0);
    if (!claimVerificationId) return json({ ok: false, error: 'claim_verification_persist_failed' }, 500);
  }

  await env.DB.prepare(`
    UPDATE editorial_claim_candidates
    SET status=?,source_id=?,claim_verification_id=?,evidence=?,
        notes=CASE WHEN ?<>'' THEN ? ELSE notes END,updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(outcome, sourceId, claimVerificationId, evidence, notes, notes, candidateId).run();

  await env.DB.prepare(`
    INSERT INTO editorial_claim_events(
      candidate_id,action,actor,source_id,claim_verification_id,details_json
    ) VALUES(?,?,?,?,?,json_object('notes',?,'taskId',?))
  `).bind(candidateId, outcome, actor, sourceId, claimVerificationId, notes, taskId || null).run();

  const queueStatus = outcome === 'dismissed' ? 'cancelled' : 'completed';
  if (taskId > 0) {
    await env.DB.prepare(`
      UPDATE maintenance_queue
      SET status=?,completed_at=CURRENT_TIMESTAMP,locked_at=NULL,locked_by=NULL,
          last_error=NULL,updated_at=CURRENT_TIMESTAMP
      WHERE id=? AND entity_key=? AND task_type='verify_claims'
    `).bind(queueStatus, taskId, `editorial-claim:${candidateId}`).run();
  } else {
    await env.DB.prepare(`
      UPDATE maintenance_queue
      SET status=?,completed_at=CURRENT_TIMESTAMP,locked_at=NULL,locked_by=NULL,
          last_error=NULL,updated_at=CURRENT_TIMESTAMP
      WHERE entity_key=? AND task_type='verify_claims'
        AND status IN ('pending','processing','failed')
    `).bind(queueStatus, `editorial-claim:${candidateId}`).run();
  }

  return json({
    ok: true,
    duplicate: false,
    outcome,
    candidate: await readCandidate(env, candidateId)
  });
}

export async function editorialClaimsApi(request: Request, env: Env, path: string): Promise<Response> {
  const authError = authorized(request, env);
  if (authError) return authError;

  if (request.method === 'POST' && path === 'api/maintenance/editorial-brief-convert') {
    return convertAcceptedBriefs(request, env);
  }
  if (request.method === 'GET' && path === 'api/maintenance/editorial-claim-candidates') {
    return listCandidates(request, env);
  }
  if (request.method === 'POST' && path === 'api/maintenance/editorial-claim-result') {
    return recordClaimResult(request, env);
  }
  return json({ ok: false, error: 'editorial_claim_route_not_found' }, 404);
}
