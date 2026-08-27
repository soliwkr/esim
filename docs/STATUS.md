# Stato del progetto

Data di riferimento: **22 agosto 2026**.

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
| Evidence importer | Production bounded ingest verificato | local/fixture + one-shot insert-only fail-closed |
| Upstream evidence schema | Production-ready | `0021`; 4 tabelle, 7 indici, 9 trigger |
| Verification provenance schema | Proposta locale | `0022`; 3 tabelle, 4 indici, 19 trigger, 1 view; non applicata remota |
| Evidence artifact storage | **Staged e verificato** | 13 object content-addressed in R2 locked |
| Replacement evidence | **Approvato esplicitamente** | Italy + Europe byte-identificati |
| Controlled evidence ingest | **Production verificato** | 2 run, 12 snapshot, 72 observation, 52 pending candidate |
| CMP / GTM / GA4 | Live e consent-gated | Consent Mode Basic |
| Affiliazioni | Disabilitate | `AFFILIATE_MODE=disabled` |

## Frontend pubblico e monetizzazione

Il sito è live e indicizzabile, ma non ancora money-ready:

- `/migliore-esim` canonica resta provider-neutral;
- First Money UI resta preview noindex/no-store `/astro-foundation/articoli/migliore-esim`;
- nessun `/go/*`, provider winner o claim commerciale non verificato è live;
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
R2 production provisioning               ✅
Airalo Italy currency drift hardening    ✅
Airalo Europe currency drift hardening   ✅
replacement complete-pair capture        ✅
raw/provenance candidate review          ✅
explicit replacement approval            ✅
approved R2 staging + post-write verify  ✅
controlled-ingest read-only preflight    ✅
explicit bounded-ingest authorization   ✅
bounded D1 ingest + exact post-verify   ✅
verification provenance design #138   ✅
local 0022 migration smoke             ✅
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

Upstream production contiene esclusivamente la coppia approved Italy/Europe, importata e verificata dal run `32396193444`:

```text
capture runs:  2
snapshots:    12
observations: 72
candidates:   52 (pending)
```

`source_registry` è rimasto a 15 righe; `plans` e `claim_verifications` non sono stati scritti.

## Approved replacement anchor

```text
capture run: 31623841563
artifact id: 9152309259
zip sha256: f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
Italy pack:  pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
Europe pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
```

Commercial delta documentato rispetto ai checkpoint storici:

```text
Airalo Italy:  29 EUR   → 32 USD
Airalo Europe: 44.5 EUR → 49 USD
```

Holafly e Ubigi restano allineati ai valori/coverage documentati nei result storici. I vecchi raw pack non sono disponibili, quindi non viene dichiarato un byte-level diff contro i vecchi `pack.json`.

## R2 production state

Bucket:

```text
senza-roaming-evidence-artifacts
```

Contract:

```text
jurisdiction: default
storage class: Standard
r2.dev / managed public access: disabled
custom domains: 0
lock id: evidence-v1-indefinite
lock prefix: v1/
lock condition: Indefinite
```

Content addressing:

```text
raw:  v1/raw/sha256/<prefix>/<digest>.<extension>
pack: v1/packs/sha256/<prefix>/<digest>.json
ref:  r2://evidence-artifacts/<object-key>
```

### Verified staging result

Il primo write attempt, run `32154128831`, ha fallito chiuso sul primo create con `cloudflare_object_create_failed:10028`. Nessuna mutation downstream è stata eseguita.

Read-only recovery/probe:

```text
32154558001  post-failure recheck          success
32154868752  R2 S3 authentication probe    success
```

Retry separatamente autorizzato:

```text
head:                  5d099010c703ea78622cd161f36705e45d3d91f2
run:                   32156353642
transport:             r2-s3-sigv4
conditional create:    If-None-Match: *
preflight collisions:  0
created objects:       13
verified objects:      13
post-write verified:   true
```

Inventory:

```text
logical raw references: 12
unique raw objects:      11
pack objects:             2
total objects:           13
```

Audit artifact:

```text
id: 9331865182
sha256: b91a432cdde585997b271f472a67fdfb16fa088adb11435657054d3e127fdd54
retention: through 2026-11-16
```

Result canonico:

```text
docs/research/EVIDENCE-R2-STAGING-RESULT-2026-08-18.md
```

Boundary verificato:

```text
replacementApproved: true
r2Staged:            true
r2Verified:          true
d1Mutated:           false
claimsVerified:      false
affiliateEnabled:    false
published:           false
deployed:            false
```

## Controlled evidence ingest — preflight remoto chiuso

Il workflow read-only ha verificato lo stato production senza eseguire mutation:

```text
run:                   32387491600
head:                  e636535684a31c409c456b0d1668e3e9bcd32ce9
checked at:            2026-08-20T15:41:16.614Z
R2 objects verified:   13
source registry:       15 rows / 9 identities resolved
D1 migration:          21 / 0021_evidence_upstream_storage.sql
existing D1 rows:      0 runs / 0 snapshots / 0 observations / 0 candidates
planned inserts:       2 runs / 12 snapshots / 72 observations / 52 candidates
D1 mutated:            false
claims verified:       false
affiliate enabled:     false
published:             false
deployed:              false
```

Audit artifact:

```text
id: 9413529042
sha256: fb0d96291e4d8b09312744d8ce46130c375a496dde46120f88a3ce857dc2de94
retention: through 2026-09-19
```

Result canonico:

```text
docs/research/EVIDENCE-CONTROLLED-INGEST-PREFLIGHT-RESULT-2026-08-20.md
```

## Gate corrente — review migration `0022`

Il bounded ingest è chiuso e verificato:

```text
run:                 32396193444
main:                55f0228c03b6604ac6858b0a4d987e0cec3ebe7c
pre-write rows:      0 / 0 / 0 / 0
inserted + verified: 2 / 12 / 72 / 52
post-write plans:    existing_exact
pending inserts:     0 / 0 / 0 / 0
```

Audit artifact:

```text
id:      9416760749
sha256:  4886495527e4b6aeacf6f425c7227345e18ba1ece5f8887fdb6a0f00816b8daa
expires: 2026-11-18T17:11:12Z
result:  docs/research/EVIDENCE-CONTROLLED-INGEST-RESULT-2026-08-20.md
```

Boundary confermato:

```text
claims verified:   false
affiliate enabled: false
published:         false
deployed:          false
```

Il bridge append-only/revisioned v1 è stato mergiato con PR #138. La migration candidate `0022_evidence_verification_provenance.sql` è stata applicata e verificata soltanto su D1 locale: production resta a `21 / 0021` e nessun candidate è ancora un claim verificato. Il gate corrente è la review della proposta; preflight e apply remoti richiedono gate e autorizzazioni separati.

Contratto locale:

```text
human-audited candidate intake
→ immutable revisioned decision
→ supports / contradicts / context links
→ deterministic current head
```

Lo smoke locale conferma che `partial` non diventa `verified` e che `claim_verifications`, `plans` ed editorial candidates restano invariati.

La migration impone candidate inizialmente pending, aggiunge un guard delete sui candidate storici e impedisce eventi audit forgiati fuori dalla transizione di stato canonica.

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
→ controlled-ingest read-only preflight ✅
→ explicit bounded-ingest authorization ✅
→ controlled evidence ingest ✅
→ verification provenance bridge design ✅
→ formal 0022 migration proposal + review ← current
→ bounded verified facts
→ First Money UI materialization
→ canonical /migliore-esim cutover
→ affiliate + measurement gate
→ explicit production deploy
→ first real affiliate click
```

## Freeze

- niente ulteriore D1 mutation senza nuovo gate esplicito;
- niente claim verification automatica;
- niente source auto-registration o metadata overwrite;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente provider winner universale;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente deploy implicito;
- niente pubblicazione autonoma dell'AI.
