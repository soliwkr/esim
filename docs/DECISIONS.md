# Decisioni architetturali

Questo registro conserva le decisioni che cambiano il modo in cui Senza Roaming viene costruito. Una decisione può essere sostituita, ma non cancellata senza lasciare traccia.

## ADR-001 — Cloudflare come runtime principale

**Stato:** accettata

**Decisione:** usare Worker, D1, Workflows, Containers e AI Gateway come piattaforma operativa principale.

**Razionale:** un solo piano infrastrutturale, deployment versionato, costi iniziali contenuti e assenza di un server permanente da amministrare.

**Conseguenza:** le nuove capacità devono essere valutate prima in termini di compatibilità con Cloudflare e isolamento dei guasti.

## ADR-002 — Nessuna pubblicazione autonoma dell'AI

**Stato:** accettata

**Decisione:** l'AI può creare cluster, brief, claim candidati e task, ma non può promuovere direttamente pagine a `published`.

**Razionale:** le informazioni eSIM cambiano e possono produrre danni concreti al viaggiatore se errate.

**Conseguenza:** ogni percorso editoriale commerciale include un gate umano e un audit log.

## ADR-003 — Separare domanda recente e verità commerciale

**Stato:** accettata

**Decisione:** Reddit, YouTube, web recente e trend alimentano opportunità editoriali; le fonti ufficiali alimentano claim verificabili.

**Razionale:** popolarità, testimonianze e discussioni non provano prezzo, copertura o condizioni contrattuali.

**Conseguenza:** i due tipi di dati vivono in tabelle e workflow distinti.

## ADR-004 — Versione fissata di last30days

**Stato:** accettata

**Decisione:** il Container usa un commit upstream fissato invece di seguire automaticamente l'ultima versione.

**Razionale:** riproducibilità, auditabilità e protezione da cambiamenti upstream inattesi.

**Conseguenza:** gli aggiornamenti dell'upstream richiedono revisione e nuovo smoke test.

## ADR-005 — Dashboard specifica del progetto

**Stato:** accettata

**Decisione:** costruire una dashboard privata per le operazioni specifiche di Senza Roaming.

**Razionale:** radar, fonti, claim, pagine e coda editoriale sono concetti specifici del progetto e devono restare vicini al suo execution plane.

**Conseguenza:** la dashboard deve usare API stabili, così un futuro Command Center può leggerne una sintesi senza duplicarne la logica.

## ADR-006 — Command Center multi-progetto separato

**Stato:** accettata come direzione, fuori dallo scope immediato

**Decisione:** il futuro Command Center sarà un control plane dello studio, non una sezione interna di Senza Roaming.

**Razionale:** infrastruttura, costi, alert, roadmap e servizi condivisi devono essere visibili su più proprietà senza trasformare un singolo sito nel sistema operativo dello studio.

**Conseguenza:** questa fase resta concentrata sul completamento di Senza Roaming. La governance dello studio sarà trattata in un cantiere separato.

## ADR-007 — OpenSEO come servizio condiviso

**Stato:** accettata come direzione

**Decisione:** distribuire OpenSEO come servizio specialistico dello studio con progetti separati, anziché incorporarlo in `soliwkr/esim`.

**Razionale:** keyword research, rank tracking, competitor intelligence, backlink e audit sono capacità riutilizzabili.

**Conseguenza:** Senza Roaming riceverà dati o task tramite integrazione, mantenendo indipendente la propria codebase.

## ADR-008 — GitHub come memoria canonica

**Stato:** accettata

**Decisione:** roadmap, status, architettura, decisioni e prossime azioni vivono nel repository.

**Razionale:** una chat lunga non deve essere l'unica fonte di contesto e non garantisce continuità operativa tra sessioni.

**Conseguenza:** ogni milestone aggiorna almeno `STATUS.md`, `NEXT.md` e, quando necessario, questo registro.

## ADR-009 — Metriche definite una volta

**Stato:** accettata come principio

**Decisione:** eventi e KPI devono avere definizioni canoniche prima di essere mostrati in dashboard o interpretati dall'AI.

**Razionale:** dashboard, query e modelli non devono attribuire significati diversi allo stesso nome.

**Conseguenza:** prima dell'attivazione analytics verrà creato un dizionario delle metriche e degli eventi.

## ADR-010 — Affiliate mode esplicita e reversibile

**Stato:** accettata

**Decisione:** mantenere `AFFILIATE_MODE=disabled` finché programmi, disclosure, tracking e quality gate non sono pronti.

**Razionale:** la monetizzazione non deve precedere accuratezza e trasparenza.

**Conseguenza:** l'attivazione avviene tramite configurazione esplicita e può essere disabilitata senza modificare contenuti o routing pubblico.

## ADR-011 — Astro come frontend principale

**Stato:** accettata

**Decisione:** usare Astro come livello frontend del sito pubblico e come shell della Control Room. Usare React soltanto per isole con interattività applicativa complessa.

**Razionale:** Senza Roaming è principalmente una proprietà editoriale content-first, ma possiede una dashboard privata che richiede stato, form, tabelle e mutation. Astro evita di trasformare l'intero sito in una SPA e consente di caricare React soltanto dove serve.

**Conseguenza:** il Worker non deve più generare nuove interfacce tramite stringhe HTML, CSS e JavaScript. Il backend esistente resta invariato e viene integrato tramite custom Worker entrypoint.

## ADR-012 — Componenti comprovati prima del codice custom

**Stato:** accettata

**Decisione:** non costruire da zero componenti generici, dashboard shell, gestione form, tabelle, dialog, toast, focus e stati applicativi già risolti da librerie mature.

**Razionale:** il valore specifico del progetto vive nei flussi editoriali, nei contratti e nei guardrail, non nella riscrittura di primitive UI.

**Conseguenza:** shadcn/ui è operativo nella foundation. Un confronto Mantine resta separato e viene eseguito soltanto se produce un vantaggio misurabile.

## ADR-013 — Migrazione frontend incrementale

**Stato:** accettata

**Decisione:** aggiungere inizialmente `apps/web` senza spostare o riscrivere subito il backend esistente.

**Razionale:** una riorganizzazione completa del repository insieme al cambio di framework aumenterebbe il rischio senza migliorare direttamente il prodotto.

**Conseguenza:** la Control Room viene migrata una vista alla volta; la ristrutturazione completa in monorepo viene valutata dopo il primo rilascio stabile.

## ADR-014 — Un solo Worker con custom Astro entrypoint

**Stato:** accettata

**Decisione:** compilare `apps/web/src/worker.ts` come entrypoint Cloudflare reale. L'entrypoint delega le route Astro previste, inoltra le route restanti al router backend ed esporta nello stesso modulo `RecentDemandWorkflow` e `Last30DaysContainer`.

**Razionale:** build, runtime smoke e deploy dimostrano che Astro, React, API, D1, Workflow e Container possono convivere senza separare il deploy e senza riscrivere il backend.

**Conseguenza:** la separazione in due Worker non viene introdotta. L'espansione delle route Astro resta progressiva e conserva i publication guardrail.

## ADR-015 — shadcn/ui per la fondazione read-only della Control Room

**Stato:** accettata

**Decisione:** installare shadcn/ui direttamente in `apps/web`, versionando i sorgenti dei componenti e usando una sola island React dentro la shell Astro.

**Razionale:** la dashboard richiede componenti accessibili e responsive senza estendere la UI legacy o ricostruire primitive generiche.

**Conseguenza:** shadcn/ui è la base della migrazione corrente. Nessun componente può accedere direttamente a D1 o introdurre capacità di pubblicazione.

## ADR-016 — Cloudflare Access con validazione JWT nell'origine

**Stato:** accettata e verificata in produzione

**Decisione:** proteggere `/control-room-foundation*` con un'applicazione Cloudflare Access deny-by-default e validare nel custom Worker il JWT prima di servire pagina o proxy.

**Razionale:** la policy al bordo e la verifica nell'origine formano un perimetro fail-closed anche in presenza di errori di routing.

**Conseguenza:** una richiesta senza configurazione valida o identità autorizzata non raggiunge la React island. Backend editoriale, D1 e publication gate non cambiano.

## ADR-017 — Sessione Control Room mediata dal Worker

**Stato:** accettata e verificata in produzione

**Decisione:** il browser della nuova Control Room non gestisce il token operativo. Dopo Cloudflare Access richiama endpoint protetti sotto `/control-room-foundation*`; il custom Worker valida nuovamente l'identità e media letture e mutation autorizzate.

**Razionale:** chiedere un secondo token all'operatore rende l'accesso macchinoso e trasferisce inutilmente una credenziale nel browser.

**Conseguenza:** campo token, storage applicativo e header di autorizzazione dal browser sono rimossi. Le letture restano `GET`; ogni mutation richiede una route esplicita, un contratto dedicato e l’identità Access verificata. Le API originali restano disponibili per agenti e consumer legacy.

## ADR-018 — Contratti runtime e guasti parziali nella Control Room

**Stato:** accettata

**Decisione:** validare a runtime health, snapshot e risorse on-demand e gestirle come risorse indipendenti nel client. Un payload non conforme viene rifiutato; il fallimento di una risorsa non cancella i dati validi delle altre.

**Razionale:** i tipi TypeScript non validano JSON ricevuto in esecuzione e un guasto parziale non deve rendere indisponibile l'intera dashboard.

**Conseguenza:** overview, health, snapshot e dettagli on-demand mostrano errori separati e conservano dati precedenti affidabili. Nessun calcolo editoriale viene spostato nel browser.

## ADR-019 — Relevance zero come quality failure deterministica

**Stato:** accettata e verificata in produzione

**Decisione:** un segnale recent-demand con `relevance_score = 0` non è idoneo al lavoro editoriale automatico. Il database lo conserva, imposta `eligible_for_editorial = 0` e aggiunge `zero_relevance`, salvo un override umano già esplicito.

**Razionale:** la Control Room ha mostrato un risultato su uno spettacolo comico associato al topic “Holafly recent experiences” con score zero ma eligibility positiva. Uno score esattamente nullo è una dichiarazione deterministica dell'upstream e non richiede un classificatore semantico per essere rifiutato.

**Conseguenza:** `0 < relevance_score < 0,35` resta un warning consultivo; `NULL` non viene bloccato automaticamente per non escludere run discovery privi di score. La regola vive in D1, riallinea i conteggi dei run e dispone di uno smoke di regressione dedicato.

## ADR-020 — Golden evaluation prima di un framework semantico

**Stato:** accettata e verificata in CI con PR #45

**Decisione:** versionare un golden dataset di segnali revisionati e misurare il trigger D1 reale con confusion matrix in CI. Non introdurre un framework esterno finché non riduce complessità o valuta una capacità che il progetto possiede davvero.

**Razionale:** il gate corrente è deterministico e vive nel database. Promptfoo è adatto quando esiste un prompt, modello o grader semantico da confrontare; Evidently e Cleanlab diventano utili con un corpus etichettato più ampio e output di modello. Great Expectations coprirebbe soprattutto vincoli strutturali già verificati da D1 e smoke runtime.

**Conseguenza:** la baseline iniziale ha registrato `3 TP`, `1 FP`, `4 TN`, `0 FN`, precision `0.75` e recall `1.00`. L'adozione futura di Promptfoo, Evidently, Great Expectations o Cleanlab richiede un criterio di ingresso documentato e resta fuori dal runtime di produzione finché non è necessaria.

## ADR-021 — Topic anchor deterministici prima di un grader semantico

**Stato:** accettata con PR #46; verifica remota ancora aperta

**Decisione:** per i nuovi run research e comparison, estrarre dalla query un massimo di otto anchor informative, persistirle nel run e richiedere nel trigger D1 almeno una corrispondenza letterale nel titolo o nel summary. Un mancato match produce `eligible_for_editorial = 0` e `topic_mismatch`.

**Razionale:** il golden set contiene un risultato estraneo con score positivo `0.2`, causato da parole generiche come “recent experience”. Il nome del provider “Holafly” distingue il segnale pertinente senza richiedere un modello o un LLM-as-a-judge.

**Conseguenza:** articoli e termini generici non diventano anchor; i run discovery persistono `[]` e restano esenti dal filtro; i run esistenti ricevono il default `[]` e non vengono riclassificati. La CI porta il golden set a `3 TP`, `0 FP`, `5 TN`, `0 FN`, precision e recall `1.00`. Sinonimi, entità implicite e negazioni restano limiti dichiarati.

## ADR-022 — Dettaglio draft on demand separato dallo snapshot

**Stato:** accettata e verificata in produzione con PR #47

**Decisione:** mantenere nello snapshot aggregato soltanto l’inventario dei draft e caricare corpo completo, FAQ, fonti, provenance field-level e stato della pagina tramite una risorsa GET-only separata, richiesta soltanto quando l’operatore apre una versione.

**Razionale:** includere tutti i corpi e le provenance nello snapshot iniziale aumenterebbe peso, tempo di validazione e raggio dei guasti. Il backend espone già il contratto necessario tramite `GET /api/maintenance/editorial-draft-grounding`; duplicare query D1 o creare un nuovo contratto editoriale non aggiungerebbe valore.

**Conseguenza:** il custom Worker aggiunge `/control-room-foundation/api/draft-detail?draftId=<id>`, protetto da Cloudflare Access e mediato dal maintenance token server-side. Il client usa un contratto runtime dedicato; un errore del dettaglio non cancella inventario, overview o altre viste. Stato draft, stato pagina materializzata e publication eligibility restano distinti. Nessuna generation, review action, materializzazione o pubblicazione viene esposta.

## ADR-023 — Parità legacy basata su capacità operative, non sul renderer HTML

**Stato:** accettata e verificata in CI con PR #49, #50 e #52

**Decisione:** valutare la parità read-only della nuova Control Room in base ai dati canonici, alle relazioni, ai guardrail e alle capacità di ispezione necessarie all’operatore. Non conservare come requisito il template HTML della preview legacy; una futura preview visuale deve appartenere al renderer pubblico Astro.

**Razionale:** la preview legacy dipende da HTML generato nel Worker e non rappresenta l’architettura frontend definitiva. Il dettaglio draft on demand espone già corpo strutturato, FAQ, fonti, provenance, regole e stato pagina senza duplicare il renderer legacy. Copiare il template produrrebbe parità visiva apparente ma nuovo debito tecnico.

**Conseguenza:** `task_id` è conservato tramite PR #50; identità audit e linkage draft sono canonici tramite PR #52. Non restano gap read-only noti. La legacy resta finché serve come fallback delle mutation; nessuna rimozione avviene sulla sola base della parità visiva.

## ADR-024 — Identità audit e linkage draft derivati da relazioni canoniche

**Stato:** accettata e verificata in CI con PR #52

**Decisione:** esporre nello snapshot una `event_key` stabile per ogni evento audit e valorizzare `draft_id` e `draft_version` soltanto per il dominio `draft`. Ottenere il linkage dalle colonne relazionali persistite e dal join con `editorial_review_drafts`, non dal JSON `details`.

**Razionale:** `editorial_review_draft_events` possiede già un ID evento e `draft_id`; il record draft possiede già `version`. Una migrazione D1 duplicata non aggiungerebbe informazione. Interpretare `details.draftId` nel browser renderebbe una struttura opaca un contratto implicito e fragile.

**Conseguenza:** la query aggregata genera chiavi namespaced (`draft-event:*`, `readiness-event:*`, `claim-event:*`, `research-run:*`, `ai-run:*`). Il contratto runtime richiede chiavi uniche; per gli eventi draft richiede ID e versione positivi, per gli altri domini richiede entrambi null. La React island seleziona tramite `event_key`, mostra il linkage canonico e conserva `details` come JSON opaco. PR #52 è mergiata nel commit `35f56e82` dopo CI finale #220 verde. Nessuna migrazione, mutation o capacità di pubblicazione è stata introdotta.

## ADR-025 — Mutation una capacità per branch con identità Access e state machine D1

**Stato:** accettata e verificata in produzione con PR #54

**Decisione:** migrare le mutation della Control Room una per volta. Ogni capacità usa una route privata dedicata, deriva l’attore dal JWT Cloudflare Access già verificato, richiede conferma esplicita nel client e delega a D1 la validità della transizione e l’audit append-only.

**Razionale:** un form browser non è un’autorità editoriale. Idempotenza, concorrenza e transizioni terminali devono restare verificabili server-side. Accettare insieme più capacità renderebbe ambiguo quale azione ha causato un cambiamento e allargherebbe il raggio di errore.

**Conseguenza:** la prima applicazione è `proposed → accepted|dismissed` sui brief. Il browser invia soltanto `briefId`, azione e note; non può scegliere l’attore. D1 conserva `editorial_brief_events`, blocca transizioni illegali e mantiene `accepted → converted` come gate successivo. Il client usa un AlertDialog, impedisce il rifiuto senza motivo e ricarica lo snapshot dopo l’esito. Il contratto attesta `publicationTriggered: false`. Conversione, claim, readiness, draft, queue retry, materializzazione e pubblicazione restano fuori dalla branch. La decisione è stata accettata dopo merge `15ea0445`, CI finale #237 e checkpoint produttivo #244: `0020` è registrata nella D1 remota, la Control Room è verificata dietro Access e nessun brief reale è stato modificato.

## ADR-026 — M5 pubblico in parallelo alle mutation M4 residue

**Stato:** accettata come ordine operativo controllato

**Decisione:** autorizzare l’avvio della migrazione del frontend pubblico Astro mentre prosegue, su branch distinte, la migrazione delle mutation residue della Control Room. La prima slice pubblica resta una preview `noindex` su `/astro-foundation`; il routing dell’apice, la rimozione dei renderer legacy e il cutover pubblico richiedono decisioni e PR separate.

**Razionale:** Astro, il custom Worker e il backend sono già isolati; la parità read-only della Control Room è completa; la prima mutation è verificata in produzione; gli stati editoriali e il publication gate non dipendono dal renderer pubblico. Attendere tutte le mutation prima di iniziare layout, navigazione e componenti pubblici prolungherebbe il lancio senza ridurre il rischio, purché le due track mantengano scope ed exit criteria separati.

**Conseguenza:** M4 non viene dichiarato completato e la legacy Control Room resta il fallback operativo. M5 può introdurre layout, metadata, navigazione, footer, token visuali, route statiche e renderer Astro in una preview non canonica. Non può modificare D1, attivare affiliazioni, pubblicare pagine review, cambiare `/`, rimuovere il renderer legacy o anticipare CMP/analytics. Il cutover apex richiede verifica di canonical, sitemap, schema, 404, accessibilità, rollback e assenza di pubblicazioni accidentali. Il piano eseguibile è registrato in `docs/PUBLIC-FRONTEND-PARALLEL-TRACK.md`.

## ADR-027 — Contratto SEO pubblico condiviso, policy di route separate

**Stato:** accettata e verificata in produzione con PR #69

**Decisione:** title, description, Open Graph e JSON-LD di homepage e articoli derivano da un modello tipizzato server-only condiviso tra renderer legacy e Astro. Canonical URL, `mainEntityOfPage`, robots e cache restano invece policy della route che possiede la risposta.

**Razionale:** duplicare metadata e schema aveva già prodotto drift: l’articolo Astro usava copy da preview, `og:type=website` e nessun JSON-LD, mentre il renderer legacy possedeva metadata e schema propri. Unificare il documento SEO senza trasferire routing consente di verificare la parità prima del cutover e impedisce che una preview noindex diventi accidentalmente canonica.

**Conseguenza:** `src/public-seo.ts` valida valori JSON compatibili, produce `WebSite`, `Article` e `FAQPage`, normalizza le date e serializza JSON-LD escapando `<`, U+2028 e U+2029. Il legacy resta indexabile e canonico su `/` e `/{slug}`; Astro resta noindex, no-store e self-canonical su `/astro-foundation`. `/sitemap.xml`, `/robots.txt` e `/go/{provider}` restano legacy-owned. Il smoke D1/workerd/Chromium confronta valori normalizzati, prova fixture `</script>` e verifica assenza di JavaScript eseguibile, regressioni sitemap/robots/redirect/404 e tutte le suite Control Room. PR #69 è mergiata nel commit `46f1d66a591dd7860c101c86cb8295d97e4a2106`; homepage e articolo sono verificati nel sorgente live. Nessuna route, D1, pubblicazione, analytics o affiliazione è stata attivata.

## ADR-028 — Ownership target esplicita e cutover tramite route matrix versionata

**Stato:** accettata come target; non attiva

**Decisione:** dopo il cutover pubblico, Astro sarà owner delle route editoriali canoniche, della sitemap, di robots e della 404 pubblica. Il backend resterà owner permanente di `/api/*`, `/go/{provider}`, legacy Control Room finché necessaria ed execution plane. L’owner live viene scelto da una matrice versionata nel custom Worker; la matrice target resta inattiva fino a una PR di cutover esplicita.

**Razionale:** oggi il custom Worker delega ad Astro soltanto `/astro-foundation*` e `/control-room-foundation*`, mentre `src/index.ts` possiede tutte le route canoniche e tecniche. Un catch-all Astro anticipato potrebbe intercettare API, provider redirect, file probe o route private. Una route matrix tipizzata rende precedenza, owner e rollback verificabili prima di spostare traffico.

**Conseguenza:** la prima slice `feat/public-route-policy-foundation` modellerà owner corrente e target separatamente, centralizzerà reserved paths e file-probe policy e farà usare al Worker soltanto la matrice corrente. Nessuna route live cambierà owner. Le route Astro canoniche e gli endpoint SEO verranno compilati e testati in PR successive senza attivazione; il cutover M5.7 sarà una modifica minima e reversibile della matrice attiva. Il namespace `/astro-foundation*` resterà noindex e no-store almeno fino al cutover verificato. Non viene introdotto alcun flag runtime nascosto, parametro URL di renderer, D1 mutation, tracking, affiliazione o capacità di pubblicazione.
