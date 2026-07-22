# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **22 luglio 2026**.

## Now

### 1. Chiudere la PR #45 sul quality evaluation spike

Branch:

```text
spike/research-quality-evaluation
```

Obiettivo esclusivo:

- versionare un golden dataset di segnali revisionati;
- eseguire il trigger D1 canonico sui casi reali di test;
- misurare true positive, false positive, true negative e false negative;
- registrare precision e recall in CI;
- confrontare framework OSS maturi senza inserirli prematuramente nel runtime.

Baseline prevista:

```text
true positive:  3
false positive: 1
true negative:  4
false negative: 0
precision:       0.75
recall:          1.00
```

Il falso positivo noto è un risultato semanticamente estraneo con score positivo `0.2`. La PR #45 lo caratterizza ma non modifica il gate di produzione.

### 2. Conservare la separazione fra gate ed evaluation

```text
quality gate di produzione
≠
framework di evaluation
```

Regole:

- D1 continua a essere il confine deterministico corrente;
- il golden evaluator usa il database locale reale dopo le migrazioni;
- una baseline non trasforma un errore noto in comportamento desiderato;
- la label editoriale umana resta distinta dal comportamento corrente del trigger;
- nessun framework esterno entra nel Worker durante lo spike;
- nessun record editoriale reale viene modificato.

### 3. Criteri di adozione dei framework

#### Promptfoo

Candidato principale quando esisterà un prompt, modello o grader semantico da valutare in Node e CI.

#### Evidently

Candidato per report, trend e drift quando il corpus etichettato avrà dimensione significativa.

#### Great Expectations

Da adottare soltanto se nasce un data-quality layer multipipeline non già coperto da D1, parser runtime e smoke.

#### Cleanlab

Da rivalutare quando esisteranno probabilità di classificazione e un dataset abbastanza ampio da cercare label errate e outlier.

### 4. Definition of Done della PR #45

Prima del merge devono passare:

- TypeScript strict e build Astro;
- migrazioni locali;
- smoke `zero_relevance` esistente;
- golden evaluation contro il trigger D1 reale;
- confusion matrix uguale alla baseline registrata;
- build e smoke Container invariati;
- runtime `workerd` invariato;
- tutti gli smoke Chromium della Control Room invariati;
- nessuna nuova dipendenza runtime;
- nessuna migrazione D1;
- nessuna modifica a Worker, Workflow, Container, AI Gateway, Vertex AI o API;
- nessuna mutation o pubblicazione.

## Next

### 5. Ridurre il falso positivo topic-mismatch

Branch prevista:

```text
feat/research-topic-mismatch-gate
```

Target misurabile:

```text
false positive: 1 → 0
false negative: 0 → 0
```

Scope previsto:

- ricavare anchor informative dalla query;
- distinguere token di dominio da parole generiche come `recent`, `experience` e `review`;
- richiedere evidenza del topic nel titolo o nel summary prima dell'eligibility automatica;
- mantenere idoneo il segnale Holafly rilevante con score `0.2`;
- aggiungere un flag auditabile come `topic_mismatch` quando il gate blocca;
- non modificare automaticamente brief, claim, bundle o draft esistenti;
- backfill soltanto con scope esplicito e test di regressione.

L'eventuale uso di Promptfoo viene valutato in questa fase soltanto se viene introdotto un vero grader semantico. Non viene usato come wrapper decorativo attorno a regole deterministiche.

### 6. Riprendere la parità completa della Control Room

Dopo il quality checkpoint:

```text
feat/control-room-draft-detail-readonly
```

Obiettivo:

- corpo completo del draft;
- FAQ e fonti;
- provenance field-level;
- claim collegati ai campi;
- stato reale della pagina materializzata;
- proxy GET-only on demand sotto Cloudflare Access;
- nessuna mutation o pubblicazione.

Poi:

```text
chore/control-room-legacy-parity-audit
```

La legacy viene rimossa soltanto dopo parità funzionale verificata.

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

## Checkpoint completati

- PR #31 — sessione server-side e un solo login Access;
- PR #32 — overview e health;
- PR #34 — radar e brief;
- PR #36 — score zero filtrato con `zero_relevance`;
- PR #37 — claim, fonti e scadenze;
- PR #39 + #40 — Page Readiness ed evidence bundle;
- PR #42 — draft, preview e decisioni read-only;
- PR #44 — queue e audit read-only, CI #174 e verifica browser reale completate.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation durante quality evaluation e topic-mismatch gate.
