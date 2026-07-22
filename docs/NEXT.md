# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **22 luglio 2026**.

## Now

### 1. Chiudere la PR #52 sul linkage audit → versione draft

Branch:

```text
fix/control-room-audit-draft-version-linkage-readonly
```

Stato verificato:

- schema reale letto: ID evento e `draft_id` già persistiti;
- versione ottenuta dal record draft collegato;
- nessuna migrazione D1 introdotta;
- `event_key`, `draft_id` e `draft_version` esposti dallo snapshot;
- contratto runtime con chiavi uniche e linkage coerente per dominio;
- UI selezionata tramite `event_key`;
- `details` non usato per ricostruire relazioni;
- CI #217 completamente verde.

Prima del merge resta da verificare soltanto la diff finale della PR e mantenere esplicito che il browser reale di produzione non è ancora stato controllato.

### 2. Verificare i linkage read-only nel browser reale

Da controllare dietro Cloudflare Access:

- claim con badge `task #<id>` e stato task;
- evento audit con `event_key` stabile;
- evento draft con ID e versione mostrati separatamente;
- eventi non-draft con linkage draft assente;
- mobile, tastiera e apertura Sheet reali.

Le CI #213 e #217 coprono già contratti, payload invalidi, desktop e mobile automatizzati. La verifica visuale non deve attestare valori che non risultano leggibili.

### 3. Verificare separatamente il topic-mismatch gate in produzione

La PR #46 è mergiata nel commit `215470ae` e la CI #188 è verde. Resta da confermare:

- applicazione remota della migrazione `0019`;
- normalizzatore con anchor attivo sui nuovi run;
- nessun Workflow avviato automaticamente;
- nessun dato editoriale artificiale creato in produzione.

La verifica funzionale completa del gate avverrà sul primo nuovo run autorizzato. Non viene creato un run di prova soltanto per chiudere il checkpoint.

### 4. Conservare le separazioni editoriali

```text
approved draft ≠ published page
draft status ≠ materialized page status
materialized page review ≠ publication eligibility
preview read-only ≠ autorizzazione operativa
queue status ≠ decisione editoriale
audit event ≠ autorizzazione operativa
```

La Control Room mostra dati persistiti; non decide readiness, approvazione, materializzazione o pubblicazione.

## Next

### 5. Azioni operative, una capacità per branch

Dopo il merge della PR #52 non restano gap read-only noti rispetto alle letture legacy. Le mutation possono iniziare soltanto con scope esplicito.

Ordine indicativo:

```text
decisione brief
→ conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Per ogni capacità sono obbligatori:

- conferma esplicita dell’operatore;
- idempotenza;
- audit persistito;
- reload dello snapshot dopo esito;
- gestione di errore e retry;
- test end-to-end;
- nessuna pubblicazione implicita.

La legacy resta disponibile finché tutte le mutation necessarie non sono migrate e verificate.

## Framework di evaluation

- golden dataset + D1 evaluator: adottati con PR #45;
- topic-anchor gate deterministico: PR #46;
- Promptfoo: soltanto con un vero prompt, modello o grader semantico;
- Evidently: reporting e drift su corpus significativo;
- Great Expectations: data-quality multipipeline non già coperta;
- Cleanlab: probabilità di modello e volume etichettato sufficiente.

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
- PR #50 — linkage read-only claim → task, merge `41a9beee`, CI #213 verde.

## Checkpoint in review

- PR #52 — linkage canonico audit → versione draft, CI #217 verde.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation dentro la PR #52;
- nessuna rimozione della legacy finché resta un fallback operativo.
