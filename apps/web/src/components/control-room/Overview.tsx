import {
  Activity,
  Database,
  FileText,
  ListChecks,
  RadioTower,
  ServerCog,
  ShieldCheck,
  Workflow,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  ControlRoomOverview,
  ControlRoomSnapshot,
  HealthSnapshot,
  OverviewMetricKey,
} from "@/lib/control-room-api"
import { cn } from "@/lib/utils"

type StatusTone = "positive" | "warning" | "negative" | "neutral"

type RuntimeStatus = {
  label: string
  value: string
  detail: string
  tone: StatusTone
  icon: typeof Activity
}

type MetricDefinition = {
  key: OverviewMetricKey
  label: string
  tone?: StatusTone
}

type MetricGroup = {
  title: string
  description: string
  icon: typeof Activity
  metrics: MetricDefinition[]
}

const metricGroups: MetricGroup[] = [
  {
    title: "Fonti e coda",
    description: "Manutenzione delle fonti e lavoro ancora da processare.",
    icon: ListChecks,
    metrics: [
      { key: "sources_total", label: "Fonti registrate" },
      { key: "sources_due", label: "Fonti da ricontrollare", tone: "warning" },
      { key: "queue_pending", label: "Task in attesa", tone: "warning" },
      { key: "queue_processing", label: "Task in lavorazione" },
      { key: "queue_failed", label: "Task falliti", tone: "negative" },
    ],
  },
  {
    title: "Ricerca recente",
    description: "Volume dei run e separazione tra segnali idonei e filtrati.",
    icon: RadioTower,
    metrics: [
      { key: "research_runs", label: "Run completati" },
      { key: "signals_eligible", label: "Segnali idonei", tone: "positive" },
      { key: "signals_filtered", label: "Segnali filtrati" },
    ],
  },
  {
    title: "Brief e claim",
    description: "Avanzamento del lavoro editoriale prima della readiness.",
    icon: FileText,
    metrics: [
      { key: "briefs_proposed", label: "Brief proposti", tone: "warning" },
      { key: "briefs_accepted", label: "Brief accettati" },
      { key: "briefs_converted", label: "Brief convertiti", tone: "positive" },
      { key: "claims_pending", label: "Claim in attesa", tone: "warning" },
      { key: "claims_verified", label: "Claim verificati", tone: "positive" },
      { key: "claims_insufficient", label: "Claim insufficienti", tone: "warning" },
    ],
  },
  {
    title: "Readiness e pagine",
    description: "Stato dei bundle, dei draft e delle pagine materializzate.",
    icon: ShieldCheck,
    metrics: [
      { key: "evidence_bundles", label: "Evidence bundle" },
      { key: "drafts_review", label: "Draft in review", tone: "warning" },
      { key: "drafts_approved", label: "Draft approvati", tone: "positive" },
      { key: "pages_review", label: "Pagine in review", tone: "warning" },
      { key: "pages_published", label: "Pagine pubblicate" },
    ],
  },
]

function toneClass(tone: StatusTone): string {
  if (tone === "positive") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-800"
  if (tone === "negative") return "border-red-200 bg-red-50 text-red-800"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function booleanStatus(value: boolean | undefined, enabled = "Disponibile"): Pick<RuntimeStatus, "value" | "tone"> {
  if (value === true) return { value: enabled, tone: "positive" }
  if (value === false) return { value: "Non disponibile", tone: "negative" }
  return { value: "Non rilevato", tone: "neutral" }
}

function configuredStatus(value: string | undefined): Pick<RuntimeStatus, "value" | "tone"> {
  if (value === "enabled") return { value: "Configurato", tone: "positive" }
  if (value === "disabled") return { value: "Non configurato", tone: "negative" }
  return { value: "Non rilevato", tone: "neutral" }
}

function combinedStatus(capability: boolean | undefined, configured: string | undefined): Pick<RuntimeStatus, "value" | "tone"> {
  if (capability === true && configured === "enabled") return { value: "Configurato", tone: "positive" }
  if (capability === false || configured === "disabled") return { value: "Non configurato", tone: "negative" }
  if (capability === true || configured === "enabled") return { value: "Dato parziale", tone: "warning" }
  return { value: "Non rilevato", tone: "neutral" }
}

function formatGeneratedAt(value: string | undefined): string {
  if (!value) return "Non disponibile"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date)
}

function RuntimeCard({ status }: { status: RuntimeStatus }) {
  const Icon = status.icon
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">{status.label}</CardTitle>
          <CardDescription className="mt-1 leading-5">{status.detail}</CardDescription>
        </div>
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <Badge variant="outline" className={cn("font-medium", toneClass(status.tone))}>{status.value}</Badge>
      </CardContent>
    </Card>
  )
}

function metricTone(metric: MetricDefinition, value: number): StatusTone {
  if (metric.tone === "negative") return value > 0 ? "negative" : "positive"
  if (metric.tone === "warning") return value > 0 ? "warning" : "neutral"
  return metric.tone || "neutral"
}

function MetricGroupCard({ group, overview }: { group: MetricGroup; overview: ControlRoomOverview }) {
  const Icon = group.icon
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription className="mt-1 leading-5">{group.description}</CardDescription>
          </div>
          <Icon aria-hidden="true" className="mt-1 size-5 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">
          {group.metrics.map((metric) => {
            const value = overview[metric.key]
            return (
              <div key={metric.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <dt className="text-sm text-muted-foreground">{metric.label}</dt>
                <dd>
                  <Badge variant="outline" className={cn("min-w-10 justify-center font-mono tabular-nums", toneClass(metricTone(metric, value)))}>
                    {value}
                  </Badge>
                </dd>
              </div>
            )
          })}
        </dl>
      </CardContent>
    </Card>
  )
}

export function Overview({
  snapshot,
  health,
  snapshotError,
  healthError,
}: {
  snapshot: ControlRoomSnapshot | null
  health: HealthSnapshot | null
  snapshotError: string | null
  healthError: string | null
}) {
  const snapshotStatus = booleanStatus(snapshot?.ok, "Disponibile")
  const workerStatus = booleanStatus(snapshot?.capabilities.worker)
  const d1Status = booleanStatus(snapshot?.capabilities.d1)
  const maintenanceStatus = combinedStatus(snapshot?.capabilities.maintenanceApi, health?.maintenanceApi)
  const workflowStatus = combinedStatus(snapshot?.capabilities.recentDemandWorkflow, health?.recentDemandWorkflow)
  const containerStatus = configuredStatus(health?.last30DaysContainer)
  const aiGatewayStatus = combinedStatus(snapshot?.capabilities.aiGateway, health?.aiGateway)
  const vertexStatus = booleanStatus(snapshot?.capabilities.vertex)

  const runtimeStatuses: RuntimeStatus[] = [
    { label: "Snapshot API", detail: "Risposta read-only mediata dal Worker.", icon: Activity, ...snapshotStatus },
    { label: "Worker", detail: "Capability dichiarata dallo snapshot.", icon: ServerCog, ...workerStatus },
    { label: "D1", detail: "Binding dati disponibile all'execution plane.", icon: Database, ...d1Status },
    { label: "Maintenance API", detail: "Secondo livello usato soltanto server-side.", icon: ShieldCheck, ...maintenanceStatus },
    { label: "Workflow", detail: "Binding del radar recent-demand.", icon: Workflow, ...workflowStatus },
    { label: "Container", detail: "Binding del servizio last30days.", icon: Database, ...containerStatus },
    { label: "AI Gateway", detail: "Configurazione del percorso AI controllato.", icon: RadioTower, ...aiGatewayStatus },
    { label: "Vertex AI", detail: "Capability del provider modello.", icon: ServerCog, ...vertexStatus },
  ]

  const incompleteCount = runtimeStatuses.filter((status) => status.tone !== "positive").length
  const publicationAutomationDisabled = snapshot?.capabilities.publicationAutomation === false
  const affiliateModeDisabled = health?.affiliateMode === "disabled"

  return (
    <section id="overview" aria-labelledby="overview-title" className="scroll-mt-24 space-y-6" data-testid="overview-section">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Overview</p>
          <h1 id="overview-title" className="text-3xl font-semibold tracking-tight">Stato operativo</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Vista read-only delle capability dichiarate e del lavoro editoriale presente nello snapshot. I binding configurati non sostituiscono un probe end-to-end del servizio esterno.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Snapshot generato:</span> {formatGeneratedAt(snapshot?.generatedAt)}
        </div>
      </div>

      {snapshotError && (
        <Alert variant="destructive" data-testid="snapshot-error">
          <Activity aria-hidden="true" />
          <AlertTitle>Snapshot non disponibile</AlertTitle>
          <AlertDescription>{snapshotError}. Le informazioni di configurazione runtime restano visibili quando disponibili.</AlertDescription>
        </Alert>
      )}

      {healthError && (
        <Alert variant="destructive" data-testid="health-error">
          <ServerCog aria-hidden="true" />
          <AlertTitle>Health API non disponibile</AlertTitle>
          <AlertDescription>{healthError}. Lo snapshot editoriale resta consultabile quando disponibile.</AlertDescription>
        </Alert>
      )}

      <Alert className={cn(incompleteCount === 0 ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70")}>
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>{incompleteCount === 0 ? "Perimetro configurato" : "Dati runtime parziali"}</AlertTitle>
        <AlertDescription>
          {incompleteCount === 0
            ? "Le API dichiarano disponibili tutte le capability attese per questa vista."
            : `${incompleteCount} componenti non risultano pienamente configurati o non sono stati rilevati.`}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Configurazione runtime">
        {runtimeStatuses.map((status) => <RuntimeCard key={status.label} status={status} />)}
      </div>

      <Alert data-testid="publication-guardrail" className={cn(
        publicationAutomationDisabled && affiliateModeDisabled
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-amber-200 bg-amber-50/70",
      )}>
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>Guardrail di rilascio</AlertTitle>
        <AlertDescription className="flex flex-wrap gap-x-6 gap-y-2">
          <span>Pubblicazione automatica: <strong>{publicationAutomationDisabled ? "disabilitata" : "non verificata"}</strong>.</span>
          <span>Affiliate mode: <strong>{affiliateModeDisabled ? "disabled" : health?.affiliateMode || "non rilevato"}</strong>.</span>
        </AlertDescription>
      </Alert>

      {snapshot && (
        <div className="grid gap-4 xl:grid-cols-2" aria-label="Metriche operative">
          {metricGroups.map((group) => <MetricGroupCard key={group.title} group={group} overview={snapshot.overview} />)}
        </div>
      )}
    </section>
  )
}
