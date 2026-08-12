# Evidence replacement candidate — review completa

Data: **12 agosto 2026**.

## Stato

La nuova coppia di evidence pack Italy + Europe è stata catturata integralmente dalle fonti ufficiali bounded, conservata come artifact GitHub e revisionata a livello di integrità raw, provenance e output semantico.

Il risultato è **candidate-only**:

```text
replacementApproved: false
r2Uploaded: false
d1Mutated: false
```

Questa review **non approva** i nuovi bundle come replacement dei raw pack storici #106/#107 e non autorizza upload R2 o controlled ingest.

## Base verificata

Capture eseguita da:

```text
main:     7ded3c2bdd4b61e8c09e490e485d5c5c091475bb
ops head: a4197ef10108f6762606eb9c270e2a354143cc23
run:      31623841563
job:      94205075398
result:   success
```

Il run era limitato a:

```text
official source network reads
Italy capture
Europe capture
semantic fingerprint comparison
GitHub artifact retention
```

Esplicitamente esclusi:

```text
replacement approval
R2 object upload / mutation
D1 mutation
claim verification writes
source_registry mutation
publication
affiliate activation
production deploy
```

## Artifact candidate

```text
name: evidence-replacement-capture-candidates
artifact id: 9152309259
size: 1,202,934 bytes
zip sha256: f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
created: 2026-08-12T17:41:13Z
expires: 2026-09-11T17:41:12Z
retention: 30 giorni
```

Il digest ZIP è stato ricalcolato sul file scaricato e coincide esattamente con il digest registrato da GitHub Actions.

La ZIP contiene esattamente **15 file**:

```text
12 raw HTML official source artifacts
2 pack.json
1 evidence-replacement-capture-summary.json
```

Per ciascun pack sono presenti esattamente sei raw source artifact.

## Raw integrity review

Verifiche effettuate sui 12 raw HTML:

```text
body sha256 vs pack metadata: 12/12 match
byte length vs pack metadata: 12/12 match
HTTP status: 12/12 = 200
redirect chain: 12/12 = 0
canonical requested/final URL: bounded official source identity preserved
visibleText sha256 recomputed: 12/12 match
```

Non sono stati usati source switch, browser fallback o bypass alternativi.

### Provenance field-level

Sono stati controllati i riferimenti `document_text` e `raw_html` delle candidate usando la stessa semantica di indicizzazione JavaScript UTF-16 del codice repository-owned.

Risultato:

```text
source/snapshot references resolved: yes
locator sourceKey/snapshotId consistency: yes
text/html anchors checked: exact
mismatch: 0
```

Una prima verifica esterna basata su indici Unicode code-point aveva fatto apparire un locator Ubigi off-by-one. Il controllo corretto con indici UTF-16, coerente con JavaScript, ha dimostrato che il locator era valido; nessun extractor change è stato necessario.

## Italy replacement candidate

Scenario:

```text
italy-10d-high-data-hotspot
```

Identity:

```text
pack id: pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
capture window: 2383 ms
semantic fingerprint: sha256:2e3d9aaa7e3540d92ff9752721980cd1f4bd2380530578e671e572061952b517
historical fingerprint: sha256:ba819d051bb73a1690c64520c537579b04c0ad2d73cdb6626a2e6c655bf678f8
historicalSemanticMatch: false
sources: 6
raw source files: 6
ranking: not_computed
```

Tutte le factual candidate restano `pending`.

### Airalo Italy — delta osservato

Storico #106:

```text
10 days
unlimited
29 EUR
```

Candidate 12 agosto 2026:

```text
10 days
unlimited
32 USD
```

Restano allineati ai risultati storici documentati:

```text
destination: IT / local
FUP: 3 GB / 24h high-speed threshold → 1 Mbps
hotspot: allowed
separate tethering cap: not declared; overall FUP applies
network: Wind Tre partial + 2 unresolved
radio technology: unknown
activation policy: unknown
```

Il cambio EUR → USD viene preservato source-native. Nessun FX o `price_eur` viene calcolato.

### Holafly Italy

Output corrente documentato:

```text
10 days
30.5 EUR
unlimited
FUP partial; exact threshold unknown
activation: arrival_and_esim_enabled
hotspot: allowed
share limit: 1 GB/day
network: Vodafone Italy / WINDTRE
radio: 4G LTE / 5G where available
```

Questi valori risultano allineati al checkpoint storico versionato #106.

### Ubigi Italy

Output corrente documentato:

```text
50 GB
30 days
29 USD
IT / local
hotspot: allowed
activation: covered_area_connection; purchase while covered = immediate
radio: 3G / 4G / 5G declared
hotspot share limit: unknown
network: unknown
```

Questi valori risultano allineati al checkpoint storico versionato #106.

## Europe replacement candidate

Scenario:

```text
europe-14d-multicountry-high-data-hotspot
```

Identity:

```text
pack id: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
capture window: 2036 ms
semantic fingerprint: sha256:f8e617f3e7f659edaddc121ec6df50cc50238308ebf5315c779b41a497c9eb11
historical fingerprint: sha256:efb5924eee13f0c2f2a17381cf823c7e78873ab53925842949525982e96dbb89
historicalSemanticMatch: false
sources: 6
raw source files: 6
ranking: not_computed
```

Tutte le factual candidate restano `pending`.

### Airalo Europe — delta osservato

Storico #107:

```text
Europe regional
41 countries declared
15 days
unlimited
44.5 EUR
```

Candidate 12 agosto 2026:

```text
Europe regional
41 countries declared
15 days
unlimited
49 USD
```

Restano allineati ai risultati storici documentati:

```text
FUP: 3 GB / 24h high-speed threshold → 1 Mbps
hotspot: allowed
separate tethering cap: not declared; overall FUP applies
destination coverage: partial
activation/network/radio/voice_sms: unknown
```

Il cambio EUR → USD viene preservato source-native. Nessun FX viene calcolato.

### Holafly Europe

Output corrente documentato:

```text
Europe regional
declaredCountryCount: 33
15 days
46.9 EUR
unlimited
FUP partial
activation: arrival_and_esim_enabled
hotspot: allowed
share limit: 1 GB/day
radio: 4G LTE / 5G where available
data-only; no native voice/SMS
network: unknown
```

Questi valori risultano allineati al checkpoint storico versionato #107.

### Ubigi Europe

Output corrente documentato:

```text
Europe regional
25 GB
30 days
29 USD
hotspot: allowed
activation: SmartStart / covered-area connection
radio: 3G / 4G / 5G with country-exception caveat
data-only
destination/network/share limit: unknown
radio coverage state: partial
```

Questi valori risultano allineati al checkpoint storico versionato #107.

## Limite del confronto storico

I raw pack originari #106/#107 non sono disponibili. Di conseguenza non viene dichiarato un byte-level diff o un `packSemanticDiff` eseguito direttamente contro i vecchi `pack.json`.

Il confronto dettagliato disponibile è fra:

```text
current complete candidate packs
+
versioned historical result documents #106/#107
```

I semantic fingerprint storici e correnti sono differenti. Il delta commerciale documentato e direttamente osservato riguarda Airalo price/currency; non viene usato questo fatto per affermare che ogni eventuale stringa interna non documentata dei vecchi pack fosse identica.

## Esito review

```text
complete Italy pack: yes
complete Europe pack: yes
raw artifacts: 12/12
raw hashes and sizes: verified
visible-text identities: verified
field-level provenance: verified
all factual candidates pending: yes
partial/unknown/not_applicable preserved: yes
ranking: not_computed
FX: none
R2 upload: none
D1 mutation: none
replacement approval: NO
```

## Gate successivo

La coppia è **ready for explicit replacement approval**, ma non ancora approved.

L'approvazione deve riferirsi esattamente a:

```text
run: 31623841563
artifact id: 9152309259
zip sha256: f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
Italy pack:  pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
Europe pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
```

Soltanto dopo l'approvazione replacement si può aprire un **nuovo gate separato** per lo staging create-only dei byte esatti nel bucket R2 locked.

Replacement approval non equivale ad autorizzazione R2 upload, controlled D1 ingest, claim verification, publication, affiliate activation o deploy.
