# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; il piano frontend vive in `docs/FRONTEND-PLAN.md`.

## Now

### 1. Chiudere la PR #69 sul vero head documentale

Branch:

```text
feat/public-seo-contract-foundation
```

PR:

```text
#69 — Add shared public SEO contract foundation
```

Scope canonico:

```text
docs/PUBLIC-SEO-CONTRACT-FOUNDATION-SCOPE.md
```

Implementazione completata:

```text
validated public page
→ src/public-seo.ts
→ typed SEO document
→ legacy canonical renderer OR Astro noindex preview
```

Il contratto condiviso ora produce:

- title e meta description;
- Open Graph `website` o `article`;
- `WebSite` JSON-LD per la homepage;
- `Article` JSON-LD per gli articoli;
- `FAQPage` soltanto quando la FAQ validata è presente;
- `dateModified` normalizzata;
- `Organization` come autore;
- `mainEntityOfPage` scelto dalla route chiamante.

La policy route resta distinta:

```text
legacy:
  / e /{slug}
  index,follow,max-image-preview:large
  canonical produzione

Astro preview:
  /astro-foundation
  /astro-foundation/articoli/{slug}
  noindex,nofollow
  X-Robots-Tag: noindex,nofollow
  Cache-Control: no-store
  self-canonical preview
```

CI applicativa #312 è completamente verde. Dopo gli aggiornamenti canonici occorre attendere la nuova CI sul head reale della PR. Soltanto allora:

```text
PR #69 ready
→ merge
→ deploy automatico
```

Non dichiarare completata o distribuita M5.5a prima di questi passaggi.

### 2. Verificare il checkpoint live della fondazione SEO

Dopo il deploy controllare almeno:

```text
/astro-foundation
/astro-foundation/articoli/<slug-published>
```

Homepage preview:

- title e description uguali al contratto canonico;
- `og:type=website`;
- `WebSite` JSON-LD valido;
- canonical ancora `/astro-foundation`;
- robots ancora `noindex,nofollow`;
- `X-Robots-Tag` e `Cache-Control: no-store` preservati.

Articolo preview:

- title e description uguali alla pagina pubblicata;
- `og:type=article`;
- `Article` JSON-LD valido;
- `FAQPage` presente soltanto quando la FAQ è presente;
- `mainEntityOfPage` sulla route preview;
- canonical ancora namespaced;
- noindex/no-store preservati;
- nessuno script eseguibile o Astro island.

Verificare inoltre che la resa visuale osservata per M5.4 non sia cambiata e che non compaia overflow orizzontale.

### 3. Non aprire ancora M5.5b

La prossima slice di routing/ownership SEO resta bloccata fino al checkpoint live M5.5a.

Non migrare adesso:

```text
/
/destinazioni
/guide
/confronti
/{slug}
/sitemap.xml
/robots.txt
/go/{provider}
```

Dopo il checkpoint, eseguire una discovery separata per decidere:

- route matrix di cutover;
- ownership futura di canonical, sitemap e robots;
- gestione schema sotto routing finale;
- preservazione redirect provider;
- drift test di cutover;
- rollback.

Nessuna di queste decisioni è implicita nella PR #69.

### 4. Contratti verificati dalla CI #312

Il nuovo comando:

```text
npm run smoke:public-seo-contracts
```

usa D1 temporanea, `workerd` e Chromium e verifica:

- parità title, description e Open Graph tra legacy e Astro;
- parità normalizzata di `Article` e `FAQPage`;
- differenze consentite soltanto per canonical, `mainEntityOfPage` e robots;
- JSON-LD valido con fixture `</script>`, `<example>`, virgolette, apostrofi e accenti;
- zero elementi arbitrari creati nel DOM;
- zero JavaScript eseguibile;
- sitemap canonica senza preview, `review` o `draft`;
- robots con sitemap e disallow correnti;
- redirect provider HTTPS, `no-store` e `noindex`;
- vere 404 canonical e preview;
- file probe esclusi dal fallback articolo;
- desktop/mobile senza overflow;
- tutte le regressioni Control Room.

CI #311 aveva rilevato un’asserzione troppo ampia che scambiava il carattere `<` dentro attributi HTML quotati per un elemento DOM. Il test è stato corretto sul comportamento reale senza indebolire la protezione.

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

- CI applicativa #302 verde;
- CI finale #307 verde;
- merge `4810c0c32d54dca6f85de19d507a6da13f3dc574`;
- articolo `published` verificato live desktop/mobile;
- hero, risposta diretta, disclosure, blocchi, FAQ, provenance, fonti e footer verificati;
- nessun overflow orizzontale visibile;
- route canoniche ancora legacy;
- nessun tracking, affiliazione, mutation o pubblicazione introdotti.

PR #68 ha registrato il checkpoint e autorizzato M5.5a; merge `bc2d6baa894e98a5cd9ce005c12ee4d2969e46b8`, CI #309 verde.

## Verifiche operative aperte

- checkpoint live metadata e JSON-LD dopo il merge della PR #69;
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
CI applicativa verde ≠ CI finale verde
CI verde ≠ verifica live
JSON-LD ≠ JavaScript applicativo
```

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
