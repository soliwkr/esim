# Prossime azioni

Ultimo aggiornamento: **12 agosto 2026**.

## Gate corrente — explicit replacement approval

Checkpoint chiusi:

```text
source reconciliation                    ✅
production source onboarding 9/9         ✅
local/fixture importer                   ✅
remote 0021                              ✅
durable artifact storage contract        ✅
native R2 Bucket Lock contract           ✅
remote R2 read-only preflight            ✅
remote R2 provisioning                   ✅
Airalo Italy currency drift hardening    ✅
Airalo Europe currency drift hardening   ✅
replacement complete-pair capture        ✅
raw/provenance candidate review          ✅
```

Production evidence upstream resta vuoto: nessun pack è stato ancora ingerito.

## R2 production state

Target:

```text
senza-roaming-evidence-artifacts
```

Provisioning verificato:

```text
run: 31600420207
mutation: created_bucket_and_set_lock
verified: true
```

Stato finale:

```text
jurisdiction: default
storage class: Standard
r2.dev: disabled
custom domains: 0
protected prefix: v1/
no lifecycle delete overlapping v1/
```

Lock canonica:

```text
id:        evidence-v1-indefinite
prefix:    v1/
enabled:   true
condition: Indefinite
```

Nessun evidence object è ancora stato caricato nel bucket.

## Replacement candidate disponibile e revisionato

I raw originari #106/#107 restano non recuperabili, ma il percorso replacement ha prodotto una nuova coppia completa.

Capture:

```text
main base: 7ded3c2bdd4b61e8c09e490e485d5c5c091475bb
run:       31623841563
ops head:  a4197ef10108f6762606eb9c270e2a354143cc23
result:    success
```

Artifact:

```text
id:         9152309259
files:      15
raw HTML:   12
pack.json:  2
summary:    1
zip sha256: f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
expires:    2026-09-11T17:41:12Z
```

Integrity review:

```text
raw hash:             12/12 verified
raw byte length:      12/12 verified
HTTP 200:             12/12
redirects:            0/12
visibleText hash:     12/12 verified
field locators:       verified with JS UTF-16 indexing
all candidates:       pending
ranking:              not_computed
replacementApproved: false
r2Uploaded:           false
d1Mutated:            false
```

Italy:

```text
pack: pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
semantic: sha256:2e3d9aaa7e3540d92ff9752721980cd1f4bd2380530578e671e572061952b517
historical: sha256:ba819d051bb73a1690c64520c537579b04c0ad2d73cdb6626a2e6c655bf678f8
Airalo documented delta: 29 EUR → 32 USD
```

Europe:

```text
pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
semantic: sha256:f8e617f3e7f659edaddc121ec6df50cc50238308ebf5315c779b41a497c9eb11
historical: sha256:efb5924eee13f0c2f2a17381cf823c7e78873ab53925842949525982e96dbb89
Airalo documented delta: 44.5 EUR → 49 USD
```

Holafly e Ubigi restano allineati ai valori/coverage documentati nei checkpoint storici #106/#107. Poiché i vecchi raw pack sono assenti, non viene dichiarato un byte-level diff contro i vecchi `pack.json`.

Review completa:

```text
docs/research/EVIDENCE-REPLACEMENT-CANDIDATE-REVIEW-2026-08-12.md
```

## Decisione immediata richiesta

La coppia è **ready for explicit replacement approval**.

L'approvazione deve identificare esattamente:

```text
run: 31623841563
artifact id: 9152309259
zip sha256: f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
Italy pack:  pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
Europe pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
```

Finché questa approval non esiste:

```text
no R2 upload
no controlled ingest
no claim verification
no money-page materialization
```

Replacement approval non equivale ad autorizzazione object upload R2.

## Gate dopo approval — R2 staging separato

Con approval replacement già registrata, aprire un nuovo gate esplicitamente autorizzato per:

```text
stage exact pack + raw bytes create-only in locked R2
→ verify object key / sha256 / byte length / artifact_ref
```

Solo dopo staging verificato:

```text
read-only D1 preflight
→ source resolution 9/9
→ idempotency/drift preflight
→ separately authorized controlled D1 batch
→ deterministic post-ingest audit
```

Controlled ingest può scrivere soltanto:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates
```

Non può scrivere:

```text
source_registry
plans
claim_verifications
published_pages
```

## Verification provenance bridge

Dopo ingest:

```text
pending evidence candidate
→ verification gate
→ verified / contradicted / expired
→ evidence bundle
→ Page Readiness
→ grounded materialization
```

Un pending candidate non è un verified claim.

`partial` resta partial e `unknown` resta unknown.

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
→ explicit replacement approval   ← current
→ separately authorized R2 staging
→ controlled evidence ingest
→ verification provenance
→ bounded verified facts
→ First Money UI materialization
→ canonical /migliore-esim cutover
→ affiliate + measurement gate
→ explicit production deploy
→ first real affiliate click
```

## Freeze

- niente replacement approval implicita;
- niente evidence upload senza approval + authorization separata;
- niente controlled ingest senza locked/resolvable raw artifacts;
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
