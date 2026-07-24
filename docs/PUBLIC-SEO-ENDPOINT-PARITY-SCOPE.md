# Public SEO endpoint parity — scope M5.5b.3

Data di riferimento: **24 luglio 2026**.

## Stato

Questa fase prepara e verifica le future risposte Astro di:

```text
/sitemap.xml
/robots.txt
```

ma non trasferisce loro traffico nel deploy reale.

```text
canonical Astro renderer parity
→ shared sitemap/robots contract
→ legacy and Astro handlers use the same builders
→ direct local SEO-endpoint runtime smoke
→ active matrix still current
→ no public cutover
```

Branch tecnica autorizzata dopo il merge di questo scope:

```text
feat/public-seo-endpoint-parity
```

## Obiettivo esclusivo

1. estrarre query, normalizzazione e serializzazione della sitemap dal renderer legacy;
2. estrarre il documento robots dalla route inline del backend;
3. creare builder server-only condivisi tra backend legacy e Astro;
4. compilare gli endpoint Astro canonici;
5. testare direttamente gli endpoint Astro in `workerd` senza modificare la matrice attiva;
6. dimostrare equivalenza semantica con le risposte legacy;
7. mantenere sitemap e robots live-owned dal backend.

Questa fase non attiva indicizzazione, Search Console, analytics o cutover.

## Ownership invariata

Durante tutta M5.5b.3:

```text
Astro live:
  /astro-foundation*
  /control-room-foundation*

Backend live:
  route canoniche editoriali
  /sitemap.xml
  /robots.txt
  /go/*
  /api/*
  legacy Control Room
  asset tecnici
```

Il contratto deve restare:

```text
createPublicWorker(activePublicRouteDecision)
activePublicRouteDecision = currentPublicRouteDecision
```

`targetPublicRouteDecision` non diventa attiva.

## Stato corrente rilevato

### Sitemap legacy

Oggi `src/pages.ts`:

- esegue direttamente `SELECT slug,updated_at FROM pages WHERE status='published' ORDER BY slug`;
- mantiene una seconda lista locale delle sette route statiche;
- concatena direttamente XML e header;
- include `lastmod` soltanto per le pagine D1 pubblicate.

### Robots legacy

Oggi `src/index.ts` costruisce inline:

```text
User-agent: *
Allow: /
Disallow: /go/
Disallow: /control-room
Disallow: /api/maintenance/
Sitemap: https://senzaroaming.it/sitemap.xml
```

La duplicazione rende possibile drift tra:

- route canoniche compilate;
- route policy;
- sitemap legacy;
- futuri endpoint Astro;
- direttive robots.

## Modulo condiviso

La branch tecnica introduce un modulo server-only proposto:

```text
src/public-seo-endpoints.ts
```

Responsabilità:

- derivare le route statiche da `PUBLIC_CANONICAL_STATIC_PATHS`;
- caricare soltanto righe `pages.status='published'`;
- validare slug e `updated_at`;
- costruire entry sitemap tipizzate;
- serializzare XML in modo deterministico e sicuro;
- costruire il documento robots canonico;
- produrre risposte HTTP condivise o dati sufficienti a produrle senza duplicazione.

Il modulo non:

- pubblica pagine;
- modifica D1;
- legge draft, claim o queue;
- conosce token o credenziali;
- invia dati a Google;
- decide l’owner live della route.

## Contratto della sitemap

### Route statiche

La sitemap include, nello stesso ordine esplicito della route policy:

```text
/
/destinazioni
/guide
/confronti
/metodo
/trasparenza
/privacy
```

Le route statiche non ricevono `lastmod` inventato.

La lista non viene riscritta dentro il builder: deriva da `PUBLIC_CANONICAL_STATIC_PATHS`.

### Pagine D1

Query canonica:

```sql
SELECT slug, updated_at
FROM pages
WHERE status='published'
ORDER BY slug ASC
```

Una entry dinamica è ammessa soltanto se:

- `slug` è una stringa non vuota;
- `publicArticleSlugCandidate('/' || slug)` restituisce esattamente lo stesso slug;
- lo slug non è riservato;
- lo slug non è un file probe;
- `updated_at` è una data valida;
- `lastmod` può essere normalizzato in `YYYY-MM-DD`;
- l’URL risultante è assoluto e appartiene al canonical site base.

Tutti i page type pubblicabili già supportati dal renderer — `destination`, `guide`, `comparison` e `provider` — possono entrare nella sitemap se lo slug è valido e lo stato è `published`.

### Ordinamento

L’ordine è deterministico:

```text
sette route statiche nell’ordine canonico
→ pagine published ordinate per slug ASC
```

Non viene usato `featured`, cluster, page type, data o ranking commerciale per cambiare l’ordine.

### Output XML

Il documento mantiene:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ...
</urlset>
```

La serializzazione:

- usa escaping XML dedicato;
- non inserisce HTML;
- non inserisce URL relative;
- non inserisce query string o fragment;
- non inserisce `changefreq`, `priority`, immagini, news o hreflang;
- non inserisce route preview, private o tecniche;
- non include `/404`;
- non include provider redirect `/go/*`;
- non include API o asset.

L’implementazione può mantenere output compatto. La parità viene valutata semanticamente; quando entrambi gli handler usano lo stesso builder, il test deve anche confrontare il body deterministico.

### Limite

Questa fase produce un singolo `urlset`.

Non introduce:

- sitemap index;
- partizionamento;
- compressione;
- submission API.

Il builder deve rilevare il superamento del limite configurato per un singolo documento invece di produrre silenziosamente una sitemap incompleta. La strategia di sitemap index appartiene a una fase futura quando il catalogo reale lo richiederà.

### Fail-closed

Una riga `published` con slug o data non validi non viene trasformata in una URL parziale o ambigua.

Il comportamento richiesto è:

```text
invalid published sitemap row
→ generic server error
→ no partial sitemap
→ no factual row leaked
```

Il test deve coprire almeno:

- slug riservato pubblicato;
- file probe pubblicato;
- `updated_at` invalido.

Non è richiesta alcuna migrazione D1.

## Contratto robots

Il documento condiviso conserva le direttive correnti:

```text
User-agent: *
Allow: /
Disallow: /go/
Disallow: /control-room
Disallow: /api/maintenance/
Sitemap: <canonical-site-base>/sitemap.xml
```

Regole:

- una sola sitemap canonica;
- newline finale deterministica;
- nessuna route preview nella sitemap;
- nessun `Disallow: /astro-foundation` introdotto: le preview devono poter esporre il proprio `noindex`;
- `Disallow: /control-room` continua a coprire il namespace legacy e il prefisso foundation;
- nessuna credenziale, token, email o informazione operativa;
- nessuna regola specifica per crawler commerciali in questa fase.

## Site base

Entrambi i documenti derivano il canonical site base dalla configurazione server-side esistente.

Il builder deve:

- accettare una URL assoluta valida;
- rimuovere lo slash finale prima di comporre i path;
- impedire origin ambigue o relative;
- produrre URL canoniche HTTPS nel contratto di produzione.

Nessun valore viene letto dal browser o dalla query string.

## Header HTTP

### Successo sitemap

Contratto da preservare:

```text
status: 200
Content-Type: application/xml;charset=UTF-8
Cache-Control: public,max-age=3600
```

### Successo robots

Contratto da preservare:

```text
status: 200
Content-Type: text/plain;charset=UTF-8
Cache-Control: public,max-age=3600
```

Gli handler Astro e legacy devono concordare su status, content type, cache e body.

Nessun `X-Robots-Tag: noindex` viene aggiunto ai due endpoint validi.

### Errore

Un errore di validazione o costruzione non restituisce un documento parziale. La risposta deve essere generica e non cacheabile oppure propagarsi a un equivalente errore generico già gestito dal runtime; il test deve provare assenza di XML parziale e dati della riga invalida.

## Handler Astro

Route proposte:

```text
apps/web/src/pages/sitemap.xml.ts
apps/web/src/pages/robots.txt.ts
```

Gli handler:

- usano esclusivamente il modulo condiviso;
- leggono D1 soltanto server-side;
- non importano React;
- non producono HTML;
- non usano client directives;
- non introducono endpoint di pubblicazione;
- non accedono a Search Console;
- non modificano la route policy.

Il contratto crawler primario da verificare è `GET`; `HEAD` deve restituire status e header coerenti senza body. Query string irrilevanti non cambiano il documento.

## Integrazione legacy

`src/pages.ts` non mantiene più una propria query/lista/serializzazione sitemap.

`src/index.ts` non mantiene più testo robots inline.

Il backend legacy delega agli stessi builder o response factory usati dagli handler Astro.

Questa modifica deve essere behavior-neutral per le richieste live valide:

- stesse URL;
- stesso ordine;
- stessi `lastmod`;
- stesse direttive robots;
- stessi header essenziali;
- nessun nuovo owner.

## Test diretto senza switch di produzione

La factory introdotta da M5.5b.2 viene riusata:

```text
createPublicWorker(routeDecision)
```

Lo smoke tecnico genera un wrapper temporaneo che modifica soltanto:

```text
route.kind === 'seo-endpoint'
→ owner: astro
```

Tutte le altre decisioni restano quelle di `currentPublicRouteDecision`.

Quindi, anche nel runtime di parity:

```text
route canoniche editoriali → backend
/sitemap.xml              → Astro
/robots.txt                → Astro
/go/*                      → backend
/api/*                     → backend
Control Room               → owner corrente
asset tecnici              → backend
```

Il wrapper temporaneo non viene esportato dal deploy e viene eliminato dopo lo smoke.

Sono vietati:

- env flag per selezionare il renderer;
- query parameter;
- header;
- cookie;
- route pubblica di test;
- configurazione segreta distribuita.

## Confronto legacy/Astro

Lo smoke usa stati D1 isolati equivalenti e avvia, in modo sequenziale o su porte separate:

1. runtime production-style con `activePublicRouteDecision` corrente;
2. runtime temporaneo con soltanto `seo-endpoint` Astro-owned.

Per la sitemap confronta:

- status;
- content type;
- cache;
- body deterministico;
- XML parseabile;
- namespace;
- ordine;
- unicità;
- route statiche;
- pagine published;
- `lastmod`;
- assenza di review, draft, archived, preview, API, Control Room, redirect e 404.

Per robots confronta:

- status;
- content type;
- cache;
- body esatto;
- newline finale;
- sitemap apex;
- direttive correnti;
- assenza del namespace preview.

## Fixture obbligatorie

### Populated state

Contiene:

- pagine `published` di più page type;
- slug ordinati in modo non coincidente con l’ordine di inserimento;
- date valide con orari;
- righe `review`, `draft` e `archived`;
- dati che dimostrano escaping XML nel serializer puro.

Attese:

- solo sette statiche più le published valide;
- dinamiche ordinate per slug;
- `lastmod` normalizzato;
- nessuna riga non pubblicata.

### Empty state

Tutte le righe sono non pubblicate.

Attese:

- sitemap valida con sole sette route statiche;
- robots invariato;
- nessuna empty page HTML.

### Invalid state

Contiene separatamente una riga `published` non valida.

Attese:

- errore generico;
- nessun documento XML parziale;
- robots ancora indipendente e valido;
- nessun dato invalido nel body.

## Regressioni obbligatorie

La CI deve continuare a provare:

- `activePublicRouteDecision === currentPublicRouteDecision`;
- `/sitemap.xml` e `/robots.txt` production-style ancora backend-owned;
- route canonicali Astro compilate ma non live-owned;
- preview noindex/no-store e fuori sitemap;
- article renderer published-only;
- 404 pubblica;
- `/go/*` e `/api/*` backend-owned;
- Cloudflare Access sulla Control Room;
- assenza di route `/api/publish`;
- nessuna mutation o D1 migration;
- tutte le suite Control Room.

## File previsti nella branch tecnica

Possibili file nuovi:

```text
src/public-seo-endpoints.ts
apps/web/src/pages/sitemap.xml.ts
apps/web/src/pages/robots.txt.ts
scripts/smoke-public-seo-endpoints.mjs
```

Possibili file modificati:

```text
src/pages.ts
src/index.ts
apps/web/src/worker.ts        # soltanto se serve un export testabile già coerente con la factory
src/public-route-policy.ts    # test/riuso, non cambio della matrice attiva
package.json
ROADMAP.md
docs/STATUS.md
docs/NEXT.md
docs/DECISIONS.md
docs/FRONTEND-PLAN.md
docs/ARCHITECTURE.md
```

Non sono previste:

- migrazioni D1;
- modifiche a Workflow o Container;
- nuove API di manutenzione;
- componenti React;
- UI pubblica;
- librerie runtime nuove.

## Acceptance criteria

La branch tecnica è accettabile soltanto se:

1. sitemap e robots derivano da builder condivisi server-only;
2. le route statiche derivano dalla route policy;
3. la sitemap legge soltanto righe `published`;
4. slug e date sono validati;
5. output XML e robots sono deterministici;
6. legacy e Astro sono semanticamente equivalenti;
7. populated, empty e invalid state sono coperti;
8. gli endpoint Astro vengono verificati nel runtime reale del build;
9. wrapper e configurazione di test vengono eliminati;
10. non esiste selezione runtime distribuita del renderer;
11. `activePublicRouteDecision` non cambia;
12. sitemap e robots live restano backend-owned;
13. API, `/go/*`, Control Room e route editoriali non cambiano owner;
14. typecheck, build, D1, quality, Container e runtime sono verdi;
15. tutte le suite Control Room sono verdi;
16. STATUS, NEXT, ROADMAP, DECISIONS, FRONTEND-PLAN e ARCHITECTURE sono aggiornati sullo stesso head finale.

## Fuori scope

- attivare la target matrix;
- cutover apex;
- deploy manuale;
- sitemap index;
- submission a Search Console;
- API Google o service account;
- CMP, Consent Mode, GTM o GA4;
- tracking o nuovi eventi;
- affiliazioni;
- redirect provider;
- modifica degli stati editoriali;
- pubblicazione di pagine;
- catalogo pilot;
- rimozione del renderer legacy;
- internazionalizzazione o hreflang.

## Rollback

Prima del cutover, il rollback consiste nel revert della branch tecnica:

- gli endpoint live restano comunque backend-owned;
- nessun dato è migrato;
- nessun record è modificato;
- nessuna configurazione Google è attivata;
- nessuna route pubblica cambia owner.

Il futuro cutover M5.7 resta una modifica separata, minima e reversibile della matrice attiva dopo la verifica congiunta di renderer, sitemap, robots, 404 e redirect.

## Exit criteria M5.5b.3

La fase è chiusa quando:

```text
shared builders implemented
+ legacy handlers delegated
+ Astro endpoints compiled
+ direct SEO-endpoint runtime parity green
+ full CI green
+ active matrix still current
+ no deploy/cutover claimed
```

Il passo successivo resta M5.6 catalog pilot oppure, soltanto dopo autorizzazione esplicita e tutti i checkpoint, M5.7 cutover apex.
