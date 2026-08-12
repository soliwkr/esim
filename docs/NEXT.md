# Prossime azioni

Ultimo aggiornamento: **12 agosto 2026**.

## Gate corrente — approved raw evidence availability

Checkpoint chiusi:

```text
source reconciliation                 ✅
production source onboarding 9/9      ✅
local/fixture importer                ✅
remote 0021                           ✅
durable artifact storage contract     ✅
native R2 Bucket Lock contract        ✅
remote R2 read-only preflight          ✅
remote R2 provisioning                 ✅
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

Nessun evidence object è stato caricato durante il provisioning.

Risultato canonico:

```text
docs/research/EVIDENCE-R2-PROVISIONING-RESULT-2026-08-12.md
```

## Blocker immediato — bundle raw Italy/Europe

I bundle raw originari #106/#107 non sono presenti nel repository o negli artifact CI storici.

Recovery già tentata:

```text
run: 31313829528
Ubigi Italy: HTTP 403
complete pack: none
remote mutation: none
```

Sono ammessi soltanto due percorsi:

### A. Recupero degli originali

```text
recover original approved bundle
→ verify exact raw identities
→ stage in locked R2
```

### B. Replacement capture

```text
new complete capture
→ raw review
→ semantic comparison
→ explicit replacement approval
→ stage in locked R2
```

Una nuova capture non diventa automaticamente approved soltanto perché conserva lo stesso semantic fingerprint.

Nessun diagnostic parziale viene promosso a raw evidence.

## Gate dopo approved raw availability

```text
stage exact pack + raw bytes in locked R2
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
→ approved raw pack availability  ← current
→ locked artifact staging
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

- niente evidence upload senza approved raw bundle;
- niente ricostruzione dei pack storici dalla documentazione;
- niente replacement capture approvata implicitamente;
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
