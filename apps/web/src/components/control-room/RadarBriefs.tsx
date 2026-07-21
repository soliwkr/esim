import { ExternalLink, FileSearch, RadioTower, Search, Sparkles } from "lucide-react"
import { useMemo, useRef, useState } from "react"

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
  ControlRoomResearchRun,
  ControlRoomSignal,
} from "@/lib/control-room-api"
import { cn } from "@/lib/utils"

function formatDateTime(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function statusClass(status: string): string {
  const normalized = status.toLowerCase()
  if (["accepted", "converted", "completed", "eligible", "verified", "approved"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }
  if (["failed", "error", "filtered", "contradicted", "rejected"].includes(normalized)) {
    return "border-red-200 bg-red-50 text-red-800"
  }
  if (["proposed", "pending", "processing", "review"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={cn("font-medium", statusClass(status))}>{status}</Badge>
}

function QualityFlags({ flags }: { flags: string[] }) {
  if (flags.length === 0) return <span className="text-sm text-muted-foreground">Nessun flag</span>
  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((flag) => <Badge key={flag} variant="secondary">{flag}</Badge>)}
    </div>
  )
}

function safeExternalUrl(value: string): string | null {
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

function RunDetail({ run }: { run: ControlRoomResearchRun }) {
  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      <SheetHeader>
        <SheetTitle>Run radar #{run.id}</SheetTitle>
        <SheetDescription>Metadati canonici dello snapshot, in sola lettura.</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 px-4 pb-6 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{run.source_system}</Badge>
          <Badge variant="outline">{run.run_kind}</Badge>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Query</p>
          <p className="leading-6">{run.query}</p>
        </div>
        <DetailGrid>
          <DetailItem label="Generato">{formatDateTime(run.generated_at)}</DetailItem>
          <DetailItem label="Creato">{formatDateTime(run.created_at)}</DetailItem>
          <DetailItem label="Finestra">{run.window_days} giorni</DetailItem>
          <DetailItem label="Risultati">{run.result_count}</DetailItem>
          <DetailItem label="Eligible">{run.eligible_count}</DetailItem>
          <DetailItem label="Filtered">{run.filtered_count}</DetailItem>
          <DetailItem label="Warning">{run.warning_count}</DetailItem>
        </DetailGrid>
      </div>
    </SheetContent>
  )
}

function SignalDetail({ signal }: { signal: ControlRoomSignal }) {
  const sourceUrl = safeExternalUrl(signal.url)
  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      <SheetHeader>
        <SheetTitle>Segnale #{signal.id}</SheetTitle>
        <SheetDescription>Opportunità editoriale proveniente dal run #{signal.run_id}.</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 px-4 pb-6 text-sm">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={signal.status} />
          <StatusBadge status={signal.eligible_for_editorial === 1 ? "eligible" : "filtered"} />
          <Badge variant="outline">{signal.signal_type}</Badge>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Titolo</p>
          <p className="leading-6">{signal.title}</p>
        </div>
        <DetailGrid>
          <DetailItem label="Topic">{signal.topic}</DetailItem>
          <DetailItem label="Fonte">{signal.source}</DetailItem>
          <DetailItem label="Pubblicato">{formatDateTime(signal.published_at)}</DetailItem>
          <DetailItem label="Aggiornato">{formatDateTime(signal.updated_at)}</DetailItem>
          <DetailItem label="Relevance score">{signal.relevance_score}</DetailItem>
          <DetailItem label="Freshness">{signal.freshness_days} giorni</DetailItem>
          <DetailItem label="Run di origine">#{signal.run_id}</DetailItem>
        </DetailGrid>
        <div>
          <p className="mb-2 font-medium">Quality flags</p>
          <QualityFlags flags={signal.quality_flags} />
        </div>
        <div>
          <p className="mb-1 font-medium">URL sorgente</p>
          {sourceUrl ? (
            <a className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline" href={sourceUrl} target="_blank" rel="noreferrer">
              Apri fonte <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          ) : <p className="break-all text-muted-foreground">{signal.url || "—"}</p>}
        </div>
        <Alert>
          <Search aria-hidden="true" />
          <AlertTitle>Segnale, non prova commerciale</AlertTitle>
          <AlertDescription>Questo record serve a prioritizzare il lavoro editoriale e non verifica prezzi, copertura o condizioni del provider.</AlertDescription>
        </Alert>
      </div>
    </SheetContent>
  )
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function BriefDetail({ brief }: { brief: ControlRoomBrief }) {
  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle>Brief #{brief.id}</SheetTitle>
        <SheetDescription>Punteggi e collegamenti persistiti dal backend, senza ricalcoli nel client.</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 px-4 pb-6 text-sm">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={brief.status} />
          <Badge variant="outline">{brief.asset_type}</Badge>
          <Badge variant="outline">{brief.search_intent}</Badge>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Titolo proposto</p>
          <p className="text-lg font-semibold leading-7">{brief.proposed_title}</p>
          <p className="mt-1 text-muted-foreground">{brief.cluster_title} · {brief.slug_suggestion}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <ScoreCard label="Opportunity" value={brief.opportunity_score} />
          <ScoreCard label="Evidence" value={brief.evidence_score} />
          <ScoreCard label="Priority" value={brief.priority_score} />
        </div>
        <DetailGrid>
          <DetailItem label="Creato">{formatDateTime(brief.created_at)}</DetailItem>
          <DetailItem label="Aggiornato">{formatDateTime(brief.updated_at)}</DetailItem>
          <DetailItem label="Evidence bundle">{brief.bundle_id === null ? "—" : `#${brief.bundle_id}`}</DetailItem>
          <DetailItem label="Readiness score">{brief.readiness_score ?? "—"}</DetailItem>
          <DetailItem label="Readiness status">{brief.readiness_status || "—"}</DetailItem>
          <DetailItem label="Draft">{brief.draft_id === null ? "—" : `#${brief.draft_id}`}</DetailItem>
          <DetailItem label="Draft status">{brief.draft_status || "—"}</DetailItem>
          <DetailItem label="Renderer">{brief.draft_renderer || "—"}</DetailItem>
        </DetailGrid>
        <div>
          <p className="mb-2 font-medium">Quality flags</p>
          <QualityFlags flags={brief.quality_flags} />
        </div>
        {brief.notes && <div><p className="mb-1 font-medium">Note</p><p className="leading-6 text-muted-foreground">{brief.notes}</p></div>}
      </div>
    </SheetContent>
  )
}

export function RadarBriefs({
  researchRuns,
  signals,
  briefs,
}: {
  researchRuns: ControlRoomResearchRun[]
  signals: ControlRoomSignal[]
  briefs: ControlRoomBrief[]
}) {
  const [sourceFilter, setSourceFilter] = useState("all")
  const [kindFilter, setKindFilter] = useState("all")
  const [selectedRun, setSelectedRun] = useState<ControlRoomResearchRun | null>(null)
  const [signalRunFilter, setSignalRunFilter] = useState("all")
  const [eligibilityFilter, setEligibilityFilter] = useState("all")
  const [selectedSignal, setSelectedSignal] = useState<ControlRoomSignal | null>(null)
  const [briefStatusFilter, setBriefStatusFilter] = useState("all")
  const [selectedBrief, setSelectedBrief] = useState<ControlRoomBrief | null>(null)
  const signalsSectionRef = useRef<HTMLElement>(null)

  const sourceSystems = useMemo(() => Array.from(new Set(researchRuns.map((run) => run.source_system))).sort(), [researchRuns])
  const runKinds = useMemo(() => Array.from(new Set(researchRuns.map((run) => run.run_kind))).sort(), [researchRuns])
  const briefStatuses = useMemo(() => Array.from(new Set(briefs.map((brief) => brief.status))).sort(), [briefs])

  const visibleRuns = researchRuns.filter((run) => (
    (sourceFilter === "all" || run.source_system === sourceFilter)
    && (kindFilter === "all" || run.run_kind === kindFilter)
  ))

  const visibleSignals = signals.filter((signal) => {
    const matchesRun = signalRunFilter === "all" || String(signal.run_id) === signalRunFilter
    const eligibility = signal.eligible_for_editorial === 1 ? "eligible" : "filtered"
    return matchesRun && (eligibilityFilter === "all" || eligibility === eligibilityFilter)
  })

  const visibleBriefs = briefStatusFilter === "all"
    ? briefs
    : briefs.filter((brief) => brief.status === briefStatusFilter)

  function showSignalsForRun(runId: number) {
    setSignalRunFilter(String(runId))
    window.requestAnimationFrame(() => signalsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  return (
    <>
      <section id="radar" aria-labelledby="radar-title" className="scroll-mt-24 space-y-5">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-primary">Radar</p>
            <h2 id="radar-title" className="text-2xl font-semibold tracking-tight">Run di ricerca recente</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Ultimi run persistiti. Questa vista non avvia Workflow e non interpreta un binding configurato come prova di un nuovo run riuscito.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[30rem]">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="run-source-filter">Sistema sorgente</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger id="run-source-filter"><SelectValue placeholder="Tutti i sistemi" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Tutti i sistemi</SelectItem>{sourceSystems.map((source) => <SelectItem key={source} value={source}>{source}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="run-kind-filter">Tipo run</label>
              <Select value={kindFilter} onValueChange={setKindFilter}>
                <SelectTrigger id="run-kind-filter"><SelectValue placeholder="Tutti i tipi" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Tutti i tipi</SelectItem>{runKinds.map((kind) => <SelectItem key={kind} value={kind}>{kind}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {researchRuns.length === 0 ? (
              <Alert className="m-6" data-testid="empty-runs"><RadioTower aria-hidden="true" /><AlertTitle>Nessun run nello snapshot</AlertTitle><AlertDescription>Non viene mostrato un run sostitutivo: il radar non ha restituito record recenti.</AlertDescription></Alert>
            ) : visibleRuns.length === 0 ? (
              <Alert className="m-6" data-testid="empty-run-filter"><AlertTitle>Nessun run per questi filtri</AlertTitle><AlertDescription>Modifica sistema sorgente o tipo di run.</AlertDescription></Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Run</TableHead><TableHead>Query</TableHead><TableHead>Generato</TableHead><TableHead>Risultati</TableHead><TableHead>Eligible / filtered</TableHead><TableHead>Warning</TableHead><TableHead className="text-right">Azioni</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {visibleRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell><div className="font-mono text-xs">#{run.id}</div><div className="mt-1 flex flex-wrap gap-1"><Badge variant="outline">{run.source_system}</Badge><Badge variant="outline">{run.run_kind}</Badge></div></TableCell>
                        <TableCell className="max-w-md font-medium"><span className="line-clamp-2">{run.query}</span></TableCell>
                        <TableCell>{formatDateTime(run.generated_at)}</TableCell>
                        <TableCell className="font-mono tabular-nums">{run.result_count}</TableCell>
                        <TableCell><span className="text-emerald-700">{run.eligible_count}</span> / <span className="text-muted-foreground">{run.filtered_count}</span></TableCell>
                        <TableCell className={cn("font-mono tabular-nums", run.warning_count > 0 && "text-amber-700")}>{run.warning_count}</TableCell>
                        <TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => showSignalsForRun(run.id)}>Vedi segnali</Button><Button variant="ghost" size="sm" onClick={() => setSelectedRun(run)} aria-label={`Apri run ${run.id}`}>Apri</Button></div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section id="signals" ref={signalsSectionRef} aria-labelledby="signals-title" className="scroll-mt-24 space-y-5">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-primary">Segnali</p>
            <h2 id="signals-title" className="text-2xl font-semibold tracking-tight">Opportunità editoriali recenti</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Titoli e discussioni recenti aiutano a scegliere cosa verificare. Non costituiscono evidenza commerciale.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[30rem]">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="signal-run-filter">Run di origine</label>
              <Select value={signalRunFilter} onValueChange={setSignalRunFilter}>
                <SelectTrigger id="signal-run-filter"><SelectValue placeholder="Tutti i run" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Tutti i run</SelectItem>{researchRuns.map((run) => <SelectItem key={run.id} value={String(run.id)}>Run #{run.id}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="signal-eligibility-filter">Idoneità</label>
              <Select value={eligibilityFilter} onValueChange={setEligibilityFilter}>
                <SelectTrigger id="signal-eligibility-filter"><SelectValue placeholder="Tutti i segnali" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Tutti i segnali</SelectItem><SelectItem value="eligible">Eligible</SelectItem><SelectItem value="filtered">Filtered</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {signals.length === 0 ? (
              <Alert className="m-6" data-testid="empty-signals"><Search aria-hidden="true" /><AlertTitle>Nessun segnale nello snapshot</AlertTitle><AlertDescription>Il radar non ha restituito segnali recenti da consultare.</AlertDescription></Alert>
            ) : visibleSignals.length === 0 ? (
              <Alert className="m-6" data-testid="empty-signal-filter"><AlertTitle>Nessun segnale per questi filtri</AlertTitle><AlertDescription>Modifica run di origine o idoneità.</AlertDescription></Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Titolo</TableHead><TableHead>Topic</TableHead><TableHead>Fonte</TableHead><TableHead>Score</TableHead><TableHead>Freshness</TableHead><TableHead>Idoneità</TableHead><TableHead>Flag</TableHead><TableHead className="text-right">Dettaglio</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {visibleSignals.map((signal) => (
                      <TableRow key={signal.id}>
                        <TableCell className="font-mono text-xs">#{signal.id}<div className="mt-1 text-muted-foreground">run #{signal.run_id}</div></TableCell>
                        <TableCell className="max-w-lg font-medium"><span className="line-clamp-2">{signal.title}</span><div className="mt-1"><StatusBadge status={signal.status} /></div></TableCell>
                        <TableCell>{signal.topic}</TableCell>
                        <TableCell>{signal.source}</TableCell>
                        <TableCell className="font-mono tabular-nums">{signal.relevance_score}</TableCell>
                        <TableCell>{signal.freshness_days} gg</TableCell>
                        <TableCell><StatusBadge status={signal.eligible_for_editorial === 1 ? "eligible" : "filtered"} /></TableCell>
                        <TableCell><Badge variant="secondary">{signal.quality_flags.length}</Badge></TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setSelectedSignal(signal)} aria-label={`Apri segnale ${signal.id}`}>Apri</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section id="briefs" aria-labelledby="briefs-title" className="scroll-mt-24 space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">Brief</p>
            <h2 id="briefs-title" className="text-2xl font-semibold tracking-tight">Priorità editoriali persistite</h2>
          </div>
          <div className="w-full sm:w-56">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="brief-status-filter">Stato brief</label>
            <Select value={briefStatusFilter} onValueChange={setBriefStatusFilter}>
              <SelectTrigger id="brief-status-filter"><SelectValue placeholder="Tutti gli stati" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tutti gli stati</SelectItem>{briefStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <Alert>
          <FileSearch aria-hidden="true" />
          <AlertTitle>Linkage non ricostruito</AlertTitle>
          <AlertDescription>Lo snapshot espone run → segnali tramite `run_id`, ma non un collegamento diretto tra singolo segnale e brief. La UI non lo deduce né lo inventa.</AlertDescription>
        </Alert>

        {briefs.length === 0 ? (
          <Alert data-testid="empty-briefs"><Sparkles aria-hidden="true" /><AlertTitle>Nessun brief nello snapshot</AlertTitle><AlertDescription>Non sono presenti priorità editoriali da mostrare.</AlertDescription></Alert>
        ) : visibleBriefs.length === 0 ? (
          <Alert data-testid="empty-brief-filter"><AlertTitle>Nessun brief per questo stato</AlertTitle><AlertDescription>Scegli un altro stato per rivedere i brief disponibili.</AlertDescription></Alert>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleBriefs.map((brief) => (
              <Card key={brief.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2"><StatusBadge status={brief.status} /><Badge variant="outline">{brief.asset_type}</Badge><Badge variant="outline">{brief.search_intent}</Badge></div>
                  <CardTitle className="pt-2 leading-7">{brief.proposed_title}</CardTitle>
                  <CardDescription>{brief.cluster_title} · {brief.slug_suggestion}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <ScoreCard label="Opportunity" value={brief.opportunity_score} />
                    <ScoreCard label="Evidence" value={brief.evidence_score} />
                    <ScoreCard label="Priority" value={brief.priority_score} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>Bundle {brief.bundle_id === null ? "—" : `#${brief.bundle_id}`} · readiness {brief.readiness_score ?? "—"}</span>
                    <span>Draft {brief.draft_id === null ? "—" : `#${brief.draft_id}`} · {brief.draft_status || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3"><QualityFlags flags={brief.quality_flags} /><Button variant="outline" size="sm" onClick={() => setSelectedBrief(brief)} aria-label={`Apri brief ${brief.id}`}>Apri dettaglio</Button></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Sheet open={selectedRun !== null} onOpenChange={(open) => { if (!open) setSelectedRun(null) }}>{selectedRun && <RunDetail run={selectedRun} />}</Sheet>
      <Sheet open={selectedSignal !== null} onOpenChange={(open) => { if (!open) setSelectedSignal(null) }}>{selectedSignal && <SignalDetail signal={selectedSignal} />}</Sheet>
      <Sheet open={selectedBrief !== null} onOpenChange={(open) => { if (!open) setSelectedBrief(null) }}>{selectedBrief && <BriefDetail brief={selectedBrief} />}</Sheet>
    </>
  )
}
