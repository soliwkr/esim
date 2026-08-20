# Prossime azioni

Ultimo aggiornamento: **20 agosto 2026**.

## Gate corrente — autorizzazione controlled ingest

Checkpoint chiusi:

```text
source reconciliation                    ✅
production source onboarding 9/9         ✅
local/fixture importer                   ✅
remote 0021                              ✅
durable artifact storage contract        ✅
native R2 Bucket Lock contract           ✅
remote R2 provisioning                   ✅
Airalo Italy currency drift hardening    ✅
Airalo Europe currency drift hardening   ✅
replacement complete-pair capture        ✅
raw/provenance candidate review          ✅
explicit replacement approval            ✅
approved R2 staging + verification       ✅
controlled-ingest read-only preflight    ✅
```

Production evidence upstream resta vuoto: nessun approved pack è ancora stato ingerito in D1. Il prossimo D1 write richiede un'autorizzazione nuova, esplicita e vincolata.

## Approved replacement anchor

```text
capture run: 31623841563
artifact id: 9152309259
zip sha256: f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
Italy pack:  pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
Europe pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
```

## R2 staging — chiuso e verificato

Target:

```text
senza-roaming-evidence-artifacts
```

Il primo create attempt `32154128831` ha fallito chiuso con `cloudflare_object_create_failed:10028`. Dopo due probe read-only verdi (`32154558001`, `32154868752`), il retry S3 create-only separatamente autorizzato ha completato lo staging.

Verified run:

```text
run:                   32156353642
head:                  5d099010c703ea78622cd161f36705e45d3d91f2
transport:             r2-s3-sigv4
conditional create:    If-None-Match: *
preflight collisions:  0
created:               13
verified:              13
```

Inventory:

```text
logical raw references: 12
unique raw objects:      11
pack objects:             2
total objects:           13
```

Bucket contract verificato durante la stessa run:

```text
jurisdiction: default
storage class: Standard
r2.dev: disabled
custom domains: 0
protected prefix: v1/
lock: evidence-v1-indefinite / Indefinite
```

Audit:

```text
artifact id: 9331865182
sha256: b91a432cdde585997b271f472a67fdfb16fa088adb11435657054d3e127fdd54
```

Result canonico:

```text
docs/research/EVIDENCE-R2-STAGING-RESULT-2026-08-18.md
```

Nessuna D1 mutation, claim verification, affiliate activation, publication o deploy è avvenuta durante staging.

## Read-only preflight — chiuso e verificato

Remote run:

```text
workflow:               Evidence Controlled Ingest Read-only Preflight
run:                    32387491600
head:                   e636535684a31c409c456b0d1668e3e9bcd32ce9
checked at:             2026-08-20T15:41:16.614Z
R2 objects verified:    13
source_registry rows:   15
identities resolved:    9/9
D1 migration:           21 / 0021_evidence_upstream_storage.sql
existing upstream rows: 0 / 0 / 0 / 0
```

Deterministic insert plan:

```text
runs:         2
snapshots:   12
observations: 72
candidates:  52
```

Audit:

```text
artifact id: 9413529042
sha256: fb0d96291e4d8b09312744d8ce46130c375a496dde46120f88a3ce857dc2de94
result: docs/research/EVIDENCE-CONTROLLED-INGEST-PREFLIGHT-RESULT-2026-08-20.md
```

Boundary:

```text
D1 mutated:         false
claims verified:    false
affiliate enabled:  false
published:          false
deployed:           false
```

## Prossimo workstream — bounded ingest authorization

Creare una branch separata da `main` **solo dopo il merge del checkpoint preflight**.

Prima di introdurre qualsiasi capacità di write:

1. vincolare l'autorizzazione ai due pack approvati e a un expected head esatto;
2. rifare un preflight remoto read-only immediatamente prima del batch;
3. richiedere ancora `0021`, source resolution 9/9 e zero drift/collision;
4. limitare il batch alle quattro tabelle upstream e ai totali attesi;
5. eseguire il batch atomicamente e fallire chiuso;
6. produrre una verifica post-ingest deterministica e un audit separato;
7. STOP prima di claim verification, affiliate activation, publication o deploy.

Il preflight verde non autorizza da solo il bounded production write.

## Controlled ingest write boundary

Il batch autorizzato potrà scrivere esclusivamente:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates
```

È vietato scrivere:

```text
source_registry
plans
claim_verifications
published_pages
```

Invarianti:

- atomic/bounded batch;
- deterministic IDs;
- exact source resolution;
- locked/resolvable `artifact_ref` obbligatori;
- existing-key drift blocca;
- exact rerun idempotente;
- `unknown|not_applicable` observation-only;
- `observed|partial` possono soltanto produrre pending candidates;
- source-native currency preservata;
- nessun FX implicito;
- nessuna verification automatica.

## Dopo ingest verificato

```text
pending evidence candidate
→ verification provenance gate
→ verified / contradicted / expired
→ evidence bundle
→ Page Readiness
→ grounded materialization
```

Un pending candidate non è un verified claim.

## First Money UI

Preview:

```text
/astro-foundation/articoli/migliore-esim
```

Canonical invariata:

```text
/migliore-esim
```

Nessun `/go/*`, winner o affiliate claim è live.

## Percorso verso il primo click affiliate

```text
source reconciliation             ✅
production source onboarding      ✅
local importer                     ✅
remote 0021                        ✅
artifact storage contract          ✅
R2 provisioning                    ✅
replacement complete pair          ✅
raw/provenance review              ✅
explicit replacement approval      ✅
locked R2 staging + verification   ✅
→ controlled-ingest read-only preflight ✅
→ explicit bounded-ingest authorization ← current
→ controlled evidence ingest
→ verification provenance
→ bounded verified facts
→ First Money UI materialization
→ canonical /migliore-esim cutover
→ affiliate + measurement gate
→ explicit production deploy
→ first affiliate click
```

## Freeze

- niente D1 write in questo preflight closeout;
- niente controlled ingest senza preflight fresco e autorizzazione separata;
- niente claim verification automatica;
- niente source auto-registration;
- niente metadata overwrite;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente provider winner universale;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente deploy automatico;
- niente pubblicazione autonoma dell'AI.
