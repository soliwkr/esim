# Senza Roaming — Roadmap

Ultimo aggiornamento: **9 agosto 2026**.

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

**Stato:** demand intelligence completata; First Money UI in preview; Truth Engine al gate R2 provisioning/preflight.

Completati:

- 1.623 keyword Planner uniche;
- ownership/cannibalization/internal linking;
- homepage, hub e `/migliore-esim` riallineati;
- GSC exporter read-only;
- First Euro demand intelligence;
- priorità #1 `/migliore-esim`, #2 `/esim-europa`;
- First Money UI preview con evidence slot non materializzati.

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

### Importer local/fixture

Verificato:

```text
first import: 2 runs / 12 snapshots / 18 observations / 8 candidates
exact rerun:  0 / 0 / 0 / 0
```

Fail-closed su source resolution, artifact identity, candidate identity ed existing-key drift. Nessun FX, auto-registration, claim verification o publication.

### Durable artifact contract

Logical store:

```text
evidence-artifacts
```

R2 target:

```text
senza-roaming-evidence-artifacts
```

Content addressing:

```text
raw:  v1/raw/sha256/<prefix>/<digest>.<ext>
pack: v1/packs/sha256/<prefix>/<digest>.json
ref:  r2://evidence-artifacts/<object-key>
```

Production storage contract:

```text
private
jurisdiction default
Standard storage class
r2.dev disabled
custom domains 0
no lifecycle delete overlapping v1/
```

Native lock:

```text
id:        evidence-v1-indefinite
prefix:    v1/
enabled:   true
condition: Indefinite
```

Non viene dichiarato legal hold/WORM irrevocabile: la configurazione amministrativa R2 resta modificabile da un attore privilegiato.

### Gate corrente — provisioning readiness

Il repository prepara un gate manual-only:

```text
workflow_dispatch
+ exact main SHA
+ confirmation PROVISION_EVIDENCE_R2
```

Preflight:

```text
absent target
→ create eligible

existing exact-compatible
→ read-only no-op

existing drifted
→ fail closed, zero repair mutation
```

Create path ammesso:

```text
POST bucket
→ read-only verify
→ PUT exact Bucket Lock
→ read-only final verify
```

Nello stesso gate sono vietati object upload, delete, domain/lifecycle mutation, D1 write e deploy.

### Gate immediatamente successivo

Dopo merge del provisioning tooling:

```text
remote R2 read-only preflight
```

Se il target è assente, la create/config mutation richiede autorizzazione esplicita separata.

Se il target è già compatible, non serve mutation di provisioning.

Se è driftato, niente auto-repair: aprire scope amministrativo separato.

### Historical pack availability

I bundle raw originari Italy/Europe #106/#107 non risultano recuperabili dal repository o dagli artifact CI storici.

Recovery read-only:

```text
run 31313829528
Ubigi Italy: HTTP 403
complete pack: none
remote mutation: none
```

Sono ammessi soltanto:

```text
original bundle recovery
```

oppure:

```text
new complete capture
→ raw review
→ semantic comparison
→ explicit replacement approval
```

### Controlled evidence ingest

Solo dopo storage + approved raw bundle availability:

```text
stage exact pack/raw artifacts in locked R2
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
R2 provisioning gate ← current
→ R2 preflight/provisioning
→ approved raw pack availability
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
→ R2 provisioning/preflight
→ approved raw artifacts
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

- R2 create/config mutation;
- evidence object upload;
- controlled D1 ingest;
- replacement capture approval;
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
