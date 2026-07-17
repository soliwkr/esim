import type { Env } from './types';

type Obj = Record<string, unknown>;
type CandidateStatus = 'pending' | 'processing' | 'verified' | 'contradicted' | 'insufficient' | 'dismissed';
type VerificationOutcome = 'verified' | 'contradicted' | 'insufficient' | 'dismissed';
type SubjectType = 'provider' | 'destination' | 'plan' | 'device' | 'page' | 'policy';
type SourceKind = 'official_provider' | 'official_help' | 'official_terms' | 'regulator' | 'manufacturer' | 'first_party_test';

const SUBJECT_TYPES = new Set<SubjectType>(['provider', 'destination', 'plan', 'device', 'page', 'policy']);
const SOURCE_KINDS = new Set<SourceKind>([
  'official_provider', 'official_help', 'official_terms', 'regulator', 'manufacturer', 'first_party_test'
]);
const OUTCOMES = new Set<VerificationOutcome>(['verified', 'contradicted', 'insufficient', 'dismissed']);
const TERMINAL = new Set<CandidateStatus>(['verified', 'contradicted', 'insufficient', 'dismissed']);

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

function uniqueStrings(value: unknown, maxItems = 20, maxLength = 500): string[] {
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

function validHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function validKey(value: unknown, max = 120): string | null {
  const candidate = str(value, max).toLocaleLowerCase('en');
  return /^[a-z0-9][a-z0-9._:-]*$/.test(candidate) ? candidate : null;
}

function validFieldName(value: unknown): string | null {
  const candidate = str(value, 120).toLocaleLowerCase('en');
  return /^[a-z0-9][a-z0-9_.-]*$/.test(candidate) ? candidate : null;
}

function sourceKinds(value: unknown): SourceKind[] {
  return [...new Set(arr(value)
    .map((item) => str(item, 80) as SourceKind)
    .filter((item) => SOURCE_KINDS.has(item)))];
}

function isDeclarativeClaim(value: string): boolean {
  if (value.length < 12) return false;
  return !/^(verificare|consultare|controllare|confermare|accertare|validare|stabilire|capire|determinare)\b/i.test(value);
}

function publicAtomicCandidate(row: Obj): Obj {
  const sourceId = row.source_id === null || row.source_id === undefined ? null : Number(row.source_id);
  const verificationId = row.claim_verification_id === null || row.claim_verification_id === undefined
    ? null
    : Number(row.claim_verification_id);
  const taskId = row.task_id === null || row.task_id === undefined ? null : Number(row.task_id);
  return {
    id: Number(row.id),
    briefId: Number(row.brief_id),
    parentCandidateId: row.parent_candidate_id === null || row.parent_candidate_id === undefined
      ? null
      : Number(row.parent_candidate_id),
    parentClaimText: row.parent_claim_text || null,
    atomic: Number(row.atomic || 0) === 1,
    subjectType: row.subject_type,
    subjectKey: row.subject_key,
    scope: parseJson(row.scope_json, {}),
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

const ATOMIC_SELECT = `
  SELECT c.*,p.claim_text AS parent_claim_text,
         b.proposed_title,b.slug_suggestion,b.priority_score,
         s.source_kind,s.label AS source_label,s.url AS source_url,
         s.trust_level AS source_trust_level,s.last_checked_at AS source_last_checked_at,
         v.verification_status,v.confidence AS verification_confidence,
         v.checked_at AS verification_checked_at,v.valid_until AS verification_valid_until,
         v.value_json AS verification_value_json,
         q.id AS task_id,q.status AS queue_status,q.priority AS queue_priority,
         q.attempts AS queue_attempts,q.last_error AS queue_last_error
  FROM editorial_claim_candidates c
  JOIN editorial_briefs b ON b.id=c.brief_id
  LEFT JOIN editorial_claim_candidates p ON p.id=c.parent_candidate_id
  LEFT JOIN source_registry s ON s.id=c.source_id
  LEFT JOIN claim_verifications v ON v.id=c.claim_verification_id
  LEFT JOIN maintenance_queue q
    ON q.entity_key=('editorial-claim:' || c.id) AND q.task_type='verify_claims'
`;

async function readAtomicCandidate(env: Env, candidateId: number): Promise<Obj | null> {
  const row = await env.DB.prepare(`${ATOMIC_SELECT} WHERE c.id=? AND c.atomic=1`)
    .bind(candidateId).first<Obj>();
  return row ? publicAtomicCandidate(row) : null;
}

async function decomposeCandidate(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'object_payload_required' }, 400);

  const parentCandidateId = integer(body.parentCandidateId);
  const actor = str(body.actor, 120) || 'human-reviewer';
  const rawClaims = arr(body.claims).slice(0, 20);
  if (parentCandidateId <= 0) return json({ ok: false, error: 'parentCandidateId_required' }, 400);
  if (!rawClaims.length) return json({ ok: false, error: 'claims_required' }, 400);

  const parent = await env.DB.prepare(`
    SELECT c.*,b.priority_score,b.slug_suggestion,b.proposed_title
    FROM editorial_claim_candidates c
    JOIN editorial_briefs b ON b.id=c.brief_id
    WHERE c.id=?
  `).bind(parentCandidateId).first<Obj>();
  if (!parent) return json({ ok: false, error: 'parent_claim_candidate_not_found' }, 404);
  if (Number(parent.atomic || 0) === 1) return json({ ok: false, error: 'atomic_candidate_cannot_be_decomposed' }, 409);
  if (!['pending', 'processing', 'dismissed'].includes(str(parent.status, 30))) {
    return json({ ok: false, error: 'parent_candidate_not_decomposable', status: parent.status }, 409);
  }

  const normalized: Array<{
    subjectType: SubjectType;
    subjectKey: string;
    fieldName: string;
    claimText: string;
    verificationQuestion: string;
    requiredSourceKinds: SourceKind[];
    scope: Obj;
  }> = [];

  for (const raw of rawClaims) {
    const item = obj(raw);
    if (!item) return json({ ok: false, error: 'each_claim_must_be_an_object' }, 400);
    const subjectType = str(item.subjectType, 40) as SubjectType;
    const subjectKey = validKey(item.subjectKey);
    const fieldName = validFieldName(item.fieldName);
    const claimText = str(item.claimText, 1000);
    const verificationQuestion = str(item.verificationQuestion, 1000);
    const requiredSourceKinds = sourceKinds(item.requiredSourceKinds);
    const scope = obj(item.scope) || {};

    if (!SUBJECT_TYPES.has(subjectType)) return json({ ok: false, error: 'invalid_subject_type' }, 400);
    if (!subjectKey) return json({ ok: false, error: 'invalid_subject_key' }, 400);
    if (!fieldName) return json({ ok: false, error: 'invalid_field_name' }, 400);
    if (!isDeclarativeClaim(claimText)) {
      return json({ ok: false, error: 'claim_text_must_be_atomic_and_declarative', claimText }, 400);
    }
    if (!verificationQuestion) return json({ ok: false, error: 'verification_question_required' }, 400);
    if (!requiredSourceKinds.length) return json({ ok: false, error: 'required_source_kinds_required' }, 400);

    normalized.push({ subjectType, subjectKey, fieldName, claimText, verificationQuestion, requiredSourceKinds, scope });
  }

  const created: Obj[] = [];
  let candidatesCreated = 0;
  let tasksCreated = 0;

  for (const claim of normalized) {
    const candidateKey = await sha256([
      'atomic-v1', parentCandidateId, claim.subjectType, claim.subjectKey,
      claim.fieldName, claim.claimText
    ].join('|'));
    const inserted = await env.DB.prepare(`
      INSERT OR IGNORE INTO editorial_claim_candidates(
        brief_id,candidate_key,field_name,claim_text,verification_question,
        required_source_kinds_json,parent_candidate_id,subject_type,subject_key,atomic,scope_json
      ) VALUES(?,?,?,?,?,?,?,?,?,1,?) RETURNING id
    `).bind(
      Number(parent.brief_id), candidateKey, claim.fieldName, claim.claimText,
      claim.verificationQuestion, JSON.stringify(claim.requiredSourceKinds), parentCandidateId,
      claim.subjectType, claim.subjectKey, JSON.stringify(claim.scope)
    ).first<{ id: number }>();

    const candidateId = inserted?.id || Number((await env.DB.prepare(
      'SELECT id FROM editorial_claim_candidates WHERE candidate_key=?'
    ).bind(candidateKey).first<{ id: number }>())?.id || 0);
    if (!candidateId) continue;

    if (inserted) {
      candidatesCreated += 1;
      await env.DB.prepare(`
        INSERT INTO editorial_claim_events(candidate_id,action,actor,details_json)
        VALUES(?,'created',?,?)
      `).bind(candidateId, actor, JSON.stringify({
        parentCandidateId,
        atomic: true,
        subjectType: claim.subjectType,
        subjectKey: claim.subjectKey,
        fieldName: claim.fieldName
      })).run();
    }

    const task = await env.DB.prepare(`
      INSERT OR IGNORE INTO maintenance_queue(
        dedupe_key,task_type,entity_type,entity_key,priority,payload_json
      ) VALUES(?,?,?,?,?,?) RETURNING id
    `).bind(
      `editorial-atomic-claim:${candidateKey}`,
      'verify_claims',
      claim.subjectType,
      `editorial-claim:${candidateId}`,
      clamp(Number(parent.priority_score || 50), 1, 100),
      JSON.stringify({
        reason: 'atomic_claim_decomposition',
        briefId: Number(parent.brief_id),
        parentCandidateId,
        candidateId,
        atomic: true,
        subjectType: claim.subjectType,
        subjectKey: claim.subjectKey,
        fieldName: claim.fieldName,
        claimText: claim.claimText,
        verificationQuestion: claim.verificationQuestion,
        requiredSourceKinds: claim.requiredSourceKinds,
        scope: claim.scope,
        targetSlug: str(parent.slug_suggestion, 140)
      })
    ).first<{ id: number }>();

    if (task?.id) {
      tasksCreated += 1;
      await env.DB.prepare(`
        INSERT INTO editorial_claim_events(candidate_id,action,actor,details_json)
        VALUES(?,'queued',?,json_object('taskId',?,'atomic',1))
      `).bind(candidateId, actor, task.id).run();
    }

    const result = await readAtomicCandidate(env, candidateId);
    if (result) created.push(result);
  }

  if (!created.length) return json({ ok: false, error: 'no_atomic_claims_persisted' }, 500);

  await env.DB.prepare(`
    UPDATE maintenance_queue
    SET status='cancelled',completed_at=CURRENT_TIMESTAMP,locked_at=NULL,locked_by=NULL,
        last_error=NULL,updated_at=CURRENT_TIMESTAMP
    WHERE entity_key=? AND task_type='verify_claims'
      AND status IN ('pending','processing','failed')
  `).bind(`editorial-claim:${parentCandidateId}`).run();

  const childIds = created.map((item) => Number(item.id));
  const decompositionNote = `Sostituito da claim atomici: ${childIds.join(', ')}`;
  await env.DB.prepare(`
    UPDATE editorial_claim_candidates
    SET status='dismissed',
        notes=CASE WHEN notes='' THEN ? ELSE notes || char(10) || ? END,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(decompositionNote, decompositionNote, parentCandidateId).run();

  await env.DB.prepare(`
    INSERT INTO editorial_claim_events(candidate_id,action,actor,details_json)
    VALUES(?,'dismissed',?,?)
  `).bind(parentCandidateId, actor, JSON.stringify({
    reason: 'superseded_by_atomic_claims',
    childCandidateIds: childIds
  })).run();

  return json({
    ok: true,
    idempotent: candidatesCreated === 0 && tasksCreated === 0,
    parentCandidateId,
    candidatesCreated,
    tasksCreated,
    candidateCount: created.length,
    candidates: created
  }, candidatesCreated || tasksCreated ? 201 : 200);
}

async function listAtomicCandidates(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const briefId = Number.parseInt(url.searchParams.get('briefId') || '0', 10) || 0;
  const parentCandidateId = Number.parseInt(url.searchParams.get('parentCandidateId') || '0', 10) || 0;
  const subjectType = str(url.searchParams.get('subjectType'), 40);
  const subjectKey = str(url.searchParams.get('subjectKey'), 120).toLocaleLowerCase('en');
  const status = str(url.searchParams.get('status'), 30) || 'all';
  const limit = clamp(Number.parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1, 100);
  if (status !== 'all' && !new Set(['pending', 'processing', 'verified', 'contradicted', 'insufficient', 'dismissed']).has(status)) {
    return json({ ok: false, error: 'invalid_candidate_status' }, 400);
  }
  if (subjectType && !SUBJECT_TYPES.has(subjectType as SubjectType)) {
    return json({ ok: false, error: 'invalid_subject_type' }, 400);
  }

  const clauses = ['c.atomic=1'];
  const bindings: unknown[] = [];
  if (briefId > 0) { clauses.push('c.brief_id=?'); bindings.push(briefId); }
  if (parentCandidateId > 0) { clauses.push('c.parent_candidate_id=?'); bindings.push(parentCandidateId); }
  if (subjectType) { clauses.push('c.subject_type=?'); bindings.push(subjectType); }
  if (subjectKey) { clauses.push('c.subject_key=?'); bindings.push(subjectKey); }
  if (status !== 'all') { clauses.push('c.status=?'); bindings.push(status); }
  bindings.push(limit);

  const rows = await env.DB.prepare(`
    ${ATOMIC_SELECT}
    WHERE ${clauses.join(' AND ')}
    ORDER BY b.priority_score DESC,c.subject_type,c.subject_key,c.field_name,c.id
    LIMIT ?
  `).bind(...bindings).all<Obj>();

  return json({
    ok: true,
    briefId: briefId || null,
    parentCandidateId: parentCandidateId || null,
    status,
    count: rows.results.length,
    candidates: rows.results.map(publicAtomicCandidate)
  });
}

async function resolveAtomicSource(
  env: Env,
  body: Obj,
  candidate: Obj,
  requiredKinds: SourceKind[]
): Promise<{ id: number; kind: SourceKind; freshnessDays: number } | null> {
  const requestedId = integer(body.sourceId);
  if (requestedId > 0) {
    const row = await env.DB.prepare(`
      SELECT id,entity_type,entity_key,source_kind,freshness_days
      FROM source_registry WHERE id=?
    `).bind(requestedId).first<Obj>();
    const kind = str(row?.source_kind, 80) as SourceKind;
    if (!row || !SOURCE_KINDS.has(kind) || !requiredKinds.includes(kind)) return null;
    if (row.entity_type !== candidate.subject_type || row.entity_key !== candidate.subject_key) return null;
    return { id: Number(row.id), kind, freshnessDays: Number(row.freshness_days || 14) };
  }

  const source = obj(body.source);
  if (!source) return null;
  const kind = str(source.kind, 80) as SourceKind;
  const label = str(source.label, 300);
  const url = validHttpsUrl(str(source.url, 2000));
  if (!SOURCE_KINDS.has(kind) || !requiredKinds.includes(kind) || !label || !url) return null;

  const trustDefault = kind === 'first_party_test' ? 4 : 5;
  const trustLevel = clamp(integer(source.trustLevel, trustDefault), 1, 5);
  const freshnessDays = clamp(integer(source.freshnessDays, 14), 1, 365);
  const row = await env.DB.prepare(`
    INSERT INTO source_registry(
      entity_type,entity_key,source_kind,label,url,trust_level,freshness_days,status,last_checked_at,notes
    ) VALUES(?,?,?,?,?,?,?,'active',CURRENT_TIMESTAMP,?)
    ON CONFLICT(entity_type,entity_key,url) DO UPDATE SET
      source_kind=excluded.source_kind,label=excluded.label,trust_level=excluded.trust_level,
      freshness_days=excluded.freshness_days,status='active',last_checked_at=CURRENT_TIMESTAMP,
      notes=CASE WHEN excluded.notes<>'' THEN excluded.notes ELSE source_registry.notes END,
      updated_at=CURRENT_TIMESTAMP
    RETURNING id,source_kind,freshness_days
  `).bind(
    candidate.subject_type, candidate.subject_key, kind, label, url,
    trustLevel, freshnessDays, str(source.notes, 2000)
  ).first<Obj>();
  if (!row) return null;
  return { id: Number(row.id), kind, freshnessDays: Number(row.freshness_days || freshnessDays) };
}

async function recordAtomicResult(request: Request, env: Env): Promise<Response> {
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
    WHERE c.id=? AND c.atomic=1
  `).bind(candidateId).first<Obj>();
  if (!candidate) return json({ ok: false, error: 'atomic_claim_candidate_not_found' }, 404);

  const currentStatus = str(candidate.status, 30) as CandidateStatus;
  if (TERMINAL.has(currentStatus)) {
    if (currentStatus === outcome) {
      return json({ ok: true, duplicate: true, candidate: await readAtomicCandidate(env, candidateId) });
    }
    return json({ ok: false, error: 'claim_candidate_already_terminal', currentStatus }, 409);
  }

  let sourceId: number | null = null;
  let claimVerificationId: number | null = null;
  if (outcome === 'verified' || outcome === 'contradicted') {
    if (!evidence) return json({ ok: false, error: 'evidence_required_for_factual_outcome' }, 400);
    const requiredKinds = sourceKinds(parseJson(candidate.required_source_kinds_json, []));
    const source = await resolveAtomicSource(env, body, candidate, requiredKinds);
    if (!source) {
      return json({
        ok: false,
        error: 'matching_approved_source_required',
        subjectType: candidate.subject_type,
        subjectKey: candidate.subject_key,
        allowedSourceKinds: requiredKinds
      }, 400);
    }
    sourceId = source.id;

    const confidenceValue = numberValue(body.confidence);
    const confidence = confidenceValue === null
      ? (outcome === 'verified' ? 1 : 0.9)
      : clamp(confidenceValue, 0, 1);
    const validUntil = str(body.validUntil, 50)
      || new Date(Date.now() + source.freshnessDays * 86_400_000).toISOString();
    const valueJson = JSON.stringify(body.value ?? { claimText: candidate.claim_text });
    const verificationStatus = outcome === 'verified' ? 'verified' : 'conflict';

    const verification = await env.DB.prepare(`
      INSERT INTO claim_verifications(
        entity_type,entity_key,field_name,value_json,source_id,verification_status,
        confidence,checked_at,valid_until,evidence,updated_at
      ) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(entity_type,entity_key,field_name,source_id) DO UPDATE SET
        value_json=excluded.value_json,verification_status=excluded.verification_status,
        confidence=excluded.confidence,checked_at=CURRENT_TIMESTAMP,valid_until=excluded.valid_until,
        evidence=excluded.evidence,updated_at=CURRENT_TIMESTAMP
      RETURNING id
    `).bind(
      candidate.subject_type, candidate.subject_key, candidate.field_name, valueJson,
      sourceId, verificationStatus, confidence, validUntil, evidence
    ).first<{ id: number }>();
    claimVerificationId = verification?.id || Number((await env.DB.prepare(`
      SELECT id FROM claim_verifications
      WHERE entity_type=? AND entity_key=? AND field_name=? AND source_id=?
    `).bind(
      candidate.subject_type, candidate.subject_key, candidate.field_name, sourceId
    ).first<{ id: number }>())?.id || 0);
    if (!claimVerificationId) return json({ ok: false, error: 'claim_verification_persist_failed' }, 500);
  }

  await env.DB.prepare(`
    UPDATE editorial_claim_candidates
    SET status=?,source_id=?,claim_verification_id=?,evidence=?,
        notes=CASE WHEN ?<>'' THEN ? ELSE notes END,updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND atomic=1
  `).bind(outcome, sourceId, claimVerificationId, evidence, notes, notes, candidateId).run();

  await env.DB.prepare(`
    INSERT INTO editorial_claim_events(
      candidate_id,action,actor,source_id,claim_verification_id,details_json
    ) VALUES(?,?,?,?,?,?)
  `).bind(candidateId, outcome, actor, sourceId, claimVerificationId, JSON.stringify({
    notes,
    taskId: taskId || null,
    atomic: true,
    subjectType: candidate.subject_type,
    subjectKey: candidate.subject_key
  })).run();

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
    candidate: await readAtomicCandidate(env, candidateId)
  });
}

export async function editorialAtomicClaimsApi(request: Request, env: Env, path: string): Promise<Response> {
  const authError = authorized(request, env);
  if (authError) return authError;

  if (request.method === 'POST' && path === 'api/maintenance/editorial-claim-decompose') {
    return decomposeCandidate(request, env);
  }
  if (request.method === 'GET' && path === 'api/maintenance/editorial-atomic-claims') {
    return listAtomicCandidates(request, env);
  }
  if (request.method === 'POST' && path === 'api/maintenance/editorial-atomic-claim-result') {
    return recordAtomicResult(request, env);
  }
  return json({ ok: false, error: 'editorial_atomic_claim_route_not_found' }, 404);
}
