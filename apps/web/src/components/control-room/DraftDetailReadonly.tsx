import {
  AlertTriangle,
  BookOpenText,
  Braces,
  ExternalLink,
  FileSearch,
  Link2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

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
import { Skeleton } from "@/components/ui/skeleton"
import type { ControlRoomDraft, ControlRoomEvidenceBundle } from "@/lib/control-room-api"
import { parseDraftDecisionRecords, type DraftDecisionRecord } from "@/lib/draft-contract"
import { fetchDraftDetail } from "@/lib/draft-detail-api"
import type {
  DraftContentBlock,
  DraftDetail,
  DraftFieldClaimIds,
} from "@/lib/draft-detail-contract"
import { cn } from "@/lib/utils"

type DetailState = {
  data: DraftDetail | null
  error: string | null
  status: "loading" | "ready" | "error"
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

function statusClass(status: string | null): string {
  if (status === "approved" || status === "published") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (status === "failed") return "border-red-200 bg-red-50 text-red-800"
  if (status === "review" || status === "changes_requested") return "border-amber-200 bg-amber-50 text-amber-800"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function StatusBadge({ label, status }: { label: string; status: string | null }) {
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", statusClass(status))}>
      {label}: {status || "non disponibile"}
    </Badge>
  )
}

function ClaimBadges({ ids }: { ids: number[] }) {
  if (ids.length === 0) return <span className="text-sm text-muted-foreground">Nessun claim collegato</span>
  return (
    <div className="flex flex-wrap gap-2">
      {ids.map((id) => <Badge key={id} variant="secondary">#{id}</Badge>)}
    </div>
  )
}

function directClaims(mapping: DraftFieldClaimIds, key: string): number[] {
  const value = mapping[key]
  return Array.isArray(value) ? value : []
}

function groupedClaims(mapping: DraftFieldClaimIds, key: string): Record<string, number[]> {
  const value = mapping[key]
  return value && !Array.isArray(value) ? value : {}
}

function ContentBlock({ block }: { block: DraftContentBlock }) {
  if (block.type === "heading") return <h4 className="pt-2 text-lg font-semibold">{block.text}</h4>
  if (block.type === "paragraph") return <p className="leading-7 text-muted-foreground">{block.text}</p>
  if (block.type === "bullets" || block.type === "steps") {
    const List = block.type === "steps" ? "ol" : "ul"
    return (
      <List className={cn("space-y-2 pl-5 text-sm leading-6 text-muted-foreground", block.type === "steps" ? "list-decimal" : "list-disc")}>
        {block.items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
      </List>
    )
  }
  if (block.type === "callout") {
    return (
      <Alert>
        <AlertTriangle aria-hidden="true" />
        <AlertTitle>{block.title}</AlertTitle>
        <AlertDescription>{block.text}</AlertDescription>
      </Alert>
    )
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-muted/60">
          <tr>{block.headers.map((header) => <th key={header} className="px-3 py-2 font-medium">{header}</th>)}</tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t">
              {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top text-muted-foreground">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DetailLoading() {
  return (
    <div className="space-y-4" data-testid="draft-detail-loading">
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-44 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}

function DetailBody({ detail, bundle }: { detail: DraftDetail; bundle: ControlRoomEvidenceBundle | null }) {
  const topFields = [
    ["Title", "title"],
    ["Meta description", "meta_description"],
    ["H1", "h1"],
    ["Direct answer", "direct_answer"],
    ["Intro", "intro"],
  ] as const
  const sectionClaims = groupedClaims(detail.fieldClaimIds, "section")
  const faqClaims = groupedClaims(detail.fieldClaimIds, "faq")

  return (
    <div className="space-y-6" data-testid="draft-detail-ready">
      <Alert className="border-emerald-200 bg-emerald-50/70">
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>Approved draft ≠ published page</AlertTitle>
        <AlertDescription>
          Stato draft, stato della pagina materializzata e publication eligibility sono tre valori distinti. Questa vista li mostra come persistiti e non abilita alcuna azione.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-2">
        <StatusBadge label="Draft" status={detail.status} />
        <StatusBadge label="Pagina" status={detail.materializedPageStatus} />
        <Badge variant="outline">Publication eligibility: {bundle?.publication_eligible === 1 ? "sì" : "no"}</Badge>
        <Badge variant="outline">Renderer: {detail.promptVersion}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagina proposta</CardTitle>
          <CardDescription>Contenuto completo persistito nel draft, non una ricostruzione client.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title</p><p className="mt-1 font-medium">{detail.page.title || "Non disponibile"}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Meta description</p><p className="mt-1 leading-6 text-muted-foreground">{detail.page.metaDescription || "Non disponibile"}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">H1</p><p className="mt-1 text-xl font-semibold">{detail.page.h1 || "Non disponibile"}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Risposta diretta</p><p className="mt-1 leading-7">{detail.page.directAnswer || "Non disponibile"}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Introduzione</p><p className="mt-1 leading-7 text-muted-foreground">{detail.page.intro || "Non disponibile"}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpenText aria-hidden="true" className="size-4" />Corpo strutturato</CardTitle>
          <CardDescription>{detail.page.content.length} blocchi persistiti.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {detail.page.content.length === 0
            ? <p className="text-sm text-muted-foreground">Nessun blocco disponibile.</p>
            : detail.page.content.map((block, index) => <ContentBlock key={index} block={block} />)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Link2 aria-hidden="true" className="size-4" />Provenance field-level</CardTitle>
          <CardDescription>Claim collegati dal renderer ai campi, alle sezioni e alle FAQ.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {topFields.map(([label, key]) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">{label}</p>
                <ClaimBadges ids={directClaims(detail.fieldClaimIds, key)} />
              </div>
            ))}
          </div>
          <div>
            <p className="mb-3 font-medium">Sezioni</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.keys(sectionClaims).length === 0
                ? <p className="text-sm text-muted-foreground">Nessuna provenance di sezione.</p>
                : Object.entries(sectionClaims).map(([key, ids]) => (
                  <div key={key} className="rounded-lg border p-3"><p className="mb-2 text-sm font-medium">Sezione {Number(key) + 1}</p><ClaimBadges ids={ids} /></div>
                ))}
            </div>
          </div>
          <div>
            <p className="mb-3 font-medium">FAQ</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.keys(faqClaims).length === 0
                ? <p className="text-sm text-muted-foreground">Nessuna provenance FAQ.</p>
                : Object.entries(faqClaims).map(([key, ids]) => (
                  <div key={key} className="rounded-lg border p-3"><p className="mb-2 text-sm font-medium">FAQ {Number(key) + 1}</p><ClaimBadges ids={ids} /></div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">FAQ</CardTitle>
          <CardDescription>Domande e risposte persistite nel draft.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {detail.page.faq.length === 0
            ? <p className="text-sm text-muted-foreground">Nessuna FAQ disponibile.</p>
            : detail.page.faq.map((item, index) => (
              <div key={`${index}-${item.question}`} className="rounded-lg border p-4">
                <p className="font-medium">{item.question}</p>
                <p className="mt-2 leading-6 text-muted-foreground">{item.answer}</p>
                <div className="mt-3"><ClaimBadges ids={faqClaims[String(index)] || []} /></div>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fonti</CardTitle>
          <CardDescription>Link HTTPS persistiti dal renderer per i claim usati.</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.page.sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna fonte disponibile.</p>
          ) : (
            <ul className="space-y-3">
              {detail.page.sources.map((source) => (
                <li key={source.url}>
                  <a className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline" href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.label}<ExternalLink aria-hidden="true" className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Claim del draft</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div><p className="mb-2 font-medium">Usati</p><ClaimBadges ids={detail.usedClaimIds} /></div>
            <div><p className="mb-2 font-medium">Esclusi</p><ClaimBadges ids={detail.excludedClaimIds} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Regole di generazione</CardTitle></CardHeader>
          <CardContent>
            {detail.generationRules.length === 0 ? <p className="text-sm text-muted-foreground">Nessuna regola persistita.</p> : (
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                {detail.generationRules.map((rule) => <li key={rule}>{rule}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Braces aria-hidden="true" className="size-4" />Metadati tecnici</CardTitle>
          <CardDescription>Dati persistiti, senza interpretazione operativa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Modello</dt><dd className="mt-1 font-medium">{detail.model}</dd></div>
            <div><dt className="text-muted-foreground">Draft key</dt><dd className="mt-1 break-all font-mono text-xs">{detail.draftKey}</dd></div>
            <div><dt className="text-muted-foreground">Generato da</dt><dd className="mt-1 font-medium">{detail.generatedBy}</dd></div>
            <div><dt className="text-muted-foreground">Revisionato da</dt><dd className="mt-1 font-medium">{detail.reviewedBy || "Non revisionato"}</dd></div>
            <div><dt className="text-muted-foreground">Creato</dt><dd className="mt-1 font-medium">{formatTimestamp(detail.createdAt)}</dd></div>
            <div><dt className="text-muted-foreground">Aggiornato</dt><dd className="mt-1 font-medium">{formatTimestamp(detail.updatedAt)}</dd></div>
          </dl>
          <div>
            <p className="mb-2 font-medium">Usage</p>
            <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(detail.usage, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DraftDetailSheet({ draft, bundle }: { draft: DraftDecisionRecord; bundle: ControlRoomEvidenceBundle | null }) {
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState<DetailState>({ data: null, error: null, status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    setState({ data: null, error: null, status: "loading" })

    fetchDraftDetail(draft.id, controller.signal).then((detail) => {
      if (
        detail.id !== draft.id
        || detail.evidenceBundleId !== draft.evidence_bundle_id
        || detail.version !== draft.version
        || detail.pageSlug !== draft.page_slug
        || detail.promptVersion !== draft.prompt_version
      ) {
        throw new Error("Il dettaglio non corrisponde al draft selezionato")
      }
      setState({ data: detail, error: null, status: "ready" })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setState({
        data: null,
        error: error instanceof Error ? error.message : "Dettaglio draft non disponibile",
        status: "error",
      })
    })

    return () => controller.abort()
  }, [draft, reloadKey])

  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
      <SheetHeader>
        <SheetTitle>Dettaglio completo draft #{draft.id}</SheetTitle>
        <SheetDescription>{draft.page_slug} · versione {draft.version} · GET-only</SheetDescription>
      </SheetHeader>
      <div className="px-4 pb-8">
        {state.status === "loading" && <DetailLoading />}
        {state.status === "error" && (
          <Alert variant="destructive" data-testid="draft-detail-error">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Dettaglio draft non disponibile</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{state.error}</p>
              <Button variant="outline" size="sm" onClick={() => setReloadKey((value) => value + 1)}>
                <RefreshCw aria-hidden="true" />Riprova
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {state.data && <DetailBody detail={state.data} bundle={bundle} />}
      </div>
    </SheetContent>
  )
}

export function DraftDetailReadonly({
  drafts,
  bundles,
}: {
  drafts: ControlRoomDraft[]
  bundles: ControlRoomEvidenceBundle[]
}) {
  const parsed = useMemo(() => {
    try {
      return { records: parseDraftDecisionRecords(drafts), error: null }
    } catch (error) {
      return { records: [] as DraftDecisionRecord[], error: error instanceof Error ? error.message : "Contratto draft non valido" }
    }
  }, [drafts])
  const [choice, setChoice] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const bundleById = useMemo(() => new Map(bundles.map((bundle) => [bundle.id, bundle])), [bundles])

  useEffect(() => {
    if (parsed.records.length === 0) setChoice("")
    else if (!parsed.records.some((draft) => String(draft.id) === choice)) setChoice(String(parsed.records[0].id))
  }, [choice, parsed.records])

  const selected = parsed.records.find((draft) => draft.id === selectedId) || null
  const selectedBundle = selected ? bundleById.get(selected.evidence_bundle_id) || null : null

  return (
    <section id="draft-detail" aria-labelledby="draft-detail-title" className="scroll-mt-24 space-y-6" data-testid="draft-detail-section">
      <div>
        <p className="text-sm font-medium text-primary">Draft on demand</p>
        <h2 id="draft-detail-title" className="text-2xl font-semibold tracking-tight">Dettaglio draft completo</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Corpo, FAQ, fonti, provenance field-level e stato pagina vengono caricati soltanto quando apri una versione. L’inventario iniziale resta leggero.
        </p>
      </div>

      <Alert>
        <FileSearch aria-hidden="true" />
        <AlertTitle>Risorsa indipendente e GET-only</AlertTitle>
        <AlertDescription>
          Un errore del dettaglio non cancella lo snapshot già valido. Il browser non riceve il maintenance token e non sono disponibili generazione, revisione, materializzazione o pubblicazione.
        </AlertDescription>
      </Alert>

      {parsed.error ? (
        <Alert variant="destructive"><AlertTriangle aria-hidden="true" /><AlertTitle>Contratto inventario draft non valido</AlertTitle><AlertDescription>{parsed.error}</AlertDescription></Alert>
      ) : parsed.records.length === 0 ? (
        <Alert data-testid="empty-draft-detail"><FileSearch aria-hidden="true" /><AlertTitle>Nessun draft disponibile</AlertTitle><AlertDescription>Il dettaglio non viene simulato.</AlertDescription></Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scegli una versione</CardTitle>
            <CardDescription>Il dettaglio viene richiesto soltanto dopo l’apertura.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="draft-detail-select">Versione draft</label>
              <Select value={choice} onValueChange={setChoice}>
                <SelectTrigger id="draft-detail-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {parsed.records.map((draft) => (
                    <SelectItem key={draft.id} value={String(draft.id)}>#{draft.id} · v{draft.version} · {draft.page_slug} · {draft.status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setSelectedId(Number(choice))} disabled={!choice} aria-label={`Apri dettaglio completo draft ${choice}`}>
              <FileSearch aria-hidden="true" />Apri dettaglio completo
            </Button>
          </CardContent>
        </Card>
      )}

      <Sheet open={selected !== null} onOpenChange={(open) => { if (!open) setSelectedId(null) }}>
        {selected && <DraftDetailSheet draft={selected} bundle={selectedBundle} />}
      </Sheet>
    </section>
  )
}
