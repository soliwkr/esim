# Evidence → D1 schema mapping

Data: **6 agosto 2026**.

## Obiettivo

Definire il mapping canonico fra il layer evidence verificato live e il D1 esistente di Senza Roaming, prima di qualsiasi migration o ingest.

Input reali:

```text
PR #104 — single-source immutable snapshot spike
PR #106 — Italy local comparison evidence pack
PR #107 — Europe regional comparison evidence pack
```

I pack #106 e #107 sono stati catturati due volte ciascuno. In entrambi i casi raw identity differenti hanno prodotto semantic fingerprint invariato e `Provider semantic changes: 0`.

Questa PR è **design-only**.

Non introduce:

```text
migrations/0021*
D1 write locale o remoto
pack import
source_registry mutation
claim_verifications mutation
Worker/API
Workflow/scheduler
ranking
publication capability
deploy
```

## 1. Principio architetturale

La catena target è:

```text
source_registry
      ↓
evidence_capture_runs
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
editorial claim resolution / evidence bundle / readiness / draft
      ↓
human publication gate separato
```

I primi quattro oggetti dopo `source_registry` sono upstream commercial evidence. Non sono editorial draft state e non sono fatti verificati.

## 2. D1 esistente: cosa riusare

### `source_registry`

Resta il registro canonico delle fonti:

```text
source_registry = dove guardare
```

Non dimostra cosa mostrava una pagina in un dato momento e non sostituisce gli snapshot immutabili.

Ogni futuro snapshot D1 deve referenziare una `source_registry.id` già riconciliata e approvata. Nessun importer può auto-registrare URL arbitrari.

Dettagli:

```text
docs/research/EVIDENCE-SOURCE-RECONCILIATION.md
```

### `claim_verifications`

Resta il **current verified factual state** downstream.

Il contratto esistente è adatto a valori strutturati grazie a:

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

Una candidate evidence non diventa automaticamente `claim_verifications`.

`verification_status='verified'` significa che il valore specifico è stato verificato; non significa che un field composito sia completo. Eventuali qualifier di completezza (`partial`, `declared`, `scenario_countries_only`, ecc.) devono restare nel valore strutturato quando semanticamente rilevanti.

### `page_evidence_bundles` e gate editoriali

Restano downstream e invariati.

Il nuovo layer non modifica:

```text
brief acceptance
editorial claim verification
page readiness
draft approval
publication gate
```

## 3. D1 esistente: cosa non forzare

### `editorial_claim_candidates`

Non è un evidence ingest target.

È intenzionalmente brief-scoped e richiede:

```text
brief_id
claim_text
verification_question
workflow/editorial state
```

Serve a trasformare un brief accettato in requisiti fattuali atomici.

Una osservazione commerciale può esistere prima e indipendentemente da qualsiasi brief.

```text
evidence_claim_candidate
!=
editorial_claim_candidate
```

Un futuro verifier può usare evidence candidates per risolvere editorial claims, ma i due oggetti non vengono fusi.

### `plans` v1

Non è un evidence ingest target.

Il contratto attuale richiede:

```text
destination_id NOT NULL
price_eur NOT NULL
unlimited boolean
single-destination identity
UNIQUE(provider_id, destination_id, provider_plan_key)
```

Non rappresenta senza perdita i casi live osservati:

- piano regionale multi-country;
- aggregate country count senza membership completa;
- prezzo source-native USD;
- coverage `partial`, `unknown`, `not_applicable`;
- hotspot allowed separato da share limit;
- network country-scoped;
- radio technology separata da operatori;
- unlimited + FUP strutturato;
- data-only / native voice-SMS.

Sono vietati workaround come:

```text
regional plan → duplicare una row per ogni Paese
Europe → pseudo-destination country
USD 29 → price_eur=29
unknown hotspot cap → 0
unknown membership → false
unknown network → [] interpretato come nessun operatore
```

`plans` resta catalog v1 finché una fase separata di commercial materialization non ne ridisegna il contratto.

## 4. `evidence_capture_runs`

### Perché serve

I pack #106/#107 non sono semplicemente sei fetch indipendenti. Conservano:

```text
scenario bounded
same capture window
pack identity
semantic fingerprint
optional compare baseline
```

Se D1 conservasse soltanto snapshot isolati perderebbe il contesto che rende riproducibile la selezione delle offerte e la comparazione temporale del pack.

### DDL progettuale

```sql
CREATE TABLE evidence_capture_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_key TEXT NOT NULL UNIQUE,
  pack_schema_version INTEGER NOT NULL,
  scenario_key TEXT NOT NULL,
  scenario_json TEXT NOT NULL CHECK(json_valid(scenario_json)),
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  capture_window_ms INTEGER NOT NULL CHECK(capture_window_ms >= 0),
  source_count INTEGER NOT NULL CHECK(source_count > 0),
  pack_sha256 TEXT NOT NULL,
  semantic_fingerprint TEXT NOT NULL,
  baseline_run_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

`run_key` è repository-owned e può coincidere con una forma content-addressed del pack.

`ranking.status=not_computed` non viene materializzato come fatto commerciale: il ranking resta fuori dal layer evidence.

### Immutabilità

Il run importato è un envelope storico. Non viene riscritto per rappresentare una cattura successiva.

Una nuova cattura crea un nuovo run.

## 5. `evidence_snapshots`

Una row rappresenta una singola osservazione immutabile di una fonte registrata all'interno di un capture run.

### DDL progettuale

```sql
CREATE TABLE evidence_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_key TEXT NOT NULL UNIQUE,
  capture_run_id INTEGER NOT NULL,
  source_id INTEGER NOT NULL,
  source_audit_key TEXT NOT NULL,
  requested_url TEXT NOT NULL,
  final_url TEXT NOT NULL,
  redirect_chain_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(redirect_chain_json)),
  fetched_at TEXT NOT NULL,
  http_status INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  capture_method TEXT NOT NULL CHECK(capture_method IN (
    'http_html','http_json','pdf','browser_rendered','manual_first_party_test'
  )),
  locale TEXT,
  currency_context TEXT,
  country_context TEXT,
  capture_context_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(capture_context_json)),
  http_etag TEXT,
  http_last_modified TEXT,
  body_sha256 TEXT NOT NULL,
  visible_text_sha256 TEXT,
  byte_length INTEGER NOT NULL CHECK(byte_length >= 0),
  artifact_ref TEXT NOT NULL,
  parser_input_version TEXT NOT NULL,
  capture_warnings_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(capture_warnings_json)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(capture_run_id) REFERENCES evidence_capture_runs(id),
  FOREIGN KEY(source_id) REFERENCES source_registry(id)
);
```

### `artifact_ref`

È un riferimento opaco a storage immutabile, non una decisione di storage.

Il design non sceglie ancora fra R2, altro object storage o un meccanismo equivalente.

Il body completo non deve essere duplicato come TEXT in D1 per forza.

Il riferimento deve essere risolvibile insieme al `body_sha256` prima che l'evidence venga usata per una verification decision.

### Snapshot identity

`snapshot_key` deve dipendere almeno da:

```text
source identity
canonical final URL
raw body hash
relevant capture context
```

Il timestamp non sostituisce il content hash.

Due snapshot possono avere raw hash diversi e semantic evidence identica: #104, #106 e #107 hanno già verificato questa possibilità.

## 6. `evidence_field_observations`

Una row rappresenta l'esito deterministico dell'estrazione di **un field** da uno snapshot.

Conserva anche `unknown` e `not_applicable`, che sono stato dell'evidence e non false assertion.

### DDL progettuale

```sql
CREATE TABLE evidence_field_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observation_key TEXT NOT NULL UNIQUE,
  snapshot_id INTEGER NOT NULL,
  subject_type TEXT NOT NULL CHECK(subject_type IN (
    'provider','destination','plan','device','page','policy'
  )),
  subject_key TEXT NOT NULL CHECK(length(trim(subject_key)) > 0),
  provider_plan_key TEXT,
  field_name TEXT NOT NULL CHECK(length(trim(field_name)) > 0),
  scope_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(scope_json)),
  coverage_state TEXT NOT NULL CHECK(coverage_state IN (
    'observed','partial','unknown','not_applicable'
  )),
  raw_value_json TEXT NOT NULL DEFAULT 'null' CHECK(json_valid(raw_value_json)),
  normalized_value_json TEXT NOT NULL DEFAULT 'null' CHECK(json_valid(normalized_value_json)),
  evidence_locator_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(evidence_locator_json)),
  extractor_id TEXT NOT NULL,
  extractor_version TEXT NOT NULL,
  normalizer_version TEXT,
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK(schema_version >= 1),
  source_role TEXT NOT NULL,
  extraction_confidence REAL CHECK(
    extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1)
  ),
  warnings_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(warnings_json)),
  observed_at TEXT NOT NULL,
  proposed_valid_until TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(snapshot_id) REFERENCES evidence_snapshots(id)
);
```

### Observation identity

`observation_key` dipende da almeno:

```text
snapshot identity
subject type + subject key
field name
canonical scope
raw value
normalized value
extractor version
```

Lo stesso snapshot e lo stesso extractor non devono produrre duplicati semanticamente identici.

### Coverage state

```text
observed
```

Il field è supportato nella forma emessa.

```text
partial
```

Esiste un sotto-fatto realmente provato, ma non è consentito promuoverlo a completezza più ampia.

Esempio Airalo Europa:

```json
{
  "fieldName":"destination_coverage",
  "coverageState":"partial",
  "normalizedValue":{
    "scope":"regional",
    "region":"EUROPE",
    "declaredCountryCount":41
  }
}
```

Il fatto osservato è il conteggio dichiarato. La membership IT/FR/ES non viene inferita.

```text
unknown
```

La cattura non prova il field. Nessun valore `false`, `0` o lista vuota viene sintetizzato.

```text
not_applicable
```

Il field non si applica alla forma dell'offerta, per esempio `data_gb` su un'offerta esplicitamente unlimited.

## 7. `evidence_claim_candidates`

Una candidate è una proposta fattuale destinata a un gate di verifica successivo.

Non duplica raw value, locator e provenance: referenzia una observation.

### DDL progettuale

```sql
CREATE TABLE evidence_claim_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_key TEXT NOT NULL UNIQUE,
  observation_id INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
    'pending','accepted_for_verification','rejected_extraction','superseded'
  )),
  decision_actor TEXT,
  decision_notes TEXT NOT NULL DEFAULT '',
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(observation_id) REFERENCES evidence_field_observations(id)
);
```

Sono intenzionalmente assenti:

```text
verified
published
winner
```

### Eligibility

```text
coverage_state=observed
→ candidate ammessa

coverage_state=partial
→ candidate ammessa soltanto per il sotto-fatto espresso nel normalized value

coverage_state=unknown
→ nessuna factual candidate

coverage_state=not_applicable
→ nessuna factual candidate
```

Il candidate layer non risolve conflitti e non decide freshness finale.

### Audit delle candidate decisions

La prima migration upstream non deve inventare mutation operative. Se in una fase successiva si abiliteranno `accepted_for_verification`, `rejected_extraction` o `superseded`, la mutation dovrà avere audit append-only o una decision table/event table dedicata.

## 8. Source reconciliation prima dell'import

`evidence_snapshots.source_id` resta `NOT NULL`.

Precondizione:

```text
sourceAuditKey + canonical URL + provider/source role
→ exactly one approved source_registry.id
```

Fail closed:

```text
0 match  → source_not_registered
>1 match → source_registry_ambiguous
```

L'importer non auto-crea una source e non usa la root provider come fallback.

I source candidates del Claims Coverage Audit mostrano esplicitamente che molte product/help surface sono `candidate_new`; il source onboarding resta quindi un gate separato.

## 9. Identità del piano / offerta

La URL non è identità del piano.

Il live Airalo Europa ha dimostrato:

```text
historical deep link
→ HTTP 302
→ canonical regional store surface
```

Il subject usa una chiave repository-owned stabile (`offerKey` / `subject_key`).

Esempi regionali già usati dagli extractor:

```text
airalo:europe:unlimited-15d
holafly:europe:unlimited-15d
ubigi:europe:25gb-30d
```

Regole:

- prezzo non entra nell'identità;
- raw hash non entra nell'identità dell'offerta;
- source URL non è la chiave primaria dell'offerta;
- `provider_plan_key` resta separato e nullable se esiste un identificatore provider affidabile;
- duration/data allowance possono far parte della chiave repository-owned quando definiscono la SKU osservata;
- cambio di prezzo, country count o markup produce nuove observations sullo stesso subject, non una nuova offerta per default;
- una modifica sostanziale della SKU richiede una nuova subject key, non un alias silenzioso.

Una futura commercial materialization può promuovere questi subject in un nuovo catalog model; non è parte di questa PR.

## 10. Field mapping osservato

La matrice completa è:

```text
docs/research/evidence-d1-field-mapping.csv
```

### `plan_type`

Il pack Europa #107 emette esplicitamente:

```json
{"type":"regional","region":"EUROPE"}
```

Il pack Italia #106 **non emette un `plan_type` separato**. Emette `destination_coverage.scope=local`.

Non è autorizzato trasformare automaticamente:

```text
destination_coverage.scope=local
→ plan_type=local
```

Se un futuro extractor vuole produrre `plan_type=local`, deve avere un locator/source rule esplicita o una normalizzazione formalmente approvata e versionata.

### `destination_coverage`

Locale osservato in #106:

```json
{"countries":["IT"],"scope":"local"}
```

Regionale aggregato in #107:

```json
{"scope":"regional","region":"EUROPE","declaredCountryCount":41}
```

Quando una source prova membership country-specific, il valore può usare una forma come:

```json
{
  "scope":"regional",
  "region":"EUROPE",
  "countries":{
    "IT":"observed",
    "FR":"observed",
    "ES":"unknown"
  }
}
```

`unknown != false`.

### `price`

```json
{"amount":29,"currency":"USD"}
```

La source currency è parte del valore.

`price_eur` non viene popolato dall'evidence ingest.

Un futuro FX-derived datum richiede fonte FX, timestamp, rate e provenance propri.

### `data_gb`

```json
{"quantity":25,"unit":"GB"}
```

Per unlimited:

```text
coverage_state=not_applicable
```

Nessun cap numerico viene sintetizzato.

### `unlimited_policy`

```json
{"unlimitedLabel":true}
```

Non implica unlimited high-speed traffic.

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

La null strutturale non diventa zero.

### `validity_days`

```json
{"duration":15,"unit":"day"}
```

Activation resta separata.

### `activation_policy`

```json
{"trigger":"arrival_and_esim_enabled"}
```

o:

```json
{"trigger":"covered_area_connection","purchaseWhileCovered":"immediate"}
```

Se non provata, observation `unknown` e nessuna factual candidate.

### `hotspot_policy`

```json
{"allowed":true}
```

### `hotspot_share_limit`

Holafly:

```json
{"quantity":1,"unit":"GB","period":"day"}
```

Airalo:

```json
{"separateTetheringCapDeclared":false,"overallFupApplies":true}
```

Ubigi live:

```text
unknown
```

`allowed=true` non sostituisce questo field.

### `network`

Locale:

```json
{"operators":["Vodafone Italy","WINDTRE"],"completeness":"declared"}
```

Parziale:

```json
{"operators":["Wind Tre"],"completeness":"partial","additionalOperatorsUnresolved":2}
```

Regionale country-scoped, quando provato:

```json
{
  "byCountry":{
    "IT":["..."],
    "FR":["..."],
    "ES":["..."]
  },
  "completeness":"scenario_countries_only"
}
```

Non appiattire operatori regionali senza attribuzione country-specific.

### `radio_technology`

```json
{"technologies":["4G LTE","5G"],"qualifier":"where_available"}
```

Non equivale a observed performance.

### `voice_sms_included`

```json
{"dataOnly":true,"nativeVoice":false,"nativeSms":false}
```

Viene emesso soltanto se source-grounded.

## 11. Mapping verso `claim_verifications`

Il verifier futuro riceve una o più candidate e decide in un gate separato.

Mapping base:

```text
observation.subject_type
→ claim_verifications.entity_type

observation.subject_key
→ claim_verifications.entity_key

observation.field_name
→ claim_verifications.field_name

observation.normalized_value_json
→ claim_verifications.value_json

snapshot.source_id
→ claim_verifications.source_id
```

Il verifier decide:

```text
verification_status
confidence
checked_at
valid_until
```

### Partial non equivale a un verified-complete field

Se una observation `partial` viene accettata per un sotto-fatto, il `value_json` verificato deve conservare il qualifier di completezza oppure il verifier deve produrre un field atomico più stretto.

Esempio valido:

```json
{
  "scope":"regional",
  "region":"EUROPE",
  "declaredCountryCount":41,
  "membershipCompleteness":"unknown"
}
```

Non è valido interpretare `verification_status=verified` come “tutti i Paesi dello scenario sono verificati”.

### Provenance del verification decision

Il D1 attuale non conserva ancora una relazione immutabile field-level fra una decisione `claim_verifications` e le evidence candidates che l'hanno sostenuta o contraddetta.

Prima di automatizzare il bridge serve una relazione append-only/revisioned del tipo:

```text
verification decision/revision
↔ evidence candidate id(s)
↔ supports | contradicts
```

Questa relazione resta fuori dalla prima migration upstream. Non va simulata infilando ID opachi nel campo `evidence` senza un contratto versionato.

## 12. Freshness

`observed_at` deriva dallo snapshot.

`proposed_valid_until` è una proposta deterministica, non una verifica.

Baseline coerente con l'audit:

```text
price: 1–3 giorni
plan data/validity/network: 3–7 giorni
hotspot/FUP: 7 giorni
help generica: 14 giorni
terms/refund: 14–30 giorni
```

Il verifier può accorciare la validity. Non la estende automaticamente oltre policy senza motivazione.

## 13. Raw drift vs semantic drift

D1 non usa `body_sha256` come proxy per commercial fact change.

```text
evidence_snapshots.body_sha256
!=
evidence_field_observations.normalized_value_json
```

Un monitor futuro può:

```text
new capture run
→ new immutable snapshots
→ deterministic extraction
→ compare observations
→ new candidates solo per evidence semanticamente rilevante
→ verification ancora separata
```

Un raw diff da solo non verifica, contraddice o pubblica nulla.

## 14. Immutability enforcement

La migration implementation dovrà valutare trigger D1 che impediscano UPDATE/DELETE su:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
```

salvo una procedura di repair esplicita e separata, se mai necessaria.

L'obiettivo è rendere l'immutabilità una proprietà del database e non soltanto una convenzione applicativa.

Le candidate possono avere current status mutabile soltanto con audit append-only quando le mutation verranno abilitate.

## 15. Indexing proposto

La futura migration dovrebbe almeno valutare:

```text
evidence_snapshots(capture_run_id, source_id, fetched_at)
evidence_field_observations(subject_type, subject_key, field_name, observed_at)
evidence_field_observations(snapshot_id, field_name)
evidence_claim_candidates(status, created_at)
```

Nessun index viene creato in questa PR.

## 16. Prima implementation slice dopo l'approvazione del design

Branch separata e scope esclusivo:

```text
additive local/versioned D1 schema:
  evidence_capture_runs
  evidence_snapshots
  evidence_field_observations
  evidence_claim_candidates

+ CHECK / FK / indexes
+ immutability trigger smoke
+ migrated-local D1 fixture validation
```

Ancora **zero runtime ingest** e **zero remote migration**.

Non combinare nella stessa PR:

- fetch live;
- source onboarding;
- import dei pack;
- `claim_verifications` mutation;
- verification provenance bridge;
- maintenance queue;
- scheduler;
- `plans` redesign;
- ranking;
- publication.

## 17. Sequenza successiva

Dopo la schema-only migration locale:

```text
A. source reconciliation / onboarding scope
B. idempotent pack → evidence tables importer
C. verification provenance bridge
D. eventuale commercial materialization / plans-v2 design
```

Ogni lettera resta un gate separato salvo decisione esplicita successiva.

## 18. Acceptance del design

Il design è accettabile soltanto se:

1. ogni forma osservata nei pack Italia ed Europa è rappresentabile senza perdita;
2. il pack/capture-window context non viene perso;
3. source identity viene riconciliata prima dell'import;
4. local/regional coverage non richiede pseudo-destinations;
5. local `plan_type` non viene inferito dal solo `destination_coverage.scope`;
6. source-native price non richiede `price_eur`;
7. `partial`, `unknown`, `not_applicable` sono first-class;
8. regional network non viene appiattito;
9. URL e prezzo non diventano plan identity;
10. evidence candidate resta separata da editorial claim candidate;
11. `plans` v1 resta fuori dall'ingest;
12. `claim_verifications` resta current verified state downstream;
13. verification provenance bridge resta separato e auditabile;
14. nessuna migration/runtime mutation/deploy è inclusa nella PR di design.
