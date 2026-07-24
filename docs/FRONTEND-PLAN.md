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
├── API
├── D1
├── Workflows e Container
├── AI Gateway / Vertex
└── gate editoriali e di pubblicazione
```

Il Worker non viene usato per creare nuove interfacce applicative tramite stringhe HTML, CSS o JavaScript.

## Stack operativo

- Astro con adapter Cloudflare;
- React soltanto per la Control Room e isole realmente interattive;
- TypeScript strict;
- Tailwind 4;
- shadcn/ui e primitive Radix;
- Lucide;
- validazione runtime dei payload;
- D1 server-side;
- smoke `workerd` e Chromium.

## Confini non negoziabili

- il browser non accede direttamente a D1;
- il browser non riceve maintenance token o secret;
- Cloudflare Access protegge la Control Room;
- l’attore delle mutation deriva dall’identità verificata;
- ogni mutation è una capacità separata;
- nessun componente introduce pubblicazione automatica;
- una preview non equivale a un cutover;
- owner target e owner live restano distinti;
- candidate, release candidate e published restano distinti;
- la legacy non viene rimossa finché è un fallback operativo.

## Integrazione Cloudflare

```text
richiesta
→ apps/web/src/worker.ts
→ activePublicRouteDecision
→ Access guard per /control-room-foundation*
→ handler Astro per route Astro-owned
→ backend per route backend-owned
```

Il Worker espone:

```text
createPublicWorker(routeDecision)
```

Il deploy normale resta:

```text
createPublicWorker(activePublicRouteDecision)
activePublicRouteDecision = currentPublicRouteDecision
```

La factory viene usata dagli smoke locali per provare matrici target limitate senza distribuire flag o route di test.

## Matrice attiva

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
  asset tecnici
  articolo fallback e 404
```

## Matrice target, non attiva

```text
Astro:
  home, listing, trust, articoli
  sitemap, robots e 404 pubblica

Backend:
  /api/*
  /go/*
  legacy Control Room finché necessaria
  D1, Workflow, Container, AI e gate editoriali
```

Il cutover richiede una PR M5.7 separata.

## Renderer pubblico

I componenti condividono:

```text
preview | canonical
```

### Preview

- namespace `/astro-foundation`;
- noindex e no-store;
- banner di isolamento;
- link interni namespaced;
- esclusione dalla sitemap.

### Canonical

- URL apex;
- link interni canonici;
- robots indicizzabili sulle risposte valide;
- cache pubblica;
- nessun copy preview.

Le route canoniche Astro sono compilate e testate, ma non ancora live-owned.

## Contratti SEO

### Pagine

`src/public-seo.ts` produce metadata, Open Graph e JSON-LD condivisi.

### Sitemap e robots

`src/public-seo-endpoints.ts` gestisce route statiche, pagine published, validazione, XML, robots e fail-closed.

Backend legacy e Astro delegano allo stesso contratto. PR #75 è mergiata con CI finale #365 verde.

## Modello a due track

### Track A — Control Room M4

```text
letture complete
→ decisione brief
→ conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
→ rimozione legacy privata
```

### Track B — frontend pubblico M5

```text
preview noindex
→ contratto SEO condiviso
→ route policy
→ canonical parity
→ sitemap/robots parity
→ catalog pilot release candidates
→ publication decision separata
→ cutover apex separato
```

Una branch appartiene a una sola track.

## Fasi completate

### F0–F3 — Foundation e Control Room

- [x] `apps/web` Astro/React;
- [x] custom Worker;
- [x] shadcn/ui;
- [x] Cloudflare Access;
- [x] sessione mediata dal Worker;
- [x] letture e parità legacy;
- [x] prima mutation brief.

### F4.0–F4.3 — Preview pubbliche

- [x] shell, trust, homepage e listing;
- [x] renderer articolo;
- [x] published-only, 404 e fail-closed;
- [x] checkpoint desktop/mobile.

### F4.4 — Parità SEO e routing

- [x] PR #69 — contratto SEO;
- [x] PR #71 — route policy;
- [x] PR #73 — canonical Astro parity;
- [x] PR #75 — sitemap e robots parity;
- [x] live ownership ancora backend.

## F4.5 — Catalogo pilot M5.6

Scope: `docs/PUBLIC-CATALOG-PILOT-SCOPE.md`.

### Candidate audit foundation

Branch tecnica proposta:

```text
feat/public-catalog-pilot-foundation
```

Responsabilità frontend/repository:

- modello tipizzato server-only;
- report read-only;
- manifest versionato;
- validazione di latest bundle e draft;
- publication eligibility e approvazioni persistite;
- provenance e freshness;
- coerenza tra draft approvato e pagina `review`;
- collisioni di slug e intento;
- massimo quattro entry;
- empty state valido;
- fixture e smoke.

Non introduce:

- nuova pagina pubblica;
- endpoint publish;
- mutation D1;
- transizione `review → published`;
- cambio della matrice;
- deploy.

### Release-candidate preparation

Usa il ciclo editoriale esistente, una pagina alla volta:

```text
brief
→ claims
→ evidence bundle
→ approved_for_publication
→ grounded draft approved
→ materialized page review
→ manifest entry
```

Una release candidate resta non pubblica.

### Publication decision

Branch separata e autorizzazione esplicita. Deve decidere se la prima pubblicazione avviene prima, durante o dopo M5.7.

## F4.6 — Cutover apex M5.7

Richiede:

- autorizzazione esplicita;
- modifica minima e reversibile della matrice;
- confronto route e metadata;
- schema, sitemap, robots e 404 validi;
- provider redirect preservati;
- publication guardrails preservati;
- rollback documentato;
- assenza di pagine review esposte.

## Cosa non facciamo adesso

- riscrivere l’intero backend;
- introdurre più mutation nella stessa branch;
- pubblicare automaticamente la pagina Cina;
- scegliere pagine del pilot senza audit reale;
- creare un design system proprietario;
- attivare generazione massiva o pSEO a template;
- aggiungere un endpoint publish nella foundation M5.6a;
- inviare la sitemap a Search Console;
- aggiungere analytics prima di CMP e Consent Mode;
- cambiare `activePublicRouteDecision` prima di M5.7;
- rimuovere una legacy prima del relativo criterio di uscita.
