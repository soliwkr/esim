# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **22 luglio 2026**.

## Now

### 1. Rendere canonico il linkage audit → versione draft

Branch prevista:

```text
fix/control-room-audit-draft-version-linkage-readonly
```

Scope esclusivo:

- verificare la struttura reale della tabella e della query audit;
- esporre un’identità evento stabile e campi canonici sufficienti per gli eventi draft;
- legare gli eventi draft a `draft_id` e `draft_version` senza interpretare euristicamente `details` nel browser;
- aggiornare contratto runtime, fixture, vista e smoke;
- mantenere il percorso read-only e GET-only;
- non introdurre decisioni draft, mutation, materializzazione o pubblicazione.

Prima di modificare il backend devono essere confermati i campi già disponibili. Non viene introdotta una migrazione D1 se la relazione può essere esposta dalla struttura persistita esistente.

### 2. Verificare il linkage claim → task nel browser reale

La PR #50 è mergiata nel commit `41a9beee` e la CI #213 è completamente verde.

Sono verificati in CI:

- `task_id: number | null` nel contratto claim;
- validazione come `null` o intero positivo;
- fixture collegata ai task persistiti;
- badge e dettaglio con ID e stato task;
- payload con ID stringa rifiutato;
- parity audit aggiornato;
- nessuna mutation o capacità di pubblicazione.

Resta una verifica visuale nel browser reale dietro Cloudflare Access. Finché non viene eseguita, il rendering non viene dichiarato verificato in produzione.

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

### 5. Azioni operative soltanto dopo il linkage audit

Ordine indicativo, una branch per capacità:

```text
decisione brief
→ conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni mutation richiede conferma esplicita, audit, idempotenza, reload dello stato e test end-to-end. La pubblicazione resta fuori scope.

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

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation durante la chiusura del linkage audit;
- nessuna rimozione della legacy finché resta un fallback operativo.
