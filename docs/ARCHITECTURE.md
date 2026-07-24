# Architettura di Senza Roaming

Data di riferimento: **24 luglio 2026**.

## Scopo

Senza Roaming è un execution project autonomo per contenuti eSIM. Raccoglie domanda, conserva fonti e claim, governa il ciclo editoriale e serve pagine pubbliche. Non è il sistema operativo generale dello studio.

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
      ├── API e redirect provider
      ├── D1
      ├── Workflows e Container
      └── AI Gateway → Vertex AI
             ├── Astro pubblico content-first
             └── Astro shell + React island Control Room
```

## Responsabilità

### Astro

- HTML pubblico, routing e navigazione;
- metadata, schema, sitemap, robots e 404 nel target;
- rendering statico o on-demand;
- shell Control Room;
- JavaScript minimo.

### React island

- risorse private validate;
- loading, error, retry e guasti parziali;
- tabelle, form e dialog;
- mutation soltanto nelle fasi autorizzate.

### Execution plane

- D1 e migrazioni;
- claim, fonti e verifiche;
- Page Readiness ed evidence bundle;
- draft e stati editoriali;
- queue, Workflow, Container e AI;
- publication guardrails;
- API protette e redirect provider.

Il browser non accede direttamente a D1.

## Route ownership

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
  asset tecnici e 404
```

### Target matrix, non attiva

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

## Read model pubblico

- D1 server-side;
- righe `published` soltanto;
- ordine e limiti deterministici;
- validazione runtime;
- 404 per assente, `review` e `draft`;
- fail-closed per righe published invalide;
- related links published-only.

## Contratti SEO

- `src/public-seo.ts` — metadata e JSON-LD;
- `src/public-seo-endpoints.ts` — sitemap e robots;
- backend legacy e Astro condividono i contratti;
- owner live ancora backend.

## Control Room privata

```text
browser autenticato
→ Cloudflare Access
→ validazione JWT
→ Astro shell
→ React island
→ route server-side
→ D1
```

Nessun maintenance token vive nel browser. Ogni mutation deriva l’attore dal JWT e usa state machine e audit D1.

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

## Stati persistiti

### Evidence bundle

```text
review_draft_eligible
publication_eligible
ready_for_review_draft
ready_for_publication
review_status
```

`ready_for_publication` richiede gate deterministico positivo e `approved_for_publication` umano.

### Draft

```text
generating
review
changes_requested
approved
failed
superseded
```

### Pagina

```text
draft
review
published
archived
```

La generazione grounded materializza soltanto `review` e protegge pagine già `published`.

## Catalogo pilot M5.6

```text
candidate
≠ release candidate
≠ published page
```

### Foundation read-only

```text
D1
→ loadPublicCatalogPilotSnapshot
→ auditPublicCatalogPilot
→ selected/excluded report
→ create/validate manifest
```

Modulo:

```text
src/public-catalog-pilot.ts
```

Il loader esegue sei gruppi di `SELECT` su:

- `editorial_briefs`;
- `page_evidence_bundles`;
- `editorial_review_drafts`;
- `editorial_review_draft_field_claims`;
- `pages`;
- claim, verification e source registry.

### Selezione canonica

Per ogni brief:

1. latest evidence bundle per versione;
2. latest draft per bundle;
3. publication gate e approvazione umana;
4. renderer grounded;
5. provenance completa;
6. claim atomic/verified con fonti HTTPS attive e non scaduti;
7. pagina materializzata `review` coerente col draft;
8. slug e intento sicuri;
9. cap massimo quattro.

Una versione più recente non approvata blocca la candidate: non si ripiega su una versione precedente approvata.

### Manifest

```text
data/public-catalog-pilot.json
```

Contratto:

- schema versionato;
- zero–quattro entry;
- ID e versioni positive;
- slug e keyword unici;
- URL HTTPS;
- nessun secret-like data;
- `pageStatus='review'`;
- drift check contro il report corrente.

Il manifest iniziale è vuoto e non attiva alcun comportamento runtime.

### Test

#### Pure fixtures

Coprono candidate valida, gate negativo, stale claim, latest draft non approved, drift pagina, slug riservato, collisioni, cap, manifest invalido ed empty state.

#### Migrated D1 smoke

Un Worker temporaneo:

- transpila route policy e audit module in ESM;
- applica le migrazioni reali;
- esegue il loader sullo schema effettivo;
- confronta conteggi e stati before/after;
- verifica nessuna mutation;
- elimina entry, config e stato locale.

CI applicativa #373 è completamente verde.

### Publication boundary

M5.6a non introduce:

- migration o mutation D1;
- endpoint o pulsante publish;
- transizione `review → published`;
- route pubblica;
- cambio owner;
- deploy o sitemap submission.

La pubblicazione richiede una branch separata, autorizzazione, identity, state machine, audit, idempotenza, freshness recheck e rollback.

## Prossima fase — audit remoto M5.6b

Deve usare un percorso read-only sicuro e produrre un report sanitizzato sui dati reali.

Possibili esiti:

```text
0 candidate → manifest vuoto e blocker report
1–4 candidate → manifest con identità reali
>4 candidate → cap deterministico
```

Nessun Paese o provider viene scelto prima dell’audit.

## Stato verificato

```text
M5.5 SEO/routing parity:     completata
M5.6a foundation:            CI applicativa #373 verde, PR #77 da chiudere
active matrix:               current
cutover:                     non eseguito
publication mutation:        non autorizzata
manifest entries:            0
```
