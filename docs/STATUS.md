# Stato del progetto

Data di riferimento: **12 agosto 2026**.

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
| Controlled evidence ingest | Bloccato | manca ancora un bundle raw approvato e disponibile |
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
source reconciliation                 ✅
production source onboarding 9/9      ✅
local/fixture evidence importer       ✅
remote 0021 schema                    ✅
durable artifact storage contract     ✅
native R2 Bucket Lock contract        ✅
R2 remote read-only preflight         ✅
R2 production provisioning            ✅
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

Read-only preflight:

```text
run: 31588635704
status: absent
issues: []
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

Audit artifact:

```text
id: 9142838561
zip sha256: 4981c73e1f2fe8f3b40ffd9254e54058ff8db90eab331cb6511aa30e1da3772a
retention: 30 giorni
```

Risultato versionato:

```text
docs/research/EVIDENCE-R2-PROVISIONING-RESULT-2026-08-12.md
```

Il provisioning non ha caricato oggetti evidence, non ha scritto D1 e non ha eseguito deploy.

## Durable evidence artifact architecture

Logical store:

```text
evidence-artifacts
```

Content addressing:

```text
raw:  v1/raw/sha256/<prefix>/<digest>.<extension>
pack: v1/packs/sha256/<prefix>/<digest>.json
ref:  r2://evidence-artifacts/<object-key>
```

Il progetto non dichiara legal hold/WORM irrevocabile: la configurazione amministrativa Cloudflare resta modificabile da un attore con privilegi sufficienti.

## Blocker corrente — approved raw artifacts

I bundle raw originari #106/#107 erano locali e ignorati da Git; non risultano recuperabili dagli artifact CI storici.

Recovery read-only già tentata:

```text
run 31313829528
Ubigi Italy: HTTP 403
complete pack: non creato
remote mutation: nessuna
```

Sono ammessi soltanto due percorsi:

```text
A. recuperare i bundle originali approvati
```

oppure:

```text
B. nuova cattura completa
→ raw review
→ semantic comparison
→ explicit replacement approval
```

Non vengono ricostruiti raw artifact dalla documentazione e una replacement capture non è approvata implicitamente dal solo semantic fingerprint.

## Gate immediatamente successivo

Solo dopo la disponibilità di un bundle raw approvato:

```text
stage exact pack + raw bytes in locked R2
→ verify artifact_ref/hash/size
→ D1 read-only preflight
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
→ approved raw pack availability
→ stage locked raw artifacts
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

- niente evidence object upload senza bundle raw approvato;
- niente controlled ingest senza locked/resolvable raw artifacts;
- niente ricostruzione dei pack storici da documentazione;
- niente replacement capture promossa implicitamente;
- niente claim verification automatica;
- niente source auto-registration o metadata overwrite;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente provider winner universale;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente deploy implicito;
- niente pubblicazione autonoma dell'AI.
