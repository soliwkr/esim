# Senza Roaming — Roadmap

Ultimo aggiornamento: **12 agosto 2026**.

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

**Stato:** demand intelligence completata; First Money UI in preview; storage Truth Engine production provisionato; replacement Italy/Europe completo e revisionato; gate corrente = explicit replacement approval.

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
- raw/provenance review della coppia replacement.

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

Nessun approved evidence pack è ancora stato importato in production.

### Durable artifact storage — production verified

Logical store:

```text
evidence-artifacts
```

R2 target:

```text
senza-roaming-evidence-artifacts
```

Production state verificato il 12 agosto 2026:

```text
exists: true
jurisdiction: default
storage class: Standard
r2.dev: disabled
custom domains: 0
protected lifecycle deletes: 0
```

Native lock:

```text
id:        evidence-v1-indefinite
prefix:    v1/
enabled:   true
condition: Indefinite
```

Content addressing:

```text
raw:  v1/raw/sha256/<prefix>/<digest>.<ext>
pack: v1/packs/sha256/<prefix>/<digest>.json
ref:  r2://evidence-artifacts/<object-key>
```

Non viene dichiarato legal hold/WORM irrevocabile: la configurazione amministrativa R2 resta modificabile da un attore privilegiato.

### Replacement candidate — complete + reviewed

I bundle raw originari #106/#107 non risultano recuperabili. La replacement capture completa del 12 agosto 2026 ha prodotto:

```text
run: 31623841563
artifact id: 9152309259
zip sha256: f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
files: 15
raw HTML: 12
pack.json: 2
```

Italy:

```text
pack: pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
semantic: sha256:2e3d9aaa7e3540d92ff9752721980cd1f4bd2380530578e671e572061952b517
Airalo: 29 EUR historical → 32 USD current
```

Europe:

```text
pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
semantic: sha256:f8e617f3e7f659edaddc121ec6df50cc50238308ebf5315c779b41a497c9eb11
Airalo: 44.5 EUR historical → 49 USD current
```

Review verificata:

```text
12/12 raw sha256 + byte length
12/12 HTTP 200
0 redirects
12/12 visibleText identities
field-level provenance locators valid
all factual candidates pending
ranking not_computed
```

Holafly e Ubigi restano allineati ai result storici versionati. I vecchi raw pack non sono disponibili, quindi non viene dichiarato byte-level diff contro i vecchi `pack.json`.

Result:

```text
docs/research/EVIDENCE-REPLACEMENT-CANDIDATE-REVIEW-2026-08-12.md
```

### Gate corrente — explicit replacement approval

La coppia è **ready for approval**, ma:

```text
replacementApproved: false
r2Uploaded: false
d1Mutated: false
```

L'approvazione deve identificare esattamente run, artifact digest e i due pack ID. Approval replacement e R2 object upload restano gate distinti.

### Controlled evidence ingest

Solo dopo:

```text
explicit replacement approval
→ separately authorized create-only R2 staging
→ verify artifact_ref/hash/size
→ D1 read-only preflight
→ source resolution 9/9
→ idempotency/drift preflight
→ separately authorized atomic bounded ingest
→ deterministic post-ingest audit
```

Write target esclusivi:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates
```

Nessun write in `source_registry`, `plans`, `claim_verifications` o published state.

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
→ explicit replacement approval
→ locked artifact staging
→ controlled evidence ingest
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
→ explicit replacement approval ← current
→ locked R2 staging
→ controlled ingest
→ verification provenance
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

- replacement capture approval;
- evidence object upload;
- controlled D1 ingest;
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
