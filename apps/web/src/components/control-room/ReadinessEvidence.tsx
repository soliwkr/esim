import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  ShieldAlert,
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
import type { ControlRoomEvidenceBundle } from "@/lib/control-room-api"
import { cn } from "@/lib/utils"

function formatDateTime(value: string | null): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function statusClass(status: string): string {
  const normalized = status.toLowerCase()
  if (["approved", "approved_for_draft", "completed", "ready"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }
  if (["rejected", "failed", "blocked"].includes(normalized)) {
    return "border-red-200 bg-red-50 text-red-800"
  }
  if (["review", "pending", "proposed"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function scoreClass(score: number): string {
  if (score >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (score >= 60) return "border-amber-200 bg-amber-50 text-amber-800"
  return "border-red-200 bg-red-50 text-red-800"
}

function GateBadge({ value }: { value: 0 | 1 }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        value === 1
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-slate-50 text-slate-700",
      )}
    >
      {value === 1 ? "Sì" : "No"}
    </Badge>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-muted/25 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-2 font-mono text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

function GateCard({ label, field, value }: { label: string; field: string; value: 0 | 1 }) {
  return (
    <div className="rounded-xl border bg-muted/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{label}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{field}</p>
        </div>
        <GateBadge value={value} />
      </div>
    </div>
  )
}

function BundleDetails({ bundle }: { bundle: ControlRoomEvidenceBundle }) {
  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle>Evidence bundle #{bundle.id}</SheetTitle>
        <SheetDescription>
          {bundle.page_slug} · Brief #{bundle.brief_id} · versione {bundle.version}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-6 text-sm">
        <Alert className="border-amber-200 bg-amber-50/70">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Due gate distinti</AlertTitle>
          <AlertDescription>
            L’idoneità alla generazione o revisione di un draft non equivale all’idoneità alla pubblicazione.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("font-medium", statusClass(bundle.review_status))}>
            {bundle.review_status}
          </Badge>
          <Badge variant="outline" className={cn("font-mono text-base", scoreClass(bundle.readiness_score))}>
            Readiness {bundle.readiness_score}
          </Badge>
        </div>

        <section aria-labelledby={`bundle-${bundle.id}-gates`}>
          <h3 id={`bundle-${bundle.id}-gates`} className="mb-3 font-semibold">Gate persistiti</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <GateCard label="Idoneo al draft" field="review_draft_eligible" value={bundle.review_draft_eligible} />
            <GateCard label="Ready for review draft" field="ready_for_review_draft" value={bundle.ready_for_review_draft} />
            <GateCard label="Idoneo alla pubblicazione" field="publication_eligible" value={bundle.publication_eligible} />
            <GateCard label="Ready for publication" field="ready_for_publication" value={bundle.ready_for_publication} />
          </div>
        </section>

        <section aria-labelledby={`bundle-${bundle.id}-claims`}>
          <h3 id={`bundle-${bundle.id}-claims`} className="mb-3 font-semibold">Stato dei claim</h3>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Verified" value={bundle.verified_count} />
            <Metric label="Insufficient" value={bundle.insufficient_count} />
            <Metric label="Contradicted" value={bundle.contradicted_count} />
            <Metric label="Pending" value={bundle.pending_count} />
            <Metric label="Expired" value={bundle.expired_count} />
          </dl>
        </section>

        <section aria-labelledby={`bundle-${bundle.id}-coverage`}>
          <h3 id={`bundle-${bundle.id}-coverage`} className="mb-3 font-semibold">Copertura dell’evidence set</h3>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Conflitti" value={bundle.conflict_count} />
            <Metric label="Fonti" value={bundle.source_count} />
            <Metric label="Soggetti" value={bundle.subject_count} />
            <Metric label="Test first-party" value={bundle.first_party_test_count} />
          </dl>
        </section>

        <section aria-labelledby={`bundle-${bundle.id}-warnings`}>
          <h3 id={`bundle-${bundle.id}-warnings`} className="mb-3 font-semibold">Warning persistiti</h3>
          {bundle.warnings.length === 0 ? (
            <p className="text-muted-foreground">Nessun warning registrato.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bundle.warnings.map((warning) => (
                <Badge key={warning} variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                  {warning}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby={`bundle-${bundle.id}-review`}>
          <h3 id={`bundle-${bundle.id}-review`} className="mb-3 font-semibold">Revisione e timestamp</h3>
          <dl className="grid gap-4 rounded-xl border bg-muted/25 p-4 sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Revisore</dt><dd className="mt-1 font-medium">{bundle.reviewed_by || "—"}</dd></div>
            <div><dt className="text-muted-foreground">Reviewed at</dt><dd className="mt-1 font-medium">{formatDateTime(bundle.reviewed_at)}</dd></div>
            <div><dt className="text-muted-foreground">Creato</dt><dd className="mt-1 font-medium">{formatDateTime(bundle.created_at)}</dd></div>
            <div><dt className="text-muted-foreground">Aggiornato</dt><dd className="mt-1 font-medium">{formatDateTime(bundle.updated_at)}</dd></div>
          </dl>
        </section>
      </div>
    </SheetContent>
  )
}

export function ReadinessEvidence({ bundles }: { bundles: ControlRoomEvidenceBundle[] }) {
  const [reviewFilter, setReviewFilter] = useState("all")
  const [draftFilter, setDraftFilter] = useState("all")
  const [publicationFilter, setPublicationFilter] = useState("all")
  const [warningFilter, setWarningFilter] = useState("all")
  const [selected, setSelected] = useState<ControlRoomEvidenceBundle | null>(null)

  const reviewStatuses = useMemo(
    () => Array.from(new Set(bundles.map((bundle) => bundle.review_status))).sort(),
    [bundles],
  )

  const visibleBundles = useMemo(() => bundles.filter((bundle) => {
    if (reviewFilter !== "all" && bundle.review_status !== reviewFilter) return false
    if (draftFilter !== "all" && bundle.review_draft_eligible !== Number(draftFilter)) return false
    if (publicationFilter !== "all" && bundle.publication_eligible !== Number(publicationFilter)) return false
    if (warningFilter === "with" && bundle.warnings.length === 0) return false
    if (warningFilter === "without" && bundle.warnings.length > 0) return false
    return true
  }), [bundles, draftFilter, publicationFilter, reviewFilter, warningFilter])

  const draftEligibleCount = bundles.filter((bundle) => bundle.review_draft_eligible === 1).length
  const publicationEligibleCount = bundles.filter((bundle) => bundle.publication_eligible === 1).length
  const warningCount = bundles.filter((bundle) => bundle.warnings.length > 0).length

  return (
    <section id="readiness" aria-labelledby="readiness-title" className="scroll-mt-24 space-y-5" data-testid="readiness-section">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Page Readiness</p>
          <h2 id="readiness-title" className="text-2xl font-semibold tracking-tight">Evidence bundle e gate</h2>
          <p className="mt-1 text-sm text-muted-foreground">{visibleBundles.length} di {bundles.length} bundle visibili · sola lettura</p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-4xl xl:grid-cols-4">
          <Select value={reviewFilter} onValueChange={setReviewFilter}>
            <SelectTrigger aria-label="Filtra per stato revisione"><SelectValue placeholder="Stato revisione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              {reviewStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={draftFilter} onValueChange={setDraftFilter}>
            <SelectTrigger aria-label="Filtra per idoneità draft"><SelectValue placeholder="Idoneità draft" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i gate draft</SelectItem>
              <SelectItem value="1">Draft idoneo</SelectItem>
              <SelectItem value="0">Draft non idoneo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={publicationFilter} onValueChange={setPublicationFilter}>
            <SelectTrigger aria-label="Filtra per idoneità pubblicazione"><SelectValue placeholder="Idoneità pubblicazione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i gate pubblicazione</SelectItem>
              <SelectItem value="1">Pubblicazione idonea</SelectItem>
              <SelectItem value="0">Pubblicazione non idonea</SelectItem>
            </SelectContent>
          </Select>
          <Select value={warningFilter} onValueChange={setWarningFilter}>
            <SelectTrigger aria-label="Filtra per warning"><SelectValue placeholder="Warning" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Con o senza warning</SelectItem>
              <SelectItem value="with">Con warning</SelectItem>
              <SelectItem value="without">Senza warning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Alert data-testid="readiness-guardrail" className="border-amber-200 bg-amber-50/70">
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Draft eligibility ≠ publication eligibility</AlertTitle>
        <AlertDescription>
          Un bundle idoneo alla generazione o revisione di un draft non è automaticamente pubblicabile. I quattro gate sono mostrati senza ricalcoli client.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Riepilogo evidence bundle">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Bundle</CardTitle><CardDescription>Record nello snapshot</CardDescription></CardHeader>
          <CardContent className="font-mono text-3xl font-semibold tabular-nums">{bundles.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Draft idonei</CardTitle><CardDescription>Gate `review_draft_eligible`</CardDescription></CardHeader>
          <CardContent className="flex items-center gap-3"><CheckCircle2 aria-hidden="true" className="size-5 text-emerald-700" /><span className="font-mono text-3xl font-semibold tabular-nums">{draftEligibleCount}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Pubblicabili</CardTitle><CardDescription>Gate `publication_eligible`</CardDescription></CardHeader>
          <CardContent className="flex items-center gap-3"><ShieldCheck aria-hidden="true" className="size-5 text-emerald-700" /><span className="font-mono text-3xl font-semibold tabular-nums">{publicationEligibleCount}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Con warning</CardTitle><CardDescription>Warning persistiti</CardDescription></CardHeader>
          <CardContent className="flex items-center gap-3"><AlertTriangle aria-hidden="true" className="size-5 text-amber-700" /><span className="font-mono text-3xl font-semibold tabular-nums">{warningCount}</span></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {bundles.length === 0 ? (
            <Alert className="m-6" data-testid="empty-evidence-bundles">
              <FileCheck2 aria-hidden="true" />
              <AlertTitle>Nessun evidence bundle nello snapshot</AlertTitle>
              <AlertDescription>Non viene mostrato contenuto sostitutivo o ricalcolato nel client.</AlertDescription>
            </Alert>
          ) : visibleBundles.length === 0 ? (
            <Alert className="m-6" data-testid="empty-readiness-filter">
              <AlertTitle>Nessun bundle per questi filtri</AlertTitle>
              <AlertDescription>Modifica i filtri per rivedere i record disponibili.</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bundle</TableHead>
                    <TableHead>Pagina</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Draft</TableHead>
                    <TableHead>Pubblicazione</TableHead>
                    <TableHead>Warning</TableHead>
                    <TableHead className="text-right">Dettaglio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleBundles.map((bundle) => (
                    <TableRow key={bundle.id} data-state={selected?.id === bundle.id ? "selected" : undefined}>
                      <TableCell className="font-mono text-xs">#{bundle.id} · v{bundle.version}</TableCell>
                      <TableCell><p className="font-medium">{bundle.page_slug}</p><p className="text-xs text-muted-foreground">Brief #{bundle.brief_id}</p></TableCell>
                      <TableCell><Badge variant="outline" className={cn("font-mono", scoreClass(bundle.readiness_score))}>{bundle.readiness_score}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={cn("font-medium", statusClass(bundle.review_status))}>{bundle.review_status}</Badge></TableCell>
                      <TableCell><GateBadge value={bundle.review_draft_eligible} /></TableCell>
                      <TableCell><GateBadge value={bundle.publication_eligible} /></TableCell>
                      <TableCell>{bundle.warnings.length === 0 ? "—" : <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">{bundle.warnings.length}</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(bundle)} aria-label={`Apri evidence bundle ${bundle.id}`}>Apri</Button>
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
        {selected && <BundleDetails bundle={selected} />}
      </Sheet>
    </section>
  )
}
