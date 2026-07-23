# `apps/web`

Frontend Astro di Senza Roaming e nuova Control Room privata.

## Runtime

`apps/web/src/worker.ts` è il custom entrypoint del singolo Worker Cloudflare.

```text
/astro-foundation*        → Astro pubblico preview
/control-room-foundation* → Astro + Access + React island
altre route               → router backend legacy
```

Lo stesso modulo conserva gli export `RecentDemandWorkflow` e `Last30DaysContainer`.

La Control Room è `noindex,nofollow` e `no-store`. Tutto il path `/control-room-foundation*` è fail-closed: il Worker richiede e valida l’identità Cloudflare Access prima di servire shell, letture o mutation autorizzate.

## Frontend pubblico preview

### Shell

`/astro-foundation` è la preview non canonica del futuro frontend pubblico.

La route:

- rende layout, header, navigazione, footer e contenuto primario come HTML Astro;
- non monta React e non richiede JavaScript per essere utile;
- usa stili pubblici isolati dalla Control Room;
- riceve metadata, canonical e header preview da `PublicLayout.astro`;
- resta `noindex,nofollow` e `no-store`;
- non è inclusa nella sitemap pubblica;
- non cambia `/`, ancora servita dal renderer legacy.

Componenti principali:

```text
src/layouts/PublicLayout.astro
src/components/public/PublicHeader.astro
src/components/public/PublicFooter.astro
src/styles/public.css
src/pages/astro-foundation.astro
```

### Trust pages

```text
/astro-foundation/metodo
/astro-foundation/trasparenza
/astro-foundation/privacy
```

Le tre route:

- riusano `PublicLayout`, header, footer e token pubblici;
- usano `src/components/public/TrustPage.astro`;
- hanno contenuto primario nel raw HTML;
- restano noindex, no-store e fuori sitemap;
- mantengono `/metodo`, `/trasparenza` e `/privacy` sul renderer legacy;
- non introducono CMP, analytics o affiliazioni.

### Homepage candidata

La terza slice M5 rende il catalogo pubblicato dentro `/astro-foundation`.

```text
Cloudflare D1 binding server-side
→ src/public-page-cards.ts
→ Astro server rendering
→ raw HTML
```

Il browser non riceve il binding D1 e non usa una API pubblica.

Read model ammesso:

```text
slug
page_type
title
meta_description
cluster
```

Contratti:

```text
Guide essenziali:
status='published' AND featured=1
ORDER BY featured DESC, updated_at DESC
LIMIT 9

Destinazioni principali:
status='published' AND page_type='destination'
ORDER BY featured DESC, updated_at DESC
LIMIT 6
```

`src/public-page-cards.ts` è condiviso dal renderer legacy e da Astro. Valida il payload D1 a runtime e non accetta clausole SQL arbitrarie.

La candidata usa:

```text
src/components/public/PublicPageCardGrid.astro
src/styles/homepage-candidate.css
```

Regole:

- soltanto righe `published`;
- draft e review non renderizzati;
- link delle card ancora verso le route canoniche legacy;
- empty state deterministico, senza contenuto inventato;
- nessuna island, API, mutation o pubblicazione;
- nessun provider ranking, prezzo o affiliazione;
- nessun CMP, GTM, GA4, Search Console o service account.

Il cutover dell’apice richiede una PR separata dopo listing, renderer articolo e parità SEO.

## UI Control Room

Astro fornisce la shell SSR e monta un solo root React con `client:load`. shadcn/ui è configurato da `components.json`; i componenti sorgente vivono sotto `src/components/ui` e lo stile Tailwind 4 privato in `src/styles/globals.css`.

La island implementa:

- sidebar desktop e Sheet mobile;
- overview e health;
- radar, segnali e brief;
- decisione controllata di brief `proposed → accepted | dismissed`;
- claim, fonti, scadenze e task;
- Page Readiness ed evidence bundle;
- inventario e dettaglio draft on demand;
- maintenance queue e audit;
- loading, errori parziali, contratti invalidi, retry ed empty state.

## Contratti privati

Il browser usa soltanto:

```text
GET  /api/health
GET  /control-room-foundation/api/snapshot
GET  /control-room-foundation/api/draft-detail?draftId=<id>
POST /control-room-foundation/api/brief-decision
```

Il maintenance token resta server-side. L’attore delle mutation deriva dal JWT Cloudflare Access.

Linkage canonici:

```text
claim.task_id + claim.task_status
audit.event_key + audit.draft_id + audit.draft_version
```

Il client non ricostruisce relazioni da JSON opaco o euristiche.

## Separazioni obbligatorie

```text
homepage candidata ≠ apice migrato
preview trust page ≠ route canonica migrata
published row ≠ review row
M5 preview ≠ public cutover
brief accepted ≠ brief converted
approved draft ≠ published page
draft status ≠ materialized page status
queue status ≠ decisione editoriale
audit event ≠ autorizzazione operativa
```

## Verifica locale

```bash
npm run types
npm run typecheck
npm run build
npm run db:migrate:local
npm run smoke:quality
npm run eval:research-quality
npm run smoke:runtime
npm run smoke:public-shell
npm run smoke:public-homepage-candidate
npm run smoke:public-trust-pages
npm run smoke:ui
npm run smoke:brief-decisions
npm run smoke:claims
npm run smoke:readiness
npm run smoke:drafts
npm run smoke:draft-detail
npm run smoke:queue-audit
npm run smoke:legacy-parity
```

Gli smoke generano credenziali Access effimere; nessuna chiave viene versionata.

`smoke:public-homepage-candidate` usa due stati D1 temporanei isolati:

1. catalogo popolato con fixture `published`, `review` e `draft`;
2. catalogo senza righe pubblicate.

Verifica:

- published-only;
- ordine e limiti;
- parità del read model legacy/Astro;
- link canonici;
- sitemap e 404;
- raw HTML senza JavaScript;
- desktop a tre colonne;
- mobile a una colonna;
- tastiera e overflow;
- empty state.

PR #54 e migrazione remota `0020` restano il checkpoint produttivo della prima mutation. La homepage candidata non modifica D1, stati editoriali o capacità di pubblicazione.
