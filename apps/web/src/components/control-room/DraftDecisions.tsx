import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  FileText,
  Link2,
  ShieldCheck,
} from "lucide-react"
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
import type {
  ControlRoomBrief,
  ControlRoomDraft,
  ControlRoomEvidenceBundle,
} from "@/lib/control-room-api"
import {
  parseDraftDecisionRecords,
  type DraftDecisionRecord,
} from "@/lib/draft-contract"
import { cn } from "@/lib/utils"

type ReviewFilter = "all" | "reviewed" | "unreviewed"

type DraftContext = {
  bundle: ControlRoomEvidenceBundle | null
  brief: ControlRoomBrief | null
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Non disponibile"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function statusClass(status: string): string {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (status === "failed") return "border-red-200 bg-red-50 text-red-800"
  if (["review", "changes_requested", "generating"].includes(status)) {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={cn("font-medium", statusClass(status))}>{status}</Badge>
}

function ClaimIds({ label, ids }: { label: string; ids: number[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      {ids.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuno</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ids.map((id) => <Badge key={id} variant="secondary">#{id}</Badge>)}
        </div>
      )}
    </div>
  )
}

function GateValue({ enabled }: { enabled: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        enabled
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-slate-50 text-slate-700",
      )}
    >
      {enabled ? "Sì" : "No"}
    </Badge>
  )
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string
  value: number
  description: string
  icon: typeof FileText
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-1 text-3xl tabular-nums">{value}</CardTitle>
        </div>
        <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
      </CardHeader>
      <CardContent><p className="text-xs leading-5 text-muted-foreground">{description}</p></CardContent>
    </Card>
  )
}

function DraftDetails({ draft, context }: { draft: DraftDecisionRecord; context: DraftContext }) {
  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle>Draft #{draft.id}</SheetTitle>
        <SheetDescription>{draft.page_slug} · versione {draft.version} · sola lettura</SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-8 text-sm">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={draft.status} />
          <Badge variant="outline">v{draft.version}</Badge>
          <Badge variant="outline">{draft.page_type}</Badge>
          <Badge variant="outline">{draft.prompt_version}</Badge>
        </div>

        <Alert className="border-emerald-200 bg-emerald-50/70">
          <ShieldCheck aria-hidden="true" />
          <AlertTitle>Decisione editoriale ≠ pubblicazione</AlertTitle>
          <AlertDescription>
            Lo stato <strong>{draft.status}</strong> appartiene al draft. Il gate del bundle è mostrato separatamente; lo stato della pagina materializzata non è esposto nello snapshot e non viene dedotto.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 rounded-xl border bg-muted/25 p-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Evidence bundle</p>
            <p className="mt-1 font-medium">#{draft.evidence_bundle_id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Brief collegato</p>
            <p className="mt-1 font-medium">
              {context.brief ? `#${context.brief.id} · ${context.brief.proposed_title}` : "Non risolto nello snapshot"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Readiness score</p>
            <p className="mt-1 font-medium">{context.bundle?.readiness_score ?? "Non disponibile"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Publication eligibility</p>
            <div className="mt-1"><GateValue enabled={context.bundle?.publication_eligible === 1} /></div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview disponibile nello snapshot</CardTitle>
            <CardDescription>Metadati principali persistiti, senza contenuto sostitutivo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title</p>
              <p className="mt-1 leading-6">{draft.title || "Non disponibile"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">H1</p>
              <p className="mt-1 text-lg font-semibold">{draft.h1 || "Non disponibile"}</p>
            </div>
          </CardContent>
        </Card>

        <Alert data-testid="draft-contract-gap">
          <Link2 aria-hidden="true" />
          <AlertTitle>Gap del contratto corrente</AlertTitle>
          <AlertDescription>
            Corpo strutturato, FAQ, fonti, provenance field-level e stato della pagina materializzata esistono nel backend, ma non sono esposti dallo snapshot aggregato. Questa vista non li ricostruisce e non richiama endpoint separati.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 sm:grid-cols-2">
          <ClaimIds label="Claim usati" ids={draft.used_claim_ids} />
          <ClaimIds label="Claim esclusi" ids={draft.excluded_claim_ids} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decisione di revisione persistita</CardTitle>
            <CardDescription>Stato, autore, note e timestamp del record draft.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Generato da</dt><dd className="mt-1 font-medium">{draft.generated_by}</dd></div>
              <div><dt className="text-muted-foreground">Revisionato da</dt><dd className="mt-1 font-medium">{draft.reviewed_by || "Non revisionato"}</dd></div>
              <div><dt className="text-muted-foreground">Revisionato il</dt><dd className="mt-1 font-medium">{formatTimestamp(draft.reviewed_at)}</dd></div>
              <div><dt className="text-muted-foreground">Stato pagina</dt><dd className="mt-1 font-medium">Non esposto nello snapshot</dd></div>
            </dl>
            <div>
              <p className="font-medium">Note di revisione</p>
              <p className="mt-1 leading-6 text-muted-foreground">{draft.review_notes || "Nessuna nota"}</p>
            </div>
          </CardContent>
        </Card>

        {draft.error_message && (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Errore del draft</AlertTitle>
            <AlertDescription>{draft.error_message}</AlertDescription>
          </Alert>
        )}

        <dl className="grid gap-4 rounded-xl border bg-muted/25 p-4 sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Creato</dt><dd className="mt-1 font-medium">{formatTimestamp(draft.created_at)}</dd></div>
          <div><dt className="text-muted-foreground">Aggiornato</dt><dd className="mt-1 font-medium">{formatTimestamp(draft.updated_at)}</dd></div>
        </dl>
      </div>
    </SheetContent>
  )
}

export function DraftDecisions({
  drafts,
  bundles,
  briefs,
}: {
  drafts: ControlRoomDraft[]
  bundles: ControlRoomEvidenceBundle[]
  briefs: ControlRoomBrief[]
}) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [rendererFilter, setRendererFilter] = useState("all")
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const parsed = useMemo(() => {
    try {
      return { records: parseDraftDecisionRecords(drafts), error: null }
    } catch (error) {
      return {
        records: [] as DraftDecisionRecord[],
        error: error instanceof Error ? error.message : "Contratto draft non valido",
      }
    }
  }, [drafts])

  const bundleById = useMemo(() => new Map(bundles.map((bundle) => [bundle.id, bundle])), [bundles])
  const briefById = useMemo(() => new Map(briefs.map((brief) => [brief.id, brief])), [briefs])
  const statuses = useMemo(() => Array.from(new Set(parsed.records.map((draft) => draft.status))).sort(), [parsed.records])
  const renderers = useMemo(() => Array.from(new Set(parsed.records.map((draft) => draft.prompt_version))).sort(), [parsed.records])

  const visibleDrafts = useMemo(() => parsed.records.filter((draft) => {
    if (statusFilter !== "all" && draft.status !== statusFilter) return false
    if (rendererFilter !== "all" && draft.prompt_version !== rendererFilter) return false
    if (reviewFilter === "reviewed" && !draft.reviewed_by) return false
    if (reviewFilter === "unreviewed" && draft.reviewed_by) return false
    return true
  }), [parsed.records, rendererFilter, reviewFilter, statusFilter])

  const selected = parsed.records.find((draft) => draft.id === selectedId) || null
  const selectedBundle = selected ? bundleById.get(selected.evidence_bundle_id) || null : null
  const selectedBrief = selectedBundle ? briefById.get(selectedBundle.brief_id) || null : null

  return (
    <section id="draft" aria-labelledby="draft-title" className="scroll-mt-24 space-y-6" data-testid="drafts-section">
      <div>
        <p className="text-sm font-medium text-primary">Draft e decisioni</p>
        <h2 id="draft-title" className="text-2xl font-semibold tracking-tight">Draft, preview e revisione</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Inventario read-only dei draft e delle decisioni di revisione già persistite nello snapshot. Nessuna azione operativa viene esposta.
        </p>
      </div>

      <Alert data-testid="draft-guardrail" className="border-emerald-200 bg-emerald-50/70">
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>Approved draft ≠ published page</AlertTitle>
        <AlertDescription>
          La vista espone lo stato del draft e il gate dell’evidence bundle come dati distinti. Lo stato della pagina materializzata non è disponibile nello snapshot aggregato.
        </AlertDescription>
      </Alert>

      {parsed.error ? (
        <Alert variant="destructive" data-testid="draft-contract-error">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Contratto draft non valido</AlertTitle>
          <AlertDescription>{parsed.error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Draft nello snapshot" value={parsed.records.length} description="Versioni disponibili nel contratto aggregato." icon={FileText} />
            <SummaryCard label="Approvati" value={parsed.records.filter((draft) => draft.status === "approved").length} description="Decisione editoriale, non pubblicazione." icon={CheckCircle2} />
            <SummaryCard label="In revisione" value={parsed.records.filter((draft) => ["review", "changes_requested"].includes(draft.status)).length} description="Record ancora nel ciclo di revisione." icon={ClipboardCheck} />
            <SummaryCard label="Revisionati" value={parsed.records.filter((draft) => Boolean(draft.reviewed_by)).length} description="Record con revisore persistito." icon={FileClock} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="draft-status-filter">Filtra per stato draft</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="draft-status-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="draft-renderer-filter">Filtra per renderer</label>
              <Select value={rendererFilter} onValueChange={setRendererFilter}>
                <SelectTrigger id="draft-renderer-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i renderer</SelectItem>
                  {renderers.map((renderer) => <SelectItem key={renderer} value={renderer}>{renderer}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="draft-review-filter">Filtra per revisione</label>
              <Select value={reviewFilter} onValueChange={(value) => setReviewFilter(value as ReviewFilter)}>
                <SelectTrigger id="draft-review-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Revisionati e non</SelectItem>
                  <SelectItem value="reviewed">Con decisione di revisione</SelectItem>
                  <SelectItem value="unreviewed">Senza decisione di revisione</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{visibleDrafts.length} di {parsed.records.length} draft visibili</p>

          {parsed.records.length === 0 ? (
            <Alert data-testid="empty-drafts">
              <FileText aria-hidden="true" />
              <AlertTitle>Nessun draft nello snapshot</AlertTitle>
              <AlertDescription>Non viene mostrato contenuto sostitutivo.</AlertDescription>
            </Alert>
          ) : visibleDrafts.length === 0 ? (
            <Alert data-testid="empty-draft-filter">
              <FileText aria-hidden="true" />
              <AlertTitle>Nessun draft per questi filtri</AlertTitle>
              <AlertDescription>Modifica i filtri per rivedere i record disponibili.</AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pagina</TableHead>
                        <TableHead>Versione</TableHead>
                        <TableHead>Renderer</TableHead>
                        <TableHead>Stato draft</TableHead>
                        <TableHead>Bundle</TableHead>
                        <TableHead>Revisore</TableHead>
                        <TableHead className="text-right">Dettaglio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleDrafts.map((draft) => (
                        <TableRow key={draft.id}>
                          <TableCell>
                            <p className="font-medium">{draft.title || draft.page_slug}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{draft.page_slug}</p>
                          </TableCell>
                          <TableCell>v{draft.version}</TableCell>
                          <TableCell><Badge variant="outline">{draft.prompt_version}</Badge></TableCell>
                          <TableCell><StatusBadge status={draft.status} /></TableCell>
                          <TableCell>#{draft.evidence_bundle_id}</TableCell>
                          <TableCell>{draft.reviewed_by || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedId(draft.id)} aria-label={`Apri draft ${draft.id}`}>Apri</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Sheet open={selected !== null} onOpenChange={(open) => { if (!open) setSelectedId(null) }}>
        {selected && <DraftDetails draft={selected} context={{ bundle: selectedBundle, brief: selectedBrief }} />}
      </Sheet>
    </section>
  )
}
