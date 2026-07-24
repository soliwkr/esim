# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now

### 1. Chiudere lo scope M5.5b.2

Branch documentale:

```text
docs/public-canonical-astro-parity-scope
```

Scope canonico:

```text
docs/PUBLIC-CANONICAL-ASTRO-PARITY-SCOPE.md
```

La PR deve registrare:

- route Astro canoniche da compilare;
- render mode `preview | canonical` condiviso;
- parametrizzazione di layout, homepage, listing, trust e articolo;
- internal linking canonicale;
- 404 Astro;
- test diretto del renderer senza cambiare owner live;
- separazione da sitemap/robots e dal cutover.

Questa branch è documentale e non modifica runtime o deploy.

### 2. Implementare la canonical Astro parity

Branch autorizzata dopo il merge dello scope:

```text
feat/public-canonical-astro-parity
```

Obiettivo esclusivo:

```text
canonical Astro routes compiled
+ direct local target-matrix smoke
+ active production matrix still current
```

Route da compilare:

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

Vincoli:

- `activePublicRouteDecision` resta uguale a `currentPublicRouteDecision`;
- le richieste canoniche del runtime production-style continuano al backend;
- nessuna variabile d’ambiente, query string, header o cookie può cambiare renderer;
- sitemap, robots, `/go/*`, `/api/*` e legacy Control Room restano backend-owned;
- nessuna route di test viene distribuita.

### 3. Factory Worker per il solo smoke locale

Refactor autorizzato:

```text
createPublicWorker(routeDecision)
```

Il default production resta:

```text
createPublicWorker(activePublicRouteDecision)
```

Lo smoke locale genera un wrapper temporaneo che usa una decisione limitata a:

```text
canonical-static
canonical-article
public-404
```

Tutto il resto resta backend-owned anche nel test. Wrapper, configurazione e stato locale vengono eliminati al termine.

### 4. Acceptance tecnica

Nuovo comando previsto:

```text
npm run smoke:public-canonical-astro
```

Deve verificare:

- home, listing, trust e articolo Astro canonici;
- canonical apex, robots indicizzabili e cache pubblica;
- nessun banner o link `/astro-foundation` nella modalità canonical;
- `WebSite`, `Article` e `FAQPage` corretti;
- published-only, ordering, limiti, empty state e related links;
- 404 per assente, review, draft, reserved path e file probe;
- fail-closed per riga published invalida;
- desktop, mobile, tastiera e assenza di overflow;
- nessun JavaScript applicativo pubblico;
- runtime production-style ancora legacy-owned.

CI completa obbligatoria:

- tipi Cloudflare;
- typecheck e build;
- migrazioni D1;
- quality gate e golden evaluation;
- Container build e smoke;
- runtime pubblico;
- route policy smoke;
- smoke preview esistenti;
- SEO drift smoke;
- canonical Astro smoke;
- tutte le suite Control Room.

### 5. Fasi successive separate

```text
M5.5b.2 canonical Astro parity
→ M5.5b.3 sitemap/robots parity
→ M5.6 catalog pilot
→ M5.7 cutover separato
```

Il cutover richiede una PR dedicata e una modifica minima e reversibile della matrice attiva.

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
- reserved paths, file probe e doppi slash iniziali non acquisiscono ownership Astro;
- tutte le regressioni pubbliche e private verdi.

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
