# Stato del progetto

Data di riferimento: **9 agosto 2026**.

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
| Evidence packs | Storicamente verificati live | Italy + Europe; bundle raw originali non versionati |
| Source registry | Production-ready | 15 righe; 9/9 identity risolte |
| Evidence importer | Local/fixture verificato | idempotente e fail-closed |
| Upstream evidence schema | Production-ready | `0021`; 4 tabelle, 7 indici, 9 trigger |
| Evidence artifact storage | Provisioning gate in preparazione | R2 privato, content-addressed + Bucket Lock canonica |
| R2 production target | Stato remoto non ancora preflighted | nessuna mutation R2 eseguita dal progetto in questa fase |
| Controlled evidence ingest | Bloccato | richiede storage verificato + bundle raw approvati |
| CMP / GTM / GA4 | Live e consent-gated | Consent Mode Basic |
| Affiliazioni | Disabilitate | `AFFILIATE_MODE=disabled` |

## Frontend pubblico e monetizzazione

Il sito è live e indicizzabile, ma non ancora money-ready:

- `/migliore-esim` canonica resta provider-neutral;
- First Money UI disponibile come preview noindex/no-store `/astro-foundation/articoli/migliore-esim`;
- nessun `/go/*`, provider winner o claim commerciale non verificato nella preview;
- affiliate tracking disabilitato;
- nessun deploy money-ready eseguito.

## Truth Engine — gate chiusi

```text
source reconciliation                 ✅
production source onboarding 9/9      ✅
local/fixture evidence importer       ✅
remote 0021 schema                    ✅
durable artifact storage contract     ✅
native R2 Bucket Lock contract        ✅
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

## Importer local/fixture

PR #124 ha verificato:

```text
first import:
  2 runs
  12 snapshots
  18 observations
  8 pending candidates

exact rerun:
  0 runs
  0 snapshots
  0 observations
  0 candidates
```

Guardrail:

- source IDs risolti dall'ambiente;
- artifact hash e candidate content-address fail-closed;
- existing-key drift blocca;
- `unknown|not_applicable` non diventano candidate;
- `partial` resta bounded;
- EUR/USD restano source-native;
- provenance multi-source preservata;
- nessun write in `plans` o `claim_verifications`;
- nessun remote ingest implicito.

## Durable evidence artifact architecture

Logical store:

```text
evidence-artifacts
```

Target R2 reale:

```text
senza-roaming-evidence-artifacts
```

Content addressing:

```text
raw:  v1/raw/sha256/<prefix>/<digest>.<extension>
pack: v1/packs/sha256/<prefix>/<digest>.json
ref:  r2://evidence-artifacts/<object-key>
```

Production contract:

```text
private bucket
jurisdiction: default
storage class: Standard
r2.dev: disabled
custom domains: 0
no lifecycle delete overlapping v1/
```

Native Bucket Lock canonica:

```text
id:        evidence-v1-indefinite
prefix:    v1/
enabled:   true
condition: Indefinite
```

Il progetto non dichiara legal hold/WORM irrevocabile: la configurazione amministrativa Cloudflare resta modificabile da un attore con privilegi sufficienti.

## R2 provisioning gate

Il repository sta preparando un workflow manual-only e fail-closed:

```text
.github/workflows/evidence-r2-provisioning.yml
```

Target policy:

```text
research/evidence/r2-provisioning-policy.json
```

Authorization boundary:

```text
workflow_dispatch
+ exact main SHA
+ confirmation PROVISION_EVIDENCE_R2
```

Preflight behavior:

```text
bucket absent
→ eligible for create

bucket existing + exact-compatible
→ verified no-op

bucket existing + any drift
→ stop read-only
```

Create path ammesso:

```text
POST create bucket
→ read-only verify private/default/Standard/no domains/no protected delete lifecycle
→ PUT exact native Bucket Lock
→ read-only final verification
```

Il gate non contiene:

```text
object upload
DELETE
public-domain mutation
lifecycle mutation
D1 mutation
deploy
```

**Nessun provisioning R2 remoto è ancora autorizzato o eseguito da questa fase.**

## Historical evidence pack blocker

I bundle raw originari #106/#107 erano locali e ignorati da Git; non risultano recuperabili dagli artifact CI storici.

Recovery read-only:

```text
run 31313829528
Ubigi Italy: HTTP 403
complete pack: non creato
remote mutation: nessuna
```

Non vengono ricostruiti raw artifact dalla documentazione e una replacement capture non è approvata implicitamente dal solo semantic fingerprint.

## Gate corrente

```text
R2 provisioning gate CI + merge
→ remote R2 read-only preflight
→ explicit provisioning authorization if mutation is required
→ private locked store verification
→ approved raw Italy/Europe bundle availability
→ stage exact artifacts
→ controlled evidence ingest
```

Il preflight R2 remoto successivo è read-only. La create/configuration del bucket resta una mutation separata.

## Percorso verso il primo click affiliate

```text
source reconciliation             ✅
production source onboarding      ✅
local importer                     ✅
remote 0021                        ✅
artifact storage contract          ✅
R2 provisioning gate               ← current
→ remote storage verification/provisioning
→ approved raw pack availability
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

- niente provisioning R2 remoto senza autorizzazione esplicita quando richiede mutation;
- niente evidence object upload nello stesso provisioning gate;
- niente controlled ingest con artifact effimeri/non risolvibili;
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
