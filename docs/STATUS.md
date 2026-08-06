# Stato del progetto

Data di riferimento: **6 agosto 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming. Lo storico dettagliato resta nel versionamento Git e nei documenti risultato delle singole milestone.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve Astro |
| Dominio `www` | Da ricontrollare | redirect implementato; checkpoint definitivo ancora aperto |
| Worker e D1 | Operativi | un solo custom Worker; D1 remoto fino a `0020` |
| Workflow e Container | Operativi | ciclo recent-demand verificato end-to-end |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione automatica |
| Control Room nuova | Operativa | read-only completo e mutation già introdotte per slice |
| Control Room legacy | Transitoria | fallback delle mutation residue |
| Frontend pubblico Astro | Live | M5.7 chiusa e verificata |
| M7 on-page foundation | Live | homepage, hub e `/migliore-esim` riallineati senza ranking commerciale |
| Sitemap e robots | Live | endpoint Astro raggiungibili |
| Catalog pilot | Audit live completato | release candidate governate dai gate; nessuna pubblicazione implicita |
| Evidence supply chain | Evidence design accettato; schema implementation next | #106 Italy + #107 Europe verificati live; #108 merged |
| iubenda CMP | Live e ricertificata | reject/grant/reload/revoke verificati |
| GTM e GA4 | Live e consent-gated | Basic Consent Mode; `page_view` verificato |
| Search Console | Collegata | exporter read-only verificato; primi snapshot iniziali ancora poveri |
| Google Ads / remarketing | Disabilitati | fuori scope |
| Affiliazioni | Disabilitate | `AFFILIATE_MODE=disabled` |
| Production deploy | Manual-only | nessuna migration o mutation D1 implicita nel deploy |

## Main corrente

Ultimo merge verificato:

```text
PR #108 — Evidence → D1 schema mapping
merge/main: 9689dd20e1a5b477a16a7cd938788a4200fe0baf
CI main #587: success
```

PR #108 è design-only e non ha introdotto migration, runtime ingest o deploy. ADR-039 è ora accettata, mentre il D1 remoto resta invariato a `0020`.

## Architettura live

```text
Cloudflare Assets
  ├── /_astro/* → asset statici
  └── /*         → custom Worker
                       ├── Astro pubblico
                       ├── Astro shell + React island Control Room
                       ├── backend/API/redirect provider
                       ├── D1
                       ├── Workflows e Container
                       └── AI Gateway → Vertex AI
```

Astro possiede home, listing, trust pages, articoli published-only, sitemap, robots, 404, preview e shell Control Room. API, `/go/*`, legacy privata ed execution plane restano backend-owned.

## Frontend pubblico e SEO

Stato verificato:

- apex su Astro;
- homepage live;
- listing live;
- trust pages live;
- `/migliore-esim` live con metodo decisionale ma senza provider winner, prezzi specifici o ranking automatico;
- sitemap e robots live;
- preview isolate dalle canonical;
- pagine pubbliche alimentate soltanto da contenuti `published` o bridge legacy esplicitamente bounded;
- nessun accesso browser diretto a D1.

La baseline M7 conserva ownership esplicita per homepage e hub e non autorizza nuove pagine commerciali prive di evidence verificata.

## Control Room e governance editoriale

Il modello resta:

```text
segnale
→ brief
→ accettazione umana
→ claim atomici
→ verifica
→ evidence bundle
→ Page Readiness
→ draft grounded
→ decisione umana sul draft
→ gate di pubblicazione separato
```

Regole invarianti:

- AI non pubblica autonomamente;
- draft approvato != pagina pubblicabile;
- evidence insufficiente, contraddetta o scaduta non alimenta testo fattuale;
- Control Room resta privata, `noindex` e `no-store`;
- identità operativa deriva da Cloudflare Access/Worker, non da token nel browser o negli URL;
- audit delle mutation resta append-only.

## Production e measurement

Pipeline production:

```text
workflow_dispatch soltanto
→ preflight fail-closed
→ npm run deploy
→ binding D1 read-only nel deploy
→ nessuna creazione/migration D1
→ smoke live
```

Measurement:

```text
Consent Mode Basic
CMP iubenda
GTM-W3LSK9RZ
GA4 G-GWJ9YPPVJW
Ads: disabled
affiliate tracking: disabled
```

Nessun GTM/GA4 parte prima del consenso alla Misurazione. Preview, Control Room e route tecniche restano escluse.

## Evidence supply chain — stato verificato

### Source Universe / snapshot / claims coverage

Chiusi:

```text
PR #103 — Source Universe Audit
PR #104 — immutable evidence snapshot spike
PR #105 — Claims Coverage Audit
```

Contratto verificato:

```text
SOURCE
→ immutable EVIDENCE SNAPSHOT
→ deterministic field extraction
→ NORMALIZED DATUM
→ PENDING CLAIM CANDIDATE
→ verification/conflict/freshness gates
```

`source_registry` resta il registro canonico delle fonti; un URL vivo non sostituisce uno snapshot storico.

### PR #106 — Italy local comparison evidence pack

Mergiata e verificata live.

Scenario:

```text
Italy
10-day trip
high data
hotspot required
Airalo / Holafly / Ubigi
```

Due capture reali consecutive:

```text
first pack:  9256b180cc820ce22dfc0351fca7c7bf2406fe5903a4909c5c43d0d53e0c1433
second pack: add5664ab7e2f03ab84560ffb20e5141a1bf096c8d0fcf77ba8807634f9be0a9
semantic fingerprint: ba819d051bb73a1690c64520c537579b04c0ad2d73cdb6626a2e6c655bf678f8
Provider semantic changes: 0
ranking: not_computed
```

Forme osservate:

- local destination coverage;
- source-native EUR/USD;
- finite data vs unlimited + FUP;
- hotspot allowed separato da share limit;
- activation policy plan-specific;
- network `observed/partial/unknown`;
- radio technology separata da network;
- `unknown` e `not_applicable` preservati.

Documento:

```text
docs/research/ITALY-COMPARISON-EVIDENCE-PACK-RESULT-2026-08-05.md
```

### PR #107 — Europe regional comparison evidence pack

Mergiata con:

```text
4480141d8debcff4ebe0538251ed1d1af9a81597
```

Scenario:

```text
Europe
14-day trip
Italy + France + Spain
high data
hotspot required
Airalo / Holafly / Ubigi
```

Due capture reali consecutive:

```text
first pack:  23f36f8eac4314fc4c0bffc9a60d21fb9509f563b7caef89719a7fb0d5efa5dd
second pack: d53bd50b002b6dcf1f5bcd3fc345a2145fe67a325382555720bddd466eb1d144
semantic fingerprint: efb5924eee13f0c2f2a17381cf823c7e78873ab53925842949525982e96dbb89
Provider semantic changes: 0
ranking: not_computed
```

Il live ha inoltre dimostrato:

- `plan_type=regional` può essere evidence separata;
- aggregate country count non prova membership dei singoli Paesi;
- regional coverage può restare `partial` o `unknown`;
- operatori regionali non vanno appiattiti quando l'attribuzione è country-scoped;
- mixed source currency resta nativa;
- deep-link URL non è identità stabile del piano;
- raw drift non equivale a commercial semantic drift.

Documento:

```text
docs/research/EUROPE-REGIONAL-EVIDENCE-PACK-RESULT-2026-08-05.md
```

### Stop condition evidence exploration

L'esplorazione con nuovi evidence pack è chiusa.

Non è emerso un difetto strutturale che giustifichi un terzo pack prima del mapping D1.

## PR #108 — Evidence → D1 schema mapping

Stato:

```text
merged
accepted design
merge/main: 9689dd20e1a5b477a16a7cd938788a4200fe0baf
CI main #587: success
no migration
no D1 write
no runtime ingest
no deploy
```

Design accettato:

```text
source_registry
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ evidence_claim_candidates
→ separate verification gate
→ claim_verifications
```

Boundary principali:

- `source_registry` resta l'unico source registry canonico;
- source del pack deve mappare a una sola row registrata prima dell'import;
- importer futuro non auto-registra URL;
- `editorial_claim_candidates` resta brief-scoped e separata;
- `plans` v1 non è un evidence-ingest target;
- capture run preserva scenario, same-window context, pack identity e semantic fingerprint;
- snapshot/observation sono progettati come immutabili;
- `coverage_state` è first-class: `observed`, `partial`, `unknown`, `not_applicable`;
- `plan_type=local` non viene dedotto dal solo `destination_coverage.scope=local`;
- source-native price resta `{amount,currency}`;
- network country-scoped non viene appiattito;
- URL/prezzo/raw hash non definiscono plan identity;
- `claim_verifications` resta current verified state downstream;
- verification provenance bridge resta un gate successivo separato.

Documenti di design:

```text
docs/research/EVIDENCE-D1-SCHEMA-MAPPING.md
docs/research/EVIDENCE-SOURCE-RECONCILIATION.md
docs/research/evidence-d1-field-mapping.csv
```

ADR accettata:

```text
ADR-039 — Upstream evidence D1 separato da catalogo e workflow editoriale
```

## D1 — boundary attuale

Schema remoto resta fino a:

```text
0020
```

PR #108 non ha creato `0021`.

La tabella `plans` v1 resta invariata e non riceve evidence importata.

Nessuna source, snapshot, candidate o claim verification dei pack #106/#107 è stata scritta in D1.

## Prossimo gate — schema upstream local-only

La prima implementation slice è una branch separata, schema-only e local-only:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates

+ CHECK/FK/index
+ immutability smoke
+ local migrated-fixture validation
```

Ancora fuori scope in quella slice:

```text
remote migration
runtime ingest
source onboarding
pack import
claim verification mutation
maintenance queue
scheduler
plans redesign
ranking
publication
deploy
```

## Altri checkpoint aperti

- ricontrollo definitivo redirect `www`;
- osservazione Search Console/GA4 su dati più maturi;
- mutation M4 residue e permanenza legacy finché serve come fallback;
- nessuna attivazione affiliate finché quality, disclosure e measurement dedicato non sono progettati.

## Freeze immediato

- niente deploy pubblico fuori da pipeline esplicita;
- niente migration D1 remota implicita;
- niente auto-registration di fonti catturate;
- niente FX implicito;
- niente `unknown → false/0`;
- niente ranking/provider winner;
- niente pubblicazione automatica;
- niente accesso browser diretto a D1;
- niente secret o token negli URL, bundle o repository;
- niente rimozione legacy finché i fallback operativi servono.