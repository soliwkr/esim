# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now

### 1. Chiudere la route policy foundation

Branch e PR:

```text
feat/public-route-policy-foundation
PR #71 — Add typed public route ownership policy
```

Stato verificato:

- matrice current/target tipizzata;
- categorie e precedenza esplicite;
- namespace preview e Control Room espliciti;
- API e provider redirect permanentemente backend-owned;
- reserved paths condivisi;
- file-probe policy condivisa;
- slug articolo single-segment validato;
- custom Worker collegato a `activePublicRouteDecision`;
- export attivo fissato alla matrice corrente;
- smoke route policy incluso nel runtime;
- CI applicativa #323 completamente verde;
- nessuna route live ha cambiato owner.

Ownership attiva:

```text
Astro:
  /astro-foundation*
  /control-room-foundation*

Backend:
  /
  /destinazioni
  /guide
  /confronti
  /metodo
  /trasparenza
  /privacy
  /{slug}
  /sitemap.xml
  /robots.txt
  /go/*
  /api/*
  /control-room
  asset tecnici e 404
```

Prima del merge richiedere ancora:

- CI verde sul head finale con codice e canonici;
- PR pronta per review;
- merge senza modificare la matrice attiva.

### 2. Aprire lo scope della canonical Astro parity

Branch documentale proposta dopo il merge di PR #71:

```text
docs/public-canonical-astro-parity-scope
```

Obiettivo esclusivo:

```text
Astro canonical routes compiled
+ renderer tested directly
+ active owner still backend
```

La discovery deve decidere con precisione:

- route file Astro canonici da aggiungere;
- parametrizzazione preview/canonical di layout, header, footer, homepage, listing, trust e articolo;
- modalità di test del renderer Astro canonico senza flag runtime e senza servire traffico live;
- internal linking canonicale;
- 404 pubblica Astro e fallback articolo;
- reserved paths e file probe;
- parità di title, description, Open Graph e JSON-LD;
- parità di published-only, empty state, related links e fail-closed;
- test desktop, mobile, tastiera e overflow;
- rollback e confine con la successiva parity sitemap/robots.

La PR di scope non modifica runtime.

### 3. Implementare M5.5b.2 soltanto dopo lo scope

Branch tecnica da autorizzare nello scope, non ancora aperta:

```text
feat/public-canonical-astro-parity
```

Vincoli previsti:

- route canoniche Astro compilate;
- custom Worker continua a usare la matrice corrente;
- richieste live canoniche continuano al backend;
- nessun nuovo namespace pubblico indicizzabile;
- nessuna route di pubblicazione;
- nessuna migrazione D1;
- sitemap, robots e `/go/*` invariati;
- nessun tracking o affiliazione.

Acceptance prevista:

- typecheck e build;
- D1 e quality suite;
- Container;
- runtime pubblico;
- route policy smoke;
- SEO drift smoke;
- test diretto delle route Astro canoniche;
- tutte le suite Control Room;
- prova che owner attivo e risposte live restano legacy.

### 4. Tenere separate le fasi successive

```text
M5.5b.2 canonical Astro parity
→ M5.5b.3 sitemap/robots/404 endpoint parity
→ M5.6 catalog pilot
→ M5.7 cutover separato
```

Il cutover richiederà una PR dedicata e una modifica minima e reversibile di `activePublicRouteDecision`.

## Checkpoint chiusi

### M5.5a — SEO contract

PR #69, merge `46f1d66a591dd7860c101c86cb8295d97e4a2106`.

Verificati dalla CI e nel sorgente live:

- title, description e Open Graph condivisi;
- `WebSite`, `Article` e `FAQPage`;
- canonical route-specific;
- homepage e articolo preview noindex e self-canonical;
- serializer JSON-LD sicuro;
- nessun JavaScript applicativo pubblico.

### M5.5b.1 — Route policy

Verificati dalla CI #323:

- active matrix uguale alla current matrix;
- target matrix inattiva;
- canonical, sitemap, robots, API e provider redirect ancora backend-owned;
- preview e nuova Control Room ancora Astro-owned;
- file probe e reserved paths non diventano articoli;
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

Sono stati preparati esternamente GTM, GA4, Search Console e service account.

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
- nessuna configurazione Google fuori da una branch M6 esplicita.

## Verifiche operative aperte

- header HTTP live delle preview;
- linkage claim → task nel browser reale;
- linkage audit → ID/versione draft nel browser reale;
- topic-mismatch sul primo run autorizzato;
- redirect `www → apex` definitivo;
- nessun Workflow avviato soltanto per creare dati di test.

## Separazioni obbligatorie

```text
SEO contract parity ≠ route cutover
route target ≠ owner live
canonical Astro compiled ≠ canonical Astro served
homepage candidata ≠ apice migrato
published row ≠ review row
progressi M5 ≠ M4 completato
GA4/GTM creati ≠ tracking attivo
approved draft ≠ published page
CI verde ≠ verifica live
JSON-LD ≠ JavaScript applicativo
```

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
