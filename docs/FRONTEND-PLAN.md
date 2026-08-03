# Piano frontend

Data di riferimento: **3 agosto 2026**.

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
- Cloudflare Access protegge la Control Room foundation;
- ogni mutation è una capacità separata;
- nessun componente introduce pubblicazione automatica;
- preview, canonical compilato, owner sulla branch e owner live sono distinti;
- candidate, release candidate e published sono distinti;
- la legacy privata resta finché è fallback operativo;
- la legacy pubblica non viene rimossa nello stesso momento del cutover;
- il tracking non essenziale resta consent-gated e assente da preview e Control Room.

## Route ownership M5.7

Il Worker reale resta:

```text
createPublicWorker(activePublicRouteDecision)
```

### Configurazione Assets attiva da PR #81

```json
{
  "run_worker_first": ["/*", "!/_astro/*"]
}
```

- `/*` porta le route dinamiche al custom Worker;
- `!/_astro/*` mantiene gli asset compilati asset-first;
- il Worker conserva la precedenza esplicita di API, `/go/*`, Control Room e path tecnici.

### Matrice current e rollback

```text
Astro:
  /astro-foundation*
  /control-room-foundation*

Backend:
  route canoniche
  sitemap e robots
  /go/*
  /api/*
  legacy Control Room
  asset tecnici e 404
```

```ts
currentPublicRouteDecision(pathname)
```

### Matrice target attiva

```text
Astro:
  homepage canonica
  Destinazioni, Guide e Confronti
  Metodo, Trasparenza e Privacy
  articoli canonici published-only
  sitemap, robots e 404
  preview
  shell Control Room

Backend:
  /api/*
  /go/*
  legacy Control Room
  asset tecnici
  D1, Workflow, Container e AI
  gate editoriali e publication capability
```

```ts
export const activePublicRouteDecision = targetPublicRouteDecision;
```

La CI applicativa #397 ha verificato questa matrice nel Worker compilato; PR #81 e #82 hanno poi completato cutover e verifica live. Merge e deploy restano comunque checkpoint distinti per ogni slice successiva.

Rollback:

```ts
export const activePublicRouteDecision = currentPublicRouteDecision;
```

## Renderer pubblico

I componenti condividono:

```text
preview | canonical
```

### Preview

- route sotto `/astro-foundation*`;
- noindex/nofollow;
- no-store;
- canonical namespaced;
- banner di isolamento;
- link namespaced;
- nessuna CMP, GTM o GA4.

### Canonical

- route apex;
- index/follow;
- cache pubblica breve;
- canonical apex;
- link apex;
- nessun banner preview;
- CMP reale sulle route indicizzabili;
- bootstrap measurement inerte fino al consenso Misurazione.

Entrambe le modalità leggono soltanto righe `published`. `review`, `draft`, archived, slug mancanti e file probe restano 404.

## Contratti SEO e script pubblici

- `src/public-seo.ts` produce metadata, Open Graph e JSON-LD;
- `src/public-seo-endpoints.ts` produce sitemap e robots;
- l'applicazione pubblica non usa una SPA o JavaScript applicativo generale;
- JSON-LD resta inerte;
- l'embed CMP e il bootstrap measurement consent-gated sono eccezioni deliberate e governate da M6;
- sitemap include route statiche e articoli published-only;
- canonical, robots e cache dipendono dalla route response;
- gli endpoint falliscono chiusi su dati invalidi.

## Modello a due track

### Track A — Control Room M4

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
→ rimozione legacy privata
```

### Track B — frontend pubblico M5/M7

```text
preview noindex
→ SEO contract
→ route policy
→ canonical parity
→ sitemap/robots parity
→ catalog audit foundation
→ remote audit live
→ apex cutover
→ verifica live
→ riallineamento M7
→ osservazione dati reali
```

Publication capability resta un percorso separato.

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
- [x] sitemap e robots parity.

### F4.5 — Catalogo pilot M5.6

Foundation:

```text
PR #77
merge fa9ed9486e400e77ad915153284c7b277a51b4d0
CI #379
```

Comprende:

- `src/public-catalog-pilot.ts` server-only;
- loader D1 con sole `SELECT`;
- report deterministic selected/excluded;
- latest bundle e draft;
- publication gate e approvazioni;
- provenance e freshness;
- coerenza pagina `review`;
- cap massimo quattro;
- manifest vuoto versionato;
- fixture pure e migrated-D1 smoke;
- before/after invariato.

Remote audit:

```text
scope PR #78 — CI #381
route PR #79 — CI #386
```

Risultato live:

```text
candidateCount: 1
eligibleCount: 0
selectedCount: 0
excludedCount: 1
```

La candidate `esim-cina-senza-vpn` resta `review`; il manifest resta vuoto. Documento:

```text
docs/PUBLIC-CATALOG-REMOTE-AUDIT-RESULT-2026-07-24.md
```

### F4.6 — Cutover apex M5.7

Branch e PR storiche:

```text
feat/public-apex-cutover
PR #81 — merged
CI applicativa #397 verde
PR #82 — closeout live
```

Implementato:

- target matrix attiva;
- Worker-first wildcard valida;
- asset Astro esclusi dal Worker;
- canonical homepage, listing, trust, articoli, sitemap, robots e 404;
- backend boundaries preservati;
- published-only e fail-closed;
- preview noindex preservata;
- review/draft hidden;
- rollback una riga;
- smoke attivo sul Worker di produzione;
- desktop e mobile;
- tutte le suite Control Room.

Il closeout ha completato:

```text
canonici finali
→ CI finale code + documentazione
→ merge PR #81
→ deploy e verifica live
→ closeout M5.7 con PR #82
```

## M7 e sicurezza deploy — stato corrente

Le PR #97 e #98 hanno riallineato homepage, i tre hub e `/migliore-esim`. Il merge della PR #98 ha attivato il vecchio trigger automatico e pubblicato M7 con configurazione CMP/measurement vuota.

La pipeline production è stata quindi corretta senza cambiare l'architettura frontend:

```text
PR #99 → workflow_dispatch manual-only, npm run deploy, D1 read-only
PR #100 → contratto smoke Control Room corretto
PR #101 → stub consent browser corretto
```

Recovery riuscita:

```text
run: 30439227471
commit: f2df5cd6ef4bf4784205911e80786f55c28f3dd0
conclusion: success
Worker version: db76b202-2a62-4871-8abf-61c488316285
```

Il run ha verificato route M7, preview, SEO, published-only, CMP/measurement, legacy Control Room e foundation protetta da Access. Nessuna creazione, migration o mutation D1 remote è parte del percorso production.

La successiva verifica browser reale ha ricertificato il widget iubenda e il gate measurement:

```text
pre-consenso: Google requests=0
rifiuto + reload: Google requests=0
consenso: GTM-W3LSK9RZ attivato
reload con consenso: GA4 collect HTTP 204, en=page_view
revoca + reload: Google requests=0
```

Il frontend M7 non è stato modificato durante il recovery.

## Acceptance live M5.7

Verificato storicamente e preservato nei successivi smoke production:

- homepage e navigazione canonica;
- listing e trust pages;
- almeno un articolo published;
- metadata, canonical e JSON-LD;
- sitemap e robots;
- 404, file probe, review e draft;
- `/api/health`;
- redirect `/go/*`;
- Control Room legacy e foundation protetta;
- preview namespaced;
- CSS asset;
- desktop, mobile e tastiera;
- header cache e robots.

## Publication decision

M5.7 e M7 non introducono `review → published`.

La prima pubblicazione richiede:

- branch mutation separata;
- identità verificata;
- conferma umana;
- state machine D1;
- audit append-only;
- idempotenza;
- freshness recheck;
- rollback/deindicizzazione;
- test end-to-end.

## Cosa non facciamo adesso

- riscrivere l’intero backend;
- pubblicare automaticamente la pagina Cina;
- generazione massiva o pSEO a template;
- endpoint publish senza scope separato;
- submission Search Console ripetuta;
- Advanced Consent Mode o cookieless pings;
- affiliazioni anticipate;
- rimozione legacy privata mentre resta fallback operativo.
