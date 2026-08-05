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

Regola:

```text
shortest observed validity covering the 14-day scenario
without forcing isomorphic SKUs
```

Superfici ufficiali osservate per la prima implementazione:

```text
Airalo  → Europe unlimited / 15 days
Holafly → Europe unlimited / 15 days
Ubigi   → Europe 25GB / 30 days
```

Queste selezioni sono target del capture, non verità persistita. Restano da verificare nel live artifact della branch.

## Source allowlist

Il runner non accetta URL arbitrari.

### Airalo

Exact regional product page:

```text
https://www.airalo.com/europe-esim/eurolink-15days-unlimited
```

Unlimited Fair Use Policy:

```text
https://www.airalo.com/m/resources/unlimited-data-plans-fair-use-policy
```

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

PR #106 ha provato una destinazione locale.

Questo pack introduce deliberatamente la dimensione:

```text
plan_type = regional
```

e deve verificare che il truth layer possa rappresentare senza perdita:

```text
regional label
regional declared country count
scenario-country membership quando provata
per-country operator attribution
country-specific technology caveats
```

La domanda tecnica principale è:

> il modello di evidence che funziona per `destination=IT` resta corretto quando un singolo piano copre molti Paesi con operatori diversi?

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
42 countries
```

o:

```text
Europe
33 countries included
```

il normalized datum può conservare:

```json
{
  "scope": "regional",
  "region": "EUROPE",
  "declaredCountryCount": 42
}
```

ma la coverage dello scenario resta `partial` finché i Paesi richiesti non sono individuati nella source catturata.

Quando la source espone i singoli Paesi, il pack può provare soltanto quelli effettivamente localizzati.

Missing evidence non diventa `false`.

## Network boundary

Un operatore regionale piatto sarebbe un modello scorretto quando gli operatori cambiano per Paese.

Per una source che espone la tabella per-country, il target è una struttura del tipo:

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

Questo non dichiara completa la rete europea del provider. La coverage resta `partial` se vengono normalizzati soltanto i tre Paesi dello scenario.

```text
network operator statement
!=
radio technology
!=
observed performance
```

Nessuno dei tre alimenta un performance score.

## Currency boundary

La valuta resta quella della source.

La prima implementazione si aspetta di poter osservare contesti non uniformi, per esempio:

```text
Airalo  → USD
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

Airalo e Holafly possono esporre un'etichetta unlimited con FUP applicabile.

Ubigi può soddisfare lo scenario tramite un piano finite-data con validità più lunga.

Il pack conserva quindi separatamente:

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

L'uso di WhatsApp, FaceTime o altre app via dati non equivale a voice/SMS nativi inclusi.

## Artifact contract

Come PR #106:

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

`ranking.status` resta sempre:

```text
not_computed
```

## Smoke CI

Comando:

```text
npm run smoke:europe-regional-evidence-pack
```

È network-free e prova almeno:

- scenario Europe / IT+FR+ES / 14 giorni;
- tre provider e sei source;
- `plan_type=regional`;
- source currency preservata;
- regional country count non promosso a scenario membership;
- Ubigi network country-scoped per IT/FR/ES;
- finite vs unlimited preservato;
- hotspot allowed separato dal share limit;
- voice/SMS data-only soltanto quando provato;
- candidate sempre `pending`;
- nessun `price_eur`;
- nessun winner;
- raw drift non semantico → zero provider changes;
- cambio prezzo → semantic delta del solo provider interessato;
- coverage table assente → `unknown`, non falso;
- capture window > 10 minuti → fail closed;
- redirect off-host → fail closed;
- artifact create-only.

## Comando live

Solo dopo CI verde:

```text
npm run evidence:europe-regional-pack
```

Il live capture non è parte della CI.

Come per #106, eventuali mismatch fra fixture e source reale vengono trattati come hardening evidence-driven:

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
- source_registry mutation;
- claim_verifications mutation;
- maintenance queue integration;
- Workflow o scheduler;
- crawler o discovery loop;
- browser automation production;
- partner credentials;
- FX conversion;
- performance measurement;
- score;
- provider winner;
- affiliate activation;
- public page generation;
- publication capability;
- deploy.

## Exit gate

La branch può chiudersi soltanto quando:

1. CI completa verde;
2. i sei URL ufficiali producono un pack reale entro la capture window;
3. i raw artifact e i locator sono coerenti;
4. tutte le factual candidate restano `pending`;
5. `plan_type=regional` deriva dalla source e non dal nome della branch;
6. regional country count non viene trasformato in membership non provata;
7. network regionali restano country-scoped quando la source lo richiede;
8. `unknown`, `partial` e `not_applicable` vengono preservati;
9. la valuta resta source-native;
10. `ranking.status=not_computed`;
11. una seconda cattura con `--compare` distingue raw drift da semantic drift.

## Stop condition dopo questo pack

Se il live checkpoint non rivela un difetto strutturale nuovo, l'esplorazione evidence si ferma qui.

Il passo successivo diventa una branch separata di:

```text
schema mapping / D1 design
```

Non un terzo pack per accumulare coverage marginale.

Il design successivo deve partire dalle forme osservate nei due pack reali:

```text
Italy local evidence pack
+
Europe regional evidence pack
→ canonical schema mapping
```
