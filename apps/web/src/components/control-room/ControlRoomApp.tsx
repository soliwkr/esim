import { useCallback, useEffect, useState } from "react"
import {
  ClipboardList,
  FileCheck2,
  FileText,
  LayoutDashboard,
  ListChecks,
  Menu,
  PanelLeft,
  RadioTower,
  RefreshCw,
  Rows3,
  ScrollText,
  Search,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { ClaimsSources } from "@/components/control-room/ClaimsSources"
import { DraftDecisions } from "@/components/control-room/DraftDecisions"
import { Overview } from "@/components/control-room/Overview"
import { QueueAudit } from "@/components/control-room/QueueAudit"
import { RadarBriefs } from "@/components/control-room/RadarBriefs"
import { ReadinessEvidence } from "@/components/control-room/ReadinessEvidence"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import {
  ControlRoomRequestError,
  fetchControlRoomSnapshot,
  fetchHealth,
  type ControlRoomSnapshot,
  type HealthSnapshot,
} from "@/lib/control-room-api"
import { cn } from "@/lib/utils"

type ResourceStatus = "idle" | "loading" | "ready" | "error"

type ResourceState<T> = {
  data: T | null
  error: string | null
  status: ResourceStatus
}

const navigation = [
  { href: "#overview", label: "Overview", icon: LayoutDashboard },
  { href: "#radar", label: "Radar", icon: RadioTower },
  { href: "#signals", label: "Segnali", icon: Search },
  { href: "#briefs", label: "Brief", icon: ClipboardList },
  { href: "#claims", label: "Claim e fonti", icon: Rows3 },
  { href: "#readiness", label: "Readiness", icon: FileCheck2 },
  { href: "#draft", label: "Draft e decisioni", icon: FileText },
  { href: "#queue", label: "Queue", icon: ListChecks },
  { href: "#audit", label: "Audit", icon: ScrollText },
]

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Navigazione Control Room" className="space-y-1">
      {navigation.map(({ href, label, icon: Icon }) => (
        <a
          key={href}
          href={href}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Icon aria-hidden="true" className="size-4" />
          {label}
        </a>
      ))}
    </nav>
  )
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar p-5 lg:block">
      <div className="mb-8 flex items-center gap-3 text-sidebar-foreground">
        <div className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <PanelLeft aria-hidden="true" className="size-5" />
        </div>
        <div>
          <p className="font-semibold">Senza Roaming</p>
          <p className="text-xs text-sidebar-foreground/65">Control Room</p>
        </div>
      </div>
      <Navigation />
      <div className="absolute inset-x-5 bottom-5 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3 text-xs leading-5 text-sidebar-foreground/75">
        Migrazione operativa in sola lettura. Nessuna azione editoriale o di pubblicazione è disponibile.
      </div>
    </aside>
  )
}

function MobileNavigation() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Apri navigazione">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SheetHeader className="text-left">
          <SheetTitle className="text-sidebar-foreground">Senza Roaming</SheetTitle>
          <SheetDescription className="text-sidebar-foreground/65">Control Room in sola lettura</SheetDescription>
        </SheetHeader>
        <div className="px-4"><Navigation onNavigate={() => setOpen(false)} /></div>
      </SheetContent>
    </Sheet>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" data-testid="loading-state" aria-label="Caricamento Control Room">
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-72 rounded-xl" />)}
      </div>
    </div>
  )
}

function resourceError(error: unknown, fallback: string): string {
  if (error instanceof ControlRoomRequestError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

const emptySnapshotState: ResourceState<ControlRoomSnapshot> = {
  data: null,
  error: null,
  status: "idle",
}

const emptyHealthState: ResourceState<HealthSnapshot> = {
  data: null,
  error: null,
  status: "idle",
}

export function ControlRoomApp() {
  const [snapshotState, setSnapshotState] = useState<ResourceState<ControlRoomSnapshot>>(emptySnapshotState)
  const [healthState, setHealthState] = useState<ResourceState<HealthSnapshot>>(emptyHealthState)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const load = useCallback(async (announce = false) => {
    setIsRefreshing(true)
    setSnapshotState((current) => ({ ...current, error: null, status: "loading" }))
    setHealthState((current) => ({ ...current, error: null, status: "loading" }))

    const [snapshotResult, healthResult] = await Promise.allSettled([
      fetchControlRoomSnapshot(),
      fetchHealth(),
    ])
    let failureCount = 0

    if (snapshotResult.status === "fulfilled") {
      setSnapshotState({ data: snapshotResult.value, error: null, status: "ready" })
    } else {
      failureCount += 1
      const message = resourceError(snapshotResult.reason, "Snapshot non disponibile")
      setSnapshotState((current) => ({ ...current, error: message, status: "error" }))
    }

    if (healthResult.status === "fulfilled") {
      setHealthState({ data: healthResult.value, error: null, status: "ready" })
    } else {
      failureCount += 1
      const message = resourceError(healthResult.reason, "Health API non disponibile")
      setHealthState((current) => ({ ...current, error: message, status: "error" }))
    }

    setIsRefreshing(false)

    if (announce) {
      if (failureCount === 0) toast.success("Control Room aggiornata")
      else if (failureCount === 1) toast.warning("Aggiornamento parziale")
      else toast.error("Control Room non disponibile")
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.controlRoomHydrated = "true"
    void load()
  }, [load])

  const initialLoading = snapshotState.data === null
    && healthState.data === null
    && (snapshotState.status === "idle" || snapshotState.status === "loading")
    && (healthState.status === "idle" || healthState.status === "loading")

  return (
    <div className="min-h-screen bg-muted/35" data-testid="control-room-app">
      <Sidebar />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <MobileNavigation />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Control Room</p>
              <p className="truncate text-xs text-muted-foreground">Overview, editoriale, queue e audit · sola lettura</p>
            </div>
            <Badge variant="outline" className="hidden gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-800 sm:inline-flex">
              <ShieldCheck aria-hidden="true" className="size-3.5" />
              Access verificato
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { void load(true) }}
              disabled={isRefreshing}
              aria-label="Aggiorna Control Room"
            >
              <RefreshCw aria-hidden="true" className={cn(isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </header>
        <main className="space-y-12 p-4 sm:p-6 lg:p-8">
          {initialLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <Overview
                snapshot={snapshotState.data}
                health={healthState.data}
                snapshotError={snapshotState.error}
                healthError={healthState.error}
              />
              {snapshotState.data && (
                <>
                  <RadarBriefs
                    researchRuns={snapshotState.data.researchRuns}
                    signals={snapshotState.data.signals}
                    briefs={snapshotState.data.briefs}
                  />
                  <ClaimsSources claims={snapshotState.data.claims} />
                  <ReadinessEvidence bundles={snapshotState.data.evidenceBundles} />
                  <DraftDecisions
                    drafts={snapshotState.data.drafts}
                    bundles={snapshotState.data.evidenceBundles}
                    briefs={snapshotState.data.briefs}
                  />
                  <QueueAudit queue={snapshotState.data.queue} audit={snapshotState.data.audit} />
                </>
              )}
            </>
          )}
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}
