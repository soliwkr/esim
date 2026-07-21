import {
  Activity,
  AlertTriangle,
  Clock3,
  FileWarning,
  ListChecks,
  LockKeyhole,
  ScrollText,
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
  ControlRoomAuditEvent,
  ControlRoomQueueTask,
  JsonValue,
} from "@/lib/control-room-api"
import { cn } from "@/lib/utils"

type QueueErrorFilter = "all" | "with_error" | "locked"

type AuditEntry = {
  event: ControlRoomAuditEvent
  sourceIndex: number
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function jsonText(value: JsonValue): string {
  return JSON.stringify(value, null, 2)
}

function statusClass(status: ControlRoomQueueTask["status"]): string {
  if (status === "processing") return "border-blue-200 bg-blue-50 text-blue-800"
  if (status === "failed") return "border-red-200 bg-red-50 text-red-800"
  return "border-amber-200 bg-amber-50 text-amber-800"
}

function QueueStatusBadge({ status }: { status: ControlRoomQueueTask["status"] }) {
  return <Badge variant="outline" className={cn("font-medium", statusClass(status))}>{status}</Badge>
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
  icon: typeof ListChecks
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

function QueueTaskDetails({ task }: { task: ControlRoomQueueTask }) {
  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle>Task queue #{task.id}</SheetTitle>
        <SheetDescription>{task.task_type} · {task.entity_key} · sola lettura</SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-8 text-sm">
        <div className="flex flex-wrap gap-2">
          <QueueStatusBadge status={task.status} />
          <Badge variant="outline">priorità {task.priority}</Badge>
          <Badge variant="outline">{task.attempts}/{task.max_attempts} tentativi</Badge>
        </div>

        <Alert data-testid="queue-task-guardrail" className="border-emerald-200 bg-emerald-50/70">
          <ShieldCheck aria-hidden="true" />
          <AlertTitle>Stato queue ≠ decisione editoriale</AlertTitle>
          <AlertDescription>
            Il task descrive lavoro operativo persistito. Uno stato failed non dichiara che il contenuto sia falso, e un task completato non equivale a una pagina pubblicata.
          </AlertDescription>
        </Alert>

        <dl className="grid gap-4 rounded-xl border bg-muted/25 p-4 sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Task type</dt><dd className="mt-1 font-medium">{task.task_type}</dd></div>
          <div><dt className="text-muted-foreground">Entity type</dt><dd className="mt-1 font-medium">{task.entity_type}</dd></div>
          <div><dt className="text-muted-foreground">Entity key</dt><dd className="mt-1 break-all font-medium">{task.entity_key}</dd></div>
          <div><dt className="text-muted-foreground">Due at</dt><dd className="mt-1 font-medium">{formatTimestamp(task.due_at)}</dd></div>
          <div><dt className="text-muted-foreground">Locked by</dt><dd className="mt-1 font-medium">{task.locked_by || "Non bloccato"}</dd></div>
          <div><dt className="text-muted-foreground">Tentativi</dt><dd className="mt-1 font-medium">{task.attempts} di {task.max_attempts}</dd></div>
          <div><dt className="text-muted-foreground">Creato</dt><dd className="mt-1 font-medium">{formatTimestamp(task.created_at)}</dd></div>
          <div><dt className="text-muted-foreground">Aggiornato</dt><dd className="mt-1 font-medium">{formatTimestamp(task.updated_at)}</dd></div>
        </dl>

        {task.last_error ? (
          <Alert variant="destructive">
            <FileWarning aria-hidden="true" />
            <AlertTitle>Ultimo errore persistito</AlertTitle>
            <AlertDescription className="break-words">{task.last_error}</AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Activity aria-hidden="true" />
            <AlertTitle>Nessun errore persistito</AlertTitle>
            <AlertDescription>Il record corrente non espone un valore in last_error.</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payload normalizzato</CardTitle>
            <CardDescription>Dati opachi mostrati come restituiti dallo snapshot; il client non li interpreta come comando.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-4 text-xs leading-5">{jsonText(task.payload)}</pre>
          </CardContent>
        </Card>
      </div>
    </SheetContent>
  )
}

function AuditEventDetails({ event }: { event: ControlRoomAuditEvent }) {
  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle>Evento audit</SheetTitle>
        <SheetDescription>{event.domain} · {event.action} · sola lettura</SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-8 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{event.domain}</Badge>
          <Badge variant="outline">{event.action}</Badge>
          <Badge variant="secondary">{event.actor}</Badge>
        </div>

        <Alert data-testid="audit-event-guardrail" className="border-emerald-200 bg-emerald-50/70">
          <ShieldCheck aria-hidden="true" />
          <AlertTitle>Evento audit ≠ autorizzazione operativa</AlertTitle>
          <AlertDescription>
            L’evento registra un fatto storico aggregato. Lo snapshot non espone un ID evento né un collegamento univoco a una specifica versione del draft.
          </AlertDescription>
        </Alert>

        <dl className="grid gap-4 rounded-xl border bg-muted/25 p-4 sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Dominio</dt><dd className="mt-1 font-medium">{event.domain}</dd></div>
          <div><dt className="text-muted-foreground">Azione</dt><dd className="mt-1 font-medium">{event.action}</dd></div>
          <div><dt className="text-muted-foreground">Attore</dt><dd className="mt-1 font-medium">{event.actor}</dd></div>
          <div><dt className="text-muted-foreground">Entità</dt><dd className="mt-1 break-all font-medium">{event.entity}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground">Creato</dt><dd className="mt-1 font-medium">{formatTimestamp(event.created_at)}</dd></div>
        </dl>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dettagli normalizzati</CardTitle>
            <CardDescription>Metadati opachi validati come JSON e mostrati senza ricostruire decisioni o relazioni.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-4 text-xs leading-5">{jsonText(event.details)}</pre>
          </CardContent>
        </Card>
      </div>
    </SheetContent>
  )
}

export function QueueAudit({
  queue,
  audit,
}: {
  queue: ControlRoomQueueTask[]
  audit: ControlRoomAuditEvent[]
}) {
  const [queueStatus, setQueueStatus] = useState("all")
  const [taskType, setTaskType] = useState("all")
  const [entityType, setEntityType] = useState("all")
  const [queueError, setQueueError] = useState<QueueErrorFilter>("all")
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)

  const [auditDomain, setAuditDomain] = useState("all")
  const [auditAction, setAuditAction] = useState("all")
  const [auditActor, setAuditActor] = useState("all")
  const [selectedAuditIndex, setSelectedAuditIndex] = useState<number | null>(null)

  const statuses = useMemo(() => Array.from(new Set(queue.map((task) => task.status))).sort(), [queue])
  const taskTypes = useMemo(() => Array.from(new Set(queue.map((task) => task.task_type))).sort(), [queue])
  const entityTypes = useMemo(() => Array.from(new Set(queue.map((task) => task.entity_type))).sort(), [queue])

  const visibleQueue = useMemo(() => queue.filter((task) => {
    if (queueStatus !== "all" && task.status !== queueStatus) return false
    if (taskType !== "all" && task.task_type !== taskType) return false
    if (entityType !== "all" && task.entity_type !== entityType) return false
    if (queueError === "with_error" && !task.last_error) return false
    if (queueError === "locked" && !task.locked_by) return false
    return true
  }), [entityType, queue, queueError, queueStatus, taskType])

  const auditEntries = useMemo<AuditEntry[]>(() => audit.map((event, sourceIndex) => ({ event, sourceIndex })), [audit])
  const domains = useMemo(() => Array.from(new Set(audit.map((event) => event.domain))).sort(), [audit])
  const actions = useMemo(() => Array.from(new Set(audit.map((event) => event.action))).sort(), [audit])
  const actors = useMemo(() => Array.from(new Set(audit.map((event) => event.actor))).sort(), [audit])

  const visibleAudit = useMemo(() => auditEntries.filter(({ event }) => {
    if (auditDomain !== "all" && event.domain !== auditDomain) return false
    if (auditAction !== "all" && event.action !== auditAction) return false
    if (auditActor !== "all" && event.actor !== auditActor) return false
    return true
  }), [auditAction, auditActor, auditDomain, auditEntries])

  const selectedTask = queue.find((task) => task.id === selectedTaskId) || null
  const selectedAudit = selectedAuditIndex === null ? null : audit[selectedAuditIndex] || null

  const pendingCount = queue.filter((task) => task.status === "pending").length
  const processingCount = queue.filter((task) => task.status === "processing").length
  const failedCount = queue.filter((task) => task.status === "failed").length

  return (
    <>
      <section id="queue" aria-labelledby="queue-title" className="scroll-mt-24 space-y-6" data-testid="queue-section">
        <div>
          <p className="text-sm font-medium text-primary">Maintenance queue</p>
          <h2 id="queue-title" className="text-2xl font-semibold tracking-tight">Coda operativa in sola lettura</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Task pending, processing e failed presenti nello snapshot aggregato. I conteggi di questa sezione riguardano soltanto i record restituiti, non sostituiscono le metriche globali dell’overview.
          </p>
        </div>

        <Alert data-testid="queue-guardrail" className="border-emerald-200 bg-emerald-50/70">
          <ShieldCheck aria-hidden="true" />
          <AlertTitle>Queue status ≠ decisione editoriale</AlertTitle>
          <AlertDescription>
            Priorità, tentativi, lock ed errori vengono mostrati come persistiti. Il client non calcola retry, outcome o autorizzazioni.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Record nello snapshot" value={queue.length} description="La query backend è limitata e include soltanto task operativi non completati." icon={ListChecks} />
          <SummaryCard label="Pending" value={pendingCount} description="Task in attesa presenti nella porzione restituita." icon={Clock3} />
          <SummaryCard label="Processing" value={processingCount} description="Task attualmente marcati processing nello snapshot." icon={LockKeyhole} />
          <SummaryCard label="Failed" value={failedCount} description="Failure operative; non equivalgono a contenuti non validi." icon={AlertTriangle} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Select value={queueStatus} onValueChange={setQueueStatus}>
            <SelectTrigger aria-label="Filtra queue per stato"><SelectValue placeholder="Tutti gli stati" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={taskType} onValueChange={setTaskType}>
            <SelectTrigger aria-label="Filtra queue per task type"><SelectValue placeholder="Tutti i task type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i task type</SelectItem>
              {taskTypes.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger aria-label="Filtra queue per entity type"><SelectValue placeholder="Tutte le entità" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le entità</SelectItem>
              {entityTypes.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={queueError} onValueChange={(value) => setQueueError(value as QueueErrorFilter)}>
            <SelectTrigger aria-label="Filtra queue per condizione"><SelectValue placeholder="Tutte le condizioni" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le condizioni</SelectItem>
              <SelectItem value="with_error">Con ultimo errore</SelectItem>
              <SelectItem value="locked">Con lock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">{visibleQueue.length} di {queue.length} task visibili</p>

        {queue.length === 0 ? (
          <Alert data-testid="empty-queue">
            <ListChecks aria-hidden="true" />
            <AlertTitle>Nessun task operativo nello snapshot</AlertTitle>
            <AlertDescription>La risposta non contiene task pending, processing o failed.</AlertDescription>
          </Alert>
        ) : visibleQueue.length === 0 ? (
          <Alert data-testid="empty-queue-filter">
            <ListChecks aria-hidden="true" />
            <AlertTitle>Nessun task corrisponde ai filtri</AlertTitle>
            <AlertDescription>Modifica i filtri senza alterare lo stato canonico della coda.</AlertDescription>
          </Alert>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stato</TableHead>
                  <TableHead>Task ed entità</TableHead>
                  <TableHead>Priorità</TableHead>
                  <TableHead>Tentativi</TableHead>
                  <TableHead>Due at</TableHead>
                  <TableHead className="text-right">Dettaglio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleQueue.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell><QueueStatusBadge status={task.status} /></TableCell>
                    <TableCell>
                      <p className="font-medium">{task.task_type}</p>
                      <p className="mt-1 max-w-sm break-all text-xs text-muted-foreground">{task.entity_type} · {task.entity_key}</p>
                      {task.last_error && <p className="mt-1 max-w-sm truncate text-xs text-red-700">{task.last_error}</p>}
                    </TableCell>
                    <TableCell className="tabular-nums">{task.priority}</TableCell>
                    <TableCell className="tabular-nums">{task.attempts}/{task.max_attempts}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatTimestamp(task.due_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedTaskId(task.id)} aria-label={`Apri task queue ${task.id}`}>
                        Apri
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Sheet open={selectedTask !== null} onOpenChange={(open) => { if (!open) setSelectedTaskId(null) }}>
          {selectedTask && <QueueTaskDetails task={selectedTask} />}
        </Sheet>
      </section>

      <section id="audit" aria-labelledby="audit-title" className="scroll-mt-24 space-y-6" data-testid="audit-section">
        <div>
          <p className="text-sm font-medium text-primary">Audit aggregato</p>
          <h2 id="audit-title" className="text-2xl font-semibold tracking-tight">Eventi e traccia operativa</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Timeline read-only di eventi draft, readiness, claim, ricerca e run AI restituiti dal backend. Ordine e dettagli restano quelli dello snapshot.
          </p>
        </div>

        <Alert data-testid="audit-guardrail" className="border-emerald-200 bg-emerald-50/70">
          <ScrollText aria-hidden="true" />
          <AlertTitle>Audit event ≠ autorizzazione operativa</AlertTitle>
          <AlertDescription>
            Il feed non espone un ID evento e non collega in modo univoco ogni riga a una versione draft. La UI non ricostruisce linkage mancanti.
          </AlertDescription>
        </Alert>

        <div className="grid gap-3 sm:grid-cols-3">
          <Select value={auditDomain} onValueChange={setAuditDomain}>
            <SelectTrigger aria-label="Filtra audit per dominio"><SelectValue placeholder="Tutti i domini" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i domini</SelectItem>
              {domains.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={auditAction} onValueChange={setAuditAction}>
            <SelectTrigger aria-label="Filtra audit per azione"><SelectValue placeholder="Tutte le azioni" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le azioni</SelectItem>
              {actions.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={auditActor} onValueChange={setAuditActor}>
            <SelectTrigger aria-label="Filtra audit per attore"><SelectValue placeholder="Tutti gli attori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli attori</SelectItem>
              {actors.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">{visibleAudit.length} di {audit.length} eventi visibili</p>

        {audit.length === 0 ? (
          <Alert data-testid="empty-audit">
            <ScrollText aria-hidden="true" />
            <AlertTitle>Nessun evento audit nello snapshot</AlertTitle>
            <AlertDescription>Il feed aggregato non ha restituito eventi.</AlertDescription>
          </Alert>
        ) : visibleAudit.length === 0 ? (
          <Alert data-testid="empty-audit-filter">
            <ScrollText aria-hidden="true" />
            <AlertTitle>Nessun evento corrisponde ai filtri</AlertTitle>
            <AlertDescription>Modifica dominio, azione o attore senza dedurre eventi mancanti.</AlertDescription>
          </Alert>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Dominio</TableHead>
                  <TableHead>Azione</TableHead>
                  <TableHead>Attore</TableHead>
                  <TableHead>Entità</TableHead>
                  <TableHead className="text-right">Dettaglio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleAudit.map(({ event, sourceIndex }) => (
                  <TableRow key={`${event.created_at}-${event.domain}-${event.action}-${event.entity}-${sourceIndex}`}>
                    <TableCell className="whitespace-nowrap">{formatTimestamp(event.created_at)}</TableCell>
                    <TableCell><Badge variant="outline">{event.domain}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{event.action}</Badge></TableCell>
                    <TableCell>{event.actor}</TableCell>
                    <TableCell className="max-w-xs break-all">{event.entity}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedAuditIndex(sourceIndex)} aria-label={`Apri evento audit ${sourceIndex + 1}`}>
                        Apri
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Sheet open={selectedAudit !== null} onOpenChange={(open) => { if (!open) setSelectedAuditIndex(null) }}>
          {selectedAudit && <AuditEventDetails event={selectedAudit} />}
        </Sheet>
      </section>
    </>
  )
}
