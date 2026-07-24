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
| Public shell Astro | In produzione come preview | `/` resta legacy |
| Trust pages Astro | Verificate in produzione | checkpoint mobile 3/3 |
| Homepage candidata Astro | Verificata in produzione | desktop, mobile e sorgente SEO live |
| Listing Astro | Verificati in produzione | Destinazioni, Guide e Confronti |
| Renderer articolo Astro | Verificato in produzione | desktop, mobile e sorgente SEO live |
| Fondazione SEO condivisa | Completata e verificata live | PR #69, merge `46f1d66a591dd7860c101c86cb8295d97e4a2106` |
| Route policy foundation | Implementata e verificata in CI | PR #71; matrice corrente ancora attiva |
| Route canonicali Astro | Non implementate | owner live ancora backend |
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

Architettura:

```text
Cloudflare Access
→ validazione origine
→ shell Astro
→ una React island
→ contratti server-side
→ D1
```

Completato:

- overview e health;
- radar, segnali e brief;
- claim, fonti, scadenze e task;
- readiness ed evidence bundle;
- inventario e dettaglio draft;
- queue e audit;
- linkage claim → task;
- linkage audit → ID/versione draft;
- decisione brief `proposed → accepted | dismissed`.

La prima mutation è verificata in produzione con identità Access, conferma esplicita, state machine D1, audit append-only, idempotenza e `publicationTriggered: false`.

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
draft approvato ≠ pagina pubblicata
```

### Preview pubbliche verificate

Sono in produzione sotto `/astro-foundation`:

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

Contratti verificati:

- noindex e no-store;
- esclusione dalla sitemap;
- D1 letto soltanto server-side;
- righe `published` soltanto;
- ordine deterministico;
- raw HTML utile senza JavaScript obbligatorio;
- desktop, mobile, tastiera e assenza di overflow;
- route canoniche ancora sul renderer legacy.

### Renderer articolo — M5.4

Implementato e verificato:

- query fissa `WHERE slug=? AND status='published'`;
- validazione runtime di scalari, date, blocchi, FAQ e fonti;
- blocchi strutturati, non HTML AI grezzo;
- FAQ native `details/summary`;
- fonti HTTPS e provenance pubblica page-level;
- nessun claim escluso o dato operativo interno esposto;
- related links published-only e deterministici;
- vera 404 per slug assente, `review` o `draft`;
- fail-closed per riga `published` invalida;
- tabelle con overflow locale;
- nessuna Astro island o JavaScript applicativo.

Il checkpoint live desktop/mobile è completo. M5.4 è chiusa.

## M5.5a — Contratto SEO condiviso

PR:

```text
#69 — Add shared public SEO contract foundation
merge: 46f1d66a591dd7860c101c86cb8295d97e4a2106
```

Architettura:

```text
validated public page
→ src/public-seo.ts
→ typed SEO document
→ legacy canonical renderer OR Astro noindex preview
```

Il modello condiviso produce title, description, Open Graph, `WebSite`, `Article`, `FAQPage`, `dateModified`, autore Organization e `mainEntityOfPage` route-specific.

Sicurezza:

- valori limitati a JSON compatibile;
- numeri non finiti e oggetti non plain rifiutati;
- profondità limitata;
- `<`, U+2028 e U+2029 escapati;
- fixture con `</script>`, `<example>`, virgolette, apostrofi e accenti;
- nessuno script eseguibile;
- `set:html` usato soltanto per JSON-LD già serializzato.

Checkpoint live conclusivo:

- homepage: noindex, self-canonical, `og:type=website`, `WebSite` JSON-LD;
- articolo `migliore-esim`: noindex, canonical namespaced, `og:type=article`, `Article` e `FAQPage`, `mainEntityOfPage`, data e autore.

Gli header HTTP live `X-Robots-Tag` e `Cache-Control: no-store` restano una verifica operativa separata; sono coperti dalla CI.

M5.5a è chiusa. Nessun cutover è avvenuto.

## M5.5b.1 — Route policy foundation

Scope canonico:

```text
docs/PUBLIC-SEO-ROUTING-OWNERSHIP-SCOPE.md
```

Branch e PR:

```text
feat/public-route-policy-foundation
PR #71 — Add typed public route ownership policy
```

Implementato:

- `src/public-route-policy.ts` server-only;
- owner tipizzati `astro | backend`;
- categorie esplicite per preview, Control Room, API, provider redirect, legacy Control Room, route canoniche statiche, endpoint SEO, asset tecnici, articolo e 404;
- normalizzazione pathname;
- reserved single-segment paths;
- file-probe policy condivisa;
- validazione dello slug articolo single-segment;
- `currentPublicRouteDecision` e `targetPublicRouteDecision` separate;
- `activePublicRouteDecision = currentPublicRouteDecision`;
- decisioni immutabili;
- custom Worker collegato all’export attivo;
- backend legacy collegato alla stessa file-probe policy.

Ownership attiva invariata:

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

La matrice target è documentata e testata, ma non viene usata per servire traffico.

### Verifica CI #323

Completamente verdi:

- generazione tipi Cloudflare;
- typecheck TypeScript e Astro;
- build Astro e custom Worker;
- migrazioni D1;
- quality gate e golden evaluation;
- Container build e smoke;
- runtime Astro/backend;
- nuovo smoke route policy;
- public shell, homepage, trust, listing, articolo e SEO;
- tutte le suite Control Room.

Il runtime conferma che `/`, listing, trust, articoli, sitemap, robots, `/go/*` e `/api/*` restano backend-owned. Nessuna route di pubblicazione è stata introdotta.

## Prossima fase — canonical Astro parity

Prima del codice serve una PR di scope separata che definisca:

- come compilare le route Astro canoniche senza servirle live;
- come testare direttamente il renderer Astro bypassando soltanto nel test la matrice attiva;
- parametrizzazione preview/canonical dei componenti;
- internal linking canonicale;
- 404 Astro;
- published-only e fail-closed;
- criterio di parità visuale, accessibile e SEO;
- nessuna migrazione live di sitemap, robots o provider redirect.

## Google measurement stack

Preparati esternamente:

- Google Tag Manager;
- Google Analytics 4;
- Search Console;
- service account con accesso alle proprietà.

Non sono configurati nel sito CMP, Consent Mode, snippet GTM, eventi GA4, invio sitemap tramite API o credenziali service account. Nessun tracking viene aggiunto alle preview noindex.

## Gap aperti

- scope canonical Astro parity;
- route canonicali Astro compilate e testate senza attivazione;
- parity di sitemap, robots e 404 Astro;
- piccolo catalogo pilot;
- PR separata di cutover apex;
- verifica HTTP live degli header preview;
- linkage recenti Control Room nel browser reale;
- topic-mismatch sul primo run autorizzato;
- conversione brief e mutation M4 residue;
- CMP, GTM, GA4 e Search Console in M6;
- rimozione legacy soltanto dopo i rispettivi criteri di uscita.

## Prossimo checkpoint

```text
merge PR #71
→ scope canonical Astro parity
→ route Astro canoniche compilate ma non servite live
→ CI completa
→ owner attivo ancora legacy
```
