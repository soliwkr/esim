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

Librerie aggiuntive vengono introdotte soltanto se riducono complessità reale.

## Confini non negoziabili

- il browser non accede direttamente a D1;
- il browser non riceve maintenance token o secret;
- Cloudflare Access protegge la Control Room;
- l’attore delle mutation deriva dall’identità verificata;
- ogni mutation è una capacità separata;
- nessun componente introduce pubblicazione automatica;
- una preview non equivale a un cutover;
- owner target e owner live restano distinti;
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

Il Worker espone la factory:

```text
createPublicWorker(routeDecision)
```

Il deploy normale resta:

```text
createPublicWorker(activePublicRouteDecision)
activePublicRouteDecision = currentPublicRouteDecision
```

La factory viene usata dagli smoke locali per provare matrici target limitate senza distribuire flag, cookie, header, query parameter o route di test.

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

## Componenti e read model pubblici

I componenti pubblici condividono un render mode tipizzato:

```text
preview | canonical
```

La modalità preview mantiene:

- namespace `/astro-foundation`;
- noindex;
- no-store;
- banner e copy di isolamento;
- link interni namespaced.

La modalità canonical mantiene:

- URL apex;
- robots indicizzabili sulle risposte valide;
- cache pubblica;
- nessun banner preview;
- link interni canonici.

Read model e validazione restano server-only.

## Contratto SEO delle pagine

`src/public-seo.ts` è la fonte condivisa per:

- title;
- description;
- Open Graph;
- `WebSite`;
- `Article`;
- `FAQPage`;
- serializer JSON-LD sicuro.

Canonical URL, robots e cache restano policy della route che possiede la risposta.

## Contratto sitemap e robots

M5.5b.3 introduce:

```text
src/public-seo-endpoints.ts
apps/web/src/pages/sitemap.xml.ts
apps/web/src/pages/robots.txt.ts
```

Il modulo condiviso gestisce:

- route statiche da `PUBLIC_CANONICAL_STATIC_PATHS`;
- pagine D1 `published` soltanto;
- validazione HTTPS del site base;
- slug e `updated_at`;
- duplicati e limite URL;
- ordine deterministico;
- `lastmod` normalizzato;
- XML escaping;
- robots deterministico;
- header e fail-closed.

Backend legacy e Astro delegano allo stesso contratto.

Quando un `seo-endpoint` è Astro-owned in uno smoke o in una futura matrice, il Worker inoltra ad Astro la pathname normalizzata della route decision. Questo rende coerenti query string e trailing slash senza cambiare il runtime live corrente.

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
→ catalogo pilot
→ cutover apex separato
```

Una branch appartiene a una sola track.

## Fasi completate

### F0–F2 — Foundation e perimetro privato

- [x] `apps/web` Astro/React;
- [x] custom Worker entrypoint;
- [x] shadcn/ui;
- [x] Cloudflare Access;
- [x] sessione mediata dal Worker;
- [x] credenziali browser rimosse;
- [x] loading, error, empty, tastiera e mobile.

### F3 — Control Room read-only e prima mutation

- [x] overview e health;
- [x] radar, segnali e brief;
- [x] claim, fonti, scadenze e task;
- [x] readiness e bundle;
- [x] draft, dettaglio, queue e audit;
- [x] parità legacy read-only;
- [x] decisione brief `proposed → accepted | dismissed`.

Mutation residue:

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

### F4.0–F4.3 — Preview pubbliche

- [x] shell `/astro-foundation`;
- [x] trust pages;
- [x] homepage candidata;
- [x] listing Destinazioni, Guide e Confronti;
- [x] renderer articolo;
- [x] published-only, 404 e fail-closed;
- [x] checkpoint desktop/mobile.

### F4.4a — Contratto SEO condiviso

- [x] `src/public-seo.ts`;
- [x] metadata e schema condivisi;
- [x] regressioni e drift testati;
- [x] PR #69.

### F4.4b.1 — Route policy

- [x] current/target matrix;
- [x] route kind e precedenza;
- [x] file probe e reserved path;
- [x] PR #71 e CI #329.

### F4.4b.2 — Canonical Astro parity

- [x] home, listing, trust, articolo e 404 compilati;
- [x] factory Worker per smoke;
- [x] runtime diretto senza switch live;
- [x] PR #73 e CI finale #350.

### F4.4b.3 — SEO endpoint parity

```text
PR #75
CI applicativa #359 verde
merge ancora pendente
```

- [x] builder sitemap/robots condivisi;
- [x] handler Astro compilati;
- [x] legacy delegato;
- [x] populated, empty e invalid state;
- [x] GET, HEAD, query e trailing slash;
- [x] output legacy/Astro equivalente;
- [x] owner live ancora backend;
- [ ] CI finale code + canonici;
- [ ] merge.

## Prossima fase — F4.5 catalogo pilot

La prima azione è uno scope documentale separato.

Deve definire:

- massimo quattro pagine iniziali, salvo evidenza contraria;
- intenti distinti;
- fonti ufficiali e freshness;
- evidence bundle minimo;
- publication eligibility;
- revisione umana e audit;
- rollback;
- criteri di misura prima della scala.

Lo scope non pubblica pagine e non cambia la matrice attiva.

## F4.6 — Cutover apex

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
- creare un design system proprietario;
- attivare sitemap index o milioni di URL;
- inviare la sitemap a Search Console;
- aggiungere analytics prima di CMP e Consent Mode;
- cambiare `activePublicRouteDecision` prima di M5.7;
- rimuovere una legacy prima del relativo criterio di uscita.
