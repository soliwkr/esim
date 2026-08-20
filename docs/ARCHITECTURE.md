# Architettura di Senza Roaming

Data di riferimento: **20 agosto 2026**.

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
- I raw evidence artifact production devono essere persistenti, risolvibili e protetti dal retention contract canonico.

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

Assets:

```json
{"run_worker_first":["/*","!/_astro/*"]}
```

Astro possiede le route pubbliche canoniche e preview; API, `/go/*`, Control Room legacy fallback ed execution plane restano backend-owned. API e `/go/*` prevalgono sempre sul catch-all pubblico.

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

Invarianti: noindex, no-store, nessun maintenance token nel browser, attore mutation derivato dall'identità verificata, state machine D1, audit append-only e legacy privata soltanto come fallback finché necessario.

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

Un evidence candidate non equivale a un claim verificato. `unknown` non equivale a `false`, `0` o lista vuota. `partial` sostiene soltanto il sotto-fatto realmente provato.

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

Remote `0021` è applicata e verificata. Il preflight remoto ha confermato che le quattro tabelle sono ancora vuote; il controlled evidence ingest production **non è ancora stato eseguito**.

### Importer boundary

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

### Controlled-ingest read-only preflight

Il gate production separa la pianificazione dal write:

```text
locked R2 GET + exact hash/size verification
→ source_registry SELECT + reconciliation 9/9
→ d1_migrations SELECT + exact 0021 state
→ four upstream table SELECTs
→ deterministic import plan
→ audit artifact
→ STOP
```

Il runner ricostruisce il modello direttamente dai byte R2 approvati e sostituisce ogni provenance locale con `r2://evidence-artifacts/...`. Le query remote ammesse devono iniziare con `SELECT` e vengono rifiutate se contengono keyword di mutation o DDL. Il workflow non genera import SQL, non esegue R2 PUT/overwrite/delete e dichiara soltanto `contents: read` nei permessi GitHub.

Il run remoto `32387491600`, sull'head `e636535684a31c409c456b0d1668e3e9bcd32ce9`, ha verificato 13 object R2, 15 righe source registry, 9/9 identity risolte, migration `0021`, upstream vuoto e un piano `2 / 12 / 72 / 52`. Tutti i boundary flag di mutation, verification, affiliate, publication e deploy sono rimasti `false`.

Il risultato verde non abilita il write: prima di un batch serve un nuovo gate con autorizzazione esplicita e un preflight fresco contro lo stato remoto.

## Durable raw evidence storage

Logical store:

```text
evidence-artifacts
```

R2 production target:

```text
senza-roaming-evidence-artifacts
```

State:

```text
jurisdiction: default
storage class: Standard
r2.dev / managed public access: disabled
custom domains: 0
```

Content addressing:

```text
raw:  v1/raw/sha256/<prefix>/<digest>.<extension>
pack: v1/packs/sha256/<prefix>/<digest>.json
ref:  r2://evidence-artifacts/<object-key>
```

Native Bucket Lock:

```text
id:        evidence-v1-indefinite
prefix:    v1/
enabled:   true
condition: Indefinite
```

L'immutabilità attesa combina content addressing, conditional create, Bucket Lock e divieto operativo di overwrite/delete. Non viene dichiarato legal hold o WORM irrevocabile.

### Approved artifact staging

La coppia replacement approvata è materializzata in R2.

Anchor:

```text
capture run: 31623841563
artifact id: 9152309259
Italy pack:  pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
Europe pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
```

Il primo remote create attempt `32154128831` ha fallito chiuso con Cloudflare error `10028`; i successivi probe read-only `32154558001` e `32154868752` hanno confermato zero target objects e autenticazione S3 valida.

Il retry autorizzato `32156353642` ha usato il trasporto R2 S3 SigV4 con semantica create-only:

```text
If-None-Match: *
```

Risultato:

```text
preflight collisions: 0
created objects:      13
verified objects:     13
post-write verified:  true
```

Inventory:

```text
12 logical raw references
11 unique raw objects
2 pack objects
13 total content-addressed objects
```

Audit canonico:

```text
docs/research/EVIDENCE-R2-STAGING-RESULT-2026-08-18.md
```

L'uso di S3 SigV4 non cambia il contratto ADR-040: il requisito architetturale resta conditional create equivalente a `If-None-Match: *`, content addressing, exact read-back verification e Bucket Lock. Nessun credential o endpoint environment-specific viene versionato.

## Historical pack recovery boundary

I raw originari #106/#107 restano non recuperabili. Il percorso replacement è stato completato con capture completa, raw/provenance review, availability/digest recheck, explicit approval e staging dei byte esatti approvati. Non è consentito ricostruire raw evidence dalla documentazione o riusare l'approval per capture differenti.

## Verification provenance boundary

Prima di automatizzare:

```text
evidence_claim_candidates
→ claim_verifications
```

serve un bridge auditabile e revisioned/append-only che distingua supports, contradicts e supersedes/expires. Una verification non può trasformare un partial in un fatto completo.

## `plans` boundary

`plans` v1 non è ingest target dell'evidence layer perché il modello attuale è troppo loss-prone per pack regionali/source-native. Un eventuale redesign resta separato da evidence storage e verification.

## Consent e measurement

Production usa iubenda + Consent Mode Basic. GTM/GA4 restano bloccati prima del consenso Misurazione previsto dal contratto M6. Ads e affiliate tracking restano disabilitati.

## Production deploy boundary

Il deploy frontend è manual-only e non crea D1, non applica migration remote, non provisiona R2, non carica evidence artifact, non esegue controlled ingest e non attiva automaticamente affiliazioni.

## Publication boundary

La pubblicazione richiede capacità separata con identità verificata, conferma umana, state machine, audit append-only, freshness recheck, idempotenza, rollback/deindicizzazione e test end-to-end. Evidence, draft approval e pubblicazione restano distinti.

## Gate operativo corrente

```text
R2 production provisioning ✅
replacement Italy/Europe approval ✅
locked R2 staging + verification ✅
→ controlled evidence ingest preflight ✅
→ explicit bounded-ingest authorization ← current
→ separately authorized D1 ingest
→ verification provenance bridge
→ bounded verified commercial facts
→ First Money UI materialization
→ canonical /migliore-esim cutover
→ affiliate + measurement gate
→ explicit production deploy
```

## Stop conditions

Non fare senza gate esplicito:

- controlled D1 ingest;
- automatic claim verification;
- `review → published`;
- affiliate activation;
- production deploy;
- FX implicito;
- source auto-registration;
- provider winner universale.
