# Research quality evaluation

Data di riferimento: **22 luglio 2026**.

## Obiettivo

Misurare il quality gate recent-demand contro decisioni editoriali umane prima di aggiungere classificatori, dipendenze o mutation operative.

Il quality gate resta deterministico e auditabile. Evaluation e runtime sono separati:

```text
quality gate di produzione
≠
framework di evaluation
```

## Metodo adottato

```text
fixture golden versionata
→ migrazioni D1 locali
→ inserimento dei segnali nel database reale di test
→ esecuzione del trigger canonico
→ confronto con label umane
→ confusion matrix in CI
```

File:

```text
tests/fixtures/research-quality-golden.json
scripts/evaluate-research-quality-golden.mjs
```

Comandi:

```bash
npm run db:migrate:local
npm run eval:research-quality
```

## Baseline PR #45

Il primo golden set contiene otto casi:

- risultato Shane Gillis con score zero;
- falso positivo semanticamente estraneo ma con score `0.2`;
- segnale Holafly rilevante con score `0.2`;
- segnale Holafly rilevante con score alto;
- segnale rilevante senza data;
- segnale rilevante fuori finestra;
- risultato con data futura;
- secondo risultato estraneo con score zero.

La PR #45 ha caratterizzato il gate precedente:

```text
true positive:  3
false positive: 1
true negative:  4
false negative: 0
precision:       0.75
recall:          1.00
```

Il falso positivo dimostrava che un punteggio positivo non garantisce la pertinenza con la query.

## PR #46 — Topic anchor gate

**Stato: implementata e in verifica.**

Il nuovo gate usa anchor informative deterministiche:

```text
query
→ normalizzazione Unicode e lowercase
→ rimozione di articoli, parole generiche e token troppo brevi
→ massimo otto anchor uniche
→ persistenza in research_runs.topic_anchors_json
→ verifica D1 su title + summary
```

Esempio:

```text
Holafly recent experiences
→ ["holafly"]
```

Parole come `recent`, `experience`, `review`, `problem` e `viaggio` non bastano a rendere un segnale pertinente.

Regola:

```text
anchor presenti nel run
+ nessun anchor in title o summary
→ eligible_for_editorial = 0
→ quality flag topic_mismatch
```

I run discovery persistono `[]` e non subiscono il filtro semantico deterministico. I run già esistenti ricevono il default `[]` e non vengono riclassificati o sottoposti a backfill.

### Risultato locale verificato

Migrazione, smoke D1, golden evaluation e ingest end-to-end in `workerd` sono verdi nella CI #183.

Golden set aggiornato:

```text
true positive:  3
false positive: 0
true negative:  5
false negative: 0
precision:       1.00
recall:          1.00
```

Il segnale estraneo con score `0.2` viene filtrato con `topic_mismatch`; il segnale Holafly rilevante con lo stesso score resta idoneo.

Questo risultato vale per il golden set versionato e non autorizza a generalizzare la precisione a tutto il web. Ogni nuovo errore reale deve diventare un caso revisionato nel dataset.

## Framework OSS valutati

### Promptfoo

Repository: <https://github.com/promptfoo/promptfoo>

Candidato principale quando esisterà un prompt, modello o grader semantico da confrontare in Node e CI. Non viene usato come wrapper decorativo attorno al trigger deterministico.

### Evidently

Repository: <https://github.com/evidentlyai/evidently>

Candidato per report, trend e drift quando il corpus etichettato avrà dimensione significativa. Non viene introdotto ora perché richiederebbe uno stack Python separato senza migliorare il trigger corrente.

### Great Expectations

Repository: <https://github.com/great-expectations/great_expectations>

Da adottare soltanto se nasce un data-quality layer multipipeline non già coperto da D1, migrazioni, parser runtime e smoke.

### Cleanlab

Repository: <https://github.com/cleanlab/cleanlab>

Da rivalutare quando esisteranno probabilità di classificazione e un dataset abbastanza ampio da cercare label errate e outlier.

## Decisione

Adottato ora:

```text
golden dataset versionato
+ evaluator contro D1 reale
+ confusion matrix bloccante in CI
+ topic anchor gate deterministico
```

Non adottato ora:

```text
framework Python separato
servizio di monitoring
LLM-as-a-judge
classificatore semantico nel runtime
```

Promptfoo entra soltanto quando input, output, costo, fallback e soglia di successo di un vero grader semantico sono formalizzati.

## Limiti e prossimo ampliamento

Il gate richiede almeno una corrispondenza letterale con un anchor informativo. Non comprende sinonimi, entità implicite o negazioni. Questi casi richiederanno nuovi esempi reali e, soltanto quando necessario, uno spike separato su un grader semantico.

La PR #46 non modifica automaticamente brief, claim, bundle o draft esistenti e non introduce pubblicazione.
