# Senza Roaming — Roadmap

Ultimo aggiornamento: **20 agosto 2026**.

## Principi non negoziabili

1. L'AI non pubblica direttamente.
2. Brief, claim, verification, readiness, draft, materializzazione e pubblicazione sono gate distinti.
3. I fatti commerciali richiedono source identity, raw evidence e data di verifica.
4. Claim insufficienti, contraddetti o scaduti non alimentano testo fattuale.
5. `partial` e `unknown` restano stati reali.
6. Il browser non accede direttamente a D1.
7. Ogni mutation production richiede identità, scope, audit e test.
8. Astro è il frontend pubblico; React resta nelle island realmente interattive.
9. Preview, release candidate e published restano distinti.
10. Tracking non essenziale soltanto con il consenso previsto.
11. GitHub è la memoria canonica.
12. Domanda SEO e monetizzazione non autorizzano claim senza evidence.
13. Evidence production richiede raw artifact persistenti, risolvibili e protetti dal retention contract canonico.

## M0–M6

- **M0 Fondazioni tecniche:** completato salvo checkpoint `www → apex` definitivo.
- **M1 Qualità e osservabilità:** quality gate operativo.
- **M2 Motore AI editoriale:** nucleo v1 operativo.
- **M3 Readiness e draft grounded:** completato e verificato.
- **M4 Control Room:** read-only completo; mutation residue aperte.
- **M5 Frontend pubblico Astro:** completato e live.
- **M6 Misurazione e indicizzazione:** CMP, GTM, GA4 e GSC live; Ads e affiliate tracking disabilitati.

## M7 — Intelligence SEO, Demand e First Euro

**Stato:** demand intelligence completata; First Money UI in preview; coppia approved Italy/Europe persistita in R2 e ingerita nelle tabelle upstream D1; gate corrente = verification provenance bridge.

Completati:

- 1.623 keyword Planner uniche;
- ownership/cannibalization/internal linking;
- homepage, hub e `/migliore-esim` riallineati;
- GSC exporter read-only;
- First Euro demand intelligence;
- priorità #1 `/migliore-esim`, #2 `/esim-europa`;
- First Money UI preview con evidence slot non materializzati;
- source reconciliation e production onboarding 9/9;
- evidence importer local/fixture;
- upstream D1 `0021` applicato in produzione;
- durable artifact contract;
- native R2 Bucket Lock contract;
- R2 production target provisionato e verificato;
- Airalo Italy/Europe currency-drift hardening;
- nuova coppia replacement Italy/Europe completa;
- raw/provenance review;
- explicit replacement approval;
- exact approved raw + pack staging in locked R2;
- post-write verification di tutti i 13 content-addressed objects;
- controlled evidence ingest read-only preflight remoto verde;
- autorizzazione bounded-ingest versionata;
- ingest D1 insert-only della coppia approved e post-verifica esatta `2 / 12 / 72 / 52`.

Preview:

```text
/astro-foundation/articoli/migliore-esim
```

Canonical `/migliore-esim` resta invariata.

## Evidence Truth Engine

### Checkpoint completati

```text
#103 source universe
#104 immutable snapshot spike
#105 claims coverage
#106 Italy evidence pack
#107 Europe evidence pack
#108 D1 mapping design
#109 canonical closeout
#110 upstream evidence schema foundation
#119 fail-closed source reconciliation
#121 target source_registry verification
#122 local source onboarding gate
run 31205724615 production source onboarding 9/9
#124 idempotent local/fixture evidence importer
#125 explicit remote 0021 migration gate
run 31260773468 remote 0021 apply + verification
#126 remote 0021 closeout
#127 durable artifact storage foundation
#128 native R2 Bucket Lock correction
#129 fail-closed R2 provisioning gate
run 31588635704 remote R2 read-only preflight
run 31600420207 R2 create + exact Bucket Lock + verification
#131 Airalo Italy source-native currency drift hardening
#132 Airalo Europe source-native currency drift hardening
run 31623841563 complete Italy + Europe replacement candidate
15 agosto 2026 explicit replacement approval
run 32154128831 first R2 write attempt failed closed
run 32154558001 post-failure read-only recheck
run 32154868752 read-only S3 auth probe
run 32156353642 S3 create-only staging + 13/13 verification
run 32387491600 controlled ingest read-only preflight
run 32391428886 final controlled-ingest read-only preflight on approved head
#136 bounded controlled-ingest authorization + runner
run 32396193444 bounded D1 ingest + exact post-write verification
```

### Production source state

```text
source_registry rows: 15
manifest identities: 9
resolved:            9
missing:             0
ambiguous:           0
```

### Production upstream D1

```text
latest migration: 0021_evidence_upstream_storage.sql
migrations:       21
upstream tables:  4
indexes:          7
triggers:         9
```

La coppia approved Italy/Europe è stata importata dal run `32396193444` e verificata contro i byte R2 approvati. Stato upstream production:

```text
capture runs:  2
snapshots:    12
observations: 72
candidates:   52 (pending)
```

`source_registry` è rimasto invariato a 15 righe. Nessun claim è stato verificato e nessuna riga `plans` è stata scritta.

### Durable artifact storage — production verified

Logical store:

```text
evidence-artifacts
```

R2 target:

```text
senza-roaming-evidence-artifacts
```

Contract remoto verificato:

```text
jurisdiction: default
storage class: Standard
r2.dev / managed public access: disabled
custom domains: 0
native lock: evidence-v1-indefinite / v1/ / Indefinite
```

Content addressing:

```text
raw:  v1/raw/sha256/<prefix>/<digest>.<ext>
pack: v1/packs/sha256/<prefix>/<digest>.json
ref:  r2://evidence-artifacts/<object-key>
```

Non viene dichiarato legal hold/WORM irrevocabile: la configurazione amministrativa R2 resta modificabile da un attore privilegiato.

### Approved replacement

```text
run: 31623841563
artifact id: 9152309259
zip sha256: f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
Italy pack:  pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
Europe pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
```

Commercial delta documentato:

```text
Airalo Italy:  29 EUR   → 32 USD
Airalo Europe: 44.5 EUR → 49 USD
```

Holafly e Ubigi restano allineati ai result storici versionati. I vecchi raw pack sono assenti, quindi non viene dichiarato un byte-level diff contro i vecchi `pack.json`.

### Locked R2 staging — verificato

Il primo create attempt `32154128831` ha fallito chiuso con `cloudflare_object_create_failed:10028`. Dopo read-only recheck e S3 auth probe, un retry separatamente autorizzato ha usato il contratto create-only equivalente previsto da ADR-040:

```text
run:                32156353642
head:               5d099010c703ea78622cd161f36705e45d3d91f2
transport:          r2-s3-sigv4
conditional write:  If-None-Match: *
collisions:         0
created:            13
verified:           13
```

Inventory:

```text
12 logical raw references
11 unique raw objects
2 pack objects
13 total objects
```

Audit artifact:

```text
id: 9331865182
sha256: b91a432cdde585997b271f472a67fdfb16fa088adb11435657054d3e127fdd54
```

Result:

```text
docs/research/EVIDENCE-R2-STAGING-RESULT-2026-08-18.md
```

R2 staging non ha mutato D1, verificato claim, attivato affiliazioni, pubblicato o deployato.

### Controlled evidence ingest — chiuso e verificato

Gate completato:

```text
exact R2 artifact_ref/hash/size verification ✅
→ read-only remote D1 state preflight ✅
→ source resolution 9/9 ✅
→ deterministic import plan ✅
→ idempotency/drift preflight ✅
→ explicit controlled-ingest authorization ✅
→ atomic bounded ingest ✅
→ deterministic post-ingest audit ✅
```

Fresh preflight e write result:

```text
canonical preflight:   32391428886
ingest run:            32396193444
main:                  55f0228c03b6604ac6858b0a4d987e0cec3ebe7c
R2 objects verified:   13
pre-write D1 rows:     0 / 0 / 0 / 0
inserted + verified:   2 runs / 12 snapshots / 72 observations / 52 candidates
post-write plan:       existing_exact / 0 pending inserts
```

Audit canonico:

```text
docs/research/EVIDENCE-CONTROLLED-INGEST-RESULT-2026-08-20.md
```

Write target esclusivi:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates
```

Nessun write in:

```text
source_registry
plans
claim_verifications
published_pages
```

Il run ha lasciato `claimsVerified`, `affiliateEnabled`, `published` e `deployed` a `false`.

### Verification provenance

Dopo ingest:

```text
pending evidence candidate
→ verification decision
→ verified / contradicted / expired
→ evidence bundle
→ Page Readiness
→ grounded materialization
```

Un evidence candidate non equivale a un verified claim.

## M8 — Monetizzazione controllata

**Stato:** non attiva.

Obiettivo:

```text
first verified money page
→ first affiliate redirect
→ first attributed sale
→ first euro
```

Percorso corrente:

```text
source gate 9/9 ✅
local importer ✅
remote 0021 ✅
artifact contract ✅
R2 provisioning ✅
replacement complete pair ✅
raw/provenance review ✅
explicit replacement approval ✅
locked R2 staging + verify ✅
→ read-only controlled-ingest preflight ✅
→ explicit bounded-ingest authorization ✅
→ controlled evidence ingest ✅
→ verification provenance bridge ← current
→ verified commercial facts
→ canonical /migliore-esim
→ affiliate + measurement gate
→ explicit production deploy
→ first affiliate click
```

Prima di `AFFILIATE_MODE=enabled` servono facts verified/fresh, affiliate approval, `/go/*`, disclosure, measurement design, privacy recheck, secret fuori repo, change esplicito e live smoke.

## M9 — Crescita e manutenzione

Dopo la prima vertical slice misurata:

- weekly demand loop;
- GSC opportunities;
- source freshness/refresh;
- commercial drift monitoring;
- expansion basata su impressions, click e revenue;
- pSEO soltanto dopo prova di qualità.

## Track operativi

### Track A — Traffic & Money

```text
First Money preview
→ bounded verified facts
→ canonical /migliore-esim
→ affiliate/measurement gate
→ explicit deploy
→ first affiliate click
→ /esim-europa
```

### Track B — Truth Engine

```text
source reconciliation ✅
→ onboarding 9/9 ✅
→ local importer ✅
→ remote 0021 ✅
→ durable artifact contract ✅
→ R2 provisioning ✅
→ replacement complete pair ✅
→ raw/provenance review ✅
→ explicit replacement approval ✅
→ locked R2 staging + verify ✅
→ controlled-ingest read-only preflight ✅
→ explicit bounded-ingest authorization ✅
→ controlled ingest ✅
→ verification provenance ← current
→ money-page facts
```

### Track C — Operations

```text
M4 mutation residue
+ GSC/GA4 observation
+ www redirect checkpoint
```

## Stop conditions

Non fare senza gate esplicito:

- ulteriori controlled D1 mutation;
- automatic claim verification;
- `review → published`;
- affiliate activation;
- production deploy;
- FX implicito;
- source auto-registration;
- provider winner universale;
- mass pSEO prima della prima vertical slice misurata.

Il valore resta misurabile come:

```text
impression → click → affiliate redirect → sale → revenue
```

senza abbassare il livello di verità commerciale.
