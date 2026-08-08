# Stato del progetto

Data di riferimento: **8 agosto 2026**.

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
| Evidence packs | Verificati live | Italy + Europe |
| Source registry | Production-ready | 15 righe; 9/9 identity risolte |
| Evidence importer | Local/fixture verificato | idempotente e fail-closed |
| Upstream evidence schema | Production-ready | `0021` applicata; 4 tabelle, 7 indici, 9 trigger |
| Controlled evidence ingest | Non eseguito | prossimo gate, autorizzazione separata |
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
- un pending candidate non è un claim verificato.

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

Source registry ricontrollata 9/9 prima dell'apply.

Nello stesso gate non sono stati eseguiti ingest, claim write, pubblicazione, affiliate activation o deploy.

Documento:

```text
docs/research/EVIDENCE-REMOTE-0021-RESULT-2026-08-08.md
```

## Gate corrente — controlled evidence ingest

Il prossimo passo richiede autorizzazione separata:

```text
approved Italy + Europe packs
→ remote source resolution 9/9
→ artifact/candidate identity preflight
→ bounded idempotent ingest
→ deterministic post-ingest audit
```

Scope obbligatorio:

- soltanto i due pack approvati;
- nessuna source auto-registration;
- nessun `claim_verifications` write;
- nessun ranking, publication o deploy;
- nessun overwrite di righe esistenti;
- stop immediato su drift o partial state.

## Percorso verso il primo click affiliate

Gate chiusi:

```text
source reconciliation ✅
production source onboarding 9/9 ✅
local/fixture importer ✅
remote 0021 ✅
```

Percorso restante:

```text
controlled evidence ingest
→ verification provenance
→ bounded verified commercial facts
→ First Money UI materialization
→ canonical /migliore-esim cutover
→ affiliate + measurement gate
→ manual production deploy
→ first real affiliate click
```

## Freeze

- niente controlled ingest senza nuova autorizzazione esplicita;
- niente `claim_verifications` automatiche;
- niente deploy implicito;
- niente source auto-registration o metadata overwrite;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente provider winner universale;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente pubblicazione autonoma dell'AI.
