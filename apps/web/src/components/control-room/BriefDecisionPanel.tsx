import { CheckCircle2, ClipboardCheck, Loader2, ShieldAlert, XCircle } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { ControlRoomBrief } from "@/lib/control-room-api"
import {
  submitBriefDecision,
  type BriefDecisionAction,
} from "@/lib/brief-decision-api"
import { cn } from "@/lib/utils"

type PendingDecision = {
  brief: ControlRoomBrief
  action: BriefDecisionAction
}

const acceptanceNote = "Accettato dalla Control Room. La conversione, la verifica dei claim e la pubblicazione restano gate separati."

function decisionLabel(action: BriefDecisionAction): string {
  return action === "accepted" ? "Accetta brief" : "Rifiuta brief"
}

export function BriefDecisionPanel({
  briefs,
  onDecisionApplied,
}: {
  briefs: ControlRoomBrief[]
  onDecisionApplied: () => Promise<void>
}) {
  const proposedBriefs = useMemo(() => briefs.filter((brief) => brief.status === "proposed"), [briefs])
  const [pending, setPending] = useState<PendingDecision | null>(null)
  const [notes, setNotes] = useState(acceptanceNote)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function openDecision(brief: ControlRoomBrief, action: BriefDecisionAction) {
    setPending({ brief, action })
    setNotes(action === "accepted" ? acceptanceNote : "")
  }

  function closeDecision() {
    if (isSubmitting) return
    setPending(null)
    setNotes(acceptanceNote)
  }

  async function confirmDecision() {
    if (!pending || isSubmitting) return
    const normalizedNotes = notes.trim()
    if (pending.action === "dismissed" && normalizedNotes.length === 0) return

    setIsSubmitting(true)
    try {
      const result = await submitBriefDecision({
        briefId: pending.brief.id,
        action: pending.action,
        notes: normalizedNotes,
      })
      await onDecisionApplied()
      toast.success(result.idempotent
        ? `Decisione del brief #${pending.brief.id} già registrata`
        : `Brief #${pending.brief.id} ${pending.action === "accepted" ? "accettato" : "rifiutato"}`)
      setPending(null)
      setNotes(acceptanceNote)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Decisione brief non registrata")
    } finally {
      setIsSubmitting(false)
    }
  }

  const dismissalReasonMissing = pending?.action === "dismissed" && notes.trim().length === 0

  return (
    <section id="brief-decisions" aria-labelledby="brief-decisions-title" className="scroll-mt-24 space-y-5">
      <div>
        <p className="text-sm font-medium text-primary">Azione operativa</p>
        <h2 id="brief-decisions-title" className="text-2xl font-semibold tracking-tight">Decisione brief</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Prima mutation della nuova Control Room. La decisione è confermata, auditata e limitata ai brief ancora proposti.
        </p>
      </div>

      <Alert data-testid="brief-decision-guardrail">
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Decisione ≠ conversione ≠ pubblicazione</AlertTitle>
        <AlertDescription>
          Accettare non genera claim o draft. Rifiutare annulla soltanto il lavoro editoriale aperto. Nessuna delle due azioni pubblica una pagina.
        </AlertDescription>
      </Alert>

      {proposedBriefs.length === 0 ? (
        <Alert data-testid="empty-brief-decisions">
          <ClipboardCheck aria-hidden="true" />
          <AlertTitle>Nessun brief proposto da decidere</AlertTitle>
          <AlertDescription>I brief già accettati, rifiutati o convertiti restano consultabili nella sezione read-only.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {proposedBriefs.map((brief) => (
            <Card key={brief.id} data-testid={`brief-decision-${brief.id}`}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">proposed</Badge>
                  <Badge variant="secondary">priority {brief.priority_score}</Badge>
                  <Badge variant="outline">{brief.asset_type}</Badge>
                </div>
                <CardTitle className="pt-2 leading-7">{brief.proposed_title}</CardTitle>
                <CardDescription>Brief #{brief.id} · {brief.cluster_title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-lg border bg-muted/30 p-3"><span className="block text-xs text-muted-foreground">Opportunity</span><strong>{brief.opportunity_score}</strong></div>
                  <div className="rounded-lg border bg-muted/30 p-3"><span className="block text-xs text-muted-foreground">Evidence</span><strong>{brief.evidence_score}</strong></div>
                  <div className="rounded-lg border bg-muted/30 p-3"><span className="block text-xs text-muted-foreground">Priority</span><strong>{brief.priority_score}</strong></div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => openDecision(brief, "dismissed")} aria-label={`Rifiuta brief ${brief.id}`}>
                    <XCircle aria-hidden="true" /> Rifiuta
                  </Button>
                  <Button onClick={() => openDecision(brief, "accepted")} aria-label={`Accetta brief ${brief.id}`}>
                    <CheckCircle2 aria-hidden="true" /> Accetta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => { if (!open) closeDecision() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending ? `${decisionLabel(pending.action)} #${pending.brief.id}` : "Decisione brief"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.action === "accepted"
                ? "Confermi lo stato accepted. Il brief non viene convertito e non vengono generati claim, draft o pagine."
                : "Confermi lo stato dismissed. Il task editoriale aperto viene annullato e il motivo resta nell’audit."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pending && (
            <div className="space-y-2">
              <label htmlFor="brief-decision-notes" className="text-sm font-medium">
                {pending.action === "dismissed" ? "Motivo del rifiuto" : "Nota di accettazione"}
              </label>
              <Textarea
                id="brief-decision-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value.slice(0, 2000))}
                aria-invalid={dismissalReasonMissing}
                disabled={isSubmitting}
                maxLength={2000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{dismissalReasonMissing ? "Il motivo è obbligatorio." : "La nota verrà salvata nell’audit."}</span>
                <span>{notes.length}/2000</span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void confirmDecision()
              }}
              disabled={isSubmitting || dismissalReasonMissing}
              className={cn(pending?.action === "dismissed" && "bg-destructive text-white hover:bg-destructive/90")}
            >
              {isSubmitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : pending?.action === "accepted" ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />}
              Conferma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
