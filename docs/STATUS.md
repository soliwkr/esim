# Stato del progetto

Data di riferimento: **15 agosto 2026**.

Questo documento fotografa lo stato operativo reale. Lo storico dettagliato resta nel versionamento Git e nei documenti risultato.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve Astro |
| Dominio `www` | Da ricontrollare | redirect implementato; checkpoint definitivo aperto |
| Worker | Operativo | custom Worker; deploy production manual-only |
| D1 remoto | Operativo fino a `0021` | upstream evidence schema applicato e verificato |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione autonoma |
| Control Room | Operativa | read-only completo + prime mutation; legacy ancora fallback |
| Frontend pubblico Astro | Live | homepage, hub, trust pages, published-only routing |
| M7 SEO foundation | Live | ownership e on-page baseline applicate |
| First Money UI | Preview mergiata | canonical `/migliore-esim` invariata |
| Source registry | Production-ready | 15 righe; 9/9 identity risolte |
| Evidence importer | Local/fixture verificato | idempotente e fail-closed |
| Upstream evidence schema | Production-ready | `0021`; 4 tabelle, 7 indici, 9 trigger |
| Evidence artifact storage | **Provisionato e verificato** | R2 privato, Standard/default, native Bucket Lock su `v1/` |
| Replacement evidence | **Approvato esplicitamente** | Italy + Europe; identità vincolata a run, ZIP e due pack ID |
| Controlled evidence ingest | Bloccato | richiede staging R2 separatamente autorizzato e verificato |
| CMP / GTM / GA4 | Live e consent-gated | Consent Mode Basic |
| Affiliazioni | Disabilitate | `AFFILIATE_MODE=disabled` |

## Frontend pubblico e monetizzazione

Il sito è live e indicizzabile, ma non ancora money-ready:

- `/migliore-esim` canonica resta provider-neutral;
- First Money UI disponibile come preview noindex/no-store `/astro-foundation/articoli/migliore-esim`;
- nessun `/go/*`, provider winner o claim commerciale non verificato nella preview;
- affiliate tracking disabilitato;
- nessun deploy money-ready eseguito.

## Truth Engine — checkpoint chiusi

```text
source reconciliation                    ✅
production source onboarding 9/9         ✅
local/fixture evidence importer          ✅
remote 0021 schema                       ✅
durable artifact storage contract        ✅
native R2 Bucket Lock contract           ✅
R2 remote read-only preflight            ✅
R2 production provisioning               ✅
Airalo Italy currency drift hardening    ✅
Airalo Europe currency drift hardening   ✅
replacement complete-pair capture        ✅
raw/provenance candidate review          ✅
explicit replacement approval            ✅
```

Production source state:

```text
source_registry rows: 15
manifest identities: 9
resolved:            9
missing:             0
ambiguous:           0
```

Remote D1:

```text
latest migration: 0021_evidence_upstream_storage.sql
migrations:       21
upstream tables:  4
indexes:          7
triggers:         9
```

Upstream production evidence rows non sono ancora state importate.

## R2 production state

Target:

```text
senza-roaming-evidence-artifacts
```

Provisioning autorizzato e verificato:

```text
run: 31600420207
mutation: created_bucket_and_set_lock
verified: true
```

Stato remoto finale:

```text
exists: true
jurisdiction: default
storage class: Standard
r2.dev / managed public access: disabled
custom domains: 0
protected lifecycle deletes: 0
```

Lock canonica:

```text
id:        evidence-v1-indefinite
prefix:    v1/
enabled:   true
condition: Indefinite
```

Result document:

```text
docs/research/EVIDENCE-R2-PROVISIONING-RESULT-2026-08-12.md
```

Il provisioning non ha caricato oggetti evidence, non ha scritto D1 e non ha eseguito deploy.

## Replacement evidence candidate — review completata

I bundle raw originari #106/#107 non sono recuperabili dal repository o dagli artifact CI storici. Il percorso replacement ha ora prodotto una coppia completa e revisionata.

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

Review integrità:

```text
raw sha256:             12/12 match
raw byte length:        12/12 match
HTTP status:            12/12 = 200
redirect chain:         12/12 = 0
visibleText sha256:     12/12 match
field-level locators:   verified with JS UTF-16 semantics
candidate status:       all pending
ranking:                not_computed
R2 uploaded:            no
D1 mutated:             no
replacement approved:  yes — 15 agosto 2026
```

Italy candidate:

```text
pack: pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
semantic: sha256:2e3d9aaa7e3540d92ff9752721980cd1f4bd2380530578e671e572061952b517
historical semantic: sha256:ba819d051bb73a1690c64520c537579b04c0ad2d73cdb6626a2e6c655bf678f8
historicalSemanticMatch: false
```

Europe candidate:

```text
pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
semantic: sha256:f8e617f3e7f659edaddc121ec6df50cc50238308ebf5315c779b41a497c9eb11
historical semantic: sha256:efb5924eee13f0c2f2a17381cf823c7e78873ab53925842949525982e96dbb89
historicalSemanticMatch: false
```

Delta commerciale documentato rispetto ai result storici versionati:

```text
Airalo Italy:  29 EUR   → 32 USD
Airalo Europe: 44.5 EUR → 49 USD
```

Holafly e Ubigi restano allineati ai valori/coverage documentati nei checkpoint storici #106/#107. I vecchi raw pack non sono disponibili, quindi non viene dichiarato un byte-level diff o un `packSemanticDiff` diretto contro i vecchi `pack.json`.

Review canonica:

```text
docs/research/EVIDENCE-REPLACEMENT-CANDIDATE-REVIEW-2026-08-12.md
```

## Explicit replacement approval — registrata

La coppia è stata approvata esplicitamente il 15 agosto 2026 dopo il nuovo download e la verifica diretta dell'artifact.

L'approval si riferisce esclusivamente a:

```text
run: 31623841563
artifact id: 9152309259
zip sha256: f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
Italy pack:  pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
Europe pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
```

```text
replacementApproved: true
r2Uploaded: false
d1Mutated: false
```

Result canonico:

```text
docs/research/EVIDENCE-REPLACEMENT-APPROVAL-2026-08-15.md
```

L'approvazione replacement **non autorizza** object upload R2, controlled ingest, claim verification, publication, affiliate activation o deploy.

## Gate dopo replacement approval

Aprire un gate separato per:

```text
stage exact pack + raw bytes create-only in locked R2
→ verify object key / sha256 / byte length / artifact_ref
→ read-only D1 preflight
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
→ separately authorized R2 staging ← current
→ controlled evidence ingest
→ verification provenance bridge
→ bounded verified facts
→ First Money UI materialization
→ canonical /migliore-esim cutover
→ affiliate + measurement gate
→ explicit production deploy
→ first real affiliate click
```

## Freeze

- niente approval implicita per capture differenti;
- niente evidence object upload prima di approval + autorizzazione upload separata;
- niente controlled ingest senza locked/resolvable raw artifacts;
- niente ricostruzione dei pack storici da documentazione;
- niente claim verification automatica;
- niente source auto-registration o metadata overwrite;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente provider winner universale;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente deploy implicito;
- niente pubblicazione autonoma dell'AI.
