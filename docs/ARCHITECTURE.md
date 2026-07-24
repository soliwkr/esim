# Architettura di Senza Roaming

Data di riferimento: **24 luglio 2026**.

## Scopo

Senza Roaming è un execution project autonomo per contenuti eSIM: raccoglie domanda, conserva fonti e claim, governa il ciclo editoriale, serve pagine pubbliche e misurerà il passaggio verso i provider.

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

- caricamento e refresh delle risorse private;
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

`src/public-route-policy.ts` definisce owner, route kind, current/target matrix, route statiche, SEO endpoint, reserved path, file probe e slug articolo validi.

Owner target, route compilata e owner live non sono equivalenti.

## Renderer e read model pubblico

I componenti condividono:

```text
preview | canonical
```

D1 viene letto soltanto server-side.

Contratti:

- righe `published` soltanto;
- ordine deterministico;
- validazione runtime;
- 404 per assente, `review` e `draft`;
- fail-closed per righe published invalide;
- related links published-only;
- nessun dato operativo interno esposto.

## Contratti SEO

### Pagine

`src/public-seo.ts` produce metadata, Open Graph e JSON-LD condivisi.

### Sitemap e robots

`src/public-seo-endpoints.ts` produce sitemap e robots condivisi tra legacy e Astro.

PR #75 è mergiata nel commit `8d52e7e316d632dcda0d5bb45b818a490df9fef6` dopo CI finale #365 completamente verde.

Ownership live ancora backend.

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

## Stato e gate persistiti

### Evidence bundle

Distingue:

```text
review_draft_eligible
publication_eligible
ready_for_review_draft
ready_for_publication
review_status
```

`publication_eligible` è deterministico. `ready_for_publication` richiede anche `approved_for_publication` umano.

### Draft

Distingue:

```text
generating
review
changes_requested
approved
failed
superseded
```

Un draft approvato non modifica automaticamente la pagina in `published`.

### Pagina

Distingue:

```text
draft
review
published
archived
```

La generazione grounded materializza soltanto `review` e protegge pagine già `published`.

## Catalogo pilot M5.6

Scope: `docs/PUBLIC-CATALOG-PILOT-SCOPE.md`.

### Distinzioni

```text
candidate
≠ release candidate
≠ published page
```

- candidate: possibile entry individuata dall’audit;
- release candidate: bundle e draft approvati, pagina coerente ancora in `review`;
- published: pagina visibile pubblicamente e inclusa nella sitemap.

### Ragione del confine

Il backend live serve già ogni riga `pages.status='published'`. Non esiste ancora una mutation autorizzata `review → published`.

La foundation M5.6 deve quindi essere read-only: auditare e certificare release candidate senza modificare lo stato pubblico.

### Candidate audit foundation

Branch tecnica proposta:

```text
feat/public-catalog-pilot-foundation
```

Architettura:

```text
D1 fixtures / snapshot editoriale
→ server-only candidate model
→ latest bundle + draft selection
→ deterministic gate validation
→ slug and intent collision checks
→ candidate report
→ versioned manifest, max 4
```

Fonti dati:

- `editorial_briefs`;
- `page_evidence_bundles`;
- `editorial_review_drafts`;
- `editorial_review_draft_field_claims`;
- `pages`;
- claim, verification e source registry.

### Gate release candidate

- latest bundle non superseded;
- `publication_eligible=1`;
- `approved_for_publication`;
- `ready_for_publication=1`;
- zero blocker, insufficient, contradicted, pending, expired e conflict;
- draft grounded approvato sullo stesso bundle;
- provenance completa;
- claim usati ancora correnti;
- pagina materializzata in `review` e identica al draft;
- `published_at=NULL` e `featured=0`;
- slug valido e non riservato;
- intento distinto;
- nessuna pagina published sovrascritta.

### Manifest

Proposta:

```text
data/public-catalog-pilot.json
```

Contiene massimo quattro entry e collega slug, intento, brief, bundle, draft, claim e fonti.

Il manifest è un artefatto di audit, non un trigger di pubblicazione.

### Empty state

Zero release candidate è un risultato valido. Il sistema deve produrre blocker espliciti senza generare dati fittizi.

### Publication boundary

M5.6a non introduce:

- mutation D1;
- endpoint publish;
- pulsante publish;
- cambio di route ownership;
- deploy;
- sitemap submission.

La prima transizione `review → published` richiede branch e autorizzazione separate, recheck di freshness, state machine, audit, idempotenza e rollback.

L’ordine tra pubblicazione e M5.7 viene deciso soltanto quando esistono release candidate reali.

## Separazione delle fonti

### Fonti ufficiali

Usate per claim commerciali datati: prezzo, durata, dati, hotspot, fair use, rete, copertura, attivazione, compatibilità, routing e termini.

### Community e domanda recente

Usate per domande, linguaggio, lamentele, confronti, content gap e priorità. Non aggiornano direttamente claim commerciali.

## Stato verificato

```text
M5.5b.1 route policy:        completata
M5.5b.2 canonical parity:    completata
M5.5b.3 SEO endpoint parity: completata
M5.6 catalog pilot:          scope in corso
active matrix:               current
cutover:                     non eseguito
publication mutation:        non autorizzata
```

## Confini delle prossime fasi

### M5.6a

- audit read-only;
- manifest massimo quattro entry;
- fixtures e smoke;
- nessuna pubblicazione.

### M5.6b

- preparazione reale una pagina alla volta;
- bundle e draft approvati;
- pagine ancora `review`.

### Publication decision

- branch separata;
- autorizzazione esplicita;
- audit e rollback.

### M5.7

- modifica minima della matrice;
- rollback documentato;
- schema, sitemap, robots e 404 verificati;
- provider redirect e publication guardrails preservati.

### M6

CMP e Consent Mode precedono GTM, GA4 e Search Console. Nessuna credenziale Google entra nel repository o nel frontend.
