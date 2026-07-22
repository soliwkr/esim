# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **22 luglio 2026**.

## Now

### 1. Chiudere il linkage claim → task

Branch:

```text
fix/control-room-claim-task-linkage-readonly
```

Draft PR:

```text
#50
```

Scope esclusivo:

- conservare `task_id` nullable nel contratto `ControlRoomClaim`;
- accettare soltanto `null` o interi positivi nel parser runtime;
- collegare la fixture canonica ai task persistiti;
- mostrare ID e stato task nel dettaglio claim;
- verificare rendering, payload invalido e parity audit;
- non modificare query backend, D1 o mutation.

Il dato esiste già nello snapshot canonico come `q.id AS task_id`; il browser non lo ricostruisce da `entity_key`.

Stato corrente:

- contratto, parser, vista, fixture e smoke aggiornati;
- draft PR #50 aperta;
- CI #211 in esecuzione;
- nessuna mutation o capacità di pubblicazione introdotta.

### 2. Rendere canonico il linkage audit → versione draft

Branch successiva prevista:

```text
fix/control-room-audit-draft-version-linkage-readonly
```

Scope da mantenere separato:

- aggiungere nel contratto server-side un’identità evento stabile o campi canonici sufficienti;
- legare gli eventi draft a `draft_id` e `draft_version` senza leggere euristicamente `details` nel client;
- mantenere il percorso GET-only;
- non introdurre decisioni draft, mutation o pubblicazione.

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

### 5. Azioni operative soltanto dopo i gap read-only

Ordine indicativo, una branch per capacità:

```text
decisione brief
→ conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni mutation richiede conferma esplicita, audit, idempotenza, reload dello stato e test end-to-end. La pubblicazione resta fuori scope.

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
- PR #49 — audit di parità legacy, mergiato nel commit `e0a39fa9` dopo CI #209 verde.

## Checkpoint in review

- PR #50 — linkage read-only claim → task; CI #211 in esecuzione.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation durante la chiusura dei gap read-only;
- nessuna rimozione della legacy finché resta un fallback operativo.
