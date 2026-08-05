# Europe Regional Comparison Evidence Pack

Data: **5 agosto 2026**.

## Obiettivo

Verificare che il contratto evidence multi-provider chiuso con PR #106 generalizzi oltre il caso locale Italia prima di progettare mapping canonico o ingest D1.

Questo è deliberatamente l'ultimo evidence pack esplorativo previsto prima dello schema design, salvo che il capture live faccia emergere un nuovo difetto strutturale reale.

Il pack resta:

```text
read-only
bounded
artifact-first
candidate=pending
no ranking
no D1
no deploy
```

## Scenario bounded

```text
Region: Europe
Trip duration: 14 days
Scenario countries: Italy + France + Spain
Data use: high
Hotspot required: yes
Device assumptions: eSIM capable + unlocked
Providers: Airalo / Holafly / Ubigi
```

Gli Stati dello scenario servono a stressare coverage e network regionali. Non vengono usati per inventare membership in un piano che dichiara soltanto `Europe` o un numero aggregato di Paesi.

## Regola di selezione offerta

I cataloghi non sono isomorfi e non viene forzato uno SKU identico.

```text
shortest observed validity covering the 14-day scenario
without forcing isomorphic SKUs
```

Target bounded:

```text
Airalo  → Europe unlimited / 15 days
Holafly → Europe unlimited / 15 days
Ubigi   → Europe 25GB / 30 days
```

La selezione resta evidence-driven. Per Airalo il pacchetto viene individuato nella riga commerciale della store surface canonica, non tramite un deep link presunto stabile.

## Source allowlist

Il runner non accetta URL arbitrari.

### Airalo

Europe regional store surface:

```text
https://www.airalo.com/europe-esim
```

Unlimited Fair Use Policy:

```text
https://www.airalo.com/m/resources/unlimited-data-plans-fair-use-policy
```

Il deep link storico `.../eurolink-15days-unlimited` è stato osservato redirigere alla store surface canonica e non è più usato come source primaria.

### Holafly

Europe product page:

```text
https://esim.holafly.com/it/esim-europa/
```

Unlimited/FUP help:

```text
https://esim.holafly.com/it/faq/informazioni-sulle-esim/esim-con-traffico-dati-illimitato/
```

### Ubigi

Europe exact product page:

```text
https://cellulardata.ubigi.com/rates-and-coverage/europe-data-plans/europe-25gb-30-days/
```

SmartStart activation help:

```text
https://cellulardata.ubigi.com/help-center/faq/esim-data-plan/when-does-my-ubigi-data-plan-activate/
```

Totale:

```text
6 fixed official URLs
```

Nessun discovery crawler.

## Perché questo pack è diverso da Italy

PR #106 ha provato una destinazione locale. Questo pack introduce:

```text
plan_type = regional
```

e deve rappresentare senza perdita:

```text
regional label
regional declared country count
scenario-country membership quando provata
per-country operator attribution
country-specific technology caveats
```

La domanda principale è:

> il modello che funziona per `destination=IT` resta corretto quando un singolo piano copre molti Paesi con operatori diversi?

## Core field target

```text
plan_type
destination_coverage
price + source currency
fixed data OR unlimited + FUP
validity_days
activation_policy
hotspot_policy
hotspot_share_limit
network
radio_technology
voice_sms_included quando provato
```

Ogni factual candidate nasce:

```text
status = pending
```

## Destination coverage boundary

Il pack non applica:

```text
Europe
→ Italy + France + Spain = true
```

per inferenza.

Se una source espone soltanto:

```text
Europe
<N> Countries and Networks
```

o:

```text
Europe
<N> paesi inclusi
```

il normalized datum può conservare il conteggio realmente osservato:

```json
{
  "scope": "regional",
  "region": "EUROPE",
  "declaredCountryCount": 41
}
```

ma la coverage dello scenario resta `partial` finché i Paesi richiesti non sono individuati in evidence specifica.

Il conteggio non è hardcoded: è un fatto commerciale soggetto a drift. Missing evidence non diventa `false`.

## Airalo store-row boundary

La store surface può esporre più durate e più offerte. Il pack seleziona come unità una sola riga osservata:

```text
15 days + Unlimited GB + source price
```

Questo evita di associare la durata di un'offerta al prezzo di un'altra.

Il live hardening iniziale ha osservato:

```text
41 Countries and Networks
15 days Unlimited GB 44.50 €
```

La valuta resta EUR perché è quella servita dalla source catturata. La store surface non prova il trigger esatto di attivazione della riga selezionata, quindi `activation_policy` Airalo resta `unknown`.

Dettagli:

```text
docs/research/EUROPE-REGIONAL-EVIDENCE-PACK-LIVE-HARDENING.md
```

## Network boundary

Un operatore regionale piatto sarebbe scorretto quando gli operatori cambiano per Paese.

Per una source che espone la tabella per-country, il target è:

```json
{
  "byCountry": {
    "FR": ["..."],
    "IT": ["..."],
    "ES": ["..."]
  },
  "completeness": "scenario_countries_only"
}
```

I locator di membership Ubigi devono derivare dai blocchi di coverage/network attribuiti ai singoli Paesi, non da occorrenze generiche dei nomi nei menu o nello state globale della pagina.

```text
network operator statement
!=
radio technology
!=
observed performance
```

Nessuno dei tre alimenta un performance score.

## Currency boundary

La valuta resta quella della source osservata. Il live può produrre contesti non uniformi, per esempio:

```text
Airalo  → EUR
Holafly → EUR
Ubigi   → USD
```

Il pack non calcola:

```text
FX rate
price_eur derivato
cheapest provider
best value
```

Un futuro FX layer resta una decisione separata con source, timestamp, rate e provenance propri.

## Unlimited / finite data boundary

Airalo e Holafly possono esporre un'etichetta unlimited con FUP applicabile. Ubigi può soddisfare lo scenario tramite un piano finite-data con validità più lunga.

Il pack conserva separatamente:

```text
data_gb
unlimited_policy
fair_use_policy
high-speed threshold se provata
post-threshold behavior se provato
```

Non forza `unlimited` come requisito di equivalenza fra provider.

## Hotspot boundary

```text
hotspot allowed
!=
hotspot share limit
```

Un provider può provare data sharing senza provare un cap specifico o l'assenza di cap. In quel caso:

```text
hotspot_policy = observed
hotspot_share_limit = unknown
```

## Voice/SMS boundary

`voice_sms_included` viene emesso soltanto se la source ufficiale catturata prova il carattere data-only o una specifica inclusione.

L'uso di app via dati non equivale a voice/SMS nativi inclusi.

## Artifact contract

```text
research/evidence/packs/<timestamp>-<hash>/
  pack.json
  sources/
    airalo-europe-plan.html
    airalo-unlimited-fup.html
    holafly-europe-plan.html
    holafly-unlimited-faq.html
    ubigi-europe-plan.html
    ubigi-activation.html
```

Gli artifact restano locali, create-only e ignorati da Git.

Ogni source conserva:

```text
requested/final URL
redirect chain
fetchedAt
HTTP status
content type
locale
ETag / Last-Modified quando presenti
raw body hash
visible-text hash
byte length
```

La capture window massima resta 10 minuti.

## Semantic fingerprint

Il pack riusa il confine verificato con #104 e #106:

```text
raw HTML drift
!=
commercial semantic drift
```

`--compare` confronta provider-level semantic evidence, non i raw snapshot ID.

```text
ranking.status = not_computed
```

## Smoke CI

```text
npm run smoke:europe-regional-evidence-pack
```

Lo smoke network-free prova almeno:

- scenario Europe / IT+FR+ES / 14 giorni;
- tre provider e sei source;
- `plan_type=regional`;
- Airalo canonical store URL e riga 15-day ancorata;
- redirect storico Airalo verso la source canonica;
- source currency preservata;
- regional country count non promosso a scenario membership;
- Ubigi membership/network derivati da blocchi country-scoped;
- finite vs unlimited preservato;
- hotspot allowed separato dal share limit;
- voice/SMS data-only soltanto quando provato;
- candidate sempre `pending`;
- nessun `price_eur` o winner;
- raw drift non semantico → zero provider changes;
- cambio prezzo → delta del solo provider interessato;
- coverage table assente → `unknown`;
- capture window > 10 minuti → fail closed;
- redirect off-host → fail closed;
- artifact create-only.

## Live gate

Solo dopo CI verde:

```text
npm run evidence:europe-regional-pack
```

Il capture live non è parte della CI.

Ogni mismatch segue:

```text
observe real response
→ identify exact contract gap
→ bounded fix
→ fixture reproduces real representation
→ CI green
→ rerun live capture
```

Non vengono allargate regex o riempiti field alla cieca.

## Guardrail

Questa branch non introduce:

- D1 schema, migration o write;
- source_registry o claim_verifications mutation;
- Worker, Workflow o scheduler;
- crawler o discovery loop;
- browser automation production;
- partner credentials;
- FX conversion;
- performance measurement;
- score o provider winner;
- affiliate activation;
- public page generation;
- publication capability;
- deploy.

## Exit gate

La branch può chiudersi soltanto quando:

1. CI completa verde;
2. i sei URL ufficiali producono un pack reale entro la capture window;
3. raw artifact e locator sono coerenti;
4. tutte le factual candidate restano `pending`;
5. `plan_type=regional` deriva dalla source;
6. regional country count non diventa membership non provata;
7. network regionali restano country-scoped;
8. `unknown`, `partial` e `not_applicable` sono preservati;
9. la valuta resta source-native;
10. `ranking.status=not_computed`;
11. una seconda cattura con `--compare` distingue raw drift da semantic drift.

## Stop condition dopo questo pack

Se il live checkpoint non rivela un difetto strutturale nuovo, l'esplorazione evidence si ferma qui.

Il passo successivo diventa una branch separata di:

```text
schema mapping / D1 design
```

Il design deve partire dalle forme osservate nei due pack reali:

```text
Italy local evidence pack
+
Europe regional evidence pack
→ canonical schema mapping
```
