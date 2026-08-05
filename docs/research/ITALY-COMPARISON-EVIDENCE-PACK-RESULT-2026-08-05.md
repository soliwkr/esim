# Italy Comparison Evidence Pack — risultato live

Data: **5 agosto 2026**.

## Esito

Lo spike read-only della PR #106 ha superato il gate live sui sei URL ufficiali bounded per lo scenario:

```text
Destination: Italy
Trip duration: 10 days
Data use: high
Hotspot required: yes
Device assumptions: eSIM capable + unlocked
```

Il risultato verifica il contratto:

```text
SOURCE
→ immutable EVIDENCE SNAPSHOT
→ deterministic field extraction
→ NORMALIZED DATUM
→ PENDING CLAIM CANDIDATE
```

senza D1 ingest, ranking, pubblicazione o deploy.

## Head e CI

Checkpoint verificato prima delle catture finali:

```text
PR: #106
branch: spike/italy-comparison-evidence-pack
head: 8adf3a64bb10f0a51b06e9a6cb76f9657a66533b
CI: #568
CI conclusion: success
```

La CI include gli smoke hardened emersi dai probe live:

- exact Airalo package page con prezzo EUR;
- Ubigi destination ancorata all'H1 canonico;
- network e radio technology Ubigi secondarie degradabili a `unknown` quando non catturate;
- SmartStart help con due locator indipendenti per arrival e purchase-while-covered.

## Prima cattura reale completa

Comando:

```text
npm run evidence:italy-pack
```

Output:

```text
Evidence pack: pack:sha256:9256b180cc820ce22dfc0351fca7c7bf2406fe5903a4909c5c43d0d53e0c1433
Artifact: research/evidence/packs/2026-08-05T14-45-41-382Z-9256b180cc82
Capture window: 3260 ms
Semantic fingerprint: sha256:ba819d051bb73a1690c64520c537579b04c0ad2d73cdb6626a2e6c655bf678f8
Ranking: not_computed
```

La directory locale contiene esattamente:

```text
pack.json
sources/airalo-italy-plan.html
sources/airalo-unlimited-fup.html
sources/holafly-italy-plan.html
sources/holafly-unlimited-faq.html
sources/ubigi-activation.html
sources/ubigi-italy-plan.html
```

Gli artifact restano locali e ignorati da Git; non vengono versionati nella PR.

## Candidate osservate

Tutte le candidate fattuali emesse dal pack hanno:

```text
status = pending
```

### Airalo

```text
destination_coverage: IT / local
validity_days: 10
price: 29 EUR
unlimited_policy: unlimited label observed
fair_use_policy: 3 GB / 24h high-speed threshold, then 1 Mbps
hotspot_policy: allowed
hotspot_share_limit: no separate tethering cap declared; overall FUP applies
network: Wind Tre, partial; 2 additional operators unresolved
```

Coverage non osservata pienamente:

```text
data_gb: not_applicable
network: partial
radio_technology: unknown
activation_policy: unknown
```

Il prezzo deriva dalla exact Italian package page e conserva la source currency EUR. Non viene creato un field derivato `price_eur`.

### Holafly

```text
destination_coverage: IT / local
validity_days: 10
price: 30.5 EUR
unlimited_policy: unlimited label observed
fair_use_policy: FUP may reduce speed; exact threshold unknown
activation_policy: arrival_and_esim_enabled
hotspot_policy: allowed
hotspot_share_limit: 1 GB / day
network: Vodafone Italy / WINDTRE
radio_technology: 4G LTE / 5G where available
```

Coverage non osservata pienamente:

```text
data_gb: not_applicable
fair_use_policy: partial
```

### Ubigi

```text
data_gb: 50 GB
validity_days: 30
price: 29 USD
destination_coverage: IT / local
hotspot_policy: allowed
activation_policy: covered_area_connection; purchaseWhileCovered=immediate
radio_technology: 3G / 4G / 5G declared for destination
```

Coverage non osservata pienamente:

```text
unlimited_policy: not_applicable
fair_use_policy: not_applicable
hotspot_share_limit: unknown
network: unknown
```

Il network resta `unknown` perché la exact product page prova l'Italia nell'H1 ma la secondary network table non era presente nella static capture finale. Nessun operatore viene sintetizzato per inferenza.

## Seconda cattura con semantic compare

Baseline:

```text
research/evidence/packs/2026-08-05T14-45-41-382Z-9256b180cc82/pack.json
```

Comando:

```text
npm run evidence:italy-pack -- --compare <baseline-pack.json>
```

Output:

```text
Evidence pack: pack:sha256:add5664ab7e2f03ab84560ffb20e5141a1bf096c8d0fcf77ba8807634f9be0a9
Artifact: research/evidence/packs/2026-08-05T14-50-32-953Z-add5664ab7e2
Capture window: 3126 ms
Semantic fingerprint: sha256:ba819d051bb73a1690c64520c537579b04c0ad2d73cdb6626a2e6c655bf678f8
Ranking: not_computed
Provider semantic changes: 0
```

I due pack ID sono diversi mentre il semantic fingerprint è identico.

Questo verifica nel pack multi-provider il confine:

```text
raw/source snapshot identity may change
≠
commercial semantic evidence changed
```

Nessun provider ha prodotto un semantic delta fra le due catture.

## Gate verificati

```text
CI completa verde: yes
6 official source artifacts: yes
capture window <= 10 min: yes
all factual candidates pending: yes
partial/unknown preserved: yes
Airalo inferred gaps filled: no
Holafly exact FUP threshold invented: no
Ubigi hotspot cap invented: no
source currency preserved: yes
ranking.status = not_computed: yes
second capture raw-vs-semantic distinction: yes
Provider semantic changes: 0
```

## Guardrail preservati

Lo spike non introduce:

- D1 schema, migration o write;
- source registry mutation;
- claim verification automatica;
- maintenance queue integration;
- Workflow o scheduler;
- crawler fleet;
- browser automation production;
- partner credentials;
- FX conversion;
- performance score;
- provider winner;
- affiliazioni;
- nuova pagina pubblica;
- publication capability;
- deploy.

## Decisione successiva

Il gate tecnico dello spike è chiuso.

Non viene scelto implicitamente il passo successivo dentro PR #106. Dopo il merge va aperto uno scope separato per **una sola** delle due direzioni già previste dal contratto dello spike:

```text
A) schema mapping / D1 design
oppure
B) ulteriore evidence pack
```

Non entrambe nella stessa branch.

La scelta deve partire dai gap rimasti osservati nel pack, in particolare:

- Airalo exact activation ancora `unknown`;
- Airalo expanded network list ancora `partial`;
- Holafly exact high-speed FUP threshold ancora `partial`;
- Ubigi hotspot share limit ancora `unknown`;
- Ubigi network table non stabile nella static capture;
- source currency non uniforme fra provider;
- destination/hotspot-share/radio-technology richiedono mapping canonico prima di qualsiasi ingest.
