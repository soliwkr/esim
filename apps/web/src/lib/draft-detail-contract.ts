import { draftStatuses, type DraftStatus } from "@/lib/draft-contract"

export type DraftDetailJson =
  | null
  | boolean
  | number
  | string
  | DraftDetailJson[]
  | { [key: string]: DraftDetailJson }

export type DraftContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; title: string; text: string }

export interface DraftFaqItem {
  question: string
  answer: string
}

export interface DraftSourceLink {
  label: string
  url: string
}

export type DraftFieldClaimIds = Record<string, number[] | Record<string, number[]>>

export interface DraftDetail {
  id: number
  evidenceBundleId: number
  draftKey: string
  version: number
  pageSlug: string
  pageType: string
  model: string
  promptVersion: string
  status: DraftStatus
  page: {
    title: string | null
    metaDescription: string | null
    eyebrow: string | null
    h1: string | null
    directAnswer: string | null
    intro: string | null
    content: DraftContentBlock[]
    faq: DraftFaqItem[]
    sources: DraftSourceLink[]
  }
  fieldClaimIds: DraftFieldClaimIds
  usedClaimIds: number[]
  excludedClaimIds: number[]
  generationRules: string[]
  responseId: string | null
  usage: DraftDetailJson
  error: string | null
  generatedBy: string
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNotes: string
  materializedPageStatus: string | null
  createdAt: string
  updatedAt: string
}

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringValue(record: JsonObject, key: string): string {
  const value = record[key]
  if (typeof value !== "string") throw new Error(`Campo dettaglio draft ${key} non valido`)
  return value
}

function nullableString(record: JsonObject, key: string): string | null {
  const value = record[key]
  if (value === null) return null
  if (typeof value !== "string") throw new Error(`Campo dettaglio draft ${key} non valido`)
  return value
}

function positiveInteger(record: JsonObject, key: string): number {
  const value = record[key]
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Campo dettaglio draft ${key} non valido`)
  }
  return value
}

function positiveIntegerArray(value: unknown, label: string): number[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "number" || !Number.isInteger(item) || item <= 0)) {
    throw new Error(`Campo dettaglio draft ${label} non valido`)
  }
  return value
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Campo dettaglio draft ${label} non valido`)
  }
  return value
}

function timestamp(record: JsonObject, key: string): string {
  const value = stringValue(record, key)
  if (Number.isNaN(new Date(value).getTime())) throw new Error(`Campo dettaglio draft ${key} non valido`)
  return value
}

function nullableTimestamp(record: JsonObject, key: string): string | null {
  const value = nullableString(record, key)
  if (value !== null && Number.isNaN(new Date(value).getTime())) {
    throw new Error(`Campo dettaglio draft ${key} non valido`)
  }
  return value
}

function isJsonValue(value: unknown, depth = 0): value is DraftDetailJson {
  if (depth > 20) return false
  if (value === null || typeof value === "string" || typeof value === "boolean") return true
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.every((item) => isJsonValue(item, depth + 1))
  if (!isObject(value)) return false
  return Object.values(value).every((item) => isJsonValue(item, depth + 1))
}

function contentBlock(value: unknown, index: number): DraftContentBlock {
  if (!isObject(value)) throw new Error(`Blocco draft ${index} non valido`)
  const type = stringValue(value, "type")

  if (type === "paragraph" || type === "heading") {
    return { type, text: stringValue(value, "text") }
  }
  if (type === "bullets" || type === "steps") {
    return { type, items: stringArray(value.items, `content.${index}.items`) }
  }
  if (type === "callout") {
    return { type, title: stringValue(value, "title"), text: stringValue(value, "text") }
  }
  if (type === "table") {
    const rows = value.rows
    if (!Array.isArray(rows) || rows.some((row) => !Array.isArray(row) || row.some((cell) => typeof cell !== "string"))) {
      throw new Error(`Campo dettaglio draft content.${index}.rows non valido`)
    }
    return {
      type,
      headers: stringArray(value.headers, `content.${index}.headers`),
      rows: rows as string[][],
    }
  }

  throw new Error(`Tipo blocco draft ${type} non valido`)
}

function faqItem(value: unknown, index: number): DraftFaqItem {
  if (!isObject(value)) throw new Error(`FAQ draft ${index} non valida`)
  return { question: stringValue(value, "question"), answer: stringValue(value, "answer") }
}

function sourceLink(value: unknown, index: number): DraftSourceLink {
  if (!isObject(value)) throw new Error(`Fonte draft ${index} non valida`)
  const label = stringValue(value, "label")
  const url = stringValue(value, "url")
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`Fonte draft ${index} non valida`)
  }
  if (parsed.protocol !== "https:") throw new Error(`Fonte draft ${index} non valida`)
  return { label, url }
}

function fieldClaimIds(value: unknown): DraftFieldClaimIds {
  if (!isObject(value)) throw new Error("Provenance draft non valida")
  const result: DraftFieldClaimIds = {}

  for (const [field, mapping] of Object.entries(value)) {
    if (!field.trim()) throw new Error("Provenance draft non valida")
    if (Array.isArray(mapping)) {
      result[field] = positiveIntegerArray(mapping, `fieldClaimIds.${field}`)
      continue
    }
    if (!isObject(mapping)) throw new Error(`Provenance draft ${field} non valida`)
    const groups: Record<string, number[]> = {}
    for (const [key, ids] of Object.entries(mapping)) {
      groups[key] = positiveIntegerArray(ids, `fieldClaimIds.${field}.${key}`)
    }
    result[field] = groups
  }

  return result
}

export function parseDraftDetailResponse(value: unknown): DraftDetail {
  if (!isObject(value) || value.ok !== true || !isObject(value.draft)) {
    throw new Error("Payload dettaglio draft non valido")
  }

  const draft = value.draft
  const status = stringValue(draft, "status")
  if (!draftStatuses.includes(status as DraftStatus)) throw new Error("Stato dettaglio draft non valido")
  if (!isObject(draft.page)) throw new Error("Pagina dettaglio draft non valida")
  if (!Array.isArray(draft.page.content) || !Array.isArray(draft.page.faq) || !Array.isArray(draft.page.sources)) {
    throw new Error("Contenuto dettaglio draft non valido")
  }
  if (!isJsonValue(draft.usage)) throw new Error("Usage dettaglio draft non valido")

  return {
    id: positiveInteger(draft, "id"),
    evidenceBundleId: positiveInteger(draft, "evidenceBundleId"),
    draftKey: stringValue(draft, "draftKey"),
    version: positiveInteger(draft, "version"),
    pageSlug: stringValue(draft, "pageSlug"),
    pageType: stringValue(draft, "pageType"),
    model: stringValue(draft, "model"),
    promptVersion: stringValue(draft, "promptVersion"),
    status: status as DraftStatus,
    page: {
      title: nullableString(draft.page, "title"),
      metaDescription: nullableString(draft.page, "metaDescription"),
      eyebrow: nullableString(draft.page, "eyebrow"),
      h1: nullableString(draft.page, "h1"),
      directAnswer: nullableString(draft.page, "directAnswer"),
      intro: nullableString(draft.page, "intro"),
      content: draft.page.content.map(contentBlock),
      faq: draft.page.faq.map(faqItem),
      sources: draft.page.sources.map(sourceLink),
    },
    fieldClaimIds: fieldClaimIds(draft.fieldClaimIds),
    usedClaimIds: positiveIntegerArray(draft.usedClaimIds, "usedClaimIds"),
    excludedClaimIds: positiveIntegerArray(draft.excludedClaimIds, "excludedClaimIds"),
    generationRules: stringArray(draft.generationRules, "generationRules"),
    responseId: nullableString(draft, "responseId"),
    usage: draft.usage,
    error: nullableString(draft, "error"),
    generatedBy: stringValue(draft, "generatedBy"),
    reviewedBy: nullableString(draft, "reviewedBy"),
    reviewedAt: nullableTimestamp(draft, "reviewedAt"),
    reviewNotes: stringValue(draft, "reviewNotes"),
    materializedPageStatus: nullableString(draft, "materializedPageStatus"),
    createdAt: timestamp(draft, "createdAt"),
    updatedAt: timestamp(draft, "updatedAt"),
  }
}
