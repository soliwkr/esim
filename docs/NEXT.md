# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **22 luglio 2026**.

## Now

### 1. Audit di parità con la Control Room legacy

Branch prevista:

```text
chore/control-room-legacy-parity-audit
```

Obiettivo esclusivo:

- confrontare ogni lettura della legacy con la nuova Control Room;
- verificare guardrail, errori, mobile, tastiera e percorsi Cloudflare Access;
- registrare eventuali gap residui senza ricostruire dati mancanti nel client;
- verificare in particolare il collegamento degli eventi audit a una specifica versione draft;
- rimuovere la legacy soltanto quando il fallback non è più necessario;
- non introdurre mutation durante l’audit.

### 2. Definition of Done dell’audit

Prima di proporre la rimozione della legacy devono risultare verificati:

- parità di tutte le letture operative necessarie;
- guardrail equivalenti o più forti;
- nessuna credenziale applicativa nel browser;
- Access fail-closed su shell e proxy;
- loading, errori parziali, retry, empty state, tastiera e mobile;
- snapshot e dettaglio draft come risorse indipendenti;
- nessun accesso diretto a D1;
- nessuna mutation o capacità di pubblicazione;
- smoke end-to-end verdi;
- fallback legacy non più necessario.

### 3. Verificare separatamente il topic-mismatch gate in produzione

La PR #46 è mergiata nel commit `215470ae` e la CI #188 è verde. Resta da confermare tramite il deploy automatico:

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

### 5. Azioni operative soltanto dopo la parità

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
- PR #47 — dettaglio draft completo GET-only, mergiato con CI #198 e verificato nel browser reale.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation durante audit di parità e verifica del topic-mismatch gate.