# Architettura di Senza Roaming

Data di riferimento: **15 agosto 2026**.

Questo documento descrive l'architettura corrente di `soliwkr/esim`. Lo storico dettagliato delle fasi e delle decisioni resta nel versionamento Git e in `docs/DECISIONS.md`.

## Principi

- Astro è il frontend pubblico principale.
- React è confinato alle interfacce realmente interattive della Control Room.
- Il browser non accede direttamente a D1.
- Il custom Cloudflare Worker resta l'unico entrypoint applicativo production.
- Cloudflare Access protegge la Control Room privata.
- Brief, claim, verification, readiness, draft, materializzazione e pubblicazione restano gate distinti.
- L'AI non pubblica autonomamente.
- Evidence, verità verificata e copy pubblico sono layer distinti.
- Ogni mutation production è esplicita, auditabile e separata dal deploy frontend.
- I raw evidence artifact production devono essere persistenti, risolvibili e protetti dal contratto di retention canonico.

## Topologia runtime

```text
Utente / crawler
      │
      ▼
Cloudflare Assets + custom Worker
      ├── /_astro/* → asset statici
      └── /*         → Worker
                         ├── public route policy
                         ├── Astro handler
                         ├── backend legacy / execution plane
                         ├── Cloudflare Access
                         ├── API e /go/*
                         ├── D1
                         ├── Workflows + Container
                         └── AI Gateway → Vertex AI

Truth Engine
      │
      ├── source_registry → D1
      ├── raw evidence    → private locked R2
      └── evidence state  → D1 upstream tables
```

Il deploy usa un solo Worker. Frontend, API, D1, Workflow, Container e AI non vengono duplicati per la migrazione Astro.

## Frontend pubblico

Astro gestisce HTML pubblico content-first, homepage, hub, trust pages, articoli, metadata, sitemap, robots, 404, shell Control Room e progressive enhancement.

React resta nelle island realmente interattive della Control Room e non è owner di D1, publication policy o evidence truth.

Entrypoint reale:

```text
apps/web/src/worker.ts
```

Composizione:

```text
createPublicWorker(activePublicRouteDecision)
```

Assets:

```json
{
  "run_worker_first": ["/*", "!/_astro/*"]
}
```

### Astro-owned

```text
/
/destinazioni
/guide
/confronti
/metodo
/trasparenza
/privacy
/{slug-published}
/sitemap.xml
/robots.txt
404 pubblica
/astro-foundation*
/control-room-foundation* shell
```

### Backend / execution-plane owned

```text
/api/*
/go/*
/control-room legacy fallback
asset tecnici backend
D1
Workflows
Container
AI Gateway
publication capability
```

API e `/go/*` prevalgono sempre sul catch-all pubblico.

## Preview e canonical

Renderer condiviso:

```text
preview | canonical
```

Preview:

```text
/astro-foundation*
robots: noindex,nofollow
cache: no-store
canonical namespaced
nessuna CMP/GTM/GA4
nessuna publication mutation
```

Canonical:

```text
route apex
robots: index,follow quando eleggibile
cache pubblica breve
canonical apex
CMP reale
measurement inerte fino al consenso previsto
```

Entrambe leggono soltanto contenuto pubblicabile secondo i gate correnti. `review`, `draft`, archived e slug invalidi restano nascosti.

## Control Room privata

```text
browser autenticato
→ Cloudflare Access
→ validazione JWT nell'origine
→ Astro shell
→ React island
→ route server-side
→ D1
```

Invarianti:

- noindex;
- no-store;
- nessun maintenance token nel browser;
- attore delle mutation derivato dall'identità verificata;
- state machine D1;
- audit append-only;
- legacy privata mantenuta soltanto come fallback finché necessario.

## Evidence Truth Engine

### Supply chain canonica

```text
official source
→ source_registry identity
→ raw immutable evidence artifact in locked R2
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ pending evidence_claim_candidates
→ verification / contradiction / expiry
→ claim_verifications
→ evidence bundle
→ Page Readiness
→ grounded materialization
→ publication gate separato
```

Un evidence candidate non equivale a un claim verificato.

`unknown` non equivale a `false`, `0` o lista vuota. `partial` sostiene soltanto il sotto-fatto realmente provato.

### Source registry

Production state verificato:

```text
rows:       15
identities: 9
resolved:   9/9
missing:    0
ambiguous:  0
```

L'importer non auto-registra fonti, non usa provider-root fallback e non remappa redirect implicitamente.

### Upstream D1

Migration production corrente:

```text
0021_evidence_upstream_storage.sql
```

Tabelle:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates
```

Remote `0021` è stata applicata e verificata l'8 agosto 2026.

Schema verificato:

```text
21 migration
4 tabelle upstream
7 indici
9 trigger
```

Il controlled evidence ingest production **non è ancora stato eseguito**.

### Importer boundary

Contratto:

```text
approved pack.json + raw artifacts
→ verify raw/semantic/candidate identity
→ resolve environment source IDs
→ deterministic upstream rows
```

Guardrail:

- source IDs environment-specific, mai hardcodati nei pack;
- artifact hash e byte length verificati;
- candidate content-address verificata;
- existing-key drift blocca;
- `unknown|not_applicable` restano observation-only;
- `observed|partial` soltanto possono generare pending candidate;
- source-native currency preservata;
- nessun FX implicito;
- nessun write in `plans` o `claim_verifications`.

## Durable raw evidence storage

### Logical store

```text
evidence-artifacts
```

### R2 production target

```text
senza-roaming-evidence-artifacts
```

Il bucket è stato provisionato e verificato il **12 agosto 2026** tramite run `31600420207`.

Stato production:

```text
exists: true
jurisdiction: default
storage class: Standard
r2.dev / managed public access: disabled
custom domains: 0
protected lifecycle deletes: 0
```

### Content addressing

```text
raw:
  v1/raw/sha256/<prefix>/<digest>.<extension>

pack:
  v1/packs/sha256/<prefix>/<digest>.json

artifact_ref:
  r2://evidence-artifacts/<object-key>
```

La chiave dipende dai byte, non da provider, URL, prezzo o ambiente.

### Retention contract

Regola native Bucket Lock production verificata:

```text
id:        evidence-v1-indefinite
prefix:    v1/
enabled:   true
condition: Indefinite
```

L'immutabilità attesa combina content addressing, conditional create, Bucket Lock e divieto operativo di overwrite/delete.

Il progetto non dichiara legal hold o WORM irrevocabile: un amministratore Cloudflare con privilegi sufficienti può modificare la configurazione della Bucket Lock.

### Provisioning result

```text
docs/research/EVIDENCE-R2-PROVISIONING-RESULT-2026-08-12.md
```

Il provisioning ha eseguito soltanto:

```text
POST bucket
→ read-only verify
→ PUT exact native Bucket Lock
→ read-only final verify
```

Non ha caricato artifact, non ha mutato D1 e non ha fatto deploy.

## Historical pack recovery boundary

I bundle raw originari dei pack Italy/Europe #106/#107 non erano versionati e non risultano recuperabili dagli artifact CI storici.

Recovery read-only del 9 agosto 2026:

```text
run 31313829528
Ubigi Italy: HTTP 403
complete pack: non creato
remote mutation: nessuna
```

Il percorso replacement è stato completato con:

```text
run 31623841563 complete Italy + Europe capture
→ raw/provenance review
→ artifact availability + ZIP digest recheck
→ explicit replacement approval del 15 agosto 2026
```

L'approval è vincolata al ZIP SHA-256 `f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84` e agli exact pack ID registrati in `docs/research/EVIDENCE-REPLACEMENT-APPROVAL-2026-08-15.md`.

Non è consentito ricostruire raw evidence dalla documentazione, riusare l'approval per una capture differente o procedere allo staging se i byte approvati non sono più scaricabili e verificabili.

## Verification provenance boundary

Prima di automatizzare:

```text
evidence_claim_candidates
→ claim_verifications
```

serve un bridge auditabile e revisioned/append-only che distingua:

```text
supports
contradicts
supersedes/expires
```

Una verification non può trasformare un partial in un fatto completo.

## `plans` boundary

`plans` v1 non è ingest target dell'evidence layer perché il modello attuale è troppo loss-prone per pack regionali/source-native.

Un eventuale redesign `plans` resta separato da evidence storage e verification.

## Consent e measurement

Production usa iubenda + Consent Mode Basic.

Default:

```text
analytics_storage = denied
ad_storage = denied
ad_user_data = denied
ad_personalization = denied
```

GTM/GA4 restano bloccati prima del consenso Misurazione previsto dal contratto M6. Ads e affiliate tracking restano disabilitati.

## Production deploy boundary

Deploy canonico:

```text
workflow_dispatch
→ npm ci
→ production preflight
→ npm run deploy
→ build Astro
→ CMP/measurement config
→ read-only D1 binding resolution
→ wrangler deploy
→ live smoke
```

Il deploy frontend:

- non crea D1;
- non applica migration remote;
- non provisiona R2;
- non carica evidence artifact;
- non esegue controlled ingest;
- non attiva automaticamente affiliazioni.

## Publication boundary

La pubblicazione richiede una capacità separata con identità verificata, conferma umana, state machine, audit append-only, freshness recheck, idempotenza, rollback/deindicizzazione e test end-to-end.

Evidence, draft approval e pubblicazione restano distinti.

## Gate operativo corrente

```text
R2 production provisioning ✅
replacement Italy/Europe approval ✅
→ separately authorized locked R2 artifact staging ← current
→ controlled evidence ingest
→ verification provenance bridge
→ bounded verified commercial facts
→ First Money UI materialization
→ canonical /migliore-esim cutover
→ affiliate + measurement gate
→ explicit production deploy
```

## Stop conditions

Non fare senza gate esplicito:

- evidence object upload senza autorizzazione staging separata;
- controlled D1 ingest;
- approval implicita di capture differenti;
- automatic claim verification;
- `review → published`;
- affiliate activation;
- production deploy;
- FX implicito;
- source auto-registration;
- provider winner universale.
