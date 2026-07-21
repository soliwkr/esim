# `apps/web`

Frontend Astro di Senza Roaming e nuova Control Room privata.

## Runtime

`apps/web/src/worker.ts` è il custom entrypoint del singolo Worker Cloudflare. Delega ad Astro `/astro-foundation` e `/control-room-foundation`; tutte le altre richieste continuano a usare il router backend in `src/index.ts`. Lo stesso modulo conserva gli export `RecentDemandWorkflow` e `Last30DaysContainer`.

La Control Room è `noindex,nofollow` e `no-store`. Tutto il path `/control-room-foundation*` è fail-closed: prima di servire la shell o il proxy snapshot, il Worker richiede e valida l’identità emessa da Cloudflare Access.

## UI

Astro fornisce la shell SSR e monta un solo root React con `client:load`. shadcn/ui è configurato da `components.json`; i componenti generati sono versionati sotto `src/components/ui` e lo stile Tailwind 4 vive in `src/styles/globals.css`.

La island implementa:

- sidebar desktop e Sheet mobile;
- caricamento automatico dopo Cloudflare Access;
- overview completa sulle 19 metriche già esposte dallo snapshot;
- capability e binding di Worker, D1, maintenance API, Workflow, Container, AI Gateway e Vertex;
- timestamp dello snapshot e guardrail di pubblicazione;
- health e snapshot gestiti come risorse indipendenti;
- run del radar filtrabili con dettaglio read-only;
- segnali recenti filtrabili per run e idoneità;
- brief ordinati dal backend con punteggi, readiness e draft collegati;
- claim, fonti e scadenze con filtri e dettaglio read-only;
- Page Readiness ed evidence bundle con score, conteggi, warning e gate separati;
- preview read-only dei metadati dell'ultimo draft;
- loading, errori parziali, contratti invalidi ed empty state.

La relazione run → segnali usa il `run_id` canonico. Lo snapshot non espone un collegamento diretto segnale → brief e la UI non lo deduce.

La vista claim mostra soltanto campi già esposti dal backend:

- brief, soggetto, campo, testo e domanda di verifica;
- stato canonico, evidence e note;
- fonte, URL, trust level e source kinds richiesti;
- verification status, confidence, checked at, valid until e task status.

Lo stato temporale `valida`, `scaduta` o `senza scadenza` deriva da `valid_until` e non modifica lo stato canonico del claim. Fonte ed evidenza restano concetti distinti; una dichiarazione ufficiale non viene presentata come test indipendente.

La vista readiness usa esclusivamente `evidenceBundles` già presente nello snapshot. Mostra come persistiti:

- readiness score e review status;
- `review_draft_eligible` e `ready_for_review_draft`;
- `publication_eligible` e `ready_for_publication`;
- conteggi claim, conflitti, fonti, soggetti e test first-party;
- warning strutturati, revisore e timestamp.

Ogni warning è un oggetto con `code`, `message` opzionale e metadati aggiuntivi opachi come claim o conflitti collegati. Il client valida `code` e `message`, conserva gli altri campi e mostra il contenuto senza trasformarlo in una decisione propria.

Draft eligibility e publication eligibility restano gate distinti. Il client non ricalcola score, conteggi o decisioni.

Non implementa avvio Workflow, accettazione o conversione brief, mutation claim, gestione fonti, valutazione readiness, approvazione bundle, generazione draft, queue actions, accesso diretto a D1 o capacità di pubblicazione.

## Dati e sessione server-side

Dopo Access, il browser legge:

- `GET /api/health`;
- `GET /control-room-foundation/api/snapshot`.

Il secondo endpoint è un proxy read-only interno al custom Worker entrypoint. Accetta soltanto `GET` e delega al contratto esistente `GET /api/maintenance/control-room` senza esporre credenziali al browser.

Il browser non conserva token applicativi e non invia un header di autorizzazione verso l’API di manutenzione. L’API originale resta invariata per agenti e consumer legacy.

`apps/web/src/lib/control-room-api.ts` valida a runtime health, overview, run, segnali, brief, claim, evidence bundle e draft. Per i bundle vengono validati anche i quattro gate binari, i conteggi non negativi, i warning strutturati e i timestamp nullable.

Punteggi, stati, quality flags, confidence, gate e valori nullable vengono mostrati come persistiti. Il client non ricalcola Opportunity, Evidence, Priority, Readiness o lo stato canonico dei claim.

Tutti i dati reali arrivano dalle API del Worker; il browser non accede a D1.

La configurazione operativa completa vive in [`docs/CONTROL-ROOM-ACCESS.md`](../../docs/CONTROL-ROOM-ACCESS.md).

## Verifica locale

```bash
npm run types
npm run typecheck
npm run build
npm run db:migrate:local
npm run smoke:quality
npm run smoke:runtime
npm run smoke:ui
npm run smoke:claims
npm run smoke:readiness
```

Gli smoke generano credenziali Access effimere di test; nessuna chiave viene versionata.

- `smoke:quality` verifica il gate D1 per score zero e low-positive relevance.
- `smoke:runtime` verifica bundle, Access, proxy GET-only, metriche overview, array radar/brief, API originale, export, health e route di pubblicazione assenti.
- `smoke:ui` verifica caricamento generale, overview, radar, brief, claim, readiness e draft, errori parziali, tastiera e mobile.
- `smoke:claims` verifica contratto claim, cinque filtri, fonte sicura, stato temporale, empty state, tastiera, mobile e assenza di fetch o mutation nel componente.
- `smoke:readiness` verifica contratto bundle, warning strutturati, quattro filtri, gate separati, empty state, tastiera, mobile e assenza di fetch o mutation nel componente.
