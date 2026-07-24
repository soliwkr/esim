# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; il piano frontend vive in `docs/FRONTEND-PLAN.md`.

## Now

### 1. Implementare la fondazione del contratto SEO pubblico

Branch autorizzata:

```text
feat/public-seo-contract-foundation
```

Scope canonico:

```text
docs/PUBLIC-SEO-CONTRACT-FOUNDATION-SCOPE.md
```

Obiettivo esclusivo:

```text
validated published page
→ shared typed SEO model
→ legacy canonical renderer OR Astro noindex preview
→ deterministic metadata and structured data
```

Implementare:

- un modulo server-only condiviso, candidato `src/public-seo.ts`;
- title e meta description derivati dallo stesso modello nei due renderer;
- Open Graph tipizzato con `website` o `article`;
- `Article` JSON-LD per gli articoli pubblicati;
- `FAQPage` JSON-LD soltanto quando la FAQ validata è presente;
- `WebSite` schema condiviso per la homepage, soltanto se resta nella stessa slice stretta;
- serializer JSON-LD sicuro contro `</script>` e caratteri di terminazione;
- props tipizzate nel layout Astro, senza accettare HTML o JSON arbitrario;
- smoke dedicato di drift e regressione.

Policy route da preservare:

```text
legacy article:
  /{slug}
  canonical production URL
  index,follow,max-image-preview:large

Astro preview article:
  /astro-foundation/articoli/{slug}
  self-canonical preview URL
  noindex,nofollow
  X-Robots-Tag: noindex,nofollow
  Cache-Control: no-store
```

La preview può usare lo stesso title, description e contenuto schema del renderer canonico, ma canonical URL, `mainEntityOfPage` e robots restano specifici della route.

### 2. Aggiungere il drift smoke SEO

Comando previsto:

```text
npm run smoke:public-seo-contracts
```

Il test usa D1 temporanea e il runtime `workerd` reale.

Confrontare per la stessa pagina pubblicata:

- title;
- meta description;
- Open Graph title, description e type;
- Article headline e description;
- FAQ questions e answers;
- dateModified;
- organization author;
- canonical e `mainEntityOfPage` secondo la policy della route.

Differenze consentite:

```text
canonical URL
mainEntityOfPage URL
robots/indexing policy
banner e navigazione propri della preview
```

Ogni altro drift deve fallire la CI.

Fixture di sicurezza obbligatoria:

```text
</script>
<example>
virgolette e apostrofi
caratteri italiani accentati
```

Acceptance:

- JSON-LD valido e parsabile;
- nessun elemento eseguibile iniettato;
- nessun raw HTML da D1;
- testo visibile escapato;
- soltanto script `type="application/ld+json"` autorizzati;
- zero JavaScript applicativo aggiunto al sito pubblico.

### 3. Conservare l’ownership SEO corrente

Questa branch non sposta:

```text
/sitemap.xml
/robots.txt
/go/{provider}
```

Aggiungere soltanto regressioni che verifichino:

- sitemap con route canoniche statiche e articoli `published`;
- nessuna route `/astro-foundation` in sitemap;
- nessuna riga `review` o `draft` in sitemap;
- robots con sitemap canonica e disallow correnti;
- redirect provider soltanto verso destinazioni HTTPS;
- redirect `no-store` e `noindex`;
- nessuna intercettazione da parte delle route Astro;
- vere 404 per canonical mancante e preview assente/review/draft;
- file probe esclusi dal fallback articolo.

La futura migrazione di sitemap, robots, provider redirect e route canoniche richiederà una seconda slice M5.5 esplicita.

### 4. Verifica richiesta prima del merge

La PR nasce draft e deve completare:

- generazione tipi Cloudflare;
- typecheck TypeScript e Astro;
- build Astro e Worker;
- migrazioni D1;
- quality smoke e golden evaluation;
- Container build e smoke;
- runtime Astro/backend;
- smoke pubblici esistenti;
- nuovo smoke SEO;
- tutte le suite Control Room.

Non indebolire le asserzioni esistenti. Gli smoke che oggi richiedono zero `<script>` devono essere aggiornati a distinguere JSON-LD non eseguibile da JavaScript applicativo.

### 5. Non attivare ancora Google measurement

Sono stati preparati esternamente:

- Google Tag Manager;
- Google Analytics 4;
- Search Console;
- service account con accesso alle proprietà.

Questo non equivale a tracking attivo.

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

- nessun JSON o private key in chat o GitHub;
- nessuna credenziale nel frontend;
- nessun tracking sulle preview noindex;
- nessuna configurazione service account fuori da una branch M6 esplicita.

### 6. Continuare M4 soltanto su branch separate

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni mutation richiede Access, conferma, state machine server-side, audit, idempotenza, reload e test end-to-end.

## Checkpoint M5.4 chiuso

PR #67:

```text
Add published-only Astro article renderer
```

Stato definitivo:

- CI applicativa #302 completamente verde;
- CI finale #307 completamente verde;
- merge commit `4810c0c32d54dca6f85de19d507a6da13f3dc574`;
- route `/astro-foundation/articoli/[slug]` distribuita;
- articolo `published` verificato live desktop e mobile;
- hero, risposta diretta, disclosure, blocchi, FAQ, provenance e fonti renderizzati;
- FAQ espansa verificata su mobile;
- fonti e footer verificati desktop/mobile;
- nessun overflow orizzontale visibile;
- related section omessa correttamente quando non esistono righe correlate exact-cluster;
- route canoniche ancora legacy;
- nessun tracking, affiliazione, mutation o pubblicazione introdotti.

Gli screenshot attestano la resa visuale. Published-only, 404, noindex/no-store, sitemap exclusion, HTTPS sources, fail-closed e link parity restano attestati dalla CI.

## Verifiche operative aperte

- header HTTP delle preview su controllo esterno dedicato;
- linkage claim → task nel browser reale;
- linkage audit → ID/versione draft nel browser reale;
- topic-mismatch sul primo run autorizzato;
- redirect `www → apex` definitivo;
- nessun Workflow avviato soltanto per creare dati di test.

## Separazioni obbligatorie

```text
homepage candidata ≠ apice migrato
listing preview ≠ listing canonico migrato
article preview ≠ articolo canonico migrato
SEO contract parity ≠ route cutover
published row ≠ review row
preview M5 ≠ cutover pubblico
progressi M5 ≠ M4 completato
GA4/GTM creati ≠ tracking attivo
service account creato ≠ credenziale configurata
brief accepted ≠ brief converted
approved draft ≠ published page
CI verde ≠ verifica visuale live
JSON-LD ≠ JavaScript applicativo
```

## Checkpoint completati recenti

- PR #54 — decisione brief in produzione;
- PR #57 — audit repository esterni;
- PR #58 — track M5 parallela;
- PR #59 — public shell preview;
- PR #60 — checkpoint mobile public shell;
- PR #61 — trust pages e checkpoint mobile 3/3;
- PR #62 — scope homepage candidata;
- PR #63 — homepage candidata, merge `7ba767d`, CI finale #284 e checkpoint live;
- PR #65 — listing preview, merge `2483fbf`, CI finale #296 e checkpoint live;
- PR #66 — chiusura M5.3 e scope renderer, merge `76aab5a`;
- PR #67 — renderer articolo, merge `4810c0c`, CI finale #307 e checkpoint live completato.

## Freeze immediato

- niente HTML applicativo nuovo nel Worker;
- niente accesso browser a D1;
- niente pubblicazione automatica;
- niente secret o PII nel client, URL, storage, log o repository;
- niente affiliazioni o tracking anticipati;
- niente sostituzione delle route canoniche nella foundation SEO;
- niente migrazione di sitemap, robots o provider redirect nella prima slice M5.5;
- niente cutover dell’apice;
- nessuna rimozione legacy finché resta un fallback operativo.
