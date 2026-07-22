import { ControlRoomRequestError } from "@/lib/control-room-api"
import { parseDraftDetailResponse, type DraftDetail } from "@/lib/draft-detail-contract"

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    throw new ControlRoomRequestError(response.status, "Risposta dettaglio draft non valida")
  }
}

export async function fetchDraftDetail(draftId: number, signal?: AbortSignal): Promise<DraftDetail> {
  if (!Number.isInteger(draftId) || draftId <= 0) {
    throw new ControlRoomRequestError(400, "ID draft non valido")
  }

  const params = new URLSearchParams({ draftId: String(draftId) })
  const response = await fetch(`/control-room-foundation/api/draft-detail?${params}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    credentials: "same-origin",
    signal,
  })
  const body = await readJson(response)

  if (!response.ok) {
    const message = response.status === 403
      ? "Sessione Cloudflare Access non valida o scaduta"
      : response.status === 404
        ? "Dettaglio draft non trovato"
        : "Dettaglio draft non disponibile"
    throw new ControlRoomRequestError(response.status, message)
  }

  try {
    return parseDraftDetailResponse(body)
  } catch {
    throw new ControlRoomRequestError(response.status, "Contratto dettaglio draft non valido")
  }
}
