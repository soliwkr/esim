# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **23 luglio 2026**.

## Now

### 1. Checkpoint decisione brief completato

PR #54 è mergiata nel commit `15ea0445`. La CI finale #237 e il checkpoint produttivo #244 attestano:

- migrazione remota `0020` registrata;
- state machine e audit append-only presenti in D1;
- Access e snapshot operativi;
- UI reale con guardrail e empty state;
- pagine pubblicate e stati brief invariati;
- automazione di pubblicazione disabilitata;
- zero richieste browser non-GET;
- zero decisioni su brief reali.

La capacità è disponibile soltanto per futuri brief `proposed`. Conversione, claim, readiness, bundle, draft, materializzazione, queue retry, pubblicazione e rimozione della legacy restano escluse.

### 2. Verificare i linkage read-only nel browser reale

Da controllare dietro Access:

- claim con badge `task #<id>` e stato task;
- evento audit con `event_key` stabile;
- evento draft con ID e versione separati;
- eventi non-draft senza linkage draft;
- mobile, tastiera e Sheet reali.

Le CI #213 e #220 coprono contratti, D1 locale, `workerd`, desktop e mobile automatizzati.

### 3. Verificare separatamente il topic-mismatch gate

La PR #46 è mergiata nel commit `215470ae` e la CI #188 è verde. Restano:

- conferma del normalizzatore con anchor attivo sui nuovi run;
- osservazione del primo nuovo run autorizzato;
- nessun Workflow avviato automaticamente;
- nessun dato editoriale artificiale creato per il test.

La verifica funzionale completa avverrà sul primo nuovo run autorizzato.

## Separazioni editoriali

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

Dopo il checkpoint documentale e mantenendo una branch separata:

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
- PR #45 — golden quality evaluation;
- PR #46 — topic-mismatch gate mergiato; stack remoto allineato, verifica funzionale sul prossimo run aperta;
- PR #47 — dettaglio draft completo, CI #198 e verifica browser reale;
- PR #49 — audit legacy, merge `e0a39fa9`, CI #209;
- PR #50 — claim → task, merge `41a9beee`, CI #213;
- PR #52 — audit → versione draft, merge `35f56e82`, CI #220;
- PR #54 — decisione brief, merge `15ea0445`, CI #237 e checkpoint produttivo #244.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- ogni nuova mutation richiede una nuova branch e uno scope esclusivo;
- nessuna rimozione della legacy finché resta un fallback operativo.
