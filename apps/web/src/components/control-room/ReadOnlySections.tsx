import { FileText, Rows3 } from "lucide-react"
import { useMemo, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ControlRoomClaim, ControlRoomDraft } from "@/lib/control-room-api"
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

function ClaimDetails({ claim }: { claim: ControlRoomClaim }) {
  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      <SheetHeader>
        <SheetTitle>Claim #{claim.id}</SheetTitle>
        <SheetDescription>Dettaglio dello snapshot, in sola lettura.</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 px-4 pb-6 text-sm">
        <StatusBadge status={claim.status} />
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Claim</p>
          <p className="leading-6">{claim.claim_text}</p>
        </div>
        <dl className="grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Soggetto</dt><dd className="mt-1 font-medium">{claim.subject_key || "—"}</dd></div>
          <div><dt className="text-muted-foreground">Campo</dt><dd className="mt-1 font-medium">{claim.field_name || "—"}</dd></div>
          <div><dt className="text-muted-foreground">Fonte</dt><dd className="mt-1 font-medium">{claim.source_label || claim.source_kind || "—"}</dd></div>
          <div><dt className="text-muted-foreground">Validità</dt><dd className="mt-1 font-medium">{claim.valid_until || "—"}</dd></div>
          <div><dt className="text-muted-foreground">Verifica</dt><dd className="mt-1 font-medium">{claim.verification_status || "—"}</dd></div>
          <div><dt className="text-muted-foreground">Confidenza</dt><dd className="mt-1 font-medium">{claim.confidence ?? "—"}</dd></div>
        </dl>
        {claim.evidence && <div><p className="mb-1 font-medium">Evidenza</p><p className="leading-6 text-muted-foreground">{claim.evidence}</p></div>}
        {claim.notes && <div><p className="mb-1 font-medium">Note</p><p className="leading-6 text-muted-foreground">{claim.notes}</p></div>}
      </div>
    </SheetContent>
  )
}

export function ClaimsPreview({ claims }: { claims: ControlRoomClaim[] }) {
  const [filter, setFilter] = useState("all")
  const [selected, setSelected] = useState<ControlRoomClaim | null>(null)
  const statuses = useMemo(() => Array.from(new Set(claims.map((claim) => claim.status))).sort(), [claims])
  const visibleClaims = filter === "all" ? claims : claims.filter((claim) => claim.status === filter)

  return (
    <section id="claims" aria-labelledby="claims-title" className="scroll-mt-24 space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Claims preview</p>
          <h2 id="claims-title" className="text-2xl font-semibold tracking-tight">Claim dallo snapshot</h2>
        </div>
        <div className="w-full sm:w-56">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="claim-filter">Filtra per stato</label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger id="claim-filter"><SelectValue placeholder="Tutti gli stati" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {claims.length === 0 ? (
            <Alert className="m-6" data-testid="empty-claims">
              <Rows3 aria-hidden="true" />
              <AlertTitle>Nessun claim nello snapshot</AlertTitle>
              <AlertDescription>Lo stato è reale: l’API non ha restituito claim da mostrare.</AlertDescription>
            </Alert>
          ) : visibleClaims.length === 0 ? (
            <Alert className="m-6" data-testid="empty-filter">
              <AlertTitle>Nessun risultato per questo filtro</AlertTitle>
              <AlertDescription>Scegli un altro stato per rivedere i claim disponibili.</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Claim</TableHead><TableHead>Soggetto</TableHead><TableHead>Stato</TableHead><TableHead>Fonte</TableHead><TableHead className="text-right">Dettaglio</TableHead></TableRow></TableHeader>
                <TableBody>
                  {visibleClaims.map((claim) => (
                    <TableRow key={claim.id} data-state={selected?.id === claim.id ? "selected" : undefined}>
                      <TableCell className="font-mono text-xs">#{claim.id}</TableCell>
                      <TableCell className="max-w-lg font-medium"><span className="line-clamp-2">{claim.claim_text}</span></TableCell>
                      <TableCell>{claim.subject_key || "—"}</TableCell>
                      <TableCell><StatusBadge status={claim.status} /></TableCell>
                      <TableCell>{claim.source_label || claim.source_kind || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(claim)} aria-label={`Apri claim ${claim.id}`}>Apri</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Sheet open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        {selected && <ClaimDetails claim={selected} />}
      </Sheet>
    </section>
  )
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
