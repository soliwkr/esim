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
  source_kind: string | null
  source_label: string | null
  source_url: string | null
  trust_level: number | null
  verification_status: string | null
  confidence: number | null
  checked_at: string | null
  valid_until: string | null
  task_status: string | null
  required_source_kinds?: string[]
  value?: unknown
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
  claims: ControlRoomClaim[]
  drafts: ControlRoomDraft[]
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

function requireBoolean(object: JsonObject, key: string): boolean {
  const value = object[key]
  if (typeof value !== "boolean") throw new Error(`Campo ${key} non valido`)
  return value
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

function parseClaims(value: unknown): ControlRoomClaim[] {
  if (!Array.isArray(value)) throw new Error("Lista claim non valida")
  for (const claim of value) {
    if (
      !isObject(claim)
      || !isFiniteNumber(claim.id)
      || typeof claim.claim_text !== "string"
      || typeof claim.status !== "string"
    ) {
      throw new Error("Claim snapshot non valido")
    }
  }
  return value as ControlRoomClaim[]
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

function parseControlRoomSnapshot(value: unknown): ControlRoomSnapshot {
  if (!isObject(value) || value.ok !== true) throw new Error("Snapshot payload non valido")
  const generatedAt = requireString(value, "generatedAt")
  if (Number.isNaN(new Date(generatedAt).getTime())) throw new Error("Timestamp snapshot non valido")

  return {
    ok: true,
    generatedAt,
    capabilities: parseCapabilities(value.capabilities),
    overview: parseOverview(value.overview),
    claims: parseClaims(value.claims),
    drafts: parseDrafts(value.drafts),
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
