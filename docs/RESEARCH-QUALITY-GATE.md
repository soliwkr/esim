# Quality gate dei segnali recenti

Il radar della domanda conserva i risultati del motore di ricerca, ma non considera automaticamente ogni risultato una prova di domanda recente.

## Perché esiste

I motori di ricerca possono restituire:

- contenuti vecchi ma ancora molto popolari;
- video sponsorizzati o con coupon;
- risultati con bassa o nulla rilevanza;
- fonti isolate senza corroborazione;
- date mancanti o incoerenti;
- contenuti estranei associati a una query o a un topic sbagliato.

Questi elementi possono essere utili come contesto, ma non devono entrare silenziosamente nella coda editoriale prioritaria.

## Regole dure

Le migrazioni del quality gate aggiungono e mantengono:

- `freshness_days`;
- `quality_flags_json`;
- `eligible_for_editorial`;
- conteggi `eligible_count` e `filtered_count` per ogni run.

Un segnale viene filtrato automaticamente quando:

```text
età del contenuto > finestra dichiarata + 7 giorni
oppure
la data risulta oltre 2 giorni nel futuro
oppure
relevance_score = 0
```

Il margine di sette giorni assorbe ritardi di indicizzazione e differenze di fuso orario.

Un relevance score esattamente pari a zero è un'indicazione esplicita dell'upstream che il risultato non è pertinente alla query. Il record viene conservato per audit, ma riceve il flag `zero_relevance` e non alimenta il lavoro editoriale prioritario.

La regola non tratta allo stesso modo:

- `0 < relevance_score < 0,35`: resta idoneo ma riceve il warning `low_relevance`;
- `relevance_score IS NULL`: non viene filtrato automaticamente, perché alcuni run discovery non producono uno score numerico.

Il database applica le regole dure tramite trigger D1. Il gate resta quindi attivo anche se un vecchio Worker o un import manuale non valorizza correttamente i campi di qualità.

## Flag consultivi

L'API aggiunge inoltre flag che aiutano la revisione:

- `missing_published_at`;
- `zero_relevance`;
- `low_relevance`;
- `uncorroborated`;
- `promotional_or_sponsored`;
- `outside_recent_window`;
- `future_dated`;
- `manual_quality_override`.

`zero_relevance`, `outside_recent_window` e `future_dated` corrispondono a condizioni bloccanti salvo override deliberato. Gli altri flag sono consultivi.

Un contenuto sponsorizzato può ancora rivelare una domanda reale, ma non deve essere trattato come prova neutrale.

## Consultazione

Per impostazione predefinita l'endpoint restituisce soltanto i segnali idonei:

```http
GET /api/maintenance/research-signals?status=new&eligibility=eligible&limit=30
```

Per vedere ciò che il gate ha escluso:

```http
GET /api/maintenance/research-signals?status=new&eligibility=filtered&limit=30
```

Per vedere entrambi:

```http
GET /api/maintenance/research-signals?status=new&eligibility=all&limit=30
```

Riepilogo per la dashboard:

```http
GET /api/maintenance/research-quality-summary?limit=10
```

## Azioni e override

Un segnale filtrato può essere marcato `reviewed` o `dismissed`, ma D1 impedisce che diventi direttamente `accepted` o `converted`.

L'override deve essere deliberato e accompagnato da una motivazione operativa. L'override:

1. ripristina l'idoneità editoriale;
2. aggiunge il flag `manual_quality_override`;
3. aggiorna i conteggi del run;
4. conserva la nota del revisore.

L'override non cancella gli altri quality flag: rende visibile che un operatore ha scelto di procedere nonostante il gate.

## Regressione obbligatoria

La CI inserisce un risultato recente con:

```text
query: Holafly recent experiences
contenuto: esperienza a uno spettacolo comico ad Austin
relevance_score: 0
```

Il test richiede:

```text
eligible_for_editorial = 0
quality_flags contiene zero_relevance
eligible_count = 0 per quel segnale
filtered_count incrementato
```

Un secondo record con score positivo ma inferiore a `0,35` resta idoneo, dimostrando che la correzione non trasforma ogni warning di bassa rilevanza in un blocco duro.

## Confine di fiducia

Il quality gate stabilisce soltanto se un segnale è utilizzabile come intelligence editoriale recente.

Non trasforma mai Reddit, YouTube o altri risultati sociali in una fonte verificata per:

- prezzi;
- dati inclusi;
- durata;
- rete;
- hotspot;
- fair use;
- rimborsi;
- copertura.

Questi claim continuano a richiedere una fonte ufficiale nel registro di verifica commerciale.
