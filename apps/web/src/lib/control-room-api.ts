export const overviewMetricKeys = [
  "sources_total",
  "sources_due",
  "queue_pending",
  "queue_processing",
  "queue_failed",
  "research_runs",
  "signals_eligible",
  "signals_filtered",
  "briefs_proposed",
  "briefs_accepted",
  "briefs_converted",
  "claims_pending",
  "claims_verified",
  "claims_insufficient",
  "evidence_bundles",
  "drafts_review",
  "drafts_approved",
  "pages_review",
  "pages_published",
] as const

export type OverviewMetricKey = typeof overviewMetricKeys[number]
export type ControlRoomOverview = Record<OverviewMetricKey, number>

export interface HealthSnapshot {
  ok: true
  site?: string
  maintenanceApi: string
  recentDemandWorkflow: string
  last30DaysContainer: string
  aiGateway: string
  affiliateMode: string
  controlRoomVersion?: number
}

export interface ControlRoomResearchRun {
  id: number
  source_system: string
  run_kind: string
  query: string
  generated_at: string | null
  window_days: number
  result_count: number
  warning_count: number
  eligible_count: number
  filtered_count: number
  created_at: string
}

export interface ControlRoomSignal {
  id: number
  run_id: number
  signal_type: string
  topic: string
  title: string
  source: string
  url: string
  published_at: string | null
  relevance_score: number
  freshness_days: number
  eligible_for_editorial: 0 | 1
  quality_flags: string[]
  status: string
  updated_at: string
}

export interface ControlRoomBrief {
  id: number
  cluster_title: string
  proposed_title: string
  slug_suggestion: string
  asset_type: string
  search_intent: string
  opportunity_score: number
  evidence_score: number
  priority_score: number
  quality_flags: string[]
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  bundle_id: number | null
  readiness_score: number | null
  readiness_status: string | null
  draft_id: number | null
  draft_status: string | null
  draft_renderer: string | null
}

export interface ControlRoomClaim {
  id: number
  brief_id: number | null
  subject_type: string | null
  subject_key: string | null
  field_name: string | null
  claim_text: string
  verification_question: string | null
  status: string
  evidence: string | null
  notes: string | null
  created_at: string
  updated_at: string
  source_kind: string | null
  source_label: string | null
  source_url: string | null
  trust_level: number | null
  verification_status: string | null
  confidence: number | null
  checked_at: string | null
  valid_until: string | null
  task_id: number | null
  task_status: string | null
  required_source_kinds: string[]
  value: unknown
}

export interface ControlRoomEvidenceWarning {
  code: string
  message?: string
  [key: string]: unknown
}

export interface ControlRoomEvidenceBundle {
  id: number
  brief_id: number
  page_slug: string
  version: number
  readiness_score: number
  review_draft_eligible: 0 | 1
  publication_eligible: 0 | 1
  ready_for_review_draft: 0 | 1
  ready_for_publication: 0 | 1
  review_status: string
  verified_count: number
  insufficient_count: number
  contradicted_count: number
  pending_count: number
  expired_count: number
  conflict_count: number
  source_count: number
  subject_count: number
  first_party_test_count: number
  warnings: ControlRoomEvidenceWarning[]
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface ControlRoomDraft {
  id: number
  evidence_bundle_id: number
  version: number
  page_slug: string
  page_type: string
  prompt_version: string
  status: string
  title: string | null
  h1: string | null
  used_claim_ids: Array<number | string>
  excluded_claim_ids: Array<number | string>
  generated_by: string | null
  review_notes: string | null
  error_message: string | null
  updated_at: string
}

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }
export type ControlRoomQueueStatus = "pending" | "processing" | "failed"

export interface ControlRoomQueueTask {
  id: number
  task_type: string
  entity_type: string
  entity_key: string
  priority: number
  status: ControlRoomQueueStatus
  due_at: string
  attempts: number
  max_attempts: number
  locked_by: string | null
  last_error: string | null
  payload: JsonValue
  created_at: string
  updated_at: string
}

export interface ControlRoomAuditEvent {
  event_key: string
  domain: string
  action: string
  actor: string
  entity: string
  draft_id: number | null
  draft_version: number | null
  details: JsonValue
  created_at: string
}

export interface ControlRoomCapabilities {
  worker: boolean
  d1: boolean
  maintenanceApi: boolean
  aiGateway: boolean
  vertex: boolean
  recentDemandWorkflow: boolean
  publicationAutomation: false
}

export interface ControlRoomSnapshot {
  ok: true
  generatedAt: string
  capabilities: ControlRoomCapabilities
  overview: ControlRoomOverview
  researchRuns: ControlRoomResearchRun[]
  signals: ControlRoomSignal[]
  briefs: ControlRoomBrief[]
  claims: ControlRoomClaim[]
  evidenceBundles: ControlRoomEvidenceBundle[]
  drafts: ControlRoomDraft[]
  queue: ControlRoomQueueTask[]
  audit: ControlRoomAuditEvent[]
}

export class ControlRoomRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "ControlRoomRequestError"
  }
}

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function requireString(object: JsonObject, key: string): string {
  const value = object[key]
  if (typeof value !== "string") throw new Error(`Campo ${key} non valido`)
  return value
}

function requireNullableString(object: JsonObject, key: string): string | null {
  const value = object[key]
  if (value === null) return null
  if (typeof value !== "string") throw new Error(`Campo ${key} non valido`)
  return value
}

function requireNumber(object: JsonObject, key: string): number {
  const value = object[key]
  if (!isFiniteNumber(value)) throw new Error(`Campo ${key} non valido`)
  return value
}

function requireNullableNumber(object: JsonObject, key: string): number | null {
  const value = object[key]
  if (value === null) return null
  if (!isFiniteNumber(value)) throw new Error(`Campo ${key} non valido`)
  return value
}

function requireNonNegativeInteger(object: JsonObject, key: string): number {
  const value = requireNumber(object, key)
  if (!Number.isInteger(value) || value < 0) throw new Error(`Campo ${key} non valido`)
  return value
}

function requirePositiveInteger(object: JsonObject, key: string): number {
  const value = requireNumber(object, key)
  if (!Number.isInteger(value) || value <= 0) throw new Error(`Campo ${key} non valido`)
  return value
}

function requireNullablePositiveInteger(object: JsonObject, key: string): number | null {
  const value = object[key]
  if (value === null) return null
  if (!isFiniteNumber(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Campo ${key} non valido`)
  }
  return value
}

function requireBinaryNumber(object: JsonObject, key: string): 0 | 1 {
  const value = requireNumber(object, key)
  if (value !== 0 && value !== 1) throw new Error(`Campo ${key} non valido`)
  return value
}

function requireBoolean(object: JsonObject, key: string): boolean {
  const value = object[key]
  if (typeof value !== "boolean") throw new Error(`Campo ${key} non valido`)
  return value
}

function requireStringArray(object: JsonObject, key: string): string[] {
  const value = object[key]
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Campo ${key} non valido`)
  }
  return value
}

function requireTimestamp(object: JsonObject, key: string): string {
  const value = requireString(object, key)
  if (Number.isNaN(new Date(value).getTime())) throw new Error(`Campo ${key} non valido`)
  return value
}

function requireNullableTimestamp(object: JsonObject, key: string): string | null {
  const value = requireNullableString(object, key)
  if (value !== null && Number.isNaN(new Date(value).getTime())) throw new Error(`Campo ${key} non valido`)
  return value
}

function isJsonValue(value: unknown, depth = 0): value is JsonValue {
  if (depth > 20) return false
  if (value === null || typeof value === "string" || typeof value === "boolean") return true
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.every((item) => isJsonValue(item, depth + 1))
  if (!isObject(value)) return false
  return Object.values(value).every((item) => isJsonValue(item, depth + 1))
}

function requireJsonValue(object: JsonObject, key: string): JsonValue {
  const value = object[key]
  if (!isJsonValue(value)) throw new Error(`Campo ${key} non valido`)
  return value
}

function requireEvidenceWarnings(object: JsonObject, key: string): ControlRoomEvidenceWarning[] {
  const value = object[key]
  if (!Array.isArray(value)) throw new Error(`Campo ${key} non valido`)

  return value.map((warning) => {
    if (!isObject(warning)) throw new Error(`Campo ${key} non valido`)
    const code = requireString(warning, "code")
    if (code.trim().length === 0) throw new Error(`Campo ${key} non valido`)

    const message = warning.message
    if (message !== undefined && typeof message !== "string") {
      throw new Error(`Campo ${key} non valido`)
    }

    return {
      ...warning,
      code,
      ...(message === undefined ? {} : { message }),
    }
  })
}

function parseHealthSnapshot(value: unknown): HealthSnapshot {
  if (!isObject(value) || value.ok !== true) throw new Error("Health payload non valido")

  const controlRoomVersion = value.controlRoomVersion
  if (controlRoomVersion !== undefined && !isFiniteNumber(controlRoomVersion)) {
    throw new Error("Campo controlRoomVersion non valido")
  }

  const site = value.site
  if (site !== undefined && typeof site !== "string") throw new Error("Campo site non valido")

  return {
    ok: true,
    ...(site === undefined ? {} : { site }),
    maintenanceApi: requireString(value, "maintenanceApi"),
    recentDemandWorkflow: requireString(value, "recentDemandWorkflow"),
    last30DaysContainer: requireString(value, "last30DaysContainer"),
    aiGateway: requireString(value, "aiGateway"),
    affiliateMode: requireString(value, "affiliateMode"),
    ...(controlRoomVersion === undefined ? {} : { controlRoomVersion }),
  }
}

function parseCapabilities(value: unknown): ControlRoomCapabilities {
  if (!isObject(value)) throw new Error("Capability snapshot non valide")
  const publicationAutomation = requireBoolean(value, "publicationAutomation")
  if (publicationAutomation !== false) throw new Error("Publication guardrail non valido")

  return {
    worker: requireBoolean(value, "worker"),
    d1: requireBoolean(value, "d1"),
    maintenanceApi: requireBoolean(value, "maintenanceApi"),
    aiGateway: requireBoolean(value, "aiGateway"),
    vertex: requireBoolean(value, "vertex"),
    recentDemandWorkflow: requireBoolean(value, "recentDemandWorkflow"),
    publicationAutomation: false,
  }
}

function parseOverview(value: unknown): ControlRoomOverview {
  if (!isObject(value)) throw new Error("Metriche overview non valide")
  return Object.fromEntries(overviewMetricKeys.map((key) => {
    const metric = value[key]
    if (!isFiniteNumber(metric)) throw new Error(`Metrica ${key} non valida`)
    return [key, metric]
  })) as ControlRoomOverview
}

function parseResearchRuns(value: unknown): ControlRoomResearchRun[] {
  if (!Array.isArray(value)) throw new Error("Lista run ricerca non valida")

  return value.map((record) => {
    if (!isObject(record)) throw new Error("Run ricerca non valido")
    return {
      id: requireNumber(record, "id"),
      source_system: requireString(record, "source_system"),
      run_kind: requireString(record, "run_kind"),
      query: requireString(record, "query"),
      generated_at: requireNullableString(record, "generated_at"),
      window_days: requireNumber(record, "window_days"),
      result_count: requireNumber(record, "result_count"),
      warning_count: requireNumber(record, "warning_count"),
      eligible_count: requireNumber(record, "eligible_count"),
      filtered_count: requireNumber(record, "filtered_count"),
      created_at: requireString(record, "created_at"),
    }
  })
}

function parseSignals(value: unknown): ControlRoomSignal[] {
  if (!Array.isArray(value)) throw new Error("Lista segnali non valida")

  return value.map((record) => {
    if (!isObject(record)) throw new Error("Segnale non valido")
    const eligibility = requireNumber(record, "eligible_for_editorial")
    if (eligibility !== 0 && eligibility !== 1) throw new Error("Idoneità segnale non valida")

    return {
      id: requireNumber(record, "id"),
      run_id: requireNumber(record, "run_id"),
      signal_type: requireString(record, "signal_type"),
      topic: requireString(record, "topic"),
      title: requireString(record, "title"),
      source: requireString(record, "source"),
      url: requireString(record, "url"),
      published_at: requireNullableString(record, "published_at"),
      relevance_score: requireNumber(record, "relevance_score"),
      freshness_days: requireNumber(record, "freshness_days"),
      eligible_for_editorial: eligibility,
      quality_flags: requireStringArray(record, "quality_flags"),
      status: requireString(record, "status"),
      updated_at: requireString(record, "updated_at"),
    }
  })
}

function parseBriefs(value: unknown): ControlRoomBrief[] {
  if (!Array.isArray(value)) throw new Error("Lista brief non valida")

  return value.map((record) => {
    if (!isObject(record)) throw new Error("Brief non valido")
    return {
      id: requireNumber(record, "id"),
      cluster_title: requireString(record, "cluster_title"),
      proposed_title: requireString(record, "proposed_title"),
      slug_suggestion: requireString(record, "slug_suggestion"),
      asset_type: requireString(record, "asset_type"),
      search_intent: requireString(record, "search_intent"),
      opportunity_score: requireNumber(record, "opportunity_score"),
      evidence_score: requireNumber(record, "evidence_score"),
      priority_score: requireNumber(record, "priority_score"),
      quality_flags: requireStringArray(record, "quality_flags"),
      status: requireString(record, "status"),
      notes: requireNullableString(record, "notes"),
      created_at: requireString(record, "created_at"),
      updated_at: requireString(record, "updated_at"),
      bundle_id: requireNullableNumber(record, "bundle_id"),
      readiness_score: requireNullableNumber(record, "readiness_score"),
      readiness_status: requireNullableString(record, "readiness_status"),
      draft_id: requireNullableNumber(record, "draft_id"),
      draft_status: requireNullableString(record, "draft_status"),
      draft_renderer: requireNullableString(record, "draft_renderer"),
    }
  })
}

function parseClaims(value: unknown): ControlRoomClaim[] {
  if (!Array.isArray(value)) throw new Error("Lista claim non valida")

  return value.map((record) => {
    if (!isObject(record)) throw new Error("Claim snapshot non valido")
    return {
      id: requireNumber(record, "id"),
      brief_id: requireNullableNumber(record, "brief_id"),
      subject_type: requireNullableString(record, "subject_type"),
      subject_key: requireNullableString(record, "subject_key"),
      field_name: requireNullableString(record, "field_name"),
      claim_text: requireString(record, "claim_text"),
      verification_question: requireNullableString(record, "verification_question"),
      status: requireString(record, "status"),
      evidence: requireNullableString(record, "evidence"),
      notes: requireNullableString(record, "notes"),
      created_at: requireTimestamp(record, "created_at"),
      updated_at: requireTimestamp(record, "updated_at"),
      source_kind: requireNullableString(record, "source_kind"),
      source_label: requireNullableString(record, "source_label"),
      source_url: requireNullableString(record, "source_url"),
      trust_level: requireNullableNumber(record, "trust_level"),
      verification_status: requireNullableString(record, "verification_status"),
      confidence: requireNullableNumber(record, "confidence"),
      checked_at: requireNullableTimestamp(record, "checked_at"),
      valid_until: requireNullableTimestamp(record, "valid_until"),
      task_id: requireNullablePositiveInteger(record, "task_id"),
      task_status: requireNullableString(record, "task_status"),
      required_source_kinds: requireStringArray(record, "required_source_kinds"),
      value: record.value,
    }
  })
}

function parseEvidenceBundles(value: unknown): ControlRoomEvidenceBundle[] {
  if (!Array.isArray(value)) throw new Error("Lista evidence bundle non valida")

  return value.map((record) => {
    if (!isObject(record)) throw new Error("Evidence bundle non valido")
    return {
      id: requirePositiveInteger(record, "id"),
      brief_id: requirePositiveInteger(record, "brief_id"),
      page_slug: requireString(record, "page_slug"),
      version: requirePositiveInteger(record, "version"),
      readiness_score: requireNumber(record, "readiness_score"),
      review_draft_eligible: requireBinaryNumber(record, "review_draft_eligible"),
      publication_eligible: requireBinaryNumber(record, "publication_eligible"),
      ready_for_review_draft: requireBinaryNumber(record, "ready_for_review_draft"),
      ready_for_publication: requireBinaryNumber(record, "ready_for_publication"),
      review_status: requireString(record, "review_status"),
      verified_count: requireNonNegativeInteger(record, "verified_count"),
      insufficient_count: requireNonNegativeInteger(record, "insufficient_count"),
      contradicted_count: requireNonNegativeInteger(record, "contradicted_count"),
      pending_count: requireNonNegativeInteger(record, "pending_count"),
      expired_count: requireNonNegativeInteger(record, "expired_count"),
      conflict_count: requireNonNegativeInteger(record, "conflict_count"),
      source_count: requireNonNegativeInteger(record, "source_count"),
      subject_count: requireNonNegativeInteger(record, "subject_count"),
      first_party_test_count: requireNonNegativeInteger(record, "first_party_test_count"),
      warnings: requireEvidenceWarnings(record, "warnings"),
      reviewed_by: requireNullableString(record, "reviewed_by"),
      reviewed_at: requireNullableTimestamp(record, "reviewed_at"),
      created_at: requireTimestamp(record, "created_at"),
      updated_at: requireTimestamp(record, "updated_at"),
    }
  })
}

function parseDrafts(value: unknown): ControlRoomDraft[] {
  if (!Array.isArray(value)) throw new Error("Lista draft non valida")
  for (const draft of value) {
    if (
      !isObject(draft)
      || !isFiniteNumber(draft.id)
      || !isFiniteNumber(draft.evidence_bundle_id)
      || !isFiniteNumber(draft.version)
      || typeof draft.page_slug !== "string"
      || typeof draft.page_type !== "string"
      || typeof draft.prompt_version !== "string"
      || typeof draft.status !== "string"
      || !Array.isArray(draft.used_claim_ids)
      || !Array.isArray(draft.excluded_claim_ids)
    ) {
      throw new Error("Draft snapshot non valido")
    }
  }
  return value as ControlRoomDraft[]
}

function parseQueue(value: unknown): ControlRoomQueueTask[] {
  if (!Array.isArray(value)) throw new Error("Lista queue non valida")

  return value.map((record) => {
    if (!isObject(record)) throw new Error("Task queue non valido")
    const status = requireString(record, "status")
    if (status !== "pending" && status !== "processing" && status !== "failed") {
      throw new Error("Stato queue non valido")
    }

    return {
      id: requirePositiveInteger(record, "id"),
      task_type: requireString(record, "task_type"),
      entity_type: requireString(record, "entity_type"),
      entity_key: requireString(record, "entity_key"),
      priority: requireNonNegativeInteger(record, "priority"),
      status,
      due_at: requireTimestamp(record, "due_at"),
      attempts: requireNonNegativeInteger(record, "attempts"),
      max_attempts: requirePositiveInteger(record, "max_attempts"),
      locked_by: requireNullableString(record, "locked_by"),
      last_error: requireNullableString(record, "last_error"),
      payload: requireJsonValue(record, "payload"),
      created_at: requireTimestamp(record, "created_at"),
      updated_at: requireTimestamp(record, "updated_at"),
    }
  })
}

function parseAudit(value: unknown): ControlRoomAuditEvent[] {
  if (!Array.isArray(value)) throw new Error("Lista audit non valida")
  const eventKeys = new Set<string>()

  return value.map((record) => {
    if (!isObject(record)) throw new Error("Evento audit non valido")
    const eventKey = requireString(record, "event_key")
    const domain = requireString(record, "domain")
    const draftId = requireNullablePositiveInteger(record, "draft_id")
    const draftVersion = requireNullablePositiveInteger(record, "draft_version")

    if (eventKey.trim().length === 0 || eventKeys.has(eventKey)) {
      throw new Error("Identità evento audit non valida")
    }
    eventKeys.add(eventKey)

    if (domain === "draft") {
      if (draftId === null || draftVersion === null) throw new Error("Linkage draft audit non valido")
    } else if (draftId !== null || draftVersion !== null) {
      throw new Error("Linkage draft audit non valido")
    }

    return {
      event_key: eventKey,
      domain,
      action: requireString(record, "action"),
      actor: requireString(record, "actor"),
      entity: requireString(record, "entity"),
      draft_id: draftId,
      draft_version: draftVersion,
      details: requireJsonValue(record, "details"),
      created_at: requireTimestamp(record, "created_at"),
    }
  })
}

function parseControlRoomSnapshot(value: unknown): ControlRoomSnapshot {
  if (!isObject(value) || value.ok !== true) throw new Error("Snapshot payload non valido")
  const generatedAt = requireString(value, "generatedAt")
  if (Number.isNaN(new Date(generatedAt).getTime())) throw new Error("Timestamp snapshot non valido")

  return {
    ok: true,
    generatedAt,
    capabilities: parseCapabilities(value.capabilities),
    overview: parseOverview(value.overview),
    researchRuns: parseResearchRuns(value.researchRuns),
    signals: parseSignals(value.signals),
    briefs: parseBriefs(value.briefs),
    claims: parseClaims(value.claims),
    evidenceBundles: parseEvidenceBundles(value.evidenceBundles),
    drafts: parseDrafts(value.drafts),
    queue: parseQueue(value.queue),
    audit: parseAudit(value.audit),
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    throw new ControlRoomRequestError(response.status, "Risposta API non valida")
  }
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthSnapshot> {
  const response = await fetch("/api/health", {
    cache: "no-store",
    credentials: "same-origin",
    signal,
  })
  const body = await readJson(response)

  if (!response.ok) throw new ControlRoomRequestError(response.status, "Health API non disponibile")
  try {
    return parseHealthSnapshot(body)
  } catch {
    throw new ControlRoomRequestError(response.status, "Contratto Health API non valido")
  }
}

export async function fetchControlRoomSnapshot(
  signal?: AbortSignal,
): Promise<ControlRoomSnapshot> {
  const response = await fetch("/control-room-foundation/api/snapshot", {
    headers: { Accept: "application/json" },
    cache: "no-store",
    credentials: "same-origin",
    signal,
  })
  const body = await readJson(response)

  if (!response.ok) {
    const message = response.status === 403
      ? "Sessione Cloudflare Access non valida o scaduta"
      : "Snapshot della Control Room non disponibile"
    throw new ControlRoomRequestError(response.status, message)
  }

  try {
    return parseControlRoomSnapshot(body)
  } catch {
    throw new ControlRoomRequestError(response.status, "Contratto snapshot non valido")
  }
}
