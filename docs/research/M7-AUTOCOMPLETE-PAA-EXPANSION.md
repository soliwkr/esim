# M7.1 — Autocomplete + PAA Demand Expansion

Data di riferimento: **6 agosto 2026**.

## Scopo

Questa micro-slice completa il gap lasciato esplicitamente aperto dalla PR #111:

```text
complete Keyword Planner corpus
+ live SERP / FAQ / community questions
+ reproducible Google Autocomplete A–Z
+ People Also Ask / related quando esposti
→ dedupe / cluster / ownership review
```

Non crea pagine e non modifica automaticamente keyword ownership.

## Collector

```text
scripts/seo-demand-expand.py
```

Input:

```text
research/seo/m7-autocomplete-paa-seeds.txt
```

Sorgente:

```text
Serper.dev
/autocomplete
/search
```

Contesto iniziale:

```text
gl=it
hl=it
location=Italy
```

Secret:

```text
SERPER_API_KEY
```

La chiave viene letta soltanto da environment/GitHub Actions Secret. Non viene passata in argv, stampata, salvata negli output o versionata.

## Sweep Autocomplete

Per ogni seed:

```text
seed
seed + a
seed + b
...
seed + z
```

I digit sono supportabili ma non inclusi nel primo passaggio per evitare costo senza necessità dimostrata.

Ogni suggestion conserva:

- seed;
- probe esatto;
- suffix;
- rank;
- `gl` / `hl`;
- `captured_at`;
- raw artifact reference;
- raw SHA-256.

## PAA / related / organic

Per ogni seed `/search` normalizza quando presenti:

```text
peopleAlsoAsk
relatedSearches
organic
```

Regola fondamentale:

```text
campo assente / lista vuota
≠
dato da inventare
```

La prima capture reale ha restituito PAA=0 e related=0 sulle query italiane. Un diagnostic separato ha provato `relatedSearches` su una query-control US, confermando che il parser non scarta il modulo quando viene restituito.

Il risultato completo è in:

```text
docs/research/M7-AUTOCOMPLETE-PAA-RESULT-2026-08-06.md
```

## Output locale

Default:

```text
research/local/m7-autocomplete-paa/<timestamp>/
```

`research/local/` è ignorata da Git.

Output:

```text
autocomplete.csv
people-also-ask.csv
related-searches.csv
organic-serp.csv
expanded-query-universe.csv
errors.csv
manifest.json
raw/autocomplete/*.json
raw/search/*.json
```

Il raw serve alla provenance locale. Nel repository vengono versionati collector, seed, result document e summary utile, non dump massivi senza review.

## Esecuzione

Self-test offline:

```bash
python3 scripts/seo-demand-expand.py --self-test
```

Capture locale:

```bash
SERPER_API_KEY='...' python3 scripts/seo-demand-expand.py
```

Workflow repository:

```text
SEO Demand Capture
```

è **manual-only (`workflow_dispatch`)** e usa esclusivamente GitHub Actions Secrets.

## Prima capture verificata

```text
run: 31121790996
requests: 476
seed: 17
autocomplete rows: 3659
expanded unique queries: 2829
organic rows: 153
PAA rows: 0
related rows: 0
errors: 0
```

## Normalizzazione

`expanded-query-universe.csv` deduplica case-insensitive + whitespace-normalized e conserva:

- forma display;
- normalized query;
- source types;
- seed che hanno prodotto la query.

Questa dedupe **non è clustering semantico**.

## Review

```text
expanded query
→ intent
→ parent topic
→ existing owner
→ support / section / FAQ / new-page candidate
→ cannibalization check
```

Regole:

1. una suggestion non crea automaticamente una route;
2. una PAA non diventa automaticamente FAQ;
3. query sovrapposte restano consolidate sotto un owner;
4. nuove page candidate richiedono SERP distinction + demand + evidence readiness;
5. provider/destination commercial facts restano soggetti alla Truth Engine;
6. autocomplete/PAA/related sono demand evidence, non commercial truth.

## Decisioni emerse

La capture non inverte la priorità:

```text
#1 /migliore-esim
#2 /esim-europa
```

Aggiunge invece:

- `/esim-hotspot` come candidate traffic/problem feeder, non money page primaria;
- voice/local-number come evidence requirement importante per `/esim-usa`;
- unlimited/duration/data/voice come dimensioni da esplicitare su `/esim-europa`;
- intent separation forte per Airalo/Holafly;
- conferma `/esim-iphone` come compatibility feeder.

## Non-goals

- nessun deploy;
- nessuna mutation D1;
- nessuna remote migration;
- nessun evidence importer;
- nessuna affiliate activation;
- nessun nuovo URL pubblico;
- nessun mass pSEO;
- nessun secret nel repository;
- nessuna pubblicazione automatica.
