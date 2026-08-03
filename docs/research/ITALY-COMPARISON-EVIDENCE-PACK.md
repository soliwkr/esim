# Italy Comparison Evidence Pack

Data: **3 agosto 2026**.

## Obiettivo

Costruire il primo evidence pack simmetrico multi-provider senza trasformarlo in ranking, ingest o pubblicazione.

Scenario bounded:

```text
Destination: Italy
Trip duration: 10 days
Data use: high
Hotspot required: yes
Device assumptions: eSIM capable + unlocked
```

Lo scenario è un **perimetro di raccolta**, non uno score.

Il pack deve rispondere:

```text
per lo stesso scenario decisionale,
quali fatti possiamo osservare oggi
per Airalo / Holafly / Ubigi,
quali restano partial/unknown,
e da quale artifact proviene ogni valore?
```

## Non è un confronto vincitore

Il pack contiene per costruzione:

```json
{
  "ranking": {
    "status": "not_computed"
  }
}
```

Non calcola:

- score;
- best value;
- winner;
- cheapest;
- fastest;
- best coverage.

Il fatto che un provider copra più field non significa che sia migliore.

## Perché uno scenario invece dello stesso SKU

I cataloghi non sono isomorfi.

Per il caso Italia osservato il 3 agosto 2026:

- Airalo espone un piano unlimited da 10 giorni;
- Holafly permette un piano unlimited da 10 giorni;
- Ubigi espone il piano esatto già verificato da 50GB / 30 giorni.

Forzare tutti a `10 days / unlimited / stessa valuta` eliminerebbe offerte reali o introdurrebbe inferenze.

Il pack conserva invece l'opzione osservabile che soddisfa il perimetro di viaggio senza dichiararla vincente.

## Source allowlist

Il comando non accetta URL arbitrari.

### Airalo

Product/catalog surface:

```text
https://www.airalo.com/it/italy-esim/
```

Policy complementare:

```text
https://www.airalo.com/m/resources/unlimited-data-plans-fair-use-policy
```

### Holafly

Product page:

```text
https://esim.holafly.com/it/esim-italia/
```

Unlimited/FUP help:

```text
https://esim.holafly.com/it/faq/informazioni-sulle-esim/esim-con-traffico-dati-illimitato/
```

### Ubigi

Product page già usata da PR #104:

```text
https://cellulardata.ubigi.com/rates-and-coverage/italy-data-plans/italy-50gb-30-days/
```

Activation complementare:

```text
https://cellulardata.ubigi.com/help-center/faq/esim-data-plan/when-does-my-ubigi-data-plan-activate/
```

Totale:

```text
6 fixed official URLs
```

Nessun discovery crawling.

## Capture contract

Ogni source produce metadata separati:

```text
source key
provider
role
source audit key
requested URL
final URL
redirect chain
fetchedAt
HTTP status
content type
locale
ETag / Last-Modified se presenti
raw body SHA-256
visible-text SHA-256
byte length
```

I redirect possono restare soltanto negli host/path allowlisted della stessa source config.

La capture window completa deve essere <= 10 minuti.

Questo non garantisce simultaneità perfetta; definisce un limite verificabile al drift temporale fra provider.

## Artifact locale

```text
research/evidence/packs/<timestamp>-<pack-hash>/
  pack.json
  sources/
    airalo-italy-plan.html
    airalo-unlimited-fup.html
    holafly-italy-plan.html
    holafly-unlimited-faq.html
    ubigi-italy-plan.html
    ubigi-activation.html
```

La directory è ignorata da Git.

Gli artifact sono create-only e ogni raw body viene ricontrollato contro il suo SHA-256 prima della persistenza.

## Candidate contract

Ogni fatto osservato nasce:

```text
status = pending
```

con:

- provider;
- offer key;
- field name;
- raw value;
- normalized value;
- scope scenario/destination;
- evidence source + snapshot ID + locator;
- observedAt;
- extractor version;
- warnings.

Nessuna candidate viene scritta in D1 o trasformata in `claim_verification`.

## Coverage state

Ogni provider conserva separatamente lo stato dei field:

```text
observed
partial
unknown
not_applicable
```

Quindi un dato mancante non diventa `false`.

Esempio:

```text
Ubigi hotspot_policy = observed: data sharing allowed
Ubigi hotspot_share_limit = unknown
```

Questo impedisce l'inferenza:

```text
sharing allowed
→ unlimited hotspot
```

## Airalo — target dello spike

Offer key:

```text
airalo:italy:unlimited-10d
```

Target osservabili:

- destination Italy;
- 10 days;
- source price in USD;
- unlimited label;
- FUP 3GB high-speed per 24h + 1 Mbps after threshold, quando confermato dalla policy catturata;
- personal hotspot allowed;
- nessun separate tethering cap dichiarato dalla policy, senza confonderlo con high-speed unlimited;
- primary network Wind Tre.

Preservato come partial:

```text
network = Wind Tre + 2 additional unresolved
```

Preservato come unknown:

```text
radio technology
exact package activation policy
```

L'activation non viene derivata dal semplice fatto che l'eSIM possa essere installata in anticipo.

## Holafly — target dello spike

Offer key:

```text
holafly:italy:unlimited-10d
```

Target:

- destination Italy;
- 10-day row;
- source price in EUR;
- unlimited label;
- FUP possible / threshold unknown nella source complementare;
- activation on arrival + eSIM enabled;
- hotspot allowed;
- 1GB/day hotspot share limit;
- Vodafone Italy / WINDTRE;
- 4G LTE / 5G where available.

La frase 4G/5G resta:

```text
radio technology statement
```

non:

```text
observed performance
```

## Ubigi — target dello spike

Offer key:

```text
ubigi:italy:50gb-30d
```

I tre field già verificati da PR #104 vengono riusati tramite lo stesso extractor field-specific:

```text
data_gb = 50GB
validity_days = 30
price = source USD
```

Il pack aggiunge evidence per:

- destination Italy;
- SmartStart activation;
- immediate activation se acquistato già in covered area;
- data sharing allowed;
- Iliad / WindTre;
- 3G / 4G / 5G indicatori dichiarati.

Resta unknown:

```text
hotspot_share_limit
```

## Currency boundary

Il pack conserva la valuta sorgente.

Atteso dalla surface corrente:

```text
Airalo → USD
Holafly → EUR
Ubigi → USD
```

Non viene calcolata una valuta comune.

Non viene valorizzato `price_eur` a partire da USD.

Un eventuale FX layer richiede una decisione separata con:

- fonte FX;
- timestamp;
- rate;
- provenance;
- derivation semantics.

## FUP boundary

Il pack distingue:

```text
unlimited label
fair use policy
high-speed threshold
post-threshold behavior
hotspot share limit
```

Airalo e Holafly non vengono compressi in un boolean `unlimited=true` sufficiente alla comparazione.

## Network boundary

```text
operators[]
radio technologies[]
observed performance
```

sono tre concetti distinti.

Airalo può restare partial se la surface statica mostra soltanto `Wind Tre + 2 others`.

Unknown e partial sono risultati validi dello spike.

## Semantic fingerprint

Il pack calcola un fingerprint su:

```text
scenario
offer key
normalized candidate values
warnings
coverage states
ranking=not_computed
```

Non include gli snapshot ID raw.

Quindi:

```text
HTML noise → source snapshot changes
but same facts → same pack semantic fingerprint
```

`--compare` restituisce provider-level semantic changes senza proclamare quale valore sia migliore.

## Smoke CI

```text
npm run smoke:italy-comparison-evidence-pack
```

È completamente network-free.

Fixture sintetiche dimostrano:

- 3 provider presenti;
- scenario immutato;
- source currency preservata;
- Airalo unlimited/FUP/hotspot con activation unknown;
- Holafly 10-day EUR price, 1GB/day hotspot e FUP partial;
- Ubigi riuso 50GB/30d/USD + activation/network/technology;
- tutte le candidate `pending`;
- raw value obbligatorio;
- evidence locator obbligatorio;
- nessun `price_eur`;
- nessun winner;
- raw drift non semantico → zero provider semantic changes;
- cambio prezzo Holafly → semantic change soltanto Holafly;
- capture window >10 minuti → fail closed;
- path fuori repository → fail closed;
- redirect off-host → fail closed;
- artifact create-only.

## Comando live

Dopo CI verde:

```text
npm run evidence:italy-pack
```

Il live capture non è parte della CI.

Lo spike non è accettato finché i sei source artifact reali non sono stati ispezionati e i field/unknown risultano coerenti con le source osservate.

## Stop condition

Questa branch non introduce:

- D1 schema/change/write/migration;
- source registry mutation;
- claim verification mutation;
- maintenance queue;
- Workflow/scheduler;
- crawler/discovery loop;
- browser automation production;
- partner API credentials;
- FX conversion;
- performance measurement;
- provider score;
- provider winner;
- affiliate activation;
- public page generation;
- publication;
- deploy.

## Exit gate

Lo spike può chiudersi soltanto quando:

1. CI completa è verde;
2. live capture dei 6 URL termina entro la capture window;
3. raw hashes e locators sono coerenti;
4. le candidate restano `pending`;
5. Airalo partial/unknown non vengono riempiti per inferenza;
6. Holafly threshold FUP resta unknown se non provato dalla source;
7. Ubigi hotspot cap resta unknown se non provato;
8. currency resta source-native;
9. `ranking.status` resta `not_computed`;
10. una seconda capture può distinguere raw drift da semantic drift.

Solo dopo questo gate si decide il passo successivo: schema mapping/D1 design oppure un ulteriore evidence pack, ma non entrambi nello stesso scope.
