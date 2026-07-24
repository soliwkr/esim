# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now

### 1. Chiudere lo scope M5.5b.3

Branch:

```text
docs/public-seo-endpoint-parity-scope
```

Documento:

```text
docs/PUBLIC-SEO-ENDPOINT-PARITY-SCOPE.md
```

Obiettivo esclusivo:

```text
shared sitemap/robots contract
+ direct Astro endpoint test plan
+ live owner still backend
```

Decisioni già definite:

- route statiche derivate da `PUBLIC_CANONICAL_STATIC_PATHS`;
- query soltanto `pages.status='published'`;
- slug e `updated_at` validati;
- statiche nell’ordine canonico, dinamiche per slug ASC;
- `lastmod` soltanto sulle pagine D1 pubblicate;
- escaping XML dedicato;
- robots condiviso con direttive correnti;
- preview, review, draft, archived, 404, API, Control Room, `/go/*` e asset esclusi;
- populated, empty e invalid state;
- fail-closed senza sitemap parziale;
- confronto runtime production-style e runtime temporaneo Astro;
- nessun flag runtime, header, cookie, query parameter o route pubblica di test;
- sitemap e robots live ancora backend-owned.

La PR di scope modifica soltanto documentazione canonica.

### 2. Implementare M5.5b.3 dopo il merge dello scope

Branch tecnica autorizzata:

```text
feat/public-seo-endpoint-parity
```

Moduli e route previste:

```text
src/public-seo-endpoints.ts
apps/web/src/pages/sitemap.xml.ts
apps/web/src/pages/robots.txt.ts
scripts/smoke-public-seo-endpoints.mjs
```

Il backend legacy deve delegare agli stessi builder:

```text
src/pages.ts   → sitemap condivisa
src/index.ts   → robots condiviso
```

Il Worker normale resta:

```text
createPublicWorker(activePublicRouteDecision)
activePublicRouteDecision = currentPublicRouteDecision
```

Lo smoke temporaneo modifica soltanto:

```text
route.kind === 'seo-endpoint'
→ owner astro
```

Tutte le altre route conservano l’owner corrente.

### 3. Acceptance della branch tecnica

Richiedere sullo stesso head finale:

- tipi Cloudflare;
- typecheck TypeScript/Astro;
- build custom Worker;
- migrazioni D1 invariate;
- quality gate e golden evaluation;
- Container build e smoke;
- runtime production-style con sitemap/robots backend-owned;
- runtime temporaneo con soli SEO endpoint Astro-owned;
- body e header legacy/Astro equivalenti;
- XML parseabile, ordinato e senza duplicati;
- robots esatto e newline finale;
- published-only e `lastmod` normalizzato;
- populated, empty e invalid state;
- nessuna sitemap parziale su riga invalida;
- preview e canonical renderer senza regressioni;
- `/go/*`, `/api/*` e Control Room invariati;
- tutte le suite Control Room;
- STATUS, NEXT, ROADMAP, DECISIONS, FRONTEND-PLAN e ARCHITECTURE aggiornati.

### 4. Tenere separate le fasi successive

```text
M5.5b.3 sitemap/robots parity
→ M5.6 catalog pilot
→ M5.7 cutover apex separato
→ M6 measurement dopo route stabili
```

Né lo scope né l’implementazione M5.5b.3 inviano la sitemap a Google.

## Checkpoint chiusi

### M5.5a — SEO contract

```text
PR #69
merge 46f1d66a591dd7860c101c86cb8295d97e4a2106
```

Homepage e articolo preview sono verificati dalla CI e nel sorgente live con metadata e JSON-LD condivisi.

### M5.5b.1 — Route policy

```text
PR #71
merge bd51faddddbb54647c22c3361dd04c5bc65e7681
CI finale #329
```

Active matrix ancora uguale alla current matrix; target matrix inattiva.

### M5.5b.2 — Canonical Astro parity

```text
PR #73
merge b3a6625bfe6e3a06a46412e58f89a033dc82b9ff
CI finale #350
```

Verificato direttamente in workerd e Chromium:

- home, listing, trust, articolo e 404 Astro canonici;
- canonical apex e `mainEntityOfPage`;
- cache pubblica sulle pagine valide;
- noindex/no-store su 404 e fallimenti chiusi;
- published-only, ordering, empty state e related links;
- review, draft, reserved path e file probe mai esposti;
- nessun JavaScript applicativo;
- default production ancora legacy-owned.

Nessun cutover o deploy pubblico è stato dichiarato.

## Track M4 parallela

Le mutation residue continuano soltanto su branch separate:

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni mutation richiede Access, conferma, state machine server-side, audit, idempotenza, reload e test end-to-end.

## Google measurement ancora bloccato

M6 resta:

```text
CMP
→ Consent Mode
→ dizionario eventi
→ GTM
→ GA4
→ Search Console / sitemap
→ verifica dati reali
```

Regole:

- nessuna private key in chat o GitHub;
- nessuna credenziale nel frontend;
- nessun tracking sulle preview noindex;
- nessuna submission sitemap durante M5.5b.3.

## Verifiche operative aperte

- header HTTP live delle preview;
- linkage claim → task nel browser reale;
- linkage audit → ID/versione draft nel browser reale;
- topic-mismatch sul primo run autorizzato;
- redirect `www → apex` definitivo;
- nessun Workflow avviato soltanto per creare dati di test.

## Freeze immediato

- niente HTML applicativo nuovo nel Worker;
- niente accesso browser a D1;
- niente pubblicazione automatica;
- niente secret o PII nel client, URL, storage, log o repository;
- niente affiliazioni o tracking anticipati;
- niente cambio della matrice attiva prima di M5.7;
- niente migrazione live di sitemap, robots o provider redirect;
- niente Search Console submission;
- niente cutover dell’apice;
- nessuna rimozione legacy finché resta un fallback operativo.
