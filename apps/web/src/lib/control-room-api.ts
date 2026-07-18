export const CONTROL_ROOM_SESSION_KEY = "srMaintenanceToken"

export interface HealthSnapshot {
  ok: boolean
  maintenanceApi: string
  recentDemandWorkflow: string
  last30DaysContainer: string
  aiGateway: string
  affiliateMode: string
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

export interface ControlRoomSnapshot {
  ok: true
  generatedAt: string
  capabilities: {
    worker: boolean
    d1: boolean
    maintenanceApi: boolean
    aiGateway: boolean
    vertex: boolean
    recentDemandWorkflow: boolean
    publicationAutomation: false
  }
  overview: Record<string, number>
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

  if (!response.ok || typeof body !== "object" || body === null || !("ok" in body)) {
    throw new ControlRoomRequestError(response.status, "Health API non disponibile")
  }

  return body as HealthSnapshot
}

export async function fetchControlRoomSnapshot(
  token: string,
  signal?: AbortSignal,
): Promise<ControlRoomSnapshot> {
  const response = await fetch("/api/maintenance/control-room", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    credentials: "same-origin",
    signal,
  })
  const body = await readJson(response)

  if (!response.ok) {
    const message = response.status === 401
      ? "Sessione non valida o scaduta"
      : "Snapshot della Control Room non disponibile"
    throw new ControlRoomRequestError(response.status, message)
  }

  if (
    typeof body !== "object"
    || body === null
    || !("ok" in body)
    || body.ok !== true
    || !("claims" in body)
    || !Array.isArray(body.claims)
    || !("drafts" in body)
    || !Array.isArray(body.drafts)
  ) {
    throw new ControlRoomRequestError(response.status, "Snapshot API non valido")
  }

  return body as ControlRoomSnapshot
}
