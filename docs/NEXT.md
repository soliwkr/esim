# Prossime azioni

Ultimo aggiornamento: **12 agosto 2026**.

## Gate corrente — R2 evidence provisioning readiness

Checkpoint chiusi:

```text
source reconciliation                 ✅
production source onboarding 9/9      ✅
local/fixture importer                ✅
remote 0021                           ✅
durable artifact storage contract     ✅
native R2 Bucket Lock contract        ✅
```

Production evidence upstream resta vuoto: nessun pack è stato ancora ingerito.

## Provisioning gate in chiusura

Target reale:

```text
senza-roaming-evidence-artifacts
```

Logical store:

```text
evidence-artifacts
```

Contratto remoto richiesto:

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

Tooling:

```text
research/evidence/r2-provisioning-policy.json
scripts/evidence-r2-provisioning-gate.mjs
scripts/smoke-evidence-r2-provisioning-gate.mjs
.github/workflows/evidence-r2-provisioning.yml
docs/research/EVIDENCE-R2-PROVISIONING-GATE.md
```

Il workflow è manual-only e separa esplicitamente lettura e mutation:

```text
operation = preflight | provision
expected_main_sha = <exact current main SHA>

preflight → confirmation vuota
provision → confirmation = PROVISION_EVIDENCE_R2
```

Un run `preflight` non può eseguire gli step condizionati di provisioning.

### Invarianti

Bucket assente:

```text
read-only preflight
→ create eligible
```

Bucket già exact-compatible:

```text
read-only preflight
→ already provisioned
→ zero mutation
```

Bucket già esistente ma driftato:

```text
read-only preflight
→ BLOCK
→ zero repair mutation
```

Drift bloccanti:

- `r2.dev` enabled;
- custom domain presente;
- jurisdiction/storage class diversa;
- native lock mancante, extra o diversa;
- lifecycle delete che si sovrappone a `v1/`.

Create path consentito soltanto da `operation=provision` separatamente autorizzata:

```text
POST bucket
→ read-only pre-lock verification
→ PUT exact native Bucket Lock
→ read-only final verification
```

Non appartengono al provisioning gate:

```text
object upload
DELETE
managed-domain mutation
custom-domain mutation
lifecycle mutation
D1 mutation
controlled ingest
deploy
```

## Passo immediatamente successivo al merge

Eseguire **soltanto un preflight remoto read-only** del target R2:

```text
operation = preflight
expected_main_sha = exact current main SHA
confirmation = <empty>
```

Obiettivo:

```text
bucket absent
OR exact-compatible
OR blocked-existing-state
```

Questo read non autorizza mutation.

### Se il bucket è assente

Fermarsi e richiedere autorizzazione esplicita per:

```text
operation = provision
confirmation = PROVISION_EVIDENCE_R2

create private Standard/default bucket
→ verify r2.dev disabled
→ verify zero custom domains
→ verify zero protected lifecycle deletes
→ set exact Indefinite lock on v1/
→ read-only final verify
```

### Se è già compatible

Nessuna create/config mutation è necessaria. Documentare il target e passare al gate artifact availability.

### Se è driftato

Non riparare automaticamente. Documentare le differenze e aprire uno scope amministrativo separato.

## Artifact availability blocker

I bundle raw originari Italy/Europe #106/#107 non sono presenti nel repository o negli artifact CI storici.

Recovery read-only:

```text
run: 31313829528
Ubigi Italy: HTTP 403
complete pack: none
remote mutation: none
```

Sono ammessi soltanto due percorsi:

```text
A. recuperare i bundle originali
```

oppure:

```text
B. nuova cattura completa
→ raw review
→ semantic comparison
→ explicit replacement approval
```

Nessun diagnostic parziale viene promosso a raw evidence.

## Gate dopo storage + artifact availability

```text
stage exact pack + raw bytes in locked R2
→ verify artifact_ref/hash/size
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

Nessun ranking, canonical cutover, affiliate activation o deploy nello stesso gate.

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
R2 provisioning gate               ← current
→ remote R2 read-only preflight
→ if needed: separately authorized R2 provisioning
→ approved raw pack availability
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

- niente R2 mutation prima di autorizzazione esplicita quando necessaria;
- niente upload evidence nello stesso provisioning run;
- niente auto-repair di bucket driftati;
- niente controlled ingest senza locked/resolvable raw artifacts;
- niente ricostruzione dei pack storici dalla documentazione;
- niente replacement capture approvata implicitamente;
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
