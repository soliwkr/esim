# Research quality evaluation

Data di riferimento: **22 luglio 2026**.

## Obiettivo

Misurare il quality gate recent-demand contro decisioni editoriali umane prima di aggiungere classificatori, dipendenze o mutation operative.

Il quality gate di produzione resta deterministico e auditabile. Lo spike non modifica il Worker, D1, Workflow, Container, AI Gateway, Vertex AI o i contratti delle API.

## Metodo adottato nello spike

```text
fixture golden versionata
→ migrazioni D1 locali
→ inserimento dei segnali nel database reale di test
→ esecuzione del trigger canonico
→ confronto con label umane
→ confusion matrix in CI
```

Il dataset vive in:

```text
tests/fixtures/research-quality-golden.json
```

L'evaluator vive in:

```text
scripts/evaluate-research-quality-golden.mjs
```

Il comando è:

```bash
npm run db:migrate:local
npm run eval:research-quality
```

## Baseline caratterizzata

Il primo golden set contiene otto casi:

- risultato Shane Gillis con score zero;
- falso positivo semanticamente estraneo ma con score `0.2`;
- segnale Holafly rilevante con score `0.2`;
- segnale Holafly rilevante con score alto;
- segnale rilevante senza data;
- segnale rilevante fuori finestra;
- risultato con data futura;
- secondo risultato estraneo con score zero.

Baseline corrente:

```text
true positive:  3
false positive: 1
true negative:  4
false negative: 0
precision:       0.75
recall:          1.00
```

Il falso positivo residuo è intenzionale nella caratterizzazione: dimostra che il solo score positivo non basta a garantire il topic match.

Una modifica futura del gate deve aggiornare la baseline soltanto insieme a una motivazione editoriale e a nuovi casi di regressione. Il target immediato è:

```text
false positive: 1 → 0
false negative: 0 → 0
```

## Spike su framework OSS maturi

### Promptfoo

Repository: <https://github.com/promptfoo/promptfoo>

Punti a favore:

- Node.js e integrazione CI;
- dataset dichiarativi e assertion;
- adatto a prompt, modelli, agenti e grader semantici;
- esecuzione locale.

Decisione:

- **candidato principale quando il topic gate includerà un classificatore o un grader AI**;
- non adottato in questa PR perché il gate misurato è un trigger D1 deterministico e non esiste ancora un prompt o modello da confrontare;
- usarlo ora aggiungerebbe un wrapper e una dipendenza senza ridurre la complessità.

### Evidently

Repository: <https://github.com/evidentlyai/evidently>

Punti a favore:

- evaluation di dati testuali, classificazione e ranking;
- report, test suite e monitoraggio nel tempo;
- metriche personalizzabili.

Decisione:

- **candidato per reporting offline e drift quando il dataset etichettato crescerà**;
- non adottato ora perché introduce uno stack Python separato per otto casi e non migliora il trigger di produzione.

### Great Expectations

Repository: <https://github.com/great-expectations/great_expectations>

Punti a favore:

- Expectations mature per qualità e contratti tabellari;
- documentazione automatica dei risultati di validazione.

Decisione:

- non adottato per il topic gate corrente;
- i vincoli strutturali sono già verificati da migrazioni, parser runtime e smoke D1;
- non risolve autonomamente la pertinenza semantica titolo/query.

### Cleanlab

Repository: <https://github.com/cleanlab/cleanlab>

Punti a favore:

- rilevazione di label errate, outlier e duplicati;
- supporto per classificazione testuale e probabilità prodotte da modelli.

Decisione:

- rinviato finché non esistono un dataset etichettato più ampio e probabilità di classificazione;
- non è appropriato per un dataset iniziale di otto casi e un trigger senza modello.

## Decisione dello spike

Adottare adesso:

```text
golden dataset versionato
+ evaluator contro il D1 reale
+ confusion matrix bloccante in CI
```

Non adottare ancora:

```text
framework Python separato
servizio di monitoring
LLM-as-a-judge
classificatore semantico nel runtime
```

Questa non è una rinuncia ai framework comprovati. È una soglia di adozione esplicita:

- Promptfoo entra quando esiste una decisione semantica basata su prompt/modello;
- Evidently entra quando servono trend, drift e report su un corpus etichettato significativo;
- Cleanlab entra quando esistono probabilità di modello e volume sufficiente per cercare label errate;
- Great Expectations entra soltanto se nasce un vero data-quality layer multipipeline non già coperto da D1 e test runtime.

## Prossimo quality checkpoint

Branch prevista:

```text
feat/research-topic-mismatch-gate
```

Scope:

- definire anchor di dominio e token informativi della query;
- filtrare il falso positivo semanticamente estraneo ma con score positivo;
- mantenere il segnale Holafly rilevante con score `0.2`;
- non usare trend o community come prova commerciale;
- non modificare automaticamente brief, claim, bundle o draft esistenti;
- aggiungere eventuale backfill soltanto con regole auditabili;
- portare il golden set a zero falsi positivi senza introdurre falsi negativi.

Una fase successiva può sperimentare Promptfoo su un grader semantico, ma non prima che input, output, costo, fallback e soglia di successo siano formalizzati.
