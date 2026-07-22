# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **22 luglio 2026**.

## Now

### 1. Chiudere la PR #46 sul topic-mismatch gate

Branch:

```text
feat/research-topic-mismatch-gate
```

Obiettivo esclusivo:

- estrarre anchor informative dai nuovi run research e comparison;
- rimuovere articoli, parole generiche e token troppo brevi;
- persistere gli anchor in `research_runs.topic_anchors_json`;
- filtrare i segnali senza alcuna corrispondenza in title o summary;
- aggiungere il flag auditabile `topic_mismatch`;
- mantenere invariati run esistenti, discovery, brief, claim, bundle e draft.

Target verificato localmente nella CI #183:

```text
true positive:  3
false positive: 0
true negative:  5
false negative: 0
precision:       1.00
recall:          1.00
```

Il risultato vale per il golden set versionato. Non viene presentato come misura universale della qualità del web.

### 2. Conservare le separazioni del gate

```text
score positivo ≠ pertinenza al topic
trend recente ≠ claim commerciale
anchor match ≠ verità fattuale
```

Regole:

- il gate decide soltanto l'idoneità del segnale al lavoro editoriale;
- non verifica prezzi, copertura, rete o condizioni commerciali;
- il match richiede almeno un anchor, non tutte le parole della query;
- low-positive pertinente resta idoneo con warning consultivo;
- run discovery usa anchor `[]` e non viene bloccato;
- nessun backfill dei run esistenti;
- nessuna mutation o pubblicazione.

### 3. Definition of Done della PR #46

Prima del merge devono passare:

- TypeScript strict e build Astro;
- migrazione D1 `0019`;
- smoke score zero e topic mismatch;
- golden evaluation con `0 FP` e `0 FN`;
- ingest end-to-end attraverso l'API in `workerd`;
- segnale estraneo score `0.2` filtrato;
- segnale Holafly score `0.2` ancora idoneo;
- Container invariato;
- tutti gli smoke Chromium della Control Room invariati;
- nessuna nuova dipendenza runtime;
- nessuna modifica a Workflow, Container, AI Gateway o Vertex AI;
- nessuna modifica automatica a brief, claim, bundle o draft;
- nessuna capacità di pubblicazione.

### 4. Verifica dopo il merge

Il deploy deve:

- applicare la migrazione remota `0019`;
- mantenere i run esistenti con anchor `[]`;
- distribuire il normalizzatore per i nuovi run;
- non avviare automaticamente un nuovo Workflow;
- non creare dati editoriali di prova in produzione.

La verifica funzionale completa avverrà sul primo nuovo run autorizzato. Fino ad allora si verifica deploy, migrazione e assenza di regressioni, senza produrre segnali artificiali.

## Next

### 5. Completare il dettaglio draft read-only

Branch prevista:

```text
feat/control-room-draft-detail-readonly
```

Obiettivo:

- corpo strutturato completo;
- sezioni, FAQ e fonti;
- provenance field-level;
- claim collegati ai campi;
- stato reale della pagina materializzata;
- proxy GET-only on demand sotto Cloudflare Access;
- separazione fra draft approved, pagina review e publication gate;
- nessuna mutation o pubblicazione.

### 6. Audit di parità e rimozione legacy

```text
chore/control-room-legacy-parity-audit
```

La legacy viene rimossa soltanto quando ogni lettura necessaria e ogni guardrail sono presenti e verificati end-to-end.

### 7. Mutation operative soltanto dopo la parità

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
- PR #45 — golden quality evaluation e criteri di adozione framework.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation durante il topic-mismatch gate.
