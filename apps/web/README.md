# `apps/web`

Frontend Astro di Senza Roaming e nuova Control Room privata.

## Runtime

`apps/web/src/worker.ts` è il custom entrypoint del singolo Worker Cloudflare. Delega ad Astro `/astro-foundation` e `/control-room-foundation`; tutte le altre richieste continuano a usare il router backend in `src/index.ts`. Lo stesso modulo conserva gli export `RecentDemandWorkflow` e `Last30DaysContainer`.

La Control Room è `noindex,nofollow` e `no-store`. Tutto il path `/control-room-foundation*` è fail-closed: prima di servire la shell o i proxy read-only, il Worker richiede e valida l’identità emessa da Cloudflare Access.

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
- inventario draft con renderer, versione, stato, revisore, note e claim usati/esclusi;
- dettaglio draft completo caricato on demand con corpo, FAQ, fonti, provenance field-level e stato pagina;
- relazioni draft → evidence bundle → brief risolte soltanto tramite ID canonici già presenti;
- maintenance queue con stato, priorità, tentativi, lock, errori, payload e timestamp;
- audit aggregato con dominio, azione, attore, entità, dettagli e timestamp;
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

Ogni warning è un oggetto con `code`, `message` opzionale e metadati aggiuntivi opachi. Il client valida `code` e `message`, conserva gli altri campi e non li trasforma in una decisione propria.

L’inventario draft usa soltanto `drafts`, `evidenceBundles` e `briefs` già presenti nello snapshot. Mostra:

- pagina, versione, renderer e stato canonico del draft;
- autore, revisore, timestamp e note di revisione;
- evidence bundle e brief collegati;
- readiness score e publication eligibility del bundle;
- title, H1 e claim usati/esclusi;
- errore di generazione quando persistito.

Il dettaglio completo è una risorsa separata e viene richiesto soltanto quando l’operatore apre una versione:

```text
GET /control-room-foundation/api/draft-detail?draftId=<id>
```

Il proxy valida Cloudflare Access, accetta soltanto `GET`, conserva il maintenance token server-side e delega all’endpoint backend esistente `GET /api/maintenance/editorial-draft-grounding`. Il client valida integralmente:

- identità, versione, bundle, slug e renderer del draft selezionato;
- title, meta description, H1, direct answer e intro;
- blocchi `paragraph`, `heading`, `bullets`, `steps`, `table` e `callout`;
- FAQ e fonti HTTPS;
- provenance dei campi principali, sezioni e FAQ;
- claim usati ed esclusi, regole di generazione e metadati tecnici;
- `materializedPageStatus` distinto dallo stato draft e dal publication gate.

Un errore del dettaglio non cancella l’inventario valido dello snapshot. Non viene effettuata alcuna richiesta finché una versione non viene aperta.

La vista Queue/Audit usa esclusivamente gli array `queue` e `audit` già presenti nello snapshot:

- la queue include soltanto task `pending`, `processing` e `failed` restituiti dalla query limitata del backend;
- i conteggi locali descrivono i record presenti nello snapshot e non sostituiscono le metriche overview;
- payload e dettagli audit sono validati come JSON e mostrati come dati opachi;
- l’audit non espone un ID evento né un legame univoco con una specifica versione draft;
- il client non calcola retry, priorità, outcome, decisioni o autorizzazioni.

Separazioni obbligatorie:

```text
approved draft ≠ published page
review draft ≠ publication eligibility
editorial approval ≠ publication action
draft status ≠ materialized page status
queue status ≠ decisione editoriale
failed task ≠ contenuto non valido
audit event ≠ autorizzazione operativa
```

L’audit aggregato non espone ancora un ID evento né un collegamento univoco con una specifica versione del draft. La UI dichiara questo limite e non ricostruisce relazioni mancanti.

Non implementa avvio Workflow, accettazione o conversione brief, mutation claim, gestione fonti, valutazione readiness, approvazione bundle, generazione o revisione operativa dei draft, materializzazione, queue actions, accesso diretto a D1 o capacità di pubblicazione.

## Dati e sessione server-side

Dopo Access, il browser legge:

- `GET /api/health`;
- `GET /control-room-foundation/api/snapshot`;
- `GET /control-room-foundation/api/draft-detail?draftId=<id>` soltanto on demand.

I due endpoint sotto `/control-room-foundation/api/*` sono proxy read-only interni al custom Worker entrypoint. Accettano soltanto `GET` e delegano a contratti backend esistenti senza esporre credenziali al browser.

Il browser non conserva token applicativi e non invia un header di autorizzazione verso l’API di manutenzione. L’API originale resta invariata per agenti e consumer legacy.

`apps/web/src/lib/control-room-api.ts` valida a runtime health, overview, run, segnali, brief, claim, evidence bundle, draft base, queue e audit. `apps/web/src/lib/draft-contract.ts` valida integralmente i campi dell’inventario draft. `apps/web/src/lib/draft-detail-contract.ts` valida il dettaglio completo on demand; `apps/web/src/lib/draft-detail-api.ts` gestisce la risorsa indipendente.

Punteggi, stati, quality flags, confidence, gate e valori nullable vengono mostrati come persistiti. Il client non ricalcola Opportunity, Evidence, Priority, Readiness o decisioni editoriali.

Tutti i dati reali arrivano dalle API del Worker; il browser non accede a D1.

La configurazione operativa completa vive in [`docs/CONTROL-ROOM-ACCESS.md`](../../docs/CONTROL-ROOM-ACCESS.md).

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
npm run smoke:claims
npm run smoke:readiness
npm run smoke:drafts
npm run smoke:draft-detail
npm run smoke:queue-audit
```

Gli smoke generano credenziali Access effimere di test; nessuna chiave viene versionata.

- `smoke:quality` verifica il gate D1 per score zero, low-positive relevance e topic mismatch.
- `eval:research-quality` confronta il trigger D1 con il golden set versionato.
- `smoke:runtime` verifica bundle, Access, proxy GET-only, metriche overview, array di dominio inclusi queue/audit, API originale, export, health e route di pubblicazione assenti.
- `smoke:ui` verifica caricamento generale, viste migrate, errori parziali, tastiera e mobile.
- `smoke:claims` verifica contratto claim, cinque filtri, fonte sicura, stato temporale, empty state, tastiera, mobile e assenza di fetch o mutation nel componente.
- `smoke:readiness` verifica contratto bundle, warning strutturati, quattro filtri, gate separati, empty state, tastiera, mobile e assenza di fetch o mutation nel componente.
- `smoke:drafts` verifica contratto inventario draft, tre filtri, decisione di revisione, relazioni bundle/brief, empty state, tastiera, mobile e assenza di mutation.
- `smoke:draft-detail` verifica Access, proxy GET-only, caricamento on demand, contratto completo, provenance, stato pagina, errore isolato, retry, mobile e assenza di mutation.
- `smoke:queue-audit` verifica contratti queue/audit, filtri, dettaglio, payload JSON, gap di linkage, empty state, tastiera, mobile e assenza di fetch o mutation nel componente.
