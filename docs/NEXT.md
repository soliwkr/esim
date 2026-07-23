# Prossime azioni

Ultimo aggiornamento: **23 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; il piano frontend vive in `docs/FRONTEND-PLAN.md`.

## Now

### 1. Listing preview Astro verificate in produzione

PR #65 implementa:

```text
/astro-foundation/destinazioni
/astro-foundation/guide
/astro-foundation/confronti
```

La slice usa la matrice tipizzata `src/public-listing-routes.ts` e lo stesso read model server-only del renderer legacy:

```text
status='published' AND page_type=?
ORDER BY featured DESC, updated_at DESC
LIMIT 100
```

Stato definitivo:

- PR #65 mergiata nel commit `2483fbfd1327754a1a526e8c3e6b201a412e610d`;
- CI applicativa #291 completamente verde;
- CI finale #296 completamente verde;
- tutte e tre le route hanno risposto `200` dopo il deploy;
- route canoniche listing e apice ancora legacy.

Checkpoint visuale completato:

- Destinazioni narrow/mobile con hero, contratto, navigazione corrente ed empty state remoto corretto;
- Guide narrow/mobile con hero, contratto, navigazione corrente e card pubblicate remote;
- Confronti narrow/mobile con hero, contratto, navigazione corrente e card pubblicata remota;
- Guide desktop largo con hero e contratto affiancati, navigazione a tre colonne e tre card nella prima riga;
- nessun overflow orizzontale visibile negli screenshot osservati;
- banner e navigazione restano nel namespace `/astro-foundation`.

Lo screenshot narrow di Guide è appena sopra il breakpoint `560px` e mostra due colonne, comportamento previsto. La CI continua a verificare la singola colonna sotto il breakpoint mobile, oltre a noindex, no-store, published-only, sitemap exclusion, vera 404 e assenza di righe `review`/`draft`.

Questo checkpoint chiude M5.3. Non autorizza cutover, indicizzazione, analytics, affiliazioni o pubblicazione.

### 2. Implementare il renderer articolo Astro

Branch autorizzata:

```text
feat/public-article-renderer
```

Scope canonico:

```text
docs/PUBLIC-ARTICLE-RENDERER-SCOPE.md
```

Obiettivo esclusivo:

- aggiungere una route articolo nel namespace preview;
- leggere soltanto pagine `published` server-side da D1;
- estrarre un read model tipizzato condiviso con il renderer legacy;
- rendere title, metadata, breadcrumb, hero, risposta diretta, blocchi strutturati, FAQ, fonti e related links in Astro;
- mostrare soltanto provenance pubblica sicura e realmente disponibile;
- non presentare claim esclusi come fatti;
- restituire vera 404 per slug assente, `review` o `draft`;
- mantenere noindex, no-store e sitemap exclusion;
- mantenere `/{slug}` sul renderer legacy.

Route preview prevista:

```text
/astro-foundation/articoli/[slug]
```

La route esplicita `articoli/` evita collisioni con home, listing e trust pages. I listing preview possono passare ai link namespaced soltanto dentro questa branch; i listing canonici restano invariati.

Read model minimo candidato:

```text
slug
page_type
title
meta_description
eyebrow
h1
direct_answer
intro
content_json
faq_json
source_links_json
cluster
search_intent
source_checked_at
updated_at
```

Regole di implementazione:

- query fissa `WHERE slug=? AND status='published'`;
- validazione runtime di righe, JSON, blocchi, FAQ e fonti;
- nessun HTML AI grezzo o `set:html` su contenuti editoriali;
- tipi di blocco ammessi espliciti e fail-closed sugli input non validi;
- URL fonte soltanto HTTPS;
- nessun claim ID interno, payload bundle, note revisore o dato operativo esposto;
- related links `published` dello stesso cluster, ordinati deterministicamente ed escluso lo slug corrente;
- nessun fallback a una pagina review;
- nessun accesso browser a D1 e nessuna API pubblica.

Smoke dedicato richiesto:

```text
npm run smoke:public-article-renderer
```

Fixture minime:

- pagina `published` completa con blocchi, FAQ e fonti;
- pagina `review` con slug noto ma non renderizzabile;
- pagina `draft` con slug noto ma non renderizzabile;
- pagina pubblicata correlata nello stesso cluster;
- fonte non HTTPS da scartare;
- blocco o JSON invalido da gestire senza HTML arbitrario;
- slug assente → 404.

Acceptance:

- raw HTML utile senza island o JavaScript richiesto;
- metadata e canonical preview deterministici;
- response header preview applicati dalla route;
- breadcrumb e link di ritorno nel namespace preview;
- link related verso preview article routes;
- mobile, desktop, tastiera, tabelle e overflow;
- sitemap invariata e senza route preview;
- route canonica articolo e renderer legacy invariati;
- tutte le regressioni D1, Container e Control Room verdi;
- nessuna route di pubblicazione introdotta.

La PR deve nascere draft perché introduce il primo renderer editoriale pubblico Astro e un read model più ampio.

### 3. Non attivare ancora Google measurement

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

### 4. Continuare M4 soltanto su branch separate

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni mutation richiede Access, conferma, state machine server-side, audit, idempotenza, reload e test end-to-end.

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
published row ≠ review row
preview M5 ≠ cutover pubblico
progressi M5 ≠ M4 completato
GA4/GTM creati ≠ tracking attivo
service account creato ≠ credenziale configurata
brief accepted ≠ brief converted
approved draft ≠ published page
```

## Checkpoint completati recenti

- PR #54 — decisione brief in produzione;
- PR #57 — audit repository esterni;
- PR #58 — track M5 parallela;
- PR #59 — public shell preview;
- PR #60 — checkpoint mobile public shell;
- PR #61 — trust pages e checkpoint mobile 3/3;
- PR #62 — scope homepage candidata;
- PR #63 — homepage candidata, merge `7ba767d`, CI finale #284 e checkpoint live desktop/mobile completati;
- PR #65 — listing preview, merge `2483fbf`, CI finale #296 e checkpoint live completato.

## Freeze immediato

- niente HTML applicativo nuovo nel Worker;
- niente accesso browser a D1;
- niente pubblicazione automatica;
- niente secret o PII nel client, URL, storage, log o repository;
- niente affiliazioni o tracking anticipati;
- niente sostituzione delle route listing o articolo canoniche nella slice preview;
- niente cutover dell’apice;
- nessuna rimozione legacy finché resta un fallback operativo.
