# Prossime azioni

Ultimo aggiornamento: **20 agosto 2026**.

## Gate corrente — formalizzazione migration `0022`

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
explicit bounded-ingest authorization   ✅
bounded D1 ingest + exact post-verify   ✅
local verification provenance bridge   ✅
```

Production evidence upstream contiene ora esclusivamente la coppia approved Italy/Europe: `2` capture run, `12` snapshot, `72` observation e `52` pending candidate. Il bridge v1 è verificato soltanto in locale; il prossimo gate è trasformarlo in una proposta migration `0022`. Non autorizza apply remoto, intake production, verifica automatica, materializzazione, affiliazioni, pubblicazione o deploy.

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

## Bounded ingest — chiuso e verificato

```text
workflow:             Evidence Controlled Ingest
run:                  32396193444
main:                 55f0228c03b6604ac6858b0a4d987e0cec3ebe7c
fresh pre-write rows: 0 / 0 / 0 / 0
inserted + verified:  2 / 12 / 72 / 52
post-write action:    existing_exact
pending inserts:      0 / 0 / 0 / 0
```

Audit:

```text
artifact id: 9416760749
sha256: 4886495527e4b6aeacf6f425c7227345e18ba1ece5f8887fdb6a0f00816b8daa
expires: 2026-11-18T17:11:12Z
result: docs/research/EVIDENCE-CONTROLLED-INGEST-RESULT-2026-08-20.md
```

Il run ha preservato R2 a 13 oggetti, `source_registry` a 15 righe e source resolution 9/9. Non ha scritto `plans` o `claim_verifications` e ha lasciato disabilitati claim verification, affiliazioni, pubblicazione e deploy.

## Controlled ingest write boundary applicato

Il batch eseguito ha scritto esclusivamente:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates
```

Non ha scritto:

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

## Prossimo workstream — migration package del verification provenance bridge

```text
pending evidence candidate
→ separately reviewed 0022 migration proposal
→ read-only remote preflight
→ explicit remote migration authorization
→ separate human verification gate
→ verified / contradicted / expired
→ evidence bundle
→ Page Readiness
→ grounded materialization
```

Un pending candidate non è un verified claim.

Il contratto locale verificato è documentato in `docs/research/EVIDENCE-VERIFICATION-PROVENANCE-BRIDGE-DESIGN-2026-08-20.md`. Il file SQL prototipo resta fuori da `migrations/`; non esiste ancora una migration production pending.

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
→ explicit bounded-ingest authorization ✅
→ controlled evidence ingest ✅
→ verification provenance design ✅
→ formal 0022 migration proposal ← current
→ bounded verified facts
→ First Money UI materialization
→ canonical /migliore-esim cutover
→ affiliate + measurement gate
→ explicit production deploy
→ first affiliate click
```

## Freeze

- niente ulteriore D1 write senza preflight fresco e autorizzazione separata;
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
