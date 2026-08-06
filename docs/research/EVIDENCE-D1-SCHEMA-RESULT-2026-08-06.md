# Evidence D1 upstream schema — risultato locale

Data: **6 agosto 2026**.

## Scope

Questa fase materializza soltanto nel repository e nel D1 locale di test il primo layer upstream accettato da ADR-039:

```text
source_registry
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ evidence_claim_candidates
```

Non introduce importer, source onboarding, runtime ingest, verification bridge, ranking, pubblicazione o deploy.

La migration è versionata come:

```text
migrations/0021_evidence_upstream_storage.sql
```

Il D1 remoto **non viene migrato** in questa fase e resta fino a `0020`.

## Implementazione

`0021` aggiunge quattro tabelle additive:

1. `evidence_capture_runs` — envelope immutabile della capture batch;
2. `evidence_snapshots` — snapshot source-linked e immutabile;
3. `evidence_field_observations` — extraction field-level con coverage state first-class;
4. `evidence_claim_candidates` — candidate upstream separate da `editorial_claim_candidates` e `claim_verifications`.

Il modello conserva separatamente:

- scenario e same capture window;
- source registry identity;
- requested/final URL e redirect chain;
- raw/visible hashes e artifact reference;
- locale, country e currency context;
- raw value, normalized value e locator;
- extractor/normalizer identity;
- `observed | partial | unknown | not_applicable`;
- source-native currency;
- candidate `pending` upstream della verifica.

## Constraint e guardrail

La migration applica:

- FK verso `source_registry` e fra gli oggetti evidence;
- CHECK sui domain enum;
- `json_valid(...)` sulle colonne JSON;
- identity unique per run, snapshot, observation e candidate;
- lookup indexes per scenario/source/subject/status;
- trigger che impediscono UPDATE/DELETE di capture run, snapshot e field observation;
- trigger che impedisce di creare candidate da observation `unknown` o `not_applicable`;
- candidate provenance identity non riscrivibile.

Non modifica:

```text
plans
source_registry
claim_verifications
editorial_claim_candidates
maintenance_queue
```

In particolare `plans` v1 resta single-destination con `destination_id NOT NULL` e `price_eur NOT NULL`; non diventa un evidence ingest target.

## Smoke locale

Script:

```text
scripts/smoke-evidence-d1-schema.mjs
```

Il test crea uno state root Wrangler isolato, applica tutte le migration fino a `0021` soltanto in locale e avvia un Worker di test locale.

La fixture usa le source provider già seedate dalle migration esistenti esclusivamente per provare FK/schema; non registra nuove source.

Forme provate:

```text
capture runs: 2
  - Italy local
  - Europe regional

snapshots: 2
observations: 9
candidates: 3

coverage:
  observed: 4
  partial: 1
  unknown: 2
  not_applicable: 2

source-native currencies:
  EUR
  USD
```

Sono inoltre provati fail-closed:

- JSON invalido;
- coverage state fuori enum;
- candidate status fuori enum (`verified` non è ammesso);
- FK source inesistente;
- duplicate run identity;
- candidate da `unknown`;
- candidate da `not_applicable`;
- UPDATE/DELETE di run, snapshot e observation;
- rewrite dell'identità candidate.

La fixture verifica inoltre che il conteggio delle row in `source_registry` e `claim_verifications` resti invariato e che `plans` v1 non riceva colonne evidence.

## CI

Prima CI tecnica completa sulla PR #110:

```text
head: 6fb0bf8e25e5647972c854bcaba39957484f2936
CI #590: success
```

Gate verificati nello stesso run:

- typecheck;
- production deploy safety contract;
- build Astro/custom Worker;
- `Validate D1 migrations` con `0021`: success;
- research quality + golden evaluation;
- container build/smoke;
- `smoke:runtime`, incluso `smoke:evidence-d1-schema`: success;
- tutte le suite Control Room: success.

## Boundary remota

Questa verifica **non prova né autorizza** l'applicazione di `0021` al D1 remoto.

Stato remoto canonico durante tutta la PR #110:

```text
schema remoto: fino a 0020
0021 remote apply: non eseguito
runtime ingest: none
source onboarding: none
claim_verifications write: none
deploy: none
```

Qualsiasi remote migration richiede un gate separato ed esplicito.

## Gate successivo

Il prossimo scope non è l'importer.

Prima serve il gate separato di **source reconciliation / onboarding**:

```text
pack sourceAuditKey + canonical URL + role/provider
→ exactly one source_registry row
```

Fail closed:

```text
0 match  → source_not_registered
>1 match → source_registry_ambiguous
```

Soltanto dopo source reconciliation potrà essere progettato/implementato l'importer idempotente `pack.json → evidence_*`.
