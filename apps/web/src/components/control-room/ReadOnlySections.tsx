import { FileText } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ControlRoomDraft } from "@/lib/control-room-api"
import { cn } from "@/lib/utils"

function statusClass(status: string): string {
  const normalized = status.toLowerCase()
  if (["verified", "approved", "enabled", "ready"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }
  if (["failed", "error", "contradicted", "disabled"].includes(normalized)) {
    return "border-red-200 bg-red-50 text-red-800"
  }
  if (["pending", "review", "processing", "proposed"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={cn("font-medium", statusClass(status))}>{status}</Badge>
}

function ClaimIdList({ label, ids }: { label: string; ids: Array<number | string> }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      {ids.length === 0 ? <p className="text-sm text-muted-foreground">Nessuno</p> : (
        <div className="flex flex-wrap gap-2">{ids.map((id) => <Badge key={String(id)} variant="secondary">#{id}</Badge>)}</div>
      )}
    </div>
  )
}

function DraftCard({ draft }: { draft: ControlRoomDraft }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2"><StatusBadge status={draft.status} /><Badge variant="outline">v{draft.version}</Badge></div>
        <CardTitle className="pt-2">{draft.title || draft.h1 || draft.page_slug}</CardTitle>
        <CardDescription>{draft.page_slug} · renderer {draft.prompt_version}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <ClaimIdList label="Claim usati" ids={draft.used_claim_ids || []} />
          <ClaimIdList label="Claim esclusi" ids={draft.excluded_claim_ids || []} />
        </div>
        <div className="rounded-xl border bg-muted/25 p-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Anteprima dallo snapshot</p>
          <h3 className="text-xl font-semibold">{draft.h1 || draft.title || "Titolo non disponibile"}</h3>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Lo snapshot espone metadati e riferimenti ai claim, non il corpo renderizzato. Questa vista non richiama endpoint operativi o di preview separati.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function DraftPreview({ drafts }: { drafts: ControlRoomDraft[] }) {
  return (
    <section id="draft" aria-labelledby="draft-title" className="scroll-mt-24 space-y-5">
      <div>
        <p className="text-sm font-medium text-primary">Draft preview</p>
        <h2 id="draft-title" className="text-2xl font-semibold tracking-tight">Ultimo draft disponibile</h2>
      </div>
      {drafts.length === 0 ? (
        <Alert data-testid="empty-drafts">
          <FileText aria-hidden="true" />
          <AlertTitle>Nessun draft nello snapshot</AlertTitle>
          <AlertDescription>Non viene mostrato contenuto sostitutivo: l’API non ha restituito draft.</AlertDescription>
        </Alert>
      ) : <DraftCard draft={drafts[0]} />}
    </section>
  )
}
