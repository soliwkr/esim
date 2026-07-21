import { CalendarClock, ExternalLink, FileCheck2, Rows3, ShieldCheck } from "lucide-react"
import { useMemo, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import type { ControlRoomClaim } from "@/lib/control-room-api"
import { cn } from "@/lib/utils"

type ExpiryState = "missing" | "valid" | "expired"

const MISSING_VALUE = "__missing__"

function formatDateTime(value: string | null): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function statusClass(status: string): string {
  const normalized = status.toLowerCase()
  if (["verified", "approved", "completed", "ready"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }
  if (["failed", "error", "contradicted", "expired", "rejected"].includes(normalized)) {
    return "border-red-200 bg-red-50 text-red-800"
  }
  if (["pending", "review", "processing", "proposed", "insufficient"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={cn("font-medium", statusClass(status))}>{status}</Badge>
}

function expiryState(validUntil: string | null, now = Date.now()): ExpiryState {
  if (!validUntil) return "missing"
  return new Date(validUntil).getTime() <= now ? "expired" : "valid"
}

function expiryLabel(state: ExpiryState): string {
  if (state === "expired") return "Scaduta"
  if (state === "valid") return "Valida"
  return "Senza scadenza"
}

function ExpiryBadge({ validUntil }: { validUntil: string | null }) {
  const state = expiryState(validUntil)
  const className = state === "expired"
    ? "border-red-200 bg-red-50 text-red-800"
    : state === "valid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-slate-200 bg-slate-50 text-slate-700"
  return <Badge variant="outline" className={cn("font-medium", className)}>{expiryLabel(state)}</Badge>
}

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null
  } catch {
    return null
  }
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">{children}</dl>
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{children}</dd></div>
}

function RequiredSources({ kinds }: { kinds: string[] }) {
  if (kinds.length === 0) return <p className="text-sm text-muted-foreground">Nessun tipo richiesto</p>
  return <div className="flex flex-wrap gap-2">{kinds.map((kind) => <Badge key={kind} variant="secondary">{kind}</Badge>)}</div>
}

function ClaimDetails({ claim }: { claim: ControlRoomClaim }) {
  const sourceUrl = safeExternalUrl(claim.source_url)
  const temporalState = expiryState(claim.valid_until)

  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle>Claim #{claim.id}</SheetTitle>
        <SheetDescription>Fonte, verifica e scadenza dallo snapshot canonico, in sola lettura.</SheetDescription>
      </SheetHeader>
      <div className="space-y-6 px-4 pb-6 text-sm">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={claim.status} />
          <ExpiryBadge validUntil={claim.valid_until} />
          {claim.verification_status && <StatusBadge status={claim.verification_status} />}
          {claim.task_status && <Badge variant="outline">task: {claim.task_status}</Badge>}
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Claim</p>
          <p className="leading-6">{claim.claim_text}</p>
        </div>

        <DetailGrid>
          <DetailItem label="Brief">{claim.brief_id === null ? "—" : `#${claim.brief_id}`}</DetailItem>
          <DetailItem label="Soggetto">{[claim.subject_type, claim.subject_key].filter(Boolean).join(" · ") || "—"}</DetailItem>
          <DetailItem label="Campo">{claim.field_name || "—"}</DetailItem>
          <DetailItem label="Stato canonico">{claim.status}</DetailItem>
          <DetailItem label="Creato">{formatDateTime(claim.created_at)}</DetailItem>
          <DetailItem label="Aggiornato">{formatDateTime(claim.updated_at)}</DetailItem>
        </DetailGrid>

        {claim.verification_question && (
          <div>
            <p className="mb-1 font-medium">Domanda di verifica</p>
            <p className="leading-6 text-muted-foreground">{claim.verification_question}</p>
          </div>
        )}

        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
            <h3 className="font-medium">Fonte</h3>
          </div>
          <DetailGrid>
            <DetailItem label="Tipo">{claim.source_kind || "—"}</DetailItem>
            <DetailItem label="Etichetta">{claim.source_label || "—"}</DetailItem>
            <DetailItem label="Trust level">{claim.trust_level ?? "—"}</DetailItem>
            <DetailItem label="Tipi richiesti"><RequiredSources kinds={claim.required_source_kinds} /></DetailItem>
          </DetailGrid>
          {sourceUrl ? (
            <a className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline" href={sourceUrl} target="_blank" rel="noreferrer">
              Apri fonte <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          ) : <p className="text-muted-foreground">URL sorgente non disponibile.</p>}
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <FileCheck2 aria-hidden="true" className="size-4 text-primary" />
            <h3 className="font-medium">Verifica</h3>
          </div>
          <DetailGrid>
            <DetailItem label="Esito">{claim.verification_status || "—"}</DetailItem>
            <DetailItem label="Confidenza persistita">{claim.confidence ?? "—"}</DetailItem>
            <DetailItem label="Controllato">{formatDateTime(claim.checked_at)}</DetailItem>
            <DetailItem label="Valido fino al">{formatDateTime(claim.valid_until)}</DetailItem>
          </DetailGrid>
          {claim.evidence ? (
            <div><p className="mb-1 font-medium">Evidenza</p><p className="leading-6 text-muted-foreground">{claim.evidence}</p></div>
          ) : <p className="text-muted-foreground">Nessuna evidenza registrata.</p>}
        </div>

        {claim.notes && <div><p className="mb-1 font-medium">Note</p><p className="leading-6 text-muted-foreground">{claim.notes}</p></div>}

        <Alert>
          <CalendarClock aria-hidden="true" />
          <AlertTitle>Stato temporale, non stato canonico</AlertTitle>
          <AlertDescription>
            “{expiryLabel(temporalState)}” deriva soltanto da <code>valid_until</code>. Non modifica lo stato “{claim.status}” e non rende utilizzabile un claim insufficiente o scaduto.
          </AlertDescription>
        </Alert>

        <Alert>
          <ShieldCheck aria-hidden="true" />
          <AlertTitle>Fonte ed evidenza restano distinte</AlertTitle>
          <AlertDescription>Una fonte ufficiale è una dichiarazione attribuita; non viene presentata come test indipendente.</AlertDescription>
        </Alert>
      </div>
    </SheetContent>
  )
}

export function ClaimsSources({ claims }: { claims: ControlRoomClaim[] }) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [briefFilter, setBriefFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [verificationFilter, setVerificationFilter] = useState("all")
  const [expiryFilter, setExpiryFilter] = useState("all")
  const [selected, setSelected] = useState<ControlRoomClaim | null>(null)

  const statuses = useMemo(() => Array.from(new Set(claims.map((claim) => claim.status))).sort(), [claims])
  const briefs = useMemo(() => Array.from(new Set(claims.map((claim) => claim.brief_id === null ? MISSING_VALUE : String(claim.brief_id)))).sort(), [claims])
  const sources = useMemo(() => Array.from(new Set(claims.map((claim) => claim.source_kind || MISSING_VALUE))).sort(), [claims])
  const verifications = useMemo(() => Array.from(new Set(claims.map((claim) => claim.verification_status || MISSING_VALUE))).sort(), [claims])

  const visibleClaims = useMemo(() => claims.filter((claim) => {
    if (statusFilter !== "all" && claim.status !== statusFilter) return false
    if (briefFilter !== "all" && (claim.brief_id === null ? MISSING_VALUE : String(claim.brief_id)) !== briefFilter) return false
    if (sourceFilter !== "all" && (claim.source_kind || MISSING_VALUE) !== sourceFilter) return false
    if (verificationFilter !== "all" && (claim.verification_status || MISSING_VALUE) !== verificationFilter) return false
    if (expiryFilter !== "all" && expiryState(claim.valid_until) !== expiryFilter) return false
    return true
  }), [briefFilter, claims, expiryFilter, sourceFilter, statusFilter, verificationFilter])

  return (
    <section id="claims" aria-labelledby="claims-title" className="scroll-mt-24 space-y-5">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Evidence registry</p>
          <h2 id="claims-title" className="text-2xl font-semibold tracking-tight">Claim, fonti e scadenze</h2>
          <p className="mt-1 text-sm text-muted-foreground">{visibleClaims.length} di {claims.length} claim visibili · sola lettura</p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-5xl xl:grid-cols-5">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filtra per stato claim"><SelectValue placeholder="Stato" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tutti gli stati</SelectItem>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={briefFilter} onValueChange={setBriefFilter}>
            <SelectTrigger aria-label="Filtra per brief"><SelectValue placeholder="Brief" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tutti i brief</SelectItem>{briefs.map((brief) => <SelectItem key={brief} value={brief}>{brief === MISSING_VALUE ? "Senza brief" : `Brief #${brief}`}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger aria-label="Filtra per fonte"><SelectValue placeholder="Fonte" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tutte le fonti</SelectItem>{sources.map((source) => <SelectItem key={source} value={source}>{source === MISSING_VALUE ? "Senza fonte" : source}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={verificationFilter} onValueChange={setVerificationFilter}>
            <SelectTrigger aria-label="Filtra per verifica"><SelectValue placeholder="Verifica" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tutte le verifiche</SelectItem>{verifications.map((verification) => <SelectItem key={verification} value={verification}>{verification === MISSING_VALUE ? "Senza verifica" : verification}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={expiryFilter} onValueChange={setExpiryFilter}>
            <SelectTrigger aria-label="Filtra per scadenza"><SelectValue placeholder="Scadenza" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le scadenze</SelectItem>
              <SelectItem value="valid">Valida</SelectItem>
              <SelectItem value="expired">Scaduta</SelectItem>
              <SelectItem value="missing">Senza scadenza</SelectItem>
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
            <Alert className="m-6" data-testid="empty-claim-filter">
              <AlertTitle>Nessun claim per questi filtri</AlertTitle>
              <AlertDescription>Modifica stato, brief, fonte, verifica o scadenza.</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead><TableHead>Claim</TableHead><TableHead>Brief</TableHead><TableHead>Soggetto</TableHead><TableHead>Stato</TableHead><TableHead>Fonte</TableHead><TableHead>Scadenza</TableHead><TableHead className="text-right">Dettaglio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleClaims.map((claim) => (
                    <TableRow key={claim.id} data-state={selected?.id === claim.id ? "selected" : undefined}>
                      <TableCell className="font-mono text-xs">#{claim.id}</TableCell>
                      <TableCell className="max-w-lg font-medium"><span className="line-clamp-2">{claim.claim_text}</span></TableCell>
                      <TableCell>{claim.brief_id === null ? "—" : `#${claim.brief_id}`}</TableCell>
                      <TableCell>{claim.subject_key || claim.subject_type || "—"}</TableCell>
                      <TableCell><StatusBadge status={claim.status} /></TableCell>
                      <TableCell>{claim.source_label || claim.source_kind || "—"}</TableCell>
                      <TableCell><ExpiryBadge validUntil={claim.valid_until} /></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setSelected(claim)} aria-label={`Apri claim ${claim.id}`}>Apri</Button></TableCell>
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
