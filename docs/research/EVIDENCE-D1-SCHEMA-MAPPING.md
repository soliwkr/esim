# Evidence → D1 schema mapping

Data: **6 agosto 2026**.

## Scopo

Questo documento definisce il mapping canonico fra il layer evidence verificato dalle PR #104, #106 e #107 e il D1 esistente di Senza Roaming.

Questa fase è **solo design**.

Non introduce:

```text
migration D1
write D1
ingest
Worker/API change
Workflow/scheduler
claim verification automatica
ranking
publication capability
deploy
```

Input reali del design:

```text
PR #106 — Italy local comparison evidence pack
PR #107 — Europe regional comparison evidence pack
```

Entrambi hanno prodotto due catture consecutive con raw identity distinta e semantic fingerprint invariato. Il caso regionale ha inoltre verificato `plan_type=regional`, aggregate country count, coverage `partial/unknown`, network country-scoped, source currency non uniforme e finite-data vs unlimited.

## 1. D1 esistente: cosa riusare e cosa non forzare

### `source_registry`

`source_registry` resta il registro canonico delle fonti.

Ruolo:

```text
source_registry = dove guardare
```

Non è uno snapshot e non deve duplicare raw artifact, locator o osservazioni storiche.

Il nuovo layer evidence deve referenziare `source_registry.id`.

### `claim_verifications`

`claim_verifications` resta il **current verified state** downstream.

La tabella è già sufficientemente generica per ospitare field strutturati perché usa:

```text
entity_type
entity_key
field_name
value_json
source_id
verification_status
confidence
checked_at
valid_until
```

Il design non richiede di rinominare i field esistenti né di convertire i nuovi field in colonne dedicate.

Una evidence candidate non diventa però una riga `claim_verifications` automaticamente.

### `editorial_claim_candidates`

Non è il target del nuovo evidence layer.

Motivo: è intenzionalmente brief-scoped e richiede:

```text
brief_id
claim_text
verification_question
workflow/editorial state
```

Serve a trasformare un brief accettato in requisiti fattuali atomici. Una osservazione commerciale può esistere prima e indipendentemente da qualsiasi brief.

Quindi:

```text
evidence claim candidate
!=
editorial_claim_candidates
```

Un futuro verifier potrà usare evidence candidates per risolvere un editorial claim, ma i due oggetti restano distinti.

### `plans`

La tabella `plans` v1 **non è un target di ingest evidence**.

Il suo contratto attuale richiede:

```text
destination_id NOT NULL
price_eur NOT NULL
unlimited boolean
single destination identity
UNIQUE(provider_id, destination_id, provider_plan_key)
```

Questo non rappresenta senza perdita i casi osservati:

- piano regionale con più Paesi;
- aggregate country count senza membership completa;
- prezzo source-native USD;
- `unknown` / `partial` / `not_applicable`;
- hotspot allowed separato dal share limit;
- network per-country;
- radio technology separata da network;
- unlimited + FUP strutturato.

È quindi vietato usare scorciatoie come:

```text
regional plan → duplicare una row per ogni Paese
Europe → creare una pseudo-destination country
USD 29 → price_eur=29
unknown hotspot cap → 0
unknown network → lista vuota interpretata come nessuna rete
```

`plans` resta legacy/catalog v1 finché una fase separata di materializzazione commerciale non ne ridisegna il contratto.

## 2. Layer canonico proposto

La catena diventa:

```text
source_registry
      ↓
evidence_snapshots
      ↓
evidence_field_observations
      ↓
evidence_claim_candidates
      ↓
verification gate separato
      ↓
claim_verifications
      ↓
editorial evidence bundle / readiness / draft
```

Il layer proposto aggiunge tre oggetti concettuali. In questa PR non vengono creati in D1.

## 3. `evidence_snapshots`

### Responsabilità

Una riga rappresenta una singola osservazione immutabile di una fonte registrata.

DDL progettuale:

```sql
CREATE TABLE evidence_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_key TEXT NOT NULL UNIQUE,
  source_id INTEGER NOT NULL,
  requested_url TEXT NOT NULL,
  final_url TEXT NOT NULL,
  redirect_chain_json TEXT NOT NULL DEFAULT '[]',
  fetched_at TEXT NOT NULL,
  http_status INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  capture_method TEXT NOT NULL,
  locale TEXT,
  currency_context TEXT,
  country_context TEXT,
  http_etag TEXT,
  http_last_modified TEXT,
  body_sha256 TEXT NOT NULL,
  visible_text_sha256 TEXT,
  byte_length INTEGER NOT NULL,
  artifact_location TEXT NOT NULL,
  parser_input_version TEXT NOT NULL,
  capture_warnings_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(source_id) REFERENCES source_registry(id)
);
```

`capture_method` iniziale:

```text
http_html
http_json
pdf
browser_rendered
manual_first_party_test
```

### Identità

Lo `snapshot_key` deve dipendere da almeno:

```text
source identity
canonical final URL
raw body hash
capture context rilevante
```

Il timestamp non sostituisce il content hash.

Due snapshot possono avere raw hash diversi e semantic evidence identica: è un caso valido e già verificato live.

### Immutabilità

Una volta inserita, una row non viene aggiornata per rappresentare una nuova cattura.

Una nuova cattura crea un nuovo snapshot.

`source_registry.content_hash`, `last_checked_at` e metadata correnti possono continuare a rappresentare lo stato operativo più recente della source, ma non sostituiscono lo storico evidence.

## 4. `evidence_field_observations`

### Responsabilità

Una row rappresenta l'esito deterministico dell'estrazione di **un field** da uno snapshot.

Serve anche a conservare correttamente field `unknown` e `not_applicable`, che non devono diventare candidate fattuali inventate.

DDL progettuale:

```sql
CREATE TABLE evidence_field_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observation_key TEXT NOT NULL UNIQUE,
  snapshot_id INTEGER NOT NULL,
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  provider_plan_key TEXT,
  field_name TEXT NOT NULL,
  scope_json TEXT NOT NULL DEFAULT '{}',
  coverage_state TEXT NOT NULL,
  raw_value_json TEXT NOT NULL DEFAULT 'null',
  normalized_value_json TEXT NOT NULL DEFAULT 'null',
  evidence_locator_json TEXT NOT NULL DEFAULT '{}',
  extractor_id TEXT NOT NULL,
  extractor_version TEXT NOT NULL,
  normalizer_version TEXT,
  schema_version INTEGER NOT NULL DEFAULT 1,
  source_role TEXT NOT NULL,
  extraction_confidence REAL,
  warnings_json TEXT NOT NULL DEFAULT '[]',
  observed_at TEXT NOT NULL,
  proposed_valid_until TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(snapshot_id) REFERENCES evidence_snapshots(id)
);
```

`subject_type` riusa il dominio già accettato:

```text
provider
destination
plan
device
page
policy
```

`coverage_state`:

```text
observed
partial
unknown
not_applicable
```

### Regola di valore

```text
observed → normalized value normalmente presente
partial → può avere un valore parziale realmente provato
unknown → nessun fatto mancante viene sintetizzato
not_applicable → assenza intenzionale per la forma del piano
```

Esempio regionale Airalo:

```json
{
  "field_name": "destination_coverage",
  "coverage_state": "partial",
  "normalized_value": {
    "scope": "regional",
    "region": "EUROPE",
    "declaredCountryCount": 41
  }
}
```

Il valore `41` è osservato; la membership di Italia, Francia e Spagna non lo è.

## 5. `evidence_claim_candidates`

### Responsabilità

Una candidate è la proposta fattuale inviata a un gate di verifica successivo.

Non duplica raw value, locator e provenance: li referenzia tramite `observation_id`.

DDL progettuale:

```sql
CREATE TABLE evidence_claim_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_key TEXT NOT NULL UNIQUE,
  observation_id INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  decision_actor TEXT,
  decision_notes TEXT NOT NULL DEFAULT '',
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(observation_id) REFERENCES evidence_field_observations(id)
);
```

Status del layer candidate:

```text
pending
accepted_for_verification
rejected_extraction
superseded
```

Sono intenzionalmente assenti:

```text
verified
published
winner
```

### Candidate eligibility

Una observation può generare candidate soltanto quando contiene un fatto supportato.

Regola iniziale:

```text
coverage_state=observed → candidate ammessa
coverage_state=partial  → candidate ammessa solo per il sotto-fatto realmente provato
coverage_state=unknown  → nessuna factual candidate
coverage_state=not_applicable → nessuna factual candidate
```

Il pack live segue già questa semantica: per esempio `destination_coverage.declaredCountryCount=41` può essere candidate `partial`, mentre la membership dei Paesi dello scenario non viene creata.

## 6. Identità del piano

La URL non è identità del piano.

Il caso Airalo Europa ha dimostrato:

```text
deep link storico
→ redirect
→ canonical store surface
```

Il subject canonico usa quindi una chiave repository-owned stabile:

```text
offerKey / subject_key
```

Esempi già verificati dagli extractor:

```text
airalo:europe:unlimited-15d
holafly:europe:unlimited-15d
ubigi:europe:25gb-30d
```

Regole:

- il prezzo non entra nell'identità;
- raw body hash non entra nell'identità del piano;
- source URL non è la chiave primaria del piano;
- `provider_plan_key` resta separato e nullable quando il provider espone un identificatore proprio affidabile;
- un cambio di prezzo o country count produce nuove observations sullo stesso subject, non un nuovo piano per default.

Una futura fase di catalog materialization potrà promuovere questi subject in un nuovo modello plan/offer; non è parte di questa PR.

## 7. Mapping dei field osservati

### `plan_type`

Value:

```json
{"type":"local","destination":"IT"}
```

o:

```json
{"type":"regional","region":"EUROPE"}
```

Non deriva dalla valuta o dalla locale.

### `destination_coverage`

Locale osservato:

```json
{"scope":"local","destination":"IT"}
```

Regionale aggregato:

```json
{"scope":"regional","region":"EUROPE","declaredCountryCount":41}
```

Quando una source prova membership country-specific, il valore può aggiungere:

```json
{
  "countries": {
    "IT":"observed",
    "FR":"observed",
    "ES":"unknown"
  }
}
```

`unknown` non equivale a `false`.

### `price`

```json
{"amount":29,"currency":"USD"}
```

La source currency viene preservata.

`price_eur` non viene popolato dall'evidence ingest.

Un futuro FX-derived datum deve avere fonte FX, timestamp, rate e provenance propri.

### `data_gb`

```json
{"quantity":25,"unit":"GB"}
```

Per un piano unlimited:

```text
data_gb = not_applicable
```

### `unlimited_policy`

```json
{"unlimitedLabel":true}
```

Non implica high-speed unlimited.

### `fair_use_policy`

Airalo:

```json
{
  "highSpeedThreshold":{"quantity":3,"unit":"GB","period":"24h"},
  "postThresholdSpeedMbps":1,
  "resetsEvery":"24h_from_activation"
}
```

Holafly partial:

```json
{
  "operatorFupMayReduceSpeed":true,
  "exactHighSpeedThreshold":null,
  "recovery":"next_day"
}
```

La null strutturale non viene trasformata in zero.

### `validity_days`

```json
{"duration":15,"unit":"day"}
```

Activation resta un field separato.

### `activation_policy`

```json
{"trigger":"arrival_and_esim_enabled"}
```

o:

```json
{"trigger":"covered_area_connection","purchaseWhileCovered":"immediate"}
```

Se non provata:

```text
coverage_state=unknown
```

### `hotspot_policy`

```json
{"allowed":true}
```

### `hotspot_share_limit`

Limite esplicito:

```json
{"quantity":1,"unit":"GB","period":"day"}
```

Oppure policy Airalo osservata:

```json
{"separateTetheringCapDeclared":false,"overallFupApplies":true}
```

`allowed=true` non sostituisce questo field.

### `network`

Locale:

```json
{"operators":["Vodafone Italy","WINDTRE"]}
```

Regionale country-scoped:

```json
{
  "byCountry": {
    "IT":["..."],
    "FR":["..."],
    "ES":["..."]
  },
  "completeness":"scenario_countries_only"
}
```

Non creare una lista piatta Europa quando l'attribuzione è per-country.

### `radio_technology`

```json
{"technologies":["4G LTE","5G"],"qualifier":"where_available"}
```

Resta separato da network e da performance osservata.

### `voice_sms_included`

```json
{"dataOnly":true,"nativeVoice":false,"nativeSms":false}
```

Viene emesso soltanto quando la source lo prova.

## 8. Mapping verso `claim_verifications`

Il verifier futuro riceve una o più `evidence_claim_candidates` e decide separatamente.

Mapping base:

```text
observation.subject_type → claim_verifications.entity_type
observation.subject_key  → claim_verifications.entity_key
observation.field_name   → claim_verifications.field_name
observation.normalized_value_json → claim_verifications.value_json
snapshot.source_id       → claim_verifications.source_id
verification decision    → verification_status/confidence/checked_at/valid_until
```

La candidate non decide:

```text
verification_status
confidence commerciale
publication eligibility
```

### Provenance del verification decision

Il D1 attuale non conserva ancora una relazione immutabile field-level fra una decisione `claim_verifications` e le evidence candidates che l'hanno sostenuta o contraddetta.

Prima di automatizzare il bridge va quindi progettato/implementato un audit append-only, preferibilmente con una relazione del tipo:

```text
claim verification decision/revision
↔ one or more evidence candidate ids
↔ relationship: supports | contradicts
```

Questa relazione è **fuori dalla prima migration upstream**. Non deve essere improvvisata aggiornando `evidence` con JSON opaco senza identità delle candidate.

## 9. `partial`, `unknown`, `not_applicable`: boundary D1

Questi stati appartengono all'osservazione evidence, non al boolean del fatto.

Esempi vietati:

```text
network unknown → operators=[] interpretato come "nessun operatore"
hotspot cap unknown → quantity=0
voice/SMS unknown → dataOnly=true
country membership unknown → false
```

Il verifier può ricevere soltanto il sotto-fatto realmente provato.

Per questo `coverage_state` deve essere first-class nel layer observation.

## 10. Freshness

`observed_at` deriva dallo snapshot.

`proposed_valid_until` è deterministico e non è una verifica.

Finestra iniziale coerente con i documenti esistenti:

```text
price: 3 giorni
plan data/validity/network: 7 giorni
hotspot/FUP: 7 giorni
help generica: 14 giorni
terms/refund: 14–30 giorni
```

Il verifier può accorciare la validità; non la estende automaticamente senza policy esplicita.

## 11. Raw drift vs semantic drift

Il database non deve usare `body_sha256` come proxy per claim changed.

Separazione:

```text
evidence_snapshots.body_sha256
!=
evidence_field_observations.normalized_value_json
```

Le due coppie di live capture #106 e #107 hanno già verificato che raw identity può cambiare con semantic fingerprint invariato.

Un monitor futuro può quindi:

1. creare un nuovo snapshot;
2. rieseguire extractor deterministico;
3. confrontare observations;
4. creare candidate nuove solo per semantic delta o nuova evidence rilevante;
5. non verificare automaticamente il claim.

## 12. Compatibilità con i gate editoriali

Il nuovo layer non cambia:

```text
brief acceptance
editorial_claim_candidates
claim verification gate
page_evidence_bundles
Page Readiness
draft approval
publication gate
```

Il flusso completo resta:

```text
commercial evidence pipeline
→ verified current claims
→ editorial claim resolution
→ evidence bundle
→ readiness
→ grounded draft
→ human publication gate
```

Un draft approvato non diventa published per effetto del nuovo schema.

## 13. Prima implementation slice raccomandata dopo questo design

Branch separata futura, scope esclusivo:

```text
migration locale/versionata delle sole tabelle upstream:
  evidence_snapshots
  evidence_field_observations
  evidence_claim_candidates

+ constraint/index
+ fixture D1 locale
+ zero runtime ingest
+ zero remote migration
```

Non includere nella stessa PR:

- fetch live;
- import dei pack;
- mutation di `claim_verifications`;
- maintenance queue;
- scheduler;
- redesign di `plans`;
- ranking;
- publication.

Dopo che lo schema upstream è provato localmente, una seconda branch può progettare/implementare un import idempotente pack → evidence tables.

## 14. Stop condition

Questo design è sufficiente quando:

1. ogni forma osservata nei pack Italia ed Europa ha una rappresentazione lossless;
2. nessun field richiede inferenza da locale/currency/destination adiacenti;
3. local e regional plan condividono lo stesso modello;
4. source-native price non richiede `price_eur`;
5. coverage `partial/unknown/not_applicable` è first-class;
6. network country-scoped non viene appiattito;
7. evidence candidate resta separata da editorial claim candidate;
8. `plans` v1 non viene usato come ingest target;
9. `claim_verifications` resta il current verified state downstream;
10. nessuna migration o runtime mutation è inclusa nella branch di design.
