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
| Routing/ownership SEO | Scope in preparazione | nessuna route canonica migrata |
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
progressi M5 ≠ completamento M4
draft approvato ≠ pagina pubblicata
```

### Public shell, trust, homepage e listing

Sono in produzione sotto `/astro-foundation`:

```text
/
metodo
trasparenza
privacy
destinazioni
guide
confronti
```

nel namespace preview.

Contratti verificati:

- noindex e no-store;
- esclusione dalla sitemap;
- D1 letto soltanto server-side;
- righe `published` soltanto;
- ordine deterministico;
- raw HTML utile senza JavaScript obbligatorio;
- desktop, mobile, tastiera e assenza di overflow;
- route canoniche ancora sul renderer legacy.

### Renderer articolo Astro — M5.4

Route:

```text
/astro-foundation/articoli/[slug]
```

Implementato e verificato:

- query fissa `WHERE slug=? AND status='published'`;
- validazione runtime di scalari, date, blocchi, FAQ e fonti;
- blocchi strutturati, non HTML AI grezzo;
- FAQ native `details/summary`;
- fonti HTTPS;
- provenance pubblica page-level;
- nessun claim escluso o dato operativo interno esposto;
- related links published-only e deterministici;
- vera 404 per slug assente, `review` o `draft`;
- fail-closed per riga `published` invalida;
- tabelle con overflow locale;
- nessuna Astro island o JavaScript applicativo.

Checkpoint live:

- desktop superiore e inferiore;
- mobile superiore e inferiore;
- hero, risposta diretta, disclosure, tabella, FAQ, provenance, fonti e footer;
- FAQ espansa su mobile;
- nessun overflow orizzontale visibile;
- related omessi quando il query set exact-cluster è vuoto.

M5.4 è chiusa.

## M5.5a — Fondazione del contratto SEO

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

Il modello condiviso produce:

- title e meta description;
- Open Graph `website` o `article`;
- `WebSite` JSON-LD;
- `Article` JSON-LD;
- `FAQPage` condizionale;
- `dateModified` normalizzata;
- `Organization` come autore;
- `mainEntityOfPage` determinato dalla route chiamante.

La policy della route resta separata:

```text
legacy:
  / e /{slug}
  index,follow,max-image-preview:large
  canonical produzione

Astro preview:
  /astro-foundation*
  noindex,nofollow
  no-store
  self-canonical preview
```

Sicurezza JSON-LD:

- valori limitati a JSON compatibile;
- numeri non finiti e oggetti non plain rifiutati;
- profondità limitata;
- `<`, U+2028 e U+2029 escapati;
- fixture con `</script>`, `<example>`, virgolette, apostrofi e accenti;
- nessuno script eseguibile;
- `set:html` usato soltanto per JSON-LD già serializzato, mai per contenuto editoriale.

### CI

Completamente verdi:

- typecheck e build;
- migrazioni;
- quality gate e golden evaluation;
- Container build e smoke;
- runtime pubblico;
- smoke SEO D1/workerd/Chromium;
- tutte le suite Control Room.

La prima esecuzione runtime aveva rilevato un’asserzione troppo ampia sul carattere `<` dentro attributi quotati. Il test è stato corretto sul DOM reale senza ridurre il guardrail.

### Checkpoint live conclusivo

Homepage preview verificata nel sorgente live:

- `robots=noindex,nofollow`;
- canonical `https://senzaroaming.it/astro-foundation`;
- `og:type=website`;
- title e description condivisi;
- `og:url` uguale alla canonical;
- `WebSite` JSON-LD con nome e URL della preview;
- nessun JavaScript applicativo visibile.

Articolo preview `migliore-esim` verificato nel sorgente live:

- canonical namespaced;
- `robots=noindex,nofollow`;
- `og:type=article`;
- `Article` JSON-LD;
- `FAQPage` JSON-LD con due domande;
- `mainEntityOfPage` sulla route preview;
- `dateModified` e autore `Organization` presenti;
- nessun secondo script eseguibile visibile.

Gli header HTTP live `X-Robots-Tag` e `Cache-Control: no-store` non sono stati ispezionati esternamente in questa sessione; restano attestati dalla CI e sono ancora elencati come verifica operativa separata.

M5.5a è chiusa. Nessun cutover è avvenuto.

## M5.5b — Routing e ownership SEO

Discovery completata:

- `apps/web/src/worker.ts` inoltra ad Astro soltanto `/astro-foundation*` e `/control-room-foundation*`;
- `src/index.ts` resta owner di tutte le route canoniche e tecniche;
- sitemap e robots sono generati dal backend;
- `/go/{provider}` resta backend-owned e registra il click in D1;
- il fallback articolo legacy avviene soltanto dopo route riservate e file-probe rejection.

Scope canonico:

```text
docs/PUBLIC-SEO-ROUTING-OWNERSHIP-SCOPE.md
```

Target:

- Astro owner futuro delle route pubbliche canoniche, sitemap, robots e 404 editoriale;
- backend owner permanente di `/api/*`, `/go/*` ed execution plane;
- Control Room foundation invariata;
- namespace preview conservato fino al cutover verificato;
- route matrix esplicita e rollback versionato.

Prima branch tecnica proposta:

```text
feat/public-route-policy-foundation
```

Questa branch modellerà soltanto owner corrente e target. Non cambierà alcuna route live.

## Google measurement stack

Preparati esternamente:

- Google Tag Manager;
- Google Analytics 4;
- Search Console;
- service account con accesso alle proprietà.

Non sono configurati nel sito:

- CMP e Consent Mode;
- snippet GTM;
- eventi GA4;
- invio sitemap tramite API;
- credenziali service account.

Nessun tracking viene aggiunto alle preview noindex.

## Gap aperti

- PR documentale di chiusura M5.5a e scope M5.5b;
- route policy foundation senza cambio live;
- canonical Astro parity sotto test;
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
merge scope routing/ownership
→ branch feat/public-route-policy-foundation
→ route matrix tipizzata senza cambio live
→ CI completa
→ verifica che canonical, sitemap, robots e go restino legacy-owned
```
