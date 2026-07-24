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
| Preview Astro | Verificata in produzione | namespace noindex/no-store |
| Renderer canonico Astro | Compilato e verificato in CI | owner live ancora backend |
| Sitemap e robots parity | Completata | PR #75, merge `8d52e7e316d632dcda0d5bb45b818a490df9fef6`, CI #365 |
| Catalogo pilot | Scope in corso | release candidate in review, nessuna pubblicazione autorizzata |
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
→ pagina materializzata in review
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

La pagina Cina non è autorizzata alla pubblicazione e non entra automaticamente nel pilot.

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
candidate ≠ release candidate ≠ published
```

### Preview live

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
- D1 server-side;
- righe `published` soltanto;
- ordine deterministico;
- raw HTML senza JavaScript obbligatorio;
- desktop, mobile e tastiera;
- route canoniche live ancora sul backend.

## M5.5 — SEO e routing parity

### M5.5a — Contratto SEO

PR #69, merge `46f1d66a591dd7860c101c86cb8295d97e4a2106`.

Condivisi:

- title e description;
- Open Graph;
- `WebSite`, `Article` e `FAQPage`;
- serializer JSON-LD sicuro.

### M5.5b.1 — Route policy

PR #71, merge `bd51faddddbb54647c22c3361dd04c5bc65e7681`, CI #329.

```text
activePublicRouteDecision = currentPublicRouteDecision
```

### M5.5b.2 — Canonical Astro parity

```text
PR #73
merge b3a6625bfe6e3a06a46412e58f89a033dc82b9ff
CI finale #350
```

Home, listing, trust, articolo e 404 canonici sono compilati e testati direttamente senza switch live.

### M5.5b.3 — Sitemap e robots parity

```text
PR #75
merge 8d52e7e316d632dcda0d5bb45b818a490df9fef6
CI finale #365
```

Completato:

- `src/public-seo-endpoints.ts` come contratto server-only;
- route statiche dalla route policy;
- query `pages.status='published'`;
- validazione site base, slug, date, duplicati e limite URL;
- XML deterministico e `lastmod` normalizzato;
- robots deterministico;
- backend legacy e Astro sullo stesso builder;
- GET, HEAD, query string e trailing slash;
- populated, empty e invalid state;
- fallimento chiuso senza XML parziale;
- tutte le suite pubbliche e Control Room.

Ownership live invariata:

```text
/sitemap.xml → backend
/robots.txt  → backend
```

Nessun deploy o cutover è stato eseguito.

## M5.6 — Catalogo pilot

Scope: `docs/PUBLIC-CATALOG-PILOT-SCOPE.md`.

Branch:

```text
docs/public-catalog-pilot-scope
```

### Scoperta verificata

Il sistema possiede già:

- `publication_eligible` deterministico;
- approvazione umana `approved_for_publication`;
- `ready_for_publication` persistito;
- draft grounded con provenance;
- approvazione del draft;
- materializzazione in `pages.status='review'`.

Non possiede una capacità autorizzata:

```text
review → published
```

Poiché il renderer legacy live serve già righe `published`, introdurre quella mutation durante la foundation esporrebbe contenuti reali prima della decisione sul cutover.

### Decisione di scope

M5.6a prepara un massimo di quattro release candidate, tutte ancora in `review`.

```text
candidate
→ gate deterministici
→ approvazione bundle
→ draft grounded approvato
→ pagina review coerente
→ release candidate manifest
```

Non sono scelti anticipatamente Paesi, dispositivi o provider.

La composizione preferita, non obbligatoria, è:

```text
1 destinazione
1 guida
1 confronto
+ 1 seconda destinazione soltanto se distinta e pienamente idonea
```

Zero candidate è un risultato valido quando i dati reali non superano i gate.

### Foundation proposta

Branch tecnica dopo il merge dello scope:

```text
feat/public-catalog-pilot-foundation
```

Output:

- audit read-only;
- manifest versionato massimo quattro entry;
- report ammessi/esclusi e blocker;
- freshness e latest-version validation;
- collisioni di slug e intento;
- fixtures e smoke;
- nessuna mutation, pubblicazione o route live.

### Pubblicazione

Non autorizzata dallo scope M5.6a.

Richiederà una decisione separata su quando eseguire la prima transizione `review → published`:

1. prima del cutover sul renderer legacy;
2. insieme a M5.7;
3. dopo M5.7.

## Google measurement

GTM, GA4, Search Console e service account sono preparati esternamente ma non collegati.

Restano assenti:

- CMP e Consent Mode;
- snippet GTM;
- eventi GA4;
- invio sitemap;
- credenziali service account nel progetto.

## Gap aperti

- merge dello scope M5.6;
- candidate audit foundation;
- audit dati reali e manifest release candidate;
- decisione separata di pubblicazione;
- M5.7 cutover apex;
- header HTTP live delle preview;
- linkage recenti Control Room nel browser reale;
- topic-mismatch sul primo run autorizzato;
- conversione brief e mutation M4 residue;
- CMP, GTM, GA4 e Search Console in M6;
- rimozione legacy soltanto dopo i rispettivi criteri di uscita.

## Prossimo checkpoint

```text
scope M5.6 in PR documentale
→ CI completa
→ merge
→ feat/public-catalog-pilot-foundation
→ audit read-only e manifest
```
