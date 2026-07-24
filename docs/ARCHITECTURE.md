# Architettura di Senza Roaming

Data di riferimento: **24 luglio 2026**.

## Scopo

Senza Roaming è un execution project autonomo per contenuti eSIM: raccoglie domanda, conserva fonti e claim, governa il ciclo editoriale, serve pagine pubbliche e misura in futuro il passaggio verso i provider.

Non è il sistema operativo generale dello studio.

## Architettura target

```text
Utente / crawler
      │
      ▼
Custom Cloudflare Worker
      ├── route policy current/target
      ├── Cloudflare Access
      ├── handler Astro
      ├── backend legacy durante la migrazione
      ├── API protette
      ├── redirect provider
      ├── D1
      ├── Workflows
      ├── Container
      └── AI Gateway → Vertex AI
             │
             ├── Astro pubblico content-first
             └── Astro shell + React island Control Room
```

La migrazione frontend non riscrive l’execution plane.

## Responsabilità

### Astro

- HTML pubblico e layout;
- routing delle pagine;
- navigazione;
- metadata, canonical e schema;
- sitemap, robots e 404 nel target;
- rendering statico o on-demand;
- shell della Control Room;
- caricamento minimo di JavaScript.

### React island

Usata soltanto per la Control Room:

- caricamento e refresh delle risorse;
- validazione runtime;
- loading, error, partial failure e retry;
- tabelle, filtri, form e dialog;
- mutation nelle fasi autorizzate;
- accessibilità dei flussi interattivi.

### Backend ed execution plane

- D1 e migrazioni;
- claim, fonti e verifiche;
- research runs e segnali;
- Page Readiness ed evidence bundle;
- draft e stati editoriali;
- maintenance queue;
- Workflows e Container;
- AI Gateway e Vertex;
- publication guardrails;
- API protette e redirect provider.

Il browser non accede direttamente a D1.

## Custom Worker e route ownership

L’entrypoint reale è:

```text
apps/web/src/worker.ts
```

Esporta:

```text
createPublicWorker(routeDecision)
```

Il deploy usa:

```text
createPublicWorker(activePublicRouteDecision)
activePublicRouteDecision = currentPublicRouteDecision
```

### Current matrix

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

### Target matrix, non attiva

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

Il cutover richiede una PR separata.

## Route policy

`src/public-route-policy.ts` definisce:

- owner `astro | backend`;
- route kind;
- current e target matrix;
- route statiche canoniche;
- SEO endpoint;
- reserved path;
- file-probe policy;
- slug articolo validi;
- precedenza delle route.

Owner target, route compilata e owner live non sono equivalenti.

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

## Read model pubblico

D1 viene letto soltanto server-side.

Contratti:

- righe `published` soltanto;
- ordine deterministico;
- limiti espliciti;
- validazione runtime;
- 404 per assente, `review` e `draft`;
- fail-closed per righe published invalide;
- related links published-only;
- nessun dato operativo interno esposto.

## Contratto SEO delle pagine

`src/public-seo.ts` produce:

- title;
- description;
- Open Graph;
- `WebSite`;
- `Article`;
- `FAQPage`;
- JSON-LD sicuro.

Canonical URL, `mainEntityOfPage`, robots e cache dipendono dalla route owner.

## Contratto sitemap e robots

M5.5b.3 introduce il modulo server-only:

```text
src/public-seo-endpoints.ts
```

Usato da:

```text
backend legacy
apps/web/src/pages/sitemap.xml.ts
apps/web/src/pages/robots.txt.ts
```

### Sitemap

- route statiche da `PUBLIC_CANONICAL_STATIC_PATHS`;
- query `pages.status='published'`;
- statiche prima, dinamiche per slug ASC;
- `lastmod` soltanto sulle pagine D1;
- validazione del canonical site base HTTPS;
- validazione slug e date;
- controllo duplicati e limite URL;
- escaping XML dedicato;
- nessun documento parziale in caso di errore.

Esclusi:

- preview;
- review, draft e archived;
- 404;
- API;
- Control Room;
- `/go/*`;
- asset tecnici.

### Robots

Documento canonico corrente:

```text
User-agent: *
Allow: /
Disallow: /go/
Disallow: /control-room
Disallow: /api/maintenance/
Sitemap: https://senzaroaming.it/sitemap.xml
```

Il newline finale è deterministico.

### Confine Worker→Astro

Quando una route `seo-endpoint` è Astro-owned in uno smoke o in una futura matrice, il Worker ricostruisce il request con la pathname normalizzata della route decision prima di chiamare Astro.

Questo garantisce parità per trailing slash e query string. Non cambia il runtime live corrente, perché sitemap e robots restano backend-owned.

## Test di parità senza switch live

Gli smoke generano wrapper e configurazioni temporanei.

### Canonical renderer

Astro possiede soltanto:

```text
canonical-static
canonical-article
public-404
```

### Sitemap e robots

Astro possiede soltanto:

```text
seo-endpoint
```

Tutto il resto conserva la current matrix.

Stati verificati:

- populated;
- empty;
- invalid.

Confronti:

- status;
- content type;
- cache;
- body;
- GET e HEAD;
- query string;
- trailing slash;
- ordering e `lastmod`;
- esclusioni;
- fallimento chiuso.

I wrapper, le configurazioni e lo stato D1 locale vengono eliminati dopo il test.

## Control Room privata

```text
browser autenticato
→ Cloudflare Access
→ validazione JWT nel Worker
→ Astro shell
→ React island
→ route server-side
→ D1
```

Conseguenze:

- nessun maintenance token nel browser;
- nessun token in URL, HTML, bundle o storage;
- risposte private no-store e noindex;
- attore delle mutation derivato dal JWT;
- state machine e audit in D1;
- nessuna capacità di pubblicazione implicita.

## Risorse Control Room

### Snapshot e health

- `GET /api/health`;
- `GET /control-room-foundation/api/snapshot`.

Le risorse sono validate e gestite in modo indipendente.

### Dettaglio draft

- caricato on demand;
- corpo, FAQ, fonti e provenance separati dallo snapshot;
- fallimento isolato;
- nessuna generazione o pubblicazione.

### Decisione brief

```text
proposed → accepted | dismissed
```

Il browser invia soltanto ID, azione e note. L’attore deriva dall’identità Access. `accepted → converted` resta una mutation separata.

## Flusso editoriale

```text
recent demand
→ brief AI
→ decisione umana
→ conversione separata
→ claim atomici + fonti
→ Page Readiness + evidence bundle
→ draft grounded in review
→ revisione umana
→ publication gate separato
```

L’AI non possiede un percorso diretto verso `published`.

## Separazione delle fonti

### Fonti ufficiali

Usate per claim commerciali datati: prezzo, durata, dati, hotspot, fair use, rete, copertura, attivazione, compatibilità, routing e termini.

### Community e domanda recente

Usate per domande, linguaggio, lamentele, confronti, content gap e priorità. Non aggiornano direttamente claim commerciali.

## Stato verificato

```text
M5.5b.1 route policy:        completata
M5.5b.2 canonical parity:    completata
M5.5b.3 SEO endpoint parity: CI applicativa #359 verde, PR #75 da chiudere
active matrix:               current
cutover:                     non eseguito
```

## Confini delle prossime fasi

### M5.6 catalogo pilot

- scope documentale prima del codice;
- massimo iniziale ristretto;
- intenti distinti;
- evidence e publication eligibility;
- revisione umana;
- nessuna generazione massiva.

### M5.7 cutover

- PR dedicata;
- modifica minima della matrice;
- rollback documentato;
- schema, sitemap, robots e 404 verificati;
- provider redirect e publication guardrails preservati.

### M6 measurement

CMP e Consent Mode precedono GTM, GA4 e Search Console. Nessuna credenziale Google entra nel repository o nel frontend.
