export const draftStatuses = [
  "generating",
  "review",
  "changes_requested",
  "approved",
  "failed",
  "superseded",
] as const

export type DraftStatus = typeof draftStatuses[number]

export interface DraftDecisionRecord {
  id: number
  evidence_bundle_id: number
  version: number
  page_slug: string
  page_type: string
  prompt_version: string
  status: DraftStatus
  title: string
  h1: string
  used_claim_ids: number[]
  excluded_claim_ids: number[]
  generated_by: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string
  error_message: string | null
  created_at: string
  updated_at: string
}

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringValue(record: JsonObject, key: string): string {
  const value = record[key]
  if (typeof value !== "string") throw new Error(`Campo draft ${key} non valido`)
  return value
}

function nullableString(record: JsonObject, key: string): string | null {
  const value = record[key]
  if (value === null) return null
  if (typeof value !== "string") throw new Error(`Campo draft ${key} non valido`)
  return value
}

function positiveInteger(record: JsonObject, key: string): number {
  const value = record[key]
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Campo draft ${key} non valido`)
  }
  return value
}

function positiveIntegerArray(record: JsonObject, key: string): number[] {
  const value = record[key]
  if (!Array.isArray(value) || value.some((item) => typeof item !== "number" || !Number.isInteger(item) || item <= 0)) {
    throw new Error(`Campo draft ${key} non valido`)
  }
  return value
}

function timestamp(record: JsonObject, key: string): string {
  const value = stringValue(record, key)
  if (Number.isNaN(new Date(value).getTime())) throw new Error(`Campo draft ${key} non valido`)
  return value
}

function nullableTimestamp(record: JsonObject, key: string): string | null {
  const value = nullableString(record, key)
  if (value !== null && Number.isNaN(new Date(value).getTime())) {
    throw new Error(`Campo draft ${key} non valido`)
  }
  return value
}

export function parseDraftDecisionRecords(value: unknown): DraftDecisionRecord[] {
  if (!Array.isArray(value)) throw new Error("Lista draft non valida")

  return value.map((record) => {
    if (!isObject(record)) throw new Error("Draft non valido")
    const status = stringValue(record, "status")
    if (!draftStatuses.includes(status as DraftStatus)) throw new Error("Stato draft non valido")

    return {
      id: positiveInteger(record, "id"),
      evidence_bundle_id: positiveInteger(record, "evidence_bundle_id"),
      version: positiveInteger(record, "version"),
      page_slug: stringValue(record, "page_slug"),
      page_type: stringValue(record, "page_type"),
      prompt_version: stringValue(record, "prompt_version"),
      status: status as DraftStatus,
      title: stringValue(record, "title"),
      h1: stringValue(record, "h1"),
      used_claim_ids: positiveIntegerArray(record, "used_claim_ids"),
      excluded_claim_ids: positiveIntegerArray(record, "excluded_claim_ids"),
      generated_by: stringValue(record, "generated_by"),
      reviewed_by: nullableString(record, "reviewed_by"),
      reviewed_at: nullableTimestamp(record, "reviewed_at"),
      review_notes: stringValue(record, "review_notes"),
      error_message: nullableString(record, "error_message"),
      created_at: timestamp(record, "created_at"),
      updated_at: timestamp(record, "updated_at"),
    }
  })
}
