# Stato del progetto

Data di riferimento: **24 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il custom Worker |
| Dominio `www` | Da ricontrollare | redirect 308 implementato |
| Worker e D1 | Operativi | stack remoto allineato fino a `0020`; topic-mismatch live ancora aperto |
| Workflow e Container | Operativi | primo ciclo recent-demand completato end-to-end |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato verificato |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione automatica |
| Primo draft | Approvato editorialmente | draft `2`; pagina materializzata ancora `review` |
| Control Room nuova | Operativa | parità read-only completa; prima mutation verificata in produzione |
| Control Room legacy | Transitoria e necessaria | fallback delle mutation residue |
| Public shell Astro | In produzione come preview | `/` live resta legacy |
| Renderer canonico Astro | Compilato e verificato in CI | owner live ancora backend |
| Sitemap e robots condivisi | Implementati e verificati dalla CI applicativa #359 | PR #75 ancora da chiudere; owner live backend |
| Affiliazioni | Disabilitate | nessun ranking o link remunerato attivo |
| Analytics | Proprietà preparate, integrazione assente | GTM, GA4 e GSC creati; nessun codice collegato |
| Service account Google | Preparato esternamente, non configurato | nessuna credenziale nel repository |

## Ciclo editoriale controllato

```text
recent demand
→ brief AI
→ accettazione umana
→ claim atomici
→ fonti ufficiali
→ verifiche
→ Page Readiness
→ evidence bundle
→ draft grounded
→ approvazione editoriale
```

Nessuno di questi passaggi pubblica autonomamente una pagina.

```text
claim:                  6
verified:               5
insufficient:           1
readiness score:        77
review draft eligible:  true
publication eligible:   false
draft:                  2 / version 2 / approved
materialized page:      review
```

La pagina Cina non è autorizzata alla pubblicazione.

## Control Room

```text
Cloudflare Access
→ validazione origine
→ shell Astro
→ una React island
→ contratti server-side
→ D1
```

Completato:

- overview, health, radar, segnali e brief;
- claim, fonti, scadenze e task;
- readiness ed evidence bundle;
- inventario e dettaglio draft;
- queue e audit;
- linkage claim → task;
- linkage audit → ID/versione draft;
- decisione brief `proposed → accepted | dismissed`.

Mutation residue:

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

M4 non è completato e la legacy privata non può ancora essere rimossa.

## Frontend pubblico Astro

```text
preview M5 ≠ cutover pubblico
owner target ≠ owner live
canonical Astro compilato ≠ canonical Astro servito
endpoint Astro compilato ≠ endpoint Astro live-owned
draft approvato ≠ pagina pubblicata
```

### Preview live verificate

Sono operative sotto `/astro-foundation`:

```text
/
metodo
trasparenza
privacy
destinazioni
guide
confronti
articoli/[slug]
```

Contratti:

- noindex e no-store;
- fuori sitemap;
- D1 letto soltanto server-side;
- righe `published` soltanto;
- ordine deterministico;
- raw HTML senza JavaScript obbligatorio;
- desktop, mobile, tastiera e assenza di overflow;
- route canoniche live ancora sul backend legacy.

## M5.5a — Contratto SEO condiviso

PR #69, merge `46f1d66a591dd7860c101c86cb8295d97e4a2106`.

Condivisi:

- title e description;
- Open Graph;
- `WebSite`, `Article` e `FAQPage`;
- data modificata e autore Organization;
- serializer JSON-LD sicuro.

Route-specific:

- canonical URL;
- `mainEntityOfPage`;
- robots;
- cache.

Homepage e articolo preview sono verificati nel sorgente live. Gli header HTTP live restano un controllo esterno separato.

## M5.5b.1 — Route policy foundation

PR #71, merge `bd51faddddbb54647c22c3361dd04c5bc65e7681`, CI finale #329.

Implementato:

- owner `astro | backend` e route kind tipizzati;
- current e target matrix separate;
- `activePublicRouteDecision = currentPublicRouteDecision`;
- reserved paths e file-probe policy condivisi;
- custom Worker collegato alla matrice attiva;
- boundary stretto per doppi slash iniziali.

Ownership attiva:

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
  asset tecnici
  articolo fallback e 404
```

## M5.5b.2 — Canonical Astro parity

```text
PR #73
merge b3a6625bfe6e3a06a46412e58f89a033dc82b9ff
CI finale #350
```

Verificato direttamente:

- render mode `preview | canonical`;
- home, listing, trust, articolo e 404 canonici nel manifest Astro;
- modalità canonical senza banner o link preview;
- internal link apex;
- canonical, robots e cache route-specific;
- articolo published-only;
- reserved path e file probe esclusi;
- 404 noindex e fail-closed;
- populated ed empty state;
- desktop, mobile, tastiera e assenza di JavaScript applicativo;
- runtime production-style ancora legacy-owned.

Nessun cutover o deploy pubblico è stato dichiarato.

## M5.5b.3 — SEO endpoint parity

Scope: `docs/PUBLIC-SEO-ENDPOINT-PARITY-SCOPE.md`.

```text
branch feat/public-seo-endpoint-parity
PR #75 — Add shared sitemap and robots parity
CI applicativa #359 completamente verde
```

### Contratto condiviso

`src/public-seo-endpoints.ts` è la fonte server-only per:

- route statiche canoniche;
- query D1 `WHERE status='published'`;
- validazione del site base HTTPS;
- validazione di slug e `updated_at`;
- controllo duplicati e limite URL;
- ordine statiche prima, dinamiche per slug ASC;
- normalizzazione `lastmod` a `YYYY-MM-DD`;
- escaping e serializzazione XML;
- documento robots deterministico;
- header di successo e fallimento chiuso.

Il backend legacy non mantiene più una propria query/serializzazione sitemap né testo robots inline. Gli handler Astro compilati sono:

```text
apps/web/src/pages/sitemap.xml.ts
apps/web/src/pages/robots.txt.ts
```

### Test diretto senza switch live

Lo smoke usa due runtime sullo stesso tipo di stato D1:

1. production-style con current matrix e endpoint backend-owned;
2. wrapper temporaneo con soltanto `route.kind === 'seo-endpoint'` Astro-owned.

Verificato:

- body e header equivalenti;
- GET, HEAD e query string irrilevanti;
- trailing slash normalizzato dal confine Worker→Astro;
- XML parseabile, namespace corretto, ordine e unicità;
- route statiche canoniche;
- pagine published-only;
- `lastmod` normalizzato;
- review, draft, archived, preview, API, Control Room, `/go/*`, 404 e asset esclusi;
- robots esatto con newline finale;
- populated state;
- empty state con sole sette URL statiche;
- invalid state con risposta generica `500`, `no-store` e nessun XML parziale;
- homepage, API e tutte le altre route ancora sull’owner corrente;
- tutte le suite Control Room verdi.

Il primo run #358 ha rilevato la differenza su `/sitemap.xml/` e `/robots.txt/`; il Worker ora inoltra ad Astro la pathname normalizzata della route decision soltanto per `seo-endpoint` Astro-owned. Questo non modifica il runtime live, perché i due endpoint restano backend-owned.

Ownership live invariata:

```text
/sitemap.xml → backend
/robots.txt  → backend
```

PR #75 resta draft fino alla CI finale sullo stesso head di codice e documentazione.

## Google measurement

GTM, GA4, Search Console e service account sono stati preparati esternamente.

Non sono configurati nel sito:

- CMP e Consent Mode;
- snippet GTM;
- eventi GA4;
- invio sitemap tramite API;
- credenziali service account.

Nessun tracking viene aggiunto alle preview noindex.

## Gap aperti

- CI finale e merge di PR #75;
- scope M5.6 catalogo pilot;
- piccolo catalogo con intenti distinti e publication gate;
- PR separata di cutover apex;
- verifica HTTP live degli header preview;
- linkage recenti Control Room nel browser reale;
- topic-mismatch sul primo run autorizzato;
- conversione brief e mutation M4 residue;
- CMP, GTM, GA4 e Search Console in M6;
- rimozione legacy soltanto dopo i rispettivi criteri di uscita.

## Prossimo checkpoint

```text
canonici aggiornati su PR #75
→ CI finale code + documentazione
→ merge senza cambiare activePublicRouteDecision
→ scope M5.6 catalogo pilot
```
