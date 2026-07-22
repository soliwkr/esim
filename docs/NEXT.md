# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **22 luglio 2026**.

## Now

### 1. Completare la mutation di decisione brief

Branch attiva:

```text
feat/control-room-brief-decision-mutation
```

Scope esclusivo:

```text
proposed → accepted | dismissed
```

Obblighi implementati da verificare in CI:

- un solo brief per richiesta;
- conferma esplicita dell’operatore;
- attore derivato dal JWT Cloudflare Access verificato;
- state machine applicata da D1;
- audit append-only `editorial_brief_events`;
- retry della stessa decisione idempotente;
- conflitto sulla decisione opposta;
- motivo obbligatorio per il rifiuto;
- cancellazione del task editoriale aperto soltanto su `dismissed`;
- reload dello snapshot dopo esito;
- test endpoint reale e browser;
- `publicationTriggered: false` nel contratto.

Non include:

- conversione brief;
- generazione o verifica claim;
- readiness o approvazione bundle;
- generazione o decisione draft;
- materializzazione;
- retry queue;
- pubblicazione;
- rimozione della legacy.

La migrazione `0020` deve superare D1 locale e runtime `workerd`. Non viene applicata in produzione e non viene dichiarata operativa finché la PR non è mergiata e la migrazione remota non è verificata.

### 2. Verificare i nuovi linkage nel browser reale

Da controllare dietro Cloudflare Access:

- claim con badge `task #<id>` e stato task;
- evento audit con `event_key` stabile;
- evento draft con ID e versione mostrati separatamente;
- eventi non-draft con linkage draft assente;
- mobile, tastiera e apertura Sheet reali.

Le CI #213 e #220 coprono contratti, payload invalidi, query D1, `workerd`, desktop e mobile automatizzati. La verifica visuale non deve attestare valori che non risultano leggibili.

### 3. Verificare separatamente il topic-mismatch gate in produzione

La PR #46 è mergiata nel commit `215470ae` e la CI #188 è verde. Resta da confermare:

- applicazione remota della migrazione `0019`;
- normalizzatore con anchor attivo sui nuovi run;
- nessun Workflow avviato automaticamente;
- nessun dato editoriale artificiale creato in produzione.

La verifica funzionale completa del gate avverrà sul primo nuovo run autorizzato. Non viene creato un run di prova soltanto per chiudere il checkpoint.

### 4. Conservare le separazioni editoriali

```text
brief accepted ≠ brief converted
brief dismissed ≠ contenuto cancellato altrove
approved draft ≠ published page
draft status ≠ materialized page status
materialized page review ≠ publication eligibility
queue status ≠ decisione editoriale
audit event ≠ autorizzazione operativa
```

## Next

Dopo il merge e la verifica della decisione brief:

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni capacità richiede una nuova branch, conferma esplicita, idempotenza, audit persistito, reload dello stato e test end-to-end. La pubblicazione resta fuori scope.

La legacy resta disponibile finché tutte le mutation necessarie non sono migrate e verificate.

## Checkpoint completati

- PR #31 — sessione server-side e un solo login Access;
- PR #32 — overview e health;
- PR #34 — radar e brief;
- PR #36 — score zero filtrato con `zero_relevance`;
- PR #37 — claim, fonti e scadenze;
- PR #39 + #40 — Page Readiness ed evidence bundle;
- PR #42 — draft, preview e decisioni read-only;
- PR #44 — queue e audit read-only;
- PR #45 — golden quality evaluation e criteri di adozione framework;
- PR #46 — topic-mismatch gate mergiato, verifica remota ancora da chiudere;
- PR #47 — dettaglio draft completo GET-only, mergiato con CI #198 e verificato nel browser reale;
- PR #49 — audit di parità legacy, merge `e0a39fa9`, CI #209 verde;
- PR #50 — linkage read-only claim → task, merge `41a9beee`, CI #213 verde;
- PR #52 — linkage canonico audit → versione draft, merge `35f56e82`, CI finale #220 verde.

## Framework di evaluation

- golden dataset + D1 evaluator: adottati con PR #45;
- topic-anchor gate deterministico: PR #46;
- Promptfoo: soltanto con un vero prompt, modello o grader semantico;
- Evidently: reporting e drift su corpus significativo;
- Great Expectations: data-quality multipipeline non già coperta;
- Cleanlab: probabilità di modello e volume etichettato sufficiente.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation diversa dalla decisione brief in questa branch;
- nessuna rimozione della legacy finché resta un fallback operativo.
