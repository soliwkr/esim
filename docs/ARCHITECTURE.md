# Architettura di Senza Roaming

Data di riferimento: **6 agosto 2026**.

## Scopo

Senza Roaming è un execution project autonomo per contenuti eSIM. Raccoglie domanda, conserva fonti e claim, governa il ciclo editoriale e serve pagine pubbliche. Non è il sistema operativo generale dello studio.

## Architettura applicativa

```text
Utente / crawler
      │
      ▼
Cloudflare Assets + custom Worker
      ├── /_astro/* → asset statici
      └── /*         → Worker
                         ├── route policy active/current/target
                         ├── Astro handler
                         ├── backend legacy
                         ├── Cloudflare Access
                         ├── API e redirect provider
                         ├── D1
                         ├── Workflows e Container
                         └── AI Gateway → Vertex AI
```

Il deploy usa un solo Worker. La migrazione del frontend non duplica D1, Workflow, Container, AI o gate editoriali.

## Responsabilità

### Astro

- HTML pubblico content-first;
- homepage, listing, trust pages e articoli;
- metadata, Open Graph e JSON-LD;
- sitemap, robots e 404 pubblica nel target;
- shell della Control Room;
- nessun JavaScript applicativo pubblico generale; eccezioni deliberate sono JSON-LD inerte, embed CMP e bootstrap measurement consent-gated;
- React soltanto nell’isola privata realmente interattiva.

### React island

- snapshot e risorse private validate;
- loading, error, retry e guasti parziali;
- tabelle, filtri, form e dialog;
- mutation soltanto nelle fasi autorizzate.

### Backend ed execution plane

- D1 e migrazioni;
- claim, fonti e verifiche;
- Page Readiness ed evidence bundle;
- draft e stati editoriali;
- queue, Workflow, Container e AI;
- API protette;
- redirect provider;
- publication guardrails.

Il browser non accede direttamente a D1.

## Evidence supply chain

Il layer upstream della verità commerciale è separato dai gate editoriali già esistenti.

Contratto già verificato live:

```text
SOURCE
→ immutable EVIDENCE SNAPSHOT
→ deterministic field extraction
→ NORMALIZED DATUM
→ PENDING CLAIM CANDIDATE
→ claim verification / conflict / freshness
→ evidence bundle
→ Page Readiness
→ draft grounded
→ eventuale publication gate umano
```

PR #104 ha provato snapshot immutabile e raw-vs-semantic drift su una source Ubigi reale. PR #106 e #107 hanno generalizzato il contratto a pack multi-provider locale e regionale, con due capture consecutive per pack e `Provider semantic changes: 0`.

### Upstream D1 evidence — ADR-039 / PR #108

PR #108 ha definito e fatto accettare il mapping canonico, senza materializzarlo ancora nel database:

```text
source_registry
      ↓
evidence_capture_runs
      ↓
evidence_snapshots
      ↓
evidence_field_observations
      ↓
evidence_claim_candidates
      ↓
verification gate separato
      ↓
claim_verifications
      ↓
editorial evidence bundle / readiness / draft
```

**Stato:** design accettato e mergiato con PR #108 (`9689dd20e1a5b477a16a7cd938788a4200fe0baf`), CI main #587 `success`; non ancora materializzato. Il D1 remoto resta a `0020`.

Confini della decisione:

- `source_registry` resta l'unico registro canonico delle fonti;
- ogni future snapshot D1 richiede una source reconciliation univoca prima dell'import;
- l'importer non auto-registra URL e non usa la provider root come fallback;
- `evidence_capture_runs` conserva scenario bounded, same capture window, pack identity e semantic fingerprint;
- `evidence_snapshots` conserva requested/final URL, redirect chain, capture context, raw hash e artifact reference;
- `evidence_field_observations` conserva raw/normalized datum, locator, scope, extractor identity e `coverage_state`;
- `coverage_state` è first-class: `observed`, `partial`, `unknown`, `not_applicable`;
- `unknown` non equivale a `false`, `0` o lista vuota;
- `partial` può sostenere soltanto il sotto-fatto realmente provato e deve preservare qualifier/completeness;
- `evidence_claim_candidates` resta separata da `editorial_claim_candidates`, che è brief-scoped;
- una evidence candidate nasce upstream e non è un `claim_verification`;
- `claim_verifications` resta il current verified factual state downstream;
- extraction confidence non equivale a verità commerciale;
- locale, destination e currency context non vengono inferiti l'uno dall'altro;
- price upstream conserva amount + source currency; `price_eur` non viene valorizzato implicitamente;
- hotspot allowed e share limit/period restano separati;
- network/operator statement, radio technology e observed performance restano concetti distinti;
- network regionale country-scoped non viene appiattito;
- URL, raw hash e prezzo non sono identità del piano;
- `plan_type=local` non viene dedotto automaticamente dal solo `destination_coverage.scope=local`;
- conflict ufficiali restano separati per product type, scenario, canale ed effective date;
- performance e routing/VPN richiedono un protocollo osservativo appropriato;
- demand source, monitor e partner API non vengono promossi automaticamente a factual source indipendente.

### `plans` v1 boundary

`plans` v1 non è un ingest target del nuovo evidence layer.

Il contratto attuale è single-destination e richiede `price_eur`; usarlo direttamente perderebbe informazioni osservate nei pack regionali e source-native.

Qualsiasi commercial materialization o `plans-v2` resta una fase separata dopo evidence storage e verification bridge.

### Verification provenance boundary

Prima di automatizzare candidate → `claim_verifications`, una fase separata deve definire una relazione auditabile e append-only/revisioned:

```text
verification decision/revision
↔ evidence candidate(s)
↔ supports | contradicts
```

Una verification `verified` non può promuovere un sotto-fatto partial a completezza non provata.

### Implementation boundary

La prima slice implementativa successiva al design accettato è soltanto schema upstream local-only:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates

+ CHECK/FK/index
+ immutability smoke
+ local migrated-fixture validation
```

Non include source onboarding, importer, runtime ingest, remote migration, claim verification mutation, scheduler, ranking, publication o deploy.

Documenti di dettaglio:

```text
docs/research/EVIDENCE-D1-SCHEMA-MAPPING.md
docs/research/EVIDENCE-SOURCE-RECONCILIATION.md
docs/research/evidence-d1-field-mapping.csv
```

## Entrypoint e routing

Entrypoint reale:

```text
apps/web/src/worker.ts
```

Composizione:

```text
createPublicWorker(activePublicRouteDecision)
```

Cloudflare Assets nella branch M5.7:

```json
{
  "run_worker_first": ["/*", "!/_astro/*"]
}
```

Conseguenze:

- ogni route dinamica raggiunge il custom Worker;
- gli asset compilati Astro restano asset-first;
- il Worker decide Astro o backend tramite la route policy;
- non esistono flag, header o query string capaci di cambiare renderer.

## Matrici di ownership

### Current matrix storica e rollback

```text
Astro:
  /astro-foundation*
  /control-room-foundation*

Backend:
  route canoniche
  /sitemap.xml
  /robots.txt
  /go/*
  /api/*
  legacy Control Room
  asset tecnici e 404
```

Funzione:

```ts
currentPublicRouteDecision(pathname)
```

### Target matrix M5.7

```text
Astro:
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
  /control-room-foundation*

Backend:
  /api/*
  /go/*
  /control-room
  /control-room.js
  /favicon.svg
  /_astro/* come asset diretto
  /astro/* tecniche
  execution plane
```

Funzione:

```ts
targetPublicRouteDecision(pathname)
```

### Cutover M5.7 storico — PR #81

```ts
export const activePublicRouteDecision = targetPublicRouteDecision;
```

Lo stato è stato verificato dalla CI applicativa #397, poi mergiato e certificato live con PR #82. La matrice target è l'owner corrente dell'apice.

### Rollback

```ts
export const activePublicRouteDecision = currentPublicRouteDecision;
```

Il rollback è versionato e richiede nuovo deploy. Non è una scorciatoia runtime.

## Classificazione delle route

`src/public-route-policy.ts` distingue:

```text
preview
control-room-foundation
api
provider-redirect
legacy-control-room
canonical-static
canonical-article
seo-endpoint
technical-asset
public-404
```

Regole di sicurezza:

- namespace preview e Control Room mantengono semantica di prefisso stretta;
- doppi slash iniziali non acquisiscono ownership privilegiata;
- slug articoli sono single-segment, lowercase e validati;
- route riservate non diventano articoli;
- file probe e path tecnici falliscono chiusi;
- `/api/*` e `/go/*` prevalgono sul catch-all pubblico.

## Read model pubblico

D1 viene letto soltanto server-side.

Contratti:

- righe `pages.status='published'` soltanto;
- ordine e limiti deterministici;
- validazione runtime;
- 404 per assente, `review`, `draft` e archived;
- fail-closed per righe published invalide;
- related links published-only;
- nessun dato operativo interno esposto.

La pagina remota `esim-cina-senza-vpn` è `review` e deve quindi restare 404 anche dopo M5.7.

## Render mode condiviso

Componenti pubblici condivisi:

```text
preview | canonical
```

### Preview

```text
namespace /astro-foundation*
robots noindex,nofollow
cache no-store
canonical self-referencing namespaced
banner di isolamento
link namespaced
```

### Canonical

```text
route apex
robots index,follow,max-image-preview:large
cache public,max-age=300
canonical apex
link apex
nessun banner preview
```

La modalità di rendering non cambia la publication eligibility e non può esporre righe non published.

## Contratti SEO

### Metadata e schema

```text
src/public-seo.ts
```

Produce:

- title e description;
- Open Graph;
- `WebSite`;
- `Article`;
- `FAQPage` quando presente;
- serializer JSON-LD sicuro contro terminazione dello script.

### Sitemap e robots

```text
src/public-seo-endpoints.ts
```

Contratti:

- route statiche dalla policy;
- articoli published-only;
- ordine deterministico;
- `lastmod` normalizzato;
- escaping XML;
- GET, HEAD, query string e trailing slash;
- fail-closed senza XML parziale;
- `/go/*`, API, Control Room, preview e 404 esclusi dalla sitemap.

## Control Room privata

```text
browser autenticato
→ Cloudflare Access
→ validazione JWT nell’origine
→ Astro shell
→ React island
→ route server-side
→ D1
```

Nessun maintenance token vive nel browser. Ogni mutation autorizzata deriva l’attore dal JWT e usa state machine e audit D1.

Route private attuali:

```text
/control-room-foundation/api/snapshot
/control-room-foundation/api/draft-detail
/control-room-foundation/api/brief-decision
/control-room-foundation/api/catalog-pilot-audit
```

Tutte applicano no-store, noindex e nosniff.

## Catalogo pilot

```text
candidate
≠ release candidate
≠ published page
```

Pipeline read-only:

```text
D1
→ loadPublicCatalogPilotSnapshot
→ auditPublicCatalogPilot
→ selected/excluded report
→ create/validate manifest
```

Manifest:

```text
data/public-catalog-pilot.json
```

Stato verificato:

```json
{
  "schemaVersion": 1,
  "generatedAt": null,
  "entries": []
}
```

Audit remoto live:

```text
candidateCount: 1
eligibleCount: 0
selectedCount: 0
excludedCount: 1
```

Il manifest vuoto non modifica routing o runtime e non blocca il cutover visuale.

## Publication boundary

M5.7 non introduce:

- mutation D1;
- endpoint o pulsante publish;
- transizione `review → published`;
- allentamento dei gate;
- analytics;
- affiliazioni;
- sitemap submission;
- rimozione del renderer legacy.

La pubblicazione richiede branch separata, identità verificata, conferma, state machine, audit append-only, idempotenza, freshness recheck e rollback.

## Verifica M5.7

La CI applicativa #397 prova il Worker compilato di produzione con matrice target attiva:

- canonical homepage, listing, trust e articoli;
- metadata e JSON-LD;
- sitemap e robots;
- 404, file probe, review e draft hidden;
- API health e maintenance;
- provider redirect;
- preview;
- Control Room e audit privato;
- asset Astro;
- desktop, mobile, tastiera e overflow;
- tutte le suite private.

## Boundary del deploy production

Il contratto canonico attivo è:

```text
workflow_dispatch
→ npm ci
→ preflight M6 + AFFILIATE_MODE=disabled
→ npm run deploy
→ build Astro
→ preparazione CMP e measurement dal contesto Actions
→ risoluzione read-only del binding D1 compilato
→ wrangler deploy
→ smoke live
```

Il workflow production non crea D1 e non applica migration remote. La risoluzione del binding usa soltanto `d1 list`; l'UUID non viene stampato né versionato. Le migration remote, quando esplicitamente autorizzate, restano una procedura separata dal deploy.

Il post-deploy verifica le cinque route M7, preview con `noindex`/`no-store`, sitemap, robots, published-only, CMP, bootstrap measurement inerte fino al consenso e Control Room foundation protetta. La legacy `/control-room` resta verificata separatamente come fallback operativo v3.

La pipeline è stata resa manual-only con PR #99, il contratto Control Room dello smoke è stato corretto con PR #100 e lo stub consent browser con PR #101. Il recovery run `30439227471` sul commit `f2df5cd6ef4bf4784205911e80786f55c28f3dd0` è terminato `success` e non ha eseguito creazione, migration o mutation D1 remote.

La verifica browser reale successiva ha ricertificato:

```text
pre-consenso: Google requests=0
rifiuto + reload: Google requests=0
consenso: GTM-W3LSK9RZ attivato
reload con consenso: GA4 collect HTTP 204, en=page_view
revoca + reload: Google requests=0
```

## Stato verificato

```text
M5.5 SEO/routing parity:       completata
M5.6 remote audit:             verificato live
manifest entries:              0
M5.7 apex cutover:             verificato live
M7 five-route slice:           live
Evidence snapshot #104:        verificato live
Claims Coverage #105:          chiuso
Italy evidence pack #106:      merged; two live captures; semantic changes=0
Europe evidence pack #107:     merged; two live captures; semantic changes=0
Evidence D1 design #108:       merged; accepted; not materialized
D1 remote schema:              fino a 0020
production workflow:           manual-only e verificato end-to-end
CMP/measurement live:          ripristinati e ricertificati
AFFILIATE_MODE:                 disabled
D1 deploy mutations:           nessuna
publication mutation:          non autorizzata
```