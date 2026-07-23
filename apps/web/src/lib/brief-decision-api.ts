import { ControlRoomRequestError } from "@/lib/control-room-api"

export type BriefDecisionAction = "accepted" | "dismissed"

export type BriefDecisionResult = {
  ok: true
  action: BriefDecisionAction
  idempotent: boolean
  publicationTriggered: false
  brief: {
    id: number
    status: string
    notes: string
    decision_actor: string | null
    decided_at: string | null
    updated_at: string
  }
  decision: {
    id: number
    brief_id: number
    action: BriefDecisionAction
    actor: string
    notes: string
    created_at: string
  }
}

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function timestamp(value: unknown, field: string): string {
  if (typeof value !== "string" || Number.isNaN(new Date(value).getTime())) {
    throw new Error(`Campo ${field} non valido`)
  }
  return value
}

function nullableTimestamp(value: unknown, field: string): string | null {
  if (value === null) return null
  return timestamp(value, field)
}

function parseResult(value: unknown): BriefDecisionResult {
  if (!isObject(value) || value.ok !== true || value.publicationTriggered !== false) {
    throw new Error("Risposta decisione brief non valida")
  }
  if (value.action !== "accepted" && value.action !== "dismissed") {
    throw new Error("Azione decisione brief non valida")
  }
  if (typeof value.idempotent !== "boolean" || !isObject(value.brief) || !isObject(value.decision)) {
    throw new Error("Risposta decisione brief non valida")
  }

  const briefId = value.brief.id
  const eventId = value.decision.id
  const eventBriefId = value.decision.brief_id
  if (
    typeof briefId !== "number" || !Number.isInteger(briefId) || briefId <= 0
    || typeof eventId !== "number" || !Number.isInteger(eventId) || eventId <= 0
    || eventBriefId !== briefId
    || value.decision.action !== value.action
    || typeof value.brief.status !== "string"
    || typeof value.brief.notes !== "string"
    || typeof value.decision.actor !== "string" || value.decision.actor.trim().length === 0
    || typeof value.decision.notes !== "string"
  ) {
    throw new Error("Contratto decisione brief non valido")
  }

  const decisionActor = value.brief.decision_actor
  if (decisionActor !== null && typeof decisionActor !== "string") {
    throw new Error("Attore decisione brief non valido")
  }

  return {
    ok: true,
    action: value.action,
    idempotent: value.idempotent,
    publicationTriggered: false,
    brief: {
      id: briefId,
      status: value.brief.status,
      notes: value.brief.notes,
      decision_actor: decisionActor,
      decided_at: nullableTimestamp(value.brief.decided_at, "decided_at"),
      updated_at: timestamp(value.brief.updated_at, "updated_at"),
    },
    decision: {
      id: eventId,
      brief_id: eventBriefId,
      action: value.action,
      actor: value.decision.actor,
      notes: value.decision.notes,
      created_at: timestamp(value.decision.created_at, "created_at"),
    },
  }
}

function errorMessage(status: number, body: unknown): string {
  const code = isObject(body) && typeof body.error === "string" ? body.error : ""
  if (status === 403) return "Identità Cloudflare Access non disponibile"
  if (status === 404) return "Brief non trovato"
  if (status === 409 || code === "brief_decision_conflict") return "Il brief è già stato deciso con uno stato incompatibile"
  if (code === "dismissal_reason_required") return "Inserisci il motivo del rifiuto"
  if (code === "brief_decision_notes_too_long") return "Le note superano 2.000 caratteri"
  return "Decisione brief non registrata"
}

export async function submitBriefDecision(input: {
  briefId: number
  action: BriefDecisionAction
  notes: string
  signal?: AbortSignal
}): Promise<BriefDecisionResult> {
  const response = await fetch("/control-room-foundation/api/brief-decision", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ briefId: input.briefId, action: input.action, notes: input.notes }),
    cache: "no-store",
    credentials: "same-origin",
    signal: input.signal,
  })

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ControlRoomRequestError(response.status, "Risposta decisione brief non valida")
  }

  if (!response.ok) throw new ControlRoomRequestError(response.status, errorMessage(response.status, body))

  try {
    return parseResult(body)
  } catch {
    throw new ControlRoomRequestError(response.status, "Contratto decisione brief non valido")
  }
}
