# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now

### 1. Chiudere la PR documentale M5.5a → M5.5b

Branch:

```text
docs/public-seo-routing-ownership-scope
```

Obiettivi:

- registrare il checkpoint live della homepage SEO;
- registrare il checkpoint live dell’articolo SEO;
- dichiarare M5.5a completata;
- documentare l’ownership corrente delle route;
- definire l’ownership target;
- autorizzare soltanto la foundation della route policy.

Scope canonico:

```text
docs/PUBLIC-SEO-ROUTING-OWNERSHIP-SCOPE.md
```

La PR è documentale. Non modifica runtime, routing, D1 o deploy pubblico oltre al normale deploy dei soli documenti non serviti dal sito.

### 2. Implementare la route policy foundation

Branch autorizzata dopo il merge dello scope:

```text
feat/public-route-policy-foundation
```

Obiettivo esclusivo:

```text
current route ownership
+ target route ownership
→ typed route matrix
→ custom Worker uses current matrix
→ zero live ownership changes
```

Implementare:

- modulo server-only tipizzato per categorie e owner;
- route statiche canoniche esplicite;
- namespace preview esplicito;
- namespace Control Room esplicito;
- API e provider redirect backend-owned;
- reserved path set condiviso;
- file-probe policy condivisa;
- precedenza del router verificabile;
- matrice corrente separata dalla matrice target;
- smoke dedicato.

La matrice attiva deve continuare a produrre:

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
```

### 3. Acceptance della route policy foundation

Richiesto prima del merge:

- generazione tipi Cloudflare;
- typecheck TypeScript e Astro;
- build Astro e custom Worker;
- migrazioni D1;
- quality smoke e golden evaluation;
- Container build e smoke;
- runtime Astro/backend;
- smoke pubblici esistenti;
- smoke SEO;
- nuovo smoke route policy;
- tutte le suite Control Room.

Regressioni obbligatorie:

- `/` ancora backend-owned;
- listing canonici ancora backend-owned;
- trust canoniche ancora backend-owned;
- `/{slug}` ancora backend-owned;
- sitemap e robots ancora backend-owned;
- `/go/*` mai intercettato da Astro;
- `/api/*` mai intercettato da Astro;
- preview ancora Astro-owned;
- Control Room foundation ancora Astro-owned e protetta;
- file probe e route riservate non diventano articoli;
- nessuna route di pubblicazione.

### 4. Preparare le slice successive, ma non implementarle insieme

Dopo la route policy foundation:

```text
M5.5b.2 canonical Astro parity
→ M5.5b.3 sitemap/robots/404 parity
→ M5.6 catalog pilot
→ M5.7 cutover separato
```

#### Canonical Astro parity

PR separata:

- componenti parametrizzati per preview o canonical;
- route canonicali Astro compilate e testate;
- internal link canonicali;
- published-only e 404;
- nessuna attivazione live.

#### SEO endpoint parity

PR separata:

- builder condiviso sitemap e robots;
- handler Astro testati;
- output semantico equivalente;
- ownership live ancora legacy.

#### Cutover

Il cutover non appartiene a M5.5b.1.

Richiederà:

- PR dedicata;
- autorizzazione esplicita;
- modifica minima della route matrix attiva;
- smoke live;
- rollback immediato verso il backend legacy.

## Checkpoint M5.5a chiuso

PR #69:

```text
Add shared public SEO contract foundation
merge 46f1d66a591dd7860c101c86cb8295d97e4a2106
```

Verificato dalla CI:

- contratto SEO tipizzato condiviso;
- title, description e Open Graph;
- `WebSite`, `Article` e `FAQPage`;
- serializer JSON-LD sicuro;
- drift legacy/Astro;
- sitemap, robots, provider redirect e 404;
- nessun JavaScript applicativo pubblico;
- tutte le regressioni Control Room.

Verificato nel sorgente live della homepage:

- noindex,nofollow;
- canonical `/astro-foundation`;
- `og:type=website`;
- `WebSite` JSON-LD.

Verificato nel sorgente live dell’articolo `migliore-esim`:

- canonical namespaced;
- `og:type=article`;
- `Article` JSON-LD;
- `FAQPage` JSON-LD;
- `mainEntityOfPage` preview;
- autore Organization e data modificata.

Gli header HTTP live `X-Robots-Tag` e `Cache-Control: no-store` restano una verifica operativa separata; sono coperti dalla CI.

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
route policy target ≠ owner live
canonical Astro compiled ≠ canonical Astro served
homepage candidata ≠ apice migrato
listing preview ≠ listing canonico migrato
article preview ≠ articolo canonico migrato
published row ≠ review row
progressi M5 ≠ M4 completato
GA4/GTM creati ≠ tracking attivo
service account creato ≠ credenziale configurata
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
- niente cambio live di route canoniche nella route policy foundation;
- niente migrazione live di sitemap, robots o provider redirect;
- niente cutover dell’apice;
- nessuna rimozione legacy finché resta un fallback operativo.
