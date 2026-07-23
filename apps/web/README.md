# `apps/web`

Frontend Astro di Senza Roaming e nuova Control Room privata.

## Runtime

`apps/web/src/worker.ts` è il custom entrypoint del singolo Worker Cloudflare. Delega ad Astro `/astro-foundation` e `/control-room-foundation`; tutte le altre richieste continuano a usare il router backend in `src/index.ts`. Lo stesso modulo conserva gli export `RecentDemandWorkflow` e `Last30DaysContainer`.

La Control Room è `noindex,nofollow` e `no-store`. Tutto il path `/control-room-foundation*` è fail-closed: il Worker richiede e valida l’identità emessa da Cloudflare Access prima di servire shell, letture o mutation autorizzate.

## UI

Astro fornisce la shell SSR e monta un solo root React con `client:load`. shadcn/ui è configurato da `components.json`; i componenti generati sono versionati sotto `src/components/ui` e lo stile Tailwind 4 vive in `src/styles/globals.css`.

La island implementa:

- sidebar desktop e Sheet mobile;
- caricamento automatico dopo Cloudflare Access;
- overview completa sulle 19 metriche dello snapshot;
- capability e binding di Worker, D1, maintenance API, Workflow, Container, AI Gateway e Vertex;
- health e snapshot come risorse indipendenti;
- radar, segnali e brief read-only;
- prima mutation controllata: decisione di un brief ancora `proposed`;
- claim, fonti, scadenze e task collegati;
- Page Readiness ed evidence bundle;
- inventario e dettaglio draft completo on demand;
- maintenance queue e audit aggregato;
- loading, errori parziali, contratti invalidi, retry ed empty state.

La relazione run → segnali usa il `run_id` canonico. Lo snapshot non espone un collegamento diretto segnale → brief e la UI non lo deduce.

## Linkage read-only canonici

La vista claim conserva `task_id` e `task_status` già persistiti. `task_id` è validato come `null` o intero positivo e non viene ricostruito da `entity_key`.

L’audit aggregato espone una `event_key` namespaced e univoca. Gli eventi `draft` espongono `draft_id` e `draft_version`; gli altri domini espongono entrambi come `null`. Il client non interpreta `details` per ricostruire relazioni.

Il dettaglio draft resta una risorsa indipendente:

```text
GET /control-room-foundation/api/draft-detail?draftId=<id>
```

Il proxy valida Access, accetta soltanto `GET`, conserva il maintenance token server-side e delega a `GET /api/maintenance/editorial-draft-grounding`. Un errore del dettaglio non cancella l’inventario valido dello snapshot.

## Decisione brief controllata

La prima mutation della nuova Control Room è:

```text
proposed → accepted | dismissed
```

Route privata:

```text
POST /control-room-foundation/api/brief-decision
```

Il browser invia soltanto:

```json
{
  "briefId": 123,
  "action": "accepted",
  "notes": "Nota dell'operatore"
}
```

L’attore non è accettato dal body. Il custom Worker lo deriva dal JWT Cloudflare Access già verificato, usando l’email normalizzata o il subject namespaced come fallback.

Guardrail:

- un solo brief per richiesta;
- AlertDialog accessibile prima dell’invio;
- rifiuto disabilitato finché manca il motivo;
- limite client di 2.000 caratteri;
- state machine applicata da D1;
- evento `editorial_brief_events` append-only;
- retry della stessa decisione idempotente;
- decisione opposta o stato terminale incompatibile → `409`;
- task editoriale aperto cancellato soltanto su `dismissed`;
- reload dello snapshot dopo esito;
- contratto con `publicationTriggered: false`.

La migrazione `0020_editorial_brief_decisions.sql` aggiunge `decision_actor`, `decided_at`, l’audit immutabile e le transizioni legali:

```text
proposed → accepted | dismissed
accepted → converted
```

`accepted → converted` resta un gate successivo e non viene esposto da questa branch. Gli stati storici vengono backfillati con attore esplicito `migration-0020-backfill`, senza inventare l’identità originale.

## Separazioni obbligatorie

```text
brief accepted ≠ brief converted
brief dismissed ≠ pubblicazione o cancellazione globale
approved draft ≠ published page
review draft ≠ publication eligibility
editorial approval ≠ publication action
draft status ≠ materialized page status
queue status ≠ decisione editoriale
failed task ≠ contenuto non valido
audit event ≠ autorizzazione operativa
```

La PR #54 non implementa conversione brief, mutation claim, valutazione readiness, approvazione bundle, generazione o revisione draft, materializzazione, queue retry, accesso browser a D1 o pubblicazione.

## Dati e sessione server-side

Dopo Access, il browser usa:

- `GET /api/health`;
- `GET /control-room-foundation/api/snapshot`;
- `GET /control-room-foundation/api/draft-detail?draftId=<id>` on demand;
- `POST /control-room-foundation/api/brief-decision` soltanto dopo conferma.

Il browser non conserva token applicativi, non invia Bearer token e non accede direttamente a D1. Le API originali restano disponibili per agenti e consumer legacy.

Contratti principali:

- `src/lib/control-room-api.ts` — health e snapshot;
- `src/lib/draft-detail-contract.ts` — dettaglio draft;
- `src/lib/brief-decision-api.ts` — risposta della mutation brief;
- `src/editorial-brief-decisions.ts` — handler server-side condiviso.

## Verifica locale

```bash
npm run types
npm run typecheck
npm run build
npm run db:migrate:local
npm run smoke:quality
npm run eval:research-quality
npm run smoke:runtime
npm run smoke:ui
npm run smoke:brief-decisions
npm run smoke:claims
npm run smoke:readiness
npm run smoke:drafts
npm run smoke:draft-detail
npm run smoke:queue-audit
npm run smoke:legacy-parity
```

Gli smoke generano credenziali Access effimere; nessuna chiave viene versionata.

- `smoke:runtime` verifica bundle, Access, proxy, API originale, export, health e route di pubblicazione assenti.
- `smoke:ui` verifica la Control Room generale e include `smoke:brief-decisions`.
- `smoke:brief-decisions` usa D1 locale migrato e `workerd`: Access anonimo negato, attore server-side, accept, dismiss, motivo obbligatorio, retry idempotente, conflitto, queue, conferme desktop/mobile, reload e conteggio pubblicazioni invariato.
- gli smoke claim, readiness, draft, dettaglio e queue/audit verificano le rispettive viste e i contratti di regressione.
- `smoke:legacy-parity` verifica letture complete, prima mutation migrata e inventario delle mutation ancora nella legacy.

La CI finale #237 è verde. PR #54, migrazione remota `0020` e Control Room reale dietro Access sono verificati dal checkpoint produttivo #244; nessuna decisione su brief reali è stata eseguita.
