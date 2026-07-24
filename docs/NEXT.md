# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now

### 1. Chiudere M5.5b.2

Branch e PR:

```text
feat/public-canonical-astro-parity
PR #73 — Add canonical Astro renderer parity
```

Stato verificato dalla CI applicativa #345:

- render mode `preview | canonical` tipizzato;
- homepage, listing, trust, articolo e 404 Astro canonici compilati;
- componenti condivisi tra preview e canonical;
- internal link canonicali;
- canonical, robots e cache route-specific;
- published-only e fail-closed;
- 404 reale per assente, `review`, `draft`, reserved path e file probe;
- Worker factory tipizzata per il solo smoke locale;
- wrapper e configurazione temporanei eliminati a fine test;
- nessun env flag, header, cookie, query parameter o route di test;
- runtime production-style ancora sulla current matrix;
- sitemap, robots, API e provider redirect ancora backend-owned;
- tutte le suite Control Room verdi.

Prima del merge restano obbligatori:

```text
canonici aggiornati sullo stesso head
→ CI finale code + documentazione
→ PR pronta per review
→ merge senza cambiare activePublicRouteDecision
```

### 2. Aprire lo scope M5.5b.3

Branch documentale proposta dopo il merge di PR #73:

```text
docs/public-seo-endpoint-parity-scope
```

Obiettivo esclusivo:

```text
shared sitemap/robots builders
+ Astro endpoint handlers tested directly
+ live owner still backend
```

La discovery deve definire:

- modello condiviso per URL statiche e pagine `published`;
- ordinamento deterministico e `lastmod`;
- escaping XML;
- contenuto e cache di `/robots.txt`;
- esclusione permanente di preview, Control Room, review, draft e route tecniche;
- modalità di test diretto degli endpoint Astro senza cambiare owner live;
- confronto semantico con l’output legacy;
- gestione della 404 per endpoint non validi;
- rollback e confine con M5.7.

La PR di scope non modifica runtime.

### 3. Implementare M5.5b.3 soltanto dopo lo scope

Branch tecnica da autorizzare nello scope:

```text
feat/public-seo-endpoint-parity
```

Vincoli previsti:

- `/sitemap.xml` e `/robots.txt` Astro compilati e testati;
- custom Worker normale ancora su `activePublicRouteDecision` corrente;
- richieste live ai due endpoint ancora servite dal backend;
- nessun invio a Search Console;
- nessun tracking, CMP o configurazione Google;
- nessuna migrazione D1 o mutation;
- `/go/*`, `/api/*` e Control Room invariati;
- nessun cutover.

Acceptance prevista:

- typecheck e build;
- D1 e quality suite;
- Container;
- runtime pubblico e route policy;
- regressioni preview e canonical renderer;
- confronto sitemap/robots legacy-Astro;
- populated ed empty state;
- tutte le suite Control Room;
- prova che owner attivo e risposte production-style restano legacy.

### 4. Tenere separate le fasi successive

```text
M5.5b.2 canonical Astro parity
→ M5.5b.3 sitemap/robots parity
→ M5.6 catalog pilot
→ M5.7 cutover separato
```

Il cutover richiede una PR dedicata, autorizzazione esplicita e una modifica minima e reversibile della matrice attiva.

## Checkpoint chiusi

### M5.5a — SEO contract

PR #69, merge `46f1d66a591dd7860c101c86cb8295d97e4a2106`.

Homepage e articolo preview sono verificati dalla CI e nel sorgente live con metadata e JSON-LD condivisi.

### M5.5b.1 — Route policy

PR #71, merge `bd51faddddbb54647c22c3361dd04c5bc65e7681`.

CI finale #329 completamente verde.

Verificato:

- active matrix uguale alla current matrix;
- target matrix inattiva;
- canonical, sitemap, robots, API e provider redirect ancora backend-owned;
- preview e nuova Control Room Astro-owned;
- reserved paths, file probe e doppi slash iniziali non acquisiscono ownership Astro.

### M5.5b.2 — Canonical Astro parity

Scope: `docs/PUBLIC-CANONICAL-ASTRO-PARITY-SCOPE.md`.

CI applicativa #345 completamente verde.

Verificato direttamente in workerd e Chromium:

- home, listing, trust, articolo e 404 Astro canonici;
- canonical apex e `mainEntityOfPage` corretti;
- cache pubblica sulle pagine valide;
- noindex/no-store sulle 404 e sui fallimenti chiusi;
- nessun banner o link preview in modalità canonical;
- `WebSite`, `Article` e `FAQPage`;
- limiti, ordering, empty state e related links;
- review, draft e file probe mai esposti;
- nessun JavaScript applicativo;
- default production ancora legacy-owned.

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

Nessuna credenziale Google entra nel repository o nel frontend. Nessun tracking viene aggiunto alle preview noindex.

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
- niente cutover dell’apice;
- nessuna rimozione legacy finché resta un fallback operativo.
