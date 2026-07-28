# Architettura di Senza Roaming

Data di riferimento: **28 luglio 2026**.

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
- JavaScript pubblico nullo salvo JSON-LD inerte;
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

Lo stato è stato verificato dalla CI applicativa #397, poi mergiato e certificato
live con PR #82. La matrice target è l'owner corrente dell'apice.

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

Il contratto canonico è:

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

Il workflow production non crea D1 e non applica migration remote. La
risoluzione del binding usa soltanto `d1 list`; l'UUID non viene stampato né
versionato. Le migration remote, quando esplicitamente autorizzate, restano una
procedura separata dal deploy.

Il post-deploy verifica le cinque route M7, preview con `noindex`/`no-store`,
sitemap, robots, published-only, CMP, bootstrap measurement inerte fino al
consenso e Control Room protetta. La correzione è preparata in draft e non
autorizza un deploy.

## Stato verificato

```text
M5.5 SEO/routing parity:  completata
M5.6 remote audit:        verificato live
manifest entries:         0
M5.7 apex cutover:         verificato live
M7 five-route slice:       live sul commit abfe7e…
production workflow:      correzione manual-only in draft
CMP/measurement live:     temporaneamente disattivati dal deploy #62
publication mutation:     non autorizzata
```
