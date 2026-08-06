# M7.1 — Autocomplete + PAA Demand Expansion

Data di riferimento: **6 agosto 2026**.

## Scopo

Questa micro-slice completa il gap esplicitamente lasciato aperto dalla PR #111:

```text
complete Keyword Planner corpus
+ live SERP / FAQ / community questions
+ reproducible Google Autocomplete A–Z
+ People Also Ask
+ related searches
→ dedupe / cluster / ownership review
```

Non crea pagine e non modifica automaticamente keyword ownership.

## Perché una slice separata

PR #111 ha definito la mappa First Euro e l'ordine operativo 1→20, ma ha dichiarato correttamente che il raw Google Autocomplete A–Z non era stato acquisito in modo sistematico.

Questa branch aggiunge un collector riproducibile invece di retro-etichettare normali SERP come “autocomplete”.

## Collector

```text
scripts/seo-demand-expand.py
```

Input iniziale:

```text
research/seo/m7-autocomplete-paa-seeds.txt
```

Seed iniziali:

```text
migliore esim
esim europa
esim usa
esim giappone
esim egitto
esim turchia
esim albania
esim svizzera
esim thailandia
airalo
airalo recensioni
airalo vs holafly
holafly
codice sconto holafly
esim illimitata
esim hotspot
esim iphone
```

La lista è un input di ricerca, non una lista di URL autorizzati.

## Sorgente

Il collector usa Serper.dev tramite due endpoint:

```text
POST https://google.serper.dev/autocomplete
POST https://google.serper.dev/search
```

Con contesto iniziale:

```text
gl=it
hl=it
location=Italy
```

La chiave viene letta soltanto da:

```text
SERPER_API_KEY
```

Non viene:

- passata in argv;
- stampata;
- salvata negli output;
- versionata.

## Sweep Autocomplete

Per ogni seed:

```text
seed
seed + a
seed + b
...
seed + z
```

Opzionalmente:

```text
seed + 0
...
seed + 9
```

I digit non sono abilitati di default perché aumentano il costo e non sono necessari al primo passaggio.

Ogni suggestion conserva:

- seed;
- probe esatto;
- suffix;
- rank nella risposta;
- `gl` / `hl`;
- `captured_at`;
- riferimento al raw payload;
- SHA-256 del raw payload.

## PAA e related searches

Per ogni seed il collector esegue anche una query `/search` e normalizza:

```text
peopleAlsoAsk
relatedSearches
organic
```

Le PAA conservano quando disponibile:

- question;
- snippet;
- title sorgente;
- link sorgente;
- rank.

Le related searches conservano query e rank.

Gli organic results servono a verificare la forma della SERP e non vengono trattati come keyword demand automaticamente.

## Output locale

Per default:

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

Il raw serve alla provenance locale. Il commit successivo deve versionare soltanto output normalizzati / snapshot necessari, non secret o dump inutili.

## Esecuzione

Self-test offline:

```bash
python3 scripts/seo-demand-expand.py --self-test
```

Capture reale:

```bash
SERPER_API_KEY='...' python3 scripts/seo-demand-expand.py
```

La chiave non deve essere incollata in chat o commit. Se l'esecuzione viene portata in GitHub Actions, usare esclusivamente un repository secret e workflow manuale research-only.

## Costo query indicativo

Con 17 seed e sweep base + A–Z:

```text
27 autocomplete probe / seed
17 search request
= 476 request circa
```

Il numero reale di righe è indipendente dal numero di request perché ogni risposta può contenere più suggestion / PAA / related queries.

## Normalizzazione

`expanded-query-universe.csv` deduplica case-insensitive + whitespace-normalized e conserva:

- forma display;
- normalized query;
- source types (`autocomplete`, `paa`, `related`);
- seed che hanno prodotto la query.

Questa dedupe non è clustering semantico.

## Review successiva alla capture

La capture deve alimentare una review separata:

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
3. query con intent sovrapposto restano consolidate sotto un owner;
4. nuove page candidate richiedono SERP distinction + demand + evidence readiness;
5. provider/destination commercial facts restano soggetti alla Truth Engine;
6. autocomplete/PAA sono demand evidence, non commercial truth.

## Primo obiettivo

Prima di implementare definitivamente il copy SEO di `/migliore-esim`, verificare almeno:

```text
migliore esim
esim europa
airalo vs holafly
esim illimitata
esim hotspot
```

contro l'universo Autocomplete/PAA/related appena catturato.

Il risultato può:

- arricchire sezioni e FAQ;
- migliorare anchor/internal linking;
- cambiare la priorità relativa delle supporting pages;

ma non cambia automaticamente la decisione First Euro #111.

## Non-goals

- nessun deploy;
- nessuna mutation D1;
- nessuna remote migration;
- nessun importer evidence;
- nessun affiliate activation;
- nessun nuovo URL pubblico;
- nessun mass pSEO;
- nessun secret nel repository;
- nessuna pubblicazione automatica.
