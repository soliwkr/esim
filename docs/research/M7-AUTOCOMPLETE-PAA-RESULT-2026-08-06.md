# M7.1 — Autocomplete A–Z + PAA / Related Result

Data: **6 agosto 2026**.

## Obiettivo

Chiudere il gap lasciato esplicitamente aperto dalla PR #111:

```text
seed prioritari
→ Google Autocomplete base + a…z
→ People Also Ask
→ related searches
→ organic SERP shape
→ dedupe / ownership review
```

Questa è demand research. Non crea pagine, non autorizza claim commerciali e non modifica automaticamente keyword ownership.

## Capture principale

Workflow:

```text
SEO Demand Capture
run: 31121790996
head: 91c31fd53a4de666d74711a194e51a84e68449e1
```

Sorgente:

```text
Serper.dev
/autocomplete
/search
```

Contesto:

```text
gl=it
hl=it
location=Italy
```

Seed: **17**.

Sweep:

```text
seed
seed + a
...
seed + z
```

Request totali: **476**.

Risultato normalizzato:

```text
autocomplete rows:          3659
expanded unique queries:    2829
organic rows:                153
peopleAlsoAsk rows:            0
relatedSearches rows:          0
errors:                        0
```

Artifact normalizzato:

```text
name: seo-demand-capture-normalized
artifact id: 8974174736
sha256: 67387293e0b29d1cde0499d9daf5d3ddd16b9c8adb62ff256c7421067fa94e24
```

Artifact raw provenance:

```text
name: seo-demand-capture-raw
artifact id: 8974174775
sha256: de78b47f43415d0b3fd04e368e2957f8d1c267e516c1cdbbbb81ab6f9fcec031
```

La chiave `SERPER_API_KEY` è stata letta esclusivamente da GitHub Actions Secrets ed è risultata mascherata nei log. Nessun secret è stato persistito negli artifact.

## Diagnostic PAA / related

Il risultato PAA=0 non è stato interpretato automaticamente come parser failure.

È stato eseguito un diagnostic separato:

```text
SEO Demand Feature Diagnostic
run: 31122315355
head: 8f7b054587df7baf20710d5d38076d244dd2c1c4
```

Casi:

```text
control-us:                 q=google, gl=us, hl=en
best-esim-it:               q=migliore esim, gl=it, hl=it
best-esim-it-location:      q=migliore esim, gl=it, hl=it, location=Italy
europe-esim-it:             q=esim europa, gl=it, hl=it
how-esim-it:                q=come funziona esim, gl=it, hl=it
```

Risultato:

```text
control-us:
  organic=6
  relatedSearches=8
  peopleAlsoAsk=0

migliore esim IT:
  organic=9
  relatedSearches=0
  peopleAlsoAsk=0

migliore esim IT + location:
  organic=9
  relatedSearches=0
  peopleAlsoAsk=0

esim europa IT:
  organic=10
  relatedSearches=0
  peopleAlsoAsk=0

come funziona esim IT:
  organic=8
  relatedSearches=0
  peopleAlsoAsk=0
```

Interpretazione:

1. il parser `relatedSearches` è provato live perché il controllo US ha restituito otto righe;
2. le query italiane della capture corrente non espongono `relatedSearches` nella risposta live;
3. `peopleAlsoAsk` non è stato esposto nemmeno dal controllo US in questa capture;
4. PAA=0 viene quindi conservato come **zero-state osservato**, non riempito con domande sintetiche;
5. le domande raccolte in PR #111 da FAQ provider, SERP e community restano una source demand distinta e non vengono rinominate “PAA”.

Se in una capture futura Serper espone `peopleAlsoAsk`, il collector è già pronto a normalizzarlo.

## A–Z — ampiezza per seed

Riepilogo versionato:

```text
research/seo/m7-autocomplete-a-z-seed-summary-2026-08-06.csv
```

Suggestion uniche più ampie:

```text
holafly                  261
airalo                   261
esim iphone              260
esim usa                 253
esim hotspot             227
esim europa              223
esim albania             200
esim egitto              156
migliore esim            148
esim illimitata          144
esim giappone            135
esim thailandia          130
airalo vs holafly        125
esim turchia             124
esim svizzera            118
airalo recensioni         92
codice sconto holafly     49
```

Questi conteggi misurano **breadth di suggestion nella capture**, non volume mensile e non sono sommabili ai dati Planner.

## Implicazioni first-money

### 1. `/migliore-esim` resta il primo URL

Le base suggestions per `migliore esim` sono fortemente destination-oriented:

```text
migliore esim giappone
migliore esim per usa
migliore esim per egitto
migliore esim per la cina
migliore esim per turchia
migliore esim regno unito
migliore esim per albania
migliore esim per marocco
migliore esim per londra
```

Conseguenza:

- `/migliore-esim` deve rispondere alla scelta generica;
- deve instradare rapidamente verso scenario/destinazione;
- non deve assorbire le future pagine destination-specific;
- la scelta “migliore” va spiegata per scenario, non con winner universale.

La decisione #111 quindi **non viene invertita**.

### 2. `/esim-europa` viene rafforzata

Le suggestions Europe mostrano ripetutamente:

- unlimited / illimitato;
- quantità dati;
- durata (es. 15/30 giorni);
- prezzo / economicità;
- numero / chiamate;
- Svizzera e copertura multi-country.

Conseguenza per il brief:

```text
coverage
+ duration
+ data model
+ FUP/unlimited semantics
+ hotspot
+ voice/number availability when supported
+ source-native price
```

Devono essere dimensioni esplicite o `unknown`, non inferenze.

### 3. `/esim-usa` richiede evidence più ricca di quanto previsto

Su 253 suggestion uniche del seed USA, la capture contiene forti pattern su:

```text
calls / voice / local number
unlimited
data amount
7/10/15/30 day-style durations
Canada / Mexico / regional combinations
```

Il summary euristico conta:

```text
voice_number: 29
data_amount: 27
unlimited: 16
duration: 6
```

Conseguenza:

prima di costruire una USA money page completa, il truth-engine deve distinguere almeno:

```text
data-only
vs
voice/SMS/local number
```

ed evitare di assumere che ogni travel eSIM sia solo dati o che un numero sia incluso.

### 4. `esim hotspot` è un traffic/problem feeder serio

Il seed produce:

```text
227 suggestion uniche
219 con hotspot/tethering semantics
```

Pattern:

```text
hotspot not working
hotspot iphone/android
unlimited hotspot
hotspot Holafly/Airalo
hotspot device/router
5G hotspot
```

La SERP catturata è prevalentemente **how-to/support/problem-solving**, con pagine provider e guide tecniche.

Decisione:

- non promuovere automaticamente `/esim-hotspot` a money page primaria;
- trattarla come **candidate traffic/problem feeder**;
- una eventuale pagina dedicata deve aiutare su setup + plan limitations e poi portare alle pagine commerciali pertinenti;
- `hotspot allowed` e `hotspot share limit` restano fatti distinti nella Truth Engine.

### 5. Airalo e Holafly richiedono intent separation reale

Le A–Z per i provider espongono in modo ricorrente:

```text
come funziona / attivazione / installazione
non funziona / APN / assistenza / rimborso
hotspot
compatibilità device
recensioni
codice sconto
quanto costa
quando installare / quando si attiva
```

Conseguenza:

non costruire un unico “mega articolo Airalo” o “mega articolo Holafly”.

Ownership separata resta corretta:

```text
/airalo-come-funziona
/airalo-recensioni
/airalo-vs-holafly

/holafly-come-funziona
/holafly-recensioni
/codice-sconto-holafly
```

con cross-linking contestuale e nessuna duplicazione dell'intento.

### 6. `/esim-iphone` resta un feeder ad alta ampiezza

`esim iphone` produce **260 suggestion uniche** e il cluster è quasi interamente model/compatibility/setup-oriented:

```text
iPhone 11/12/13/14/15/16/17
Pro / Pro Max
XR / XS / SE
compatibili
setup / transfer
market/country variants
```

Conseguenza:

- manufacturer-first evidence;
- niente lista modello duplicata dentro ogni destination page;
- forte internal linking da compatibilità → destination/comparison pages.

### 7. Coupon Holafly è transactional ma freshness-sensitive

Le suggestions includono:

```text
10 / 15 / 20
influencer names
Black Friday
month/year variants
come usare
dove inserire
come ottenere
```

Conseguenza:

la pagina coupon può avere forte conversion intent, ma deve avere un freshness contract separato. Un codice scaduto non può restare come claim commerciale solo perché è presente in Autocomplete.

## Impatto sull'ordine #111

La capture **non giustifica da sola** un riordino meccanico della top-20.

Restano primi:

```text
1. /migliore-esim
2. /esim-europa
```

Nuovo candidate da tenere in review:

```text
/esim-hotspot → traffic/problem feeder, non money page primaria
```

La priorità di una nuova route richiede ancora:

```text
Planner / demand signal
+ SERP distinction
+ owner non-cannibalizzante
+ evidence readiness
+ commercial/internal-link value
```

## Artefatti versionati

```text
scripts/seo-demand-expand.py
research/seo/m7-autocomplete-paa-seeds.txt
research/seo/m7-autocomplete-a-z-seed-summary-2026-08-06.csv
docs/research/M7-AUTOCOMPLETE-PAA-EXPANSION.md
docs/research/M7-AUTOCOMPLETE-PAA-RESULT-2026-08-06.md
```

Gli artifact completi restano nelle GitHub Actions della capture. I raw body non vengono copiati in massa nel repository.

## Guardrail invariati

Autocomplete/PAA/related sono **demand evidence**.

Non sono:

- verità commerciale;
- prova di prezzo;
- prova di copertura;
- prova di performance;
- autorizzazione a pubblicare;
- autorizzazione a creare centinaia di pagine.

La pipeline resta:

```text
DEMAND
→ intent / owner / page brief

COMMERCIAL TRUTH
→ official evidence / verification / freshness

poi

page consumer-first
→ affiliate gate
→ manual production deploy
```
