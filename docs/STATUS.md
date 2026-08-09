# Stato del progetto

Data di riferimento: **9 agosto 2026**.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve Astro |
| Dominio `www` | Da ricontrollare | redirect implementato; checkpoint definitivo aperto |
| Worker | Operativo | deploy production manual-only |
| D1 remoto | Operativo fino a `0021` | upstream evidence schema applicato e verificato |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione autonoma |
| Control Room | Operativa | read-only completo + prime mutation; legacy ancora fallback |
| Frontend pubblico Astro | Live | homepage, hub, trust pages, routing published-only |
| M7 SEO foundation | Live | ownership e on-page baseline applicate |
| First Money UI | Preview mergiata | canonical `/migliore-esim` invariata |
| Evidence packs | Storicamente verificati live | Italy + Europe; raw bundle originali non versionati |
| Source registry | Production-ready | 15 righe; 9/9 identity risolte |
| Evidence importer | Local/fixture verificato | idempotente e fail-closed |
| Upstream evidence schema | Production-ready | `0021` applicata; 4 tabelle, 7 indici, 9 trigger |
| Evidence artifact storage | Design/local gate | R2 privato content-addressed; provisioning remoto non autorizzato |
| Controlled evidence ingest | Bloccato | richiede artifact storage persistente + bundle raw approvati |
| CMP / GTM / GA4 | Live e consent-gated | Consent Mode Basic |
| Affiliazioni | Disabilitate | `AFFILIATE_MODE=disabled` |

## Stato commerciale pubblico

Il sito è live e indicizzabile, ma non ancora money-ready:

- `/migliore-esim` canonica resta provider-neutral;
- la First Money UI vive nella preview noindex/no-store `/astro-foundation/articoli/migliore-esim`;
- nessun `/go/*`, provider winner o claim commerciale non verificato è live;
- affiliate tracking resta disabilitato;
- gli evidence slot non sono ancora materializzati.

## Evidence supply chain

Contratto:

```text
source_registry
→ durable raw artifact
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ pending evidence_claim_candidates
→ verification / conflict / freshness
→ evidence bundle
→ Page Readiness
→ grounded page
→ publication gate separato
```

Invarianti:

- missing evidence non equivale a false;
- `partial` e `unknown` restano stati reali;
- nessun FX implicito;
- hotspot allowed e share limit restano distinti;
- ranking non appartiene al layer evidence;
- un pending candidate non è un claim verificato;
- `artifact_ref` deve essere risolvibile a raw bytes persistenti verificabili con `body_sha256`.

## Source identity e onboarding — chiusi

Production:

```text
source_registry rows: 15
manifest identities: 9
resolved:            9
missing:             0
ambiguous:           0
readyForImporter:    true
```

Documento:

```text
docs/research/EVIDENCE-SOURCE-REGISTRY-REMOTE-ONBOARDING-RESULT-2026-08-07.md
```

## Importer local/fixture — chiuso

PR #124 e CI #651 hanno verificato:

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
- artifact e candidate identity fail-closed;
- existing-key drift blocca;
- `unknown|not_applicable` non producono candidate;
- EUR/USD source-native preservati;
- provenance multi-source preservata;
- `source_registry`, `claim_verifications`, `plans` invariati;
- remote CLI rifiutata.

Documento:

```text
docs/research/EVIDENCE-PACK-IMPORTER-LOCAL-RESULT-2026-08-08.md
```

## Remote `0021` — chiusa

Gate implementato con PR #125:

```text
CI #657: success
merge: 1bc46e4a49fd0d50c1b4648083ea08a086033918
```

Esecuzione remota:

```text
workflow run: 31260773468
preflight:    remote 0001–0020, sole pending 0021
apply:        0021_evidence_upstream_storage.sql ✅
post-verify:  21 migration, 4 tabelle, 7 indici, 9 trigger
```

PR #126 ha chiuso il checkpoint canonico; post-merge CI #660 è verde sul main `6fec173d438aa7e4d584acd8092b4f6e42470c4d`.

Source registry ricontrollata 9/9 prima dell'apply.

Nello stesso gate non sono stati eseguiti ingest, claim write, pubblicazione, affiliate activation o deploy.

Documento:

```text
docs/research/EVIDENCE-REMOTE-0021-RESULT-2026-08-08.md
```

## Evidence artifact storage — gate emerso prima dell'ingest

Il mapping D1 richiede che `evidence_snapshots.artifact_ref` sia risolvibile insieme a `body_sha256`. I pack storici #106/#107 erano stati salvati come artifact locali create-only, ignorati da Git; il design #108 non aveva ancora scelto lo storage persistente.

Decisione della branch corrente:

```text
private Cloudflare R2
+ content-addressed SHA-256 keys
+ create-only conditional write
+ no overwrite/delete nel percorso operativo
```

Forma logica:

```text
raw:  r2://evidence-artifacts/v1/raw/sha256/<prefix>/<digest>.<ext>
pack: r2://evidence-artifacts/v1/packs/sha256/<prefix>/<digest>.json
```

R2 non viene dichiarato WORM/Object Lock. L'immutabilità è applicativa/content-addressed.

Questa branch non crea bucket, credential o oggetti remoti.

Documento:

```text
docs/research/EVIDENCE-ARTIFACT-STORAGE.md
```

## Recovery dei pack storici — blocker reale

I result Italia/Europa conservano pack ID e semantic fingerprint, ma i bundle completi `pack.json + sources/` non risultano recuperabili dal repository o dagli artifact CI storici.

È stato tentato un recovery read-only il 9 agosto 2026 con gli stessi runner canonici su GitHub Actions:

```text
run: 31313829528
Italy capture: failed closed
reason: ubigi-italy-plan HTTP 403
artifact completo: non creato
D1 write: nessuna
```

Non vengono usati workaround di scraping, dati ricostruiti dalla documentazione o diagnostici parziali.

Una nuova cattura semanticamente equivalente non è automaticamente l'identity raw storica approvata.

## Gate corrente

Il percorso immediato è ora:

```text
artifact storage contract CI
→ explicit remote R2 provisioning authorization
→ private/create-only storage verification
→ recover original Italy/Europe bundles OR approve replacement captures
→ stage pack + raw bytes in R2
→ separately controlled D1 evidence ingest
→ deterministic post-ingest audit
```

Il controlled ingest già autorizzato non viene eseguito finché le sue precondizioni di provenance non sono soddisfatte.

## Percorso verso il primo click affiliate

Gate chiusi:

```text
source reconciliation ✅
production source onboarding 9/9 ✅
local/fixture importer ✅
remote 0021 ✅
```

Gate emerso:

```text
durable artifact provenance ← current
```

Percorso restante:

```text
R2 artifact gate
→ approved raw pack availability
→ controlled evidence ingest
→ verification provenance
→ bounded verified commercial facts
→ First Money UI materialization
→ canonical /migliore-esim cutover
→ affiliate + measurement gate
→ manual production deploy
→ first real affiliate click
```

## Freeze

- niente R2 provisioning remoto senza autorizzazione esplicita;
- niente controlled ingest con `artifact_ref` effimero o non risolvibile;
- niente ricostruzione dei pack storici da documentazione o diagnostici parziali;
- niente replacement capture promossa automaticamente a pack approvato;
- niente `claim_verifications` automatiche;
- niente deploy implicito;
- niente source auto-registration o metadata overwrite;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente provider winner universale;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente pubblicazione autonoma dell'AI.
