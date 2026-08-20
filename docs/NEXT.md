# Prossime azioni

Ultimo aggiornamento: **20 agosto 2026**.

## Gate corrente — controlled evidence ingest preflight

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
```

Production evidence upstream resta vuoto: nessun approved pack è ancora stato ingerito in D1.

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

## Prossimo workstream — controlled ingest gate

Creare una branch separata da `main` **solo dopo il merge del checkpoint R2**.

La prima fase deve essere read-only:

```text
1. verify exact R2 artifact refs / hashes / sizes
2. verify remote D1 schema state = 0021
3. reconcile source_registry 9/9
4. compute deterministic import plan
5. idempotency/drift preflight against current upstream rows
6. produce audit/preflight result
7. STOP
```

Soltanto dopo un preflight verde e una nuova autorizzazione esplicita può essere creato il marker/call che abilita il bounded production write.

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
→ controlled evidence ingest      ← current
→ verification provenance
→ bounded verified facts
→ First Money UI materialization
→ canonical /migliore-esim cutover
→ affiliate + measurement gate
→ explicit production deploy
→ first affiliate click
```

## Freeze

- niente D1 write in questo R2 closeout;
- niente controlled ingest senza preflight e autorizzazione separata;
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
