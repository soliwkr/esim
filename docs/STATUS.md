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
| Trust, homepage e listing Astro | Verificati in produzione | namespace preview noindex/no-store |
| Renderer articolo Astro | Verificato in produzione | desktop, mobile e sorgente SEO live |
| Fondazione SEO condivisa | Completata e verificata live | PR #69 |
| Route policy foundation | Completata | PR #71, merge `bd51faddddbb54647c22c3361dd04c5bc65e7681`, CI #329 |
| Canonical Astro parity | Scope definito | implementazione non avviata; owner live ancora backend |
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
draft approvato ≠ pagina pubblicata
```

### Preview verificate

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

Contratti verificati:

- noindex e no-store;
- fuori sitemap;
- D1 letto soltanto server-side;
- righe `published` soltanto;
- ordine deterministico;
- raw HTML senza JavaScript obbligatorio;
- desktop, mobile, tastiera e assenza di overflow;
- route canoniche ancora sul backend legacy.

### M5.4 — Renderer articolo

Implementato e verificato:

- query `WHERE slug=? AND status='published'`;
- validazione runtime di scalari, date, blocchi, FAQ e fonti;
- blocchi strutturati e FAQ native;
- fonti HTTPS e provenance pubblica;
- nessun dato operativo interno esposto;
- related links published-only e deterministici;
- vera 404 per assente, `review` o `draft`;
- fail-closed per riga `published` invalida;
- nessun HTML AI grezzo o JavaScript applicativo.

Il checkpoint live desktop/mobile è completo.

## M5.5a — Contratto SEO condiviso

PR #69, merge `46f1d66a591dd7860c101c86cb8295d97e4a2106`.

```text
validated public page
→ src/public-seo.ts
→ typed SEO document
→ legacy canonical renderer OR Astro noindex preview
```

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

Homepage e articolo preview sono verificati nel sorgente live. Gli header HTTP live restano una verifica separata, già coperta dalla CI.

M5.5a è chiusa.

## M5.5b.1 — Route policy foundation

Scope: `docs/PUBLIC-SEO-ROUTING-OWNERSHIP-SCOPE.md`.

PR #71:

```text
Add typed public route ownership policy
merge bd51faddddbb54647c22c3361dd04c5bc65e7681
CI finale #329
```

Implementato:

- `src/public-route-policy.ts`;
- owner `astro | backend` e route kind tipizzati;
- current e target matrix separate;
- `activePublicRouteDecision = currentPublicRouteDecision`;
- reserved paths e file-probe policy condivisi;
- validazione slug articolo single-segment;
- custom Worker collegato alla matrice attiva;
- backend legacy collegato alla stessa probe policy;
- smoke route policy dedicato;
- boundary stretto per doppi slash iniziali.

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

CI #329 completamente verde, comprese tutte le suite pubbliche e Control Room.

## M5.5b.2 — Canonical Astro parity

Scope canonico:

```text
docs/PUBLIC-CANONICAL-ASTRO-PARITY-SCOPE.md
```

Branch tecnica autorizzata dopo il merge dello scope:

```text
feat/public-canonical-astro-parity
```

Obiettivo:

```text
canonical Astro routes compiled
+ direct local target-matrix smoke
+ active production matrix still current
```

Route previste:

```text
/
/destinazioni
/guide
/confronti
/metodo
/trasparenza
/privacy
/{slug-published}
404 editoriale
```

Decisioni principali:

- render mode tipizzato `preview | canonical`;
- componenti condivisi, non route duplicate;
- canonical mode senza banner o copy preview;
- cache canonicale `public,max-age=300`;
- internal link interamente canonicali;
- published-only, fail-closed e SEO condivisi;
- Worker costruibile tramite factory tipizzata;
- default production sempre sulla matrice attiva corrente;
- smoke locale con wrapper e configurazione temporanei;
- nessun env flag, header, cookie o query parameter per cambiare renderer;
- sitemap e robots rinviati a M5.5b.3.

Nessun runtime è modificato dalla branch documentale corrente.

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

- implementazione canonical Astro parity senza attivazione;
- parity Astro di sitemap e robots;
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
merge scope canonical Astro parity
→ branch feat/public-canonical-astro-parity
→ route Astro canoniche compilate e testate direttamente
→ runtime production-style ancora legacy-owned
→ CI completa
```
