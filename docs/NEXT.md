# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **22 luglio 2026**.

## Now

### 1. Chiudere la PR #47 sul dettaglio draft completo read-only

Branch:

```text
feat/control-room-draft-detail-readonly
```

Obiettivo esclusivo:

- mantenere leggero lo snapshot aggregato;
- caricare il dettaglio soltanto quando l’operatore apre una versione;
- usare il GET backend esistente `editorial-draft-grounding`;
- mediare la richiesta con un proxy server-side sotto Cloudflare Access;
- mostrare corpo strutturato, FAQ, fonti e provenance field-level;
- mostrare lo stato reale della pagina materializzata;
- mantenere distinti stato draft, stato pagina e publication eligibility;
- non introdurre generation, review action, materializzazione, mutation o pubblicazione.

Architettura:

```text
inventario draft nello snapshot
→ apertura esplicita di una versione
→ GET /control-room-foundation/api/draft-detail?draftId=<id>
→ validazione Cloudflare Access
→ maintenance token soltanto server-side
→ GET backend esistente
→ contratto runtime separato
```

### 2. Definition of Done della PR #47

Prima del merge devono passare:

- TypeScript strict e build Astro;
- migrazioni, quality smoke e golden evaluation invariati;
- Container invariato;
- runtime `workerd` con Access e proxy GET-only;
- risposta anonima e JWT invalido rifiutati;
- `POST` rifiutato con `405` e `Allow: GET`;
- nessuna richiesta dettaglio prima dell’apertura;
- body, blocchi, FAQ, fonti HTTPS e provenance validati;
- corrispondenza tra inventario e dettaglio su ID, bundle, versione, slug e renderer;
- errore del dettaglio isolato senza cancellare lo snapshot;
- retry esplicito, tastiera e mobile;
- tutti gli smoke precedenti invariati;
- nessuna nuova dipendenza runtime;
- nessuna modifica a D1, Workflow, Container, AI Gateway, Vertex AI o backend editoriale;
- nessuna mutation o capacità di pubblicazione.

### 3. Conservare le separazioni editoriali

```text
approved draft ≠ published page
draft status ≠ materialized page status
materialized page review ≠ publication eligibility
preview read-only ≠ autorizzazione operativa
```

Il dettaglio mostra dati persistiti; non decide readiness, approvazione, materializzazione o pubblicazione.

### 4. Verificare separatamente il topic-mismatch gate in produzione

La PR #46 è mergiata nel commit `215470ae` e la CI #188 è verde. Resta da confermare tramite il deploy automatico:

- applicazione remota della migrazione `0019`;
- normalizzatore con anchor attivo sui nuovi run;
- nessun Workflow avviato automaticamente;
- nessun dato editoriale artificiale creato in produzione.

La verifica funzionale completa del gate avverrà sul primo nuovo run autorizzato. Non viene creato un run di prova soltanto per chiudere il checkpoint.

## Next

### 5. Audit di parità con la Control Room legacy

Branch prevista:

```text
chore/control-room-legacy-parity-audit
```

Obiettivo:

- confrontare ogni lettura della legacy con la nuova Control Room;
- verificare guardrail, errori, mobile, tastiera e percorsi Access;
- registrare eventuali gap residui;
- rimuovere la legacy soltanto quando il fallback non è più necessario;
- non introdurre mutation durante l’audit.

### 6. Azioni operative soltanto dopo la parità

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
- PR #46 — topic-mismatch gate mergiato, verifica remota ancora da chiudere.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation durante dettaglio draft e audit di parità.
