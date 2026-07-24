# Public canonical Astro parity — scope M5.5b.2

Data di riferimento: **24 luglio 2026**.

## Stato

Questa fase compila e verifica le future route canoniche Astro, ma non le serve nel deploy reale.

```text
route policy foundation
→ canonical Astro pages compiled
→ direct local target-matrix smoke
→ active matrix still current
→ no public cutover
```

Branch tecnica autorizzata dopo il merge di questo scope:

```text
feat/public-canonical-astro-parity
```

## Obiettivo esclusivo

Preparare la versione Astro canonica di:

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

Le route devono essere presenti nel manifest Astro e verificabili in un runtime locale dedicato, mentre `activePublicRouteDecision` continua a instradare ogni richiesta canonica live al backend legacy.

## Ownership invariata

Durante tutta M5.5b.2:

```text
Astro live:
  /astro-foundation*
  /control-room-foundation*

Backend live:
  tutte le route canoniche
  /sitemap.xml
  /robots.txt
  /go/*
  /api/*
  legacy Control Room
```

La matrice target non diventa attiva.

## Route Astro da compilare

File previsti:

```text
apps/web/src/pages/index.astro
apps/web/src/pages/destinazioni.astro
apps/web/src/pages/guide.astro
apps/web/src/pages/confronti.astro
apps/web/src/pages/metodo.astro
apps/web/src/pages/trasparenza.astro
apps/web/src/pages/privacy.astro
apps/web/src/pages/[slug].astro
apps/web/src/pages/404.astro
```

Non vengono aggiunti in questa slice:

```text
apps/web/src/pages/sitemap.xml.*
apps/web/src/pages/robots.txt.*
```

Sitemap e robots appartengono a M5.5b.3.

## Render mode condiviso

Introdurre un contratto tipizzato, candidato:

```text
src/public-render-mode.ts
```

Valori ammessi:

```text
preview
canonical
```

Il contratto deve derivare almeno:

- home path;
- listing path;
- trust path;
- article path;
- canonical path;
- breadcrumb e navigation labels;
- preview banner visibility;
- noindex policy;
- cache policy;
- article base per card e correlati.

Non accettare path o HTML arbitrari dal database.

## Componenti da parametrizzare

### Layout

`PublicLayout.astro` deve distinguere esplicitamente:

```text
preview:
  noindex,nofollow
  X-Robots-Tag noindex,nofollow
  Cache-Control no-store
  self-canonical namespaced

canonical:
  index,follow,max-image-preview:large
  nessun X-Robots-Tag noindex
  Cache-Control public,max-age=300
  canonical apex
```

Title, description, Open Graph e JSON-LD continuano a provenire da `src/public-seo.ts`.

### Homepage

Estrarre il corpo attuale della candidata in un componente condiviso o render route condiviso.

La modalità canonical:

- non mostra il banner preview;
- usa link `/destinazioni`, `/guide`, `/confronti`, `/metodo`;
- usa card articolo `/{slug}`;
- conserva query, limiti, ordering ed empty state;
- usa `WebSite` JSON-LD sull’URL apex.

### Listing

`PublicListingPage.astro` riceve il render mode.

La modalità canonical:

- usa title e description canonici senza prefisso preview;
- breadcrumb da `/`;
- navigation tra listing canonicali;
- card verso `/{slug}`;
- nessun copy “preview” o “route attuali non cambiano”;
- stesso read model published-only e stesso ordine.

### Trust pages

Il contenuto di Metodo, Trasparenza e Privacy non deve essere duplicato tra due route file.

Estrarre route component condivisi o componenti contenuto dedicati. `TrustPage.astro` riceve il render mode e deriva:

- link interni namespaced o canonici;
- aria-label coerenti;
- presenza del banner e della nota di isolamento.

La modalità canonical non mostra testo che descrive la pagina come preview.

### Articolo

`PublicArticlePage.astro` riceve il render mode.

La modalità canonical:

- canonical path `/{slug}`;
- breadcrumb `/` e listing canonicale;
- related links `/{slug}`;
- nessun banner o pannello “Contratto della preview”;
- disclosure commerciale invariata e derivata dallo stato affiliate corrente;
- `Article` e `FAQPage` con `mainEntityOfPage` canonico;
- published-only, HTTPS sources, provenance e fail-closed invariati.

`PublicRelatedArticles.astro` deve ricevere un article path builder o render mode; non deve hardcodare il namespace preview.

### 404

La route Astro 404 deve:

- restituire status `404` reale;
- essere noindex,nofollow;
- usare `Cache-Control: no-store`;
- non interrogare D1 per path non idonei;
- non mostrare contenuto editoriale da righe `review` o `draft`;
- mantenere il contratto canonical `/404` finché una decisione successiva non lo cambia;
- offrire link canonici a Destinazioni e Guide.

## Fallback articolo

`[slug].astro` accetta soltanto lo slug già classificato da `publicArticleSlugCandidate`.

Sequenza:

```text
pathname
→ route policy
→ canonical-article
→ slug validato
→ loadPublishedArticle
→ found | missing | invalid
```

Esiti:

```text
found:
  200 canonical Astro

missing / draft / review:
  404 Astro

published invalid:
  500 generica fail-closed
```

Reserved path e file probe non devono raggiungere la query articolo.

## Test diretto senza switch runtime

Non introdurre:

- variabile d’ambiente per cambiare renderer;
- query parameter;
- header speciale;
- cookie;
- route pubblica di test;
- flag Cloudflare nascosto.

Refactor consentito:

```text
createPublicWorker(routeDecision)
```

Il custom Worker esporta una factory tipizzata. Il default production resta:

```text
createPublicWorker(activePublicRouteDecision)
```

Lo smoke locale:

1. esegue il normale build Astro;
2. genera in una directory temporanea un piccolo Worker wrapper;
3. importa la factory dal build server;
4. passa una funzione di test che assegna ad Astro soltanto:
   - `canonical-static`;
   - `canonical-article`;
   - `public-404`;
5. mantiene backend-owned:
   - API;
   - provider redirect;
   - legacy Control Room;
   - asset tecnici;
   - sitemap e robots;
6. avvia Wrangler con una copia temporanea della configurazione generata;
7. elimina wrapper e stato al termine.

La factory non deve essere selezionabile da una richiesta o dalla configurazione del deploy reale.

## Parità richiesta

Parità non significa HTML byte-identico al renderer legacy.

Significa:

- stesso catalogo pubblico e stessa inclusione published-only;
- stesso ordine deterministico;
- stessi title, description, Open Graph e JSON-LD normalizzati;
- stessi canonical URL e status attesi;
- stessi limiti e empty state dei read model;
- stesse FAQ, fonti, date e correlati per un articolo;
- nessuna riga `review` o `draft`;
- nessun HTML AI grezzo;
- nessun JavaScript applicativo pubblico;
- internal link interamente canonici nella modalità canonical;
- accessibilità, mobile e overflow equivalenti alla preview verificata.

Il design target è quello Astro già verificato nella preview, senza copy e segnali di isolamento preview.

## Fixture D1

Lo smoke canonicale usa stati isolati:

### Populated

- homepage featured oltre il limite;
- destinazioni oltre il limite;
- listing di tutti i tipi;
- articolo published con blocchi, FAQ, fonti e correlati;
- righe `review` e `draft` omonime o più recenti da escludere;
- una riga published strutturalmente invalida.

### Empty

- nessuna riga published utilizzabile;
- homepage e listing mostrano gli empty state previsti;
- articolo assente restituisce 404.

## Smoke e acceptance

Nuovo comando previsto:

```text
npm run smoke:public-canonical-astro
```

Verificare nel runtime diretto Astro:

- home, tre listing, tre trust page e articolo `200`;
- canonical apex corretti;
- robots indexabili sulle pagine canoniche;
- cache pubblica `max-age=300`;
- nessun banner preview;
- nessun link `/astro-foundation` nel corpo canonico;
- card, breadcrumb, menu, footer e related completamente canonici;
- `WebSite`, `Article` e `FAQPage` corretti;
- published-only e ordering;
- empty state;
- 404 reale per assente, review, draft, reserved path e file probe;
- 500 generica per published invalida;
- desktop, mobile, tastiera e nessun overflow;
- nessun `astro-island` o script eseguibile pubblico.

Verificare nel runtime production-style normale:

- le stesse route canoniche continuano a essere servite dal backend;
- `/sitemap.xml`, `/robots.txt`, `/go/*` e `/api/*` restano backend-owned;
- preview e Control Room foundation restano Astro-owned;
- `activePublicRouteDecision === currentPublicRouteDecision`;
- doppi slash iniziali non acquisiscono ownership Astro.

## CI completa

Prima del merge:

- tipi Cloudflare;
- typecheck TypeScript e Astro;
- build Astro e custom Worker;
- migrazioni D1;
- quality gate e golden evaluation;
- Container build e smoke;
- runtime production-style;
- route policy smoke;
- smoke pubblici preview;
- SEO drift smoke;
- nuovo canonical Astro smoke;
- tutte le suite Control Room.

## Esclusioni

- nessun cambio a `activePublicRouteDecision`;
- nessun cutover live;
- nessuna migrazione di sitemap o robots;
- nessuna modifica a `/go/{provider}`;
- nessuna modifica ai contratti API;
- nessuna D1 migration o mutation;
- nessuna capacità di pubblicazione;
- nessun tracking, CMP o configurazione Google;
- nessuna attivazione affiliate;
- nessuna rimozione del renderer legacy;
- nessun deploy di una route di test.

## Criterio di uscita

M5.5b.2 è completata quando:

```text
canonical Astro routes compiled and directly verified
+ production-style runtime still legacy-owned
+ full CI green
+ no live cutover
```

La fase successiva è M5.5b.3: builder e handler Astro per sitemap/robots, ancora senza attivazione live.
