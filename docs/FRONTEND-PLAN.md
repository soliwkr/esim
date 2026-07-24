# Piano frontend

Data di riferimento: **24 luglio 2026**.

## Decisione

Senza Roaming usa Astro come frontend principale e React soltanto per interfacce fortemente interattive.

```text
Astro
├── sito pubblico content-first
├── layout, navigazione e SEO
├── pagine statiche e on-demand
├── sitemap, robots e 404
└── shell della Control Room

React island
└── applicazione interattiva della Control Room

Custom Cloudflare Worker
├── route ownership e precedenza
├── Cloudflare Access
├── proxy e mutation private autorizzate
├── API e D1
├── Workflows e Container
├── AI Gateway / Vertex
└── gate editoriali e di pubblicazione
```

## Stack operativo

- Astro con adapter Cloudflare;
- React soltanto per la Control Room;
- TypeScript strict;
- Tailwind 4;
- shadcn/ui e Radix;
- validazione runtime;
- D1 server-side;
- smoke `workerd` e Chromium.

## Confini non negoziabili

- il browser non accede direttamente a D1;
- il browser non riceve maintenance token o secret;
- Cloudflare Access protegge la Control Room;
- ogni mutation è una capacità separata;
- nessun componente introduce pubblicazione automatica;
- preview, canonical compiled e live owner sono distinti;
- candidate, release candidate e published sono distinti;
- la legacy resta finché è fallback operativo.

## Route ownership

Il deploy normale resta:

```text
createPublicWorker(activePublicRouteDecision)
activePublicRouteDecision = currentPublicRouteDecision
```

### Matrice attiva

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

### Matrice target, non attiva

```text
Astro:
  home, listing, trust, articoli
  sitemap, robots e 404

Backend:
  /api/*
  /go/*
  legacy Control Room finché necessaria
  execution plane
```

## Renderer e contratti SEO

I componenti pubblici condividono:

```text
preview | canonical
```

- `src/public-seo.ts` produce metadata e JSON-LD;
- `src/public-seo-endpoints.ts` produce sitemap e robots;
- D1 viene letto soltanto server-side;
- righe `review` e `draft` non vengono servite pubblicamente;
- route canoniche e SEO endpoint live restano backend-owned.

## Modello a due track

### Track A — Control Room M4

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
→ rimozione legacy privata
```

### Track B — frontend pubblico M5

```text
preview noindex
→ SEO contract
→ route policy
→ canonical parity
→ sitemap/robots parity
→ catalog audit foundation
→ release candidates reali
→ publication decision
→ cutover apex
```

## Fasi completate

### F0–F3 — Foundation e Control Room

- [x] `apps/web` Astro/React;
- [x] custom Worker;
- [x] shadcn/ui;
- [x] Cloudflare Access;
- [x] letture e parità legacy;
- [x] prima mutation brief.

### F4.0–F4.4 — Frontend pubblico e parità

- [x] shell, trust, homepage e listing preview;
- [x] renderer articolo;
- [x] contratto SEO;
- [x] route policy;
- [x] canonical Astro parity;
- [x] sitemap e robots parity;
- [x] live ownership ancora backend.

## F4.5 — Catalogo pilot M5.6

Scope: `docs/PUBLIC-CATALOG-PILOT-SCOPE.md`.

### Candidate audit foundation

```text
branch feat/public-catalog-pilot-foundation
PR #77
CI applicativa #373 verde
```

Implementato:

- `src/public-catalog-pilot.ts` server-only;
- loader D1 con sole `SELECT`;
- report deterministico selected/excluded;
- latest bundle e latest draft;
- publication gate e approvazioni;
- grounded renderer e provenance;
- freshness di claim e fonti;
- coerenza draft/pagina;
- slug/route safety e collisioni;
- cap massimo quattro;
- manifest creation/validation;
- empty manifest versionato;
- fixture pure;
- smoke sul D1 realmente migrato;
- before/after invariato.

File:

```text
src/public-catalog-pilot.ts
data/public-catalog-pilot.json
scripts/smoke-public-catalog-pilot.mjs
scripts/smoke-public-catalog-pilot-d1.mjs
```

La foundation non introduce UI, route, API o mutation. Non cambia il rendering pubblico.

### Audit remoto e release-candidate preparation

Fase successiva:

```text
safe remote read-only audit
→ blocker report
→ 0–4 real candidates
→ prepare one page at a time
→ materialized review page
→ manifest entry
```

Nessuna pagina viene scelta in anticipo.

### Publication decision

Separata e non autorizzata dalla foundation. Deve decidere se la prima pubblicazione avviene prima, durante o dopo M5.7.

## F4.6 — Cutover apex M5.7

Richiede:

- autorizzazione esplicita;
- modifica minima e reversibile della matrice;
- confronto route, metadata, sitemap, robots e 404;
- provider redirect e publication guardrails preservati;
- rollback documentato;
- nessuna pagina review esposta.

## Cosa non facciamo adesso

- riscrivere l’intero backend;
- pubblicare automaticamente la pagina Cina;
- scegliere pagine senza audit reale;
- generazione massiva o pSEO a template;
- endpoint publish nella foundation;
- Search Console submission;
- analytics prima di CMP e Consent Mode;
- cambio della matrice prima di M5.7;
- rimozione legacy anticipata.
