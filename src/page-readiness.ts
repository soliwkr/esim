import type { Env } from './types';

type Obj = Record<string, unknown>;
type ReviewAction = 'approved_for_draft' | 'changes_requested' | 'approved_for_publication';

const FORMULA_VERSION = 'page-readiness-v1';
const REVIEW_ACTIONS = new Set<ReviewAction>([
  'approved_for_draft', 'changes_requested', 'approved_for_publication'
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseJson(value: unknown, fallback: unknown): unknown {
  try { return JSON.parse(String(value ?? '')); } catch { return fallback; }
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

function isoExpired(value: unknown, nowMs: number): boolean {
  const text = str(value, 80);
  if (!text) return false;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) && parsed <= nowMs;
}

function publicBundle(row: Obj): Obj {
  return {
    id: Number(row.id),
    briefId: Number(row.brief_id),
    pageSlug: row.page_slug,
    version: Number(row.version),
    bundleKey: row.bundle_key,
    formulaVersion: row.formula_version,
    readinessScore: Number(row.readiness_score),
    reviewDraftEligible: Number(row.review_draft_eligible) === 1,
    publicationEligible: Number(row.publication_eligible) === 1,
    readyForReviewDraft: Number(row.ready_for_review_draft) === 1,
    readyForPublication: Number(row.ready_for_publication) === 1,
    reviewStatus: row.review_status,
    summary: {
      verified: Number(row.verified_count || 0),
      insufficient: Number(row.insufficient_count || 0),
      contradicted: Number(row.contradicted_count || 0),
      pending: Number(row.pending_count || 0),
      dismissed: Number(row.dismissed_count || 0),
      expired: Number(row.expired_count || 0),
      conflicts: Number(row.conflict_count || 0),
      sources: Number(row.source_count || 0),
      subjects: Number(row.subject_count || 0),
      firstPartyTests: Number(row.first_party_test_count || 0)
    },
    blockers: parseJson(row.blockers_json, []),
    warnings: parseJson(row.warnings_json, []),
    bundle: parseJson(row.bundle_json, {}),
    generatedBy: row.generated_by,
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    reviewNotes: row.review_notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function vpnConflictGroups(claims: Obj[]): Obj[] {
  const subjects = new Map<string, { positive: number[]; negative: number[]; fields: string[] }>();

  for (const claim of claims) {
    if (claim.status !== 'verified' || claim.expired === true) continue;
    if (claim.subjectType !== 'provider') continue;
    const fieldName = str(claim.fieldName, 160).toLocaleLowerCase('en');
    if (!fieldName.includes('vpn')) continue;
    const value = obj(claim.value) || {};
    const scope = obj(claim.scope) || {};
    const destination = str(scope.destination, 80).toLocaleLowerCase('en') || 'global';
    const key = `${claim.subjectKey}:${destination}`;
    const bucket = subjects.get(key) || { positive: [], negative: [], fields: [] };
    const id = Number(claim.id);

    if (value.integratedVpnClaim === true || value.builtInVpnServiceOffered === true) {
      bucket.positive.push(id);
    }
    if (value.builtInVpnServiceOffered === false) {
      bucket.negative.push(id);
    }
    bucket.fields.push(fieldName);
    subjects.set(key, bucket);
  }

  const conflicts: Obj[] = [];
  for (const [key, bucket] of subjects.entries()) {
    if (!bucket.positive.length || !bucket.negative.length) continue;
    const [subjectKey, destination] = key.split(':');
    conflicts.push({
      type: 'scoped_official_document_conflict',
      subjectType: 'provider',
      subjectKey,
      destination,
      positiveClaimIds: bucket.positive,
      negativeClaimIds: bucket.negative,
      fields: [...new Set(bucket.fields)],
      message: 'Fonti ufficiali dello stesso provider usano formulazioni divergenti sulla presenza di una VPN integrata. Il draft deve mantenere scope e attribuzione separati.'
    });
  }
  return conflicts;
}

async function readBundle(env: Env, bundleId: number): Promise<Obj | null> {
  const row = await env.DB.prepare('SELECT * FROM page_evidence_bundles WHERE id=?')
    .bind(bundleId).first<Obj>();
  return row ? publicBundle(row) : null;
}

async function evaluateReadiness(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'object_payload_required' }, 400);
  const briefId = integer(body.briefId);
  const actor = str(body.actor, 120) || 'system';
  const force = body.force === true;
  if (briefId <= 0) return json({ ok: false, error: 'briefId_required' }, 400);

  const brief = await env.DB.prepare(`
    SELECT b.*,r.model,r.prompt_version
    FROM editorial_briefs b
    JOIN ai_editorial_runs r ON r.id=b.ai_run_id
    WHERE b.id=?
  `).bind(briefId).first<Obj>();
  if (!brief) return json({ ok: false, error: 'editorial_brief_not_found' }, 404);

  const claimRows = await env.DB.prepare(`
    SELECT c.*,
           s.source_kind,s.label AS source_label,s.url AS source_url,
           s.trust_level,s.status AS source_status,s.last_checked_at,
           v.verification_status,v.confidence,v.checked_at,v.valid_until,v.value_json
    FROM editorial_claim_candidates c
    LEFT JOIN source_registry s ON s.id=c.source_id
    LEFT JOIN claim_verifications v ON v.id=c.claim_verification_id
    WHERE c.brief_id=? AND c.atomic=1
    ORDER BY c.subject_type,c.subject_key,c.field_name,c.id
  `).bind(briefId).all<Obj>();

  const signalRows = await env.DB.prepare(`
    SELECT s.id,s.signal_type,s.topic,s.title,s.summary,s.source,s.url,s.published_at,
           s.relevance_score,s.corroboration_count,s.status
    FROM editorial_brief_signals bs
    JOIN research_signals s ON s.id=bs.signal_id
    WHERE bs.brief_id=?
    ORDER BY s.id
  `).bind(briefId).all<Obj>();

  const now = new Date();
  const nowMs = now.getTime();
  const claims: Obj[] = claimRows.results.map((row) => {
    const status = str(row.status, 30);
    const validUntil = row.valid_until || null;
    const expired = status === 'verified' && (
      isoExpired(validUntil, nowMs) || (row.source_status && row.source_status !== 'active')
    );
    return {
      id: Number(row.id),
      parentCandidateId: row.parent_candidate_id === null ? null : Number(row.parent_candidate_id),
      subjectType: row.subject_type,
      subjectKey: row.subject_key,
      scope: parseJson(row.scope_json, {}),
      fieldName: row.field_name,
      claimText: row.claim_text,
      verificationQuestion: row.verification_question,
      requiredSourceKinds: parseJson(row.required_source_kinds_json, []),
      status,
      expired,
      evidence: row.evidence,
      notes: row.notes,
      source: row.source_id ? {
        id: Number(row.source_id),
        kind: row.source_kind,
        label: row.source_label,
        url: row.source_url,
        trustLevel: Number(row.trust_level || 0),
        status: row.source_status,
        lastCheckedAt: row.last_checked_at || null
      } : null,
      verification: row.claim_verification_id ? {
        id: Number(row.claim_verification_id),
        status: row.verification_status,
        confidence: Number(row.confidence || 0),
        checkedAt: row.checked_at,
        validUntil
      } : null,
      value: parseJson(row.value_json, null)
    };
  });

  const verified = claims.filter((claim) => claim.status === 'verified' && claim.expired !== true);
  const insufficient = claims.filter((claim) => claim.status === 'insufficient');
  const contradicted = claims.filter((claim) => claim.status === 'contradicted');
  const pending = claims.filter((claim) => claim.status === 'pending' || claim.status === 'processing');
  const dismissed = claims.filter((claim) => claim.status === 'dismissed');
  const expired = claims.filter((claim) => claim.expired === true);
  const sourceIds = new Set(verified.map((claim) => Number((obj(claim.source) || {}).id || 0)).filter(Boolean));
  const subjects = new Set(verified.map((claim) => `${claim.subjectType}:${claim.subjectKey}`));
  const firstPartyTests = verified.filter((claim) => (obj(claim.source) || {}).kind === 'first_party_test');
  const conflicts = vpnConflictGroups(claims);

  const blockers: Obj[] = [];
  if (!['accepted', 'converted'].includes(str(brief.status, 30))) {
    blockers.push({ code: 'brief_not_accepted', message: 'Il brief deve essere accettato o convertito prima del gate.' });
  }
  if (!claims.length) blockers.push({ code: 'no_atomic_claims', message: 'Non esistono claim atomici per il brief.' });
  if (!verified.length) blockers.push({ code: 'no_current_verified_claims', message: 'Non esistono claim verificati e correnti.' });
  if (pending.length) blockers.push({ code: 'pending_claims', claimIds: pending.map((claim) => claim.id) });
  if (expired.length) blockers.push({ code: 'expired_claims', claimIds: expired.map((claim) => claim.id) });
  if (contradicted.length) blockers.push({ code: 'contradicted_claims', claimIds: contradicted.map((claim) => claim.id) });

  const warnings: Obj[] = [];
  if (insufficient.length) warnings.push({
    code: 'insufficient_claims',
    claimIds: insufficient.map((claim) => claim.id),
    message: 'Questi claim possono essere descritti soltanto come non dimostrati; non possono alimentare frasi fattuali.'
  });
  if (conflicts.length) warnings.push({
    code: 'scoped_source_conflicts',
    conflicts,
    message: 'Le formulazioni divergenti devono restare separate e attribuite nel draft.'
  });
  if (!firstPartyTests.length) warnings.push({
    code: 'no_first_party_test',
    message: 'Il bundle contiene dichiarazioni ufficiali dei provider, ma nessun test indipendente sul campo.'
  });
  warnings.push({
    code: 'provider_statements_require_attribution',
    message: 'Le affermazioni verificate descrivono ciò che i provider dichiarano; non diventano garanzie indipendenti.'
  });

  const reviewDraftEligible = blockers.length === 0;
  const publicationEligible = reviewDraftEligible
    && insufficient.length === 0
    && conflicts.length === 0;

  const score = clamp(
    30
      + Math.min(verified.length * 10, 40)
      + Math.min(subjects.size * 5, 15)
      + (expired.length === 0 ? 10 : 0)
      + (pending.length === 0 ? 5 : 0)
      - insufficient.length * 8
      - contradicted.length * 20
      - conflicts.length * 15
      - expired.length * 15
      - pending.length * 10,
    0,
    100
  );

  const pageSlug = str(brief.slug_suggestion, 140) || `editorial-brief-${briefId}`;
  const coreBundle: Obj = {
    formulaVersion: FORMULA_VERSION,
    brief: {
      id: briefId,
      status: brief.status,
      clusterTitle: brief.cluster_title,
      proposedTitle: brief.proposed_title,
      pageSlug,
      directAnswer: brief.direct_answer,
      rationale: brief.rationale,
      assetType: brief.asset_type,
      searchIntent: brief.search_intent,
      opportunityScore: Number(brief.opportunity_score || 0),
      evidenceScore: Number(brief.evidence_score || 0),
      priorityScore: Number(brief.priority_score || 0),
      qualityFlags: parseJson(brief.quality_flags_json, []),
      risks: parseJson(brief.risks_json, []),
      outline: parseJson(brief.outline_json, []),
      model: brief.model,
      promptVersion: brief.prompt_version
    },
    signals: signalRows.results.map((signal) => ({
      id: Number(signal.id),
      type: signal.signal_type,
      topic: signal.topic,
      title: signal.title,
      summary: signal.summary,
      source: signal.source,
      url: signal.url,
      publishedAt: signal.published_at,
      relevanceScore: signal.relevance_score,
      corroborationCount: Number(signal.corroboration_count || 0),
      status: signal.status
    })),
    claims,
    conflicts,
    summary: {
      verified: verified.length,
      insufficient: insufficient.length,
      contradicted: contradicted.length,
      pending: pending.length,
      dismissed: dismissed.length,
      expired: expired.length,
      conflicts: conflicts.length,
      sources: sourceIds.size,
      subjects: subjects.size,
      firstPartyTests: firstPartyTests.length
    },
    decision: {
      readinessScore: score,
      reviewDraftEligible,
      publicationEligible,
      readyForReviewDraft: reviewDraftEligible,
      readyForPublication: false,
      blockers,
      warnings
    },
    contentRules: [
      'Usare soltanto claim verified e non scaduti come fatti attribuiti.',
      'Non trasformare dichiarazioni del provider in garanzie indipendenti.',
      'Non usare claim insufficient come fatti.',
      'Mostrare separatamente scope e documenti quando esistono formulazioni divergenti.',
      'Mantenere il contenuto in review finché una persona non approva il bundle.',
      'La pubblicazione richiede un gate umano separato e publicationEligible=true.'
    ]
  };

  const bundleKey = await sha256(JSON.stringify(coreBundle));
  const existing = await env.DB.prepare('SELECT * FROM page_evidence_bundles WHERE bundle_key=?')
    .bind(bundleKey).first<Obj>();
  if (existing && !force) {
    await env.DB.prepare(`
      INSERT INTO page_readiness_events(bundle_id,action,actor,details_json)
      VALUES(?,'duplicate',?,json_object('briefId',?,'bundleKey',?))
    `).bind(Number(existing.id), actor, briefId, bundleKey).run();
    return json({ ok: true, duplicate: true, evidenceBundle: publicBundle(existing) });
  }

  const latest = await env.DB.prepare(`
    SELECT id,version FROM page_evidence_bundles
    WHERE brief_id=? ORDER BY version DESC LIMIT 1
  `).bind(briefId).first<Obj>();
  const version = Number(latest?.version || 0) + 1;

  if (latest?.id) {
    await env.DB.prepare(`
      INSERT INTO page_readiness_events(bundle_id,action,actor,details_json)
      VALUES(?,'superseded',?,json_object('newVersion',?))
    `).bind(Number(latest.id), actor, version).run();
    await env.DB.prepare(`
      UPDATE page_evidence_bundles
      SET review_status='superseded',ready_for_publication=0,updated_at=CURRENT_TIMESTAMP
      WHERE brief_id=? AND review_status<>'superseded'
    `).bind(briefId).run();
  }

  const fullBundle = { ...coreBundle, generatedAt: now.toISOString(), version, bundleKey };
  const inserted = await env.DB.prepare(`
    INSERT INTO page_evidence_bundles(
      brief_id,page_slug,version,bundle_key,formula_version,readiness_score,
      review_draft_eligible,publication_eligible,ready_for_review_draft,ready_for_publication,
      verified_count,insufficient_count,contradicted_count,pending_count,dismissed_count,
      expired_count,conflict_count,source_count,subject_count,first_party_test_count,
      blockers_json,warnings_json,bundle_json,generated_by
    ) VALUES(?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id
  `).bind(
    briefId, pageSlug, version, bundleKey, FORMULA_VERSION, score,
    reviewDraftEligible ? 1 : 0, publicationEligible ? 1 : 0, reviewDraftEligible ? 1 : 0,
    verified.length, insufficient.length, contradicted.length, pending.length, dismissed.length,
    expired.length, conflicts.length, sourceIds.size, subjects.size, firstPartyTests.length,
    JSON.stringify(blockers), JSON.stringify(warnings), JSON.stringify(fullBundle), actor
  ).first<{ id: number }>();
  if (!inserted?.id) return json({ ok: false, error: 'evidence_bundle_persist_failed' }, 500);

  await env.DB.prepare(`
    INSERT INTO page_readiness_events(bundle_id,action,actor,details_json)
    VALUES(?,'evaluated',?,json_object(
      'briefId',?,'version',?,'readinessScore',?,
      'reviewDraftEligible',?,'publicationEligible',?
    ))
  `).bind(
    inserted.id, actor, briefId, version, score,
    reviewDraftEligible ? 1 : 0, publicationEligible ? 1 : 0
  ).run();

  if (reviewDraftEligible) {
    await env.DB.prepare(`
      INSERT OR IGNORE INTO maintenance_queue(
        dedupe_key,task_type,entity_type,entity_key,priority,payload_json
      ) VALUES(?,?,?,?,?,?)
    `).bind(
      `page-readiness-review:${bundleKey}`,
      'editorial_review',
      'page',
      pageSlug,
      clamp(Number(brief.priority_score || 50), 1, 100),
      JSON.stringify({
        reason: 'page_readiness_gate',
        briefId,
        evidenceBundleId: inserted.id,
        evidenceBundleVersion: version,
        pageSlug,
        readinessScore: score,
        reviewDraftEligible,
        publicationEligible,
        blockers,
        warnings
      })
    ).run();
  }

  return json({
    ok: true,
    duplicate: false,
    evidenceBundle: await readBundle(env, inserted.id)
  }, 201);
}

async function listReadiness(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const briefId = Number.parseInt(url.searchParams.get('briefId') || '0', 10) || 0;
  const bundleId = Number.parseInt(url.searchParams.get('bundleId') || '0', 10) || 0;
  const limit = clamp(Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20, 1, 100);
  const clauses: string[] = [];
  const bindings: unknown[] = [];
  if (briefId > 0) { clauses.push('brief_id=?'); bindings.push(briefId); }
  if (bundleId > 0) { clauses.push('id=?'); bindings.push(bundleId); }
  bindings.push(limit);

  const rows = await env.DB.prepare(`
    SELECT * FROM page_evidence_bundles
    ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
    ORDER BY brief_id ASC,version DESC
    LIMIT ?
  `).bind(...bindings).all<Obj>();

  return json({
    ok: true,
    briefId: briefId || null,
    bundleId: bundleId || null,
    count: rows.results.length,
    evidenceBundles: rows.results.map(publicBundle)
  });
}

async function readinessAction(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'object_payload_required' }, 400);
  const bundleId = integer(body.bundleId);
  const action = str(body.action, 50) as ReviewAction;
  const actor = str(body.actor, 120) || 'human-reviewer';
  const notes = str(body.notes, 4000);
  if (bundleId <= 0) return json({ ok: false, error: 'bundleId_required' }, 400);
  if (!REVIEW_ACTIONS.has(action)) return json({ ok: false, error: 'invalid_readiness_action' }, 400);

  const row = await env.DB.prepare('SELECT * FROM page_evidence_bundles WHERE id=?')
    .bind(bundleId).first<Obj>();
  if (!row) return json({ ok: false, error: 'evidence_bundle_not_found' }, 404);
  if (row.review_status === 'superseded') return json({ ok: false, error: 'evidence_bundle_superseded' }, 409);
  if (row.review_status === action) {
    return json({ ok: true, duplicate: true, evidenceBundle: publicBundle(row) });
  }

  try {
    await env.DB.prepare(`
      UPDATE page_evidence_bundles
      SET review_status=?,reviewed_by=?,review_notes=?,updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(action, actor, notes, bundleId).run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('evidence_bundle_not_eligible_for_draft')) {
      return json({ ok: false, error: 'evidence_bundle_not_eligible_for_draft' }, 409);
    }
    if (message.includes('evidence_bundle_not_eligible_for_publication')) {
      return json({ ok: false, error: 'evidence_bundle_not_eligible_for_publication' }, 409);
    }
    throw error;
  }

  await env.DB.prepare(`
    INSERT INTO page_readiness_events(bundle_id,action,actor,details_json)
    VALUES(?,?,?,json_object('notes',?))
  `).bind(bundleId, action, actor, notes).run();

  await env.DB.prepare(`
    UPDATE maintenance_queue
    SET status='completed',completed_at=CURRENT_TIMESTAMP,locked_at=NULL,locked_by=NULL,
        last_error=NULL,updated_at=CURRENT_TIMESTAMP
    WHERE task_type='editorial_review' AND entity_type='page' AND entity_key=?
      AND json_extract(payload_json,'$.evidenceBundleId')=?
      AND status IN ('pending','processing','failed')
  `).bind(row.page_slug, bundleId).run();

  return json({ ok: true, duplicate: false, action, evidenceBundle: await readBundle(env, bundleId) });
}

export async function pageReadinessApi(request: Request, env: Env, path: string): Promise<Response> {
  const authError = authorized(request, env);
  if (authError) return authError;

  if (request.method === 'POST' && path === 'api/maintenance/page-readiness-evaluate') {
    return evaluateReadiness(request, env);
  }
  if (request.method === 'GET' && path === 'api/maintenance/page-readiness') {
    return listReadiness(request, env);
  }
  if (request.method === 'POST' && path === 'api/maintenance/page-readiness-action') {
    return readinessAction(request, env);
  }
  return json({ ok: false, error: 'page_readiness_route_not_found' }, 404);
}
