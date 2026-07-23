# Prossime azioni

Ultimo aggiornamento: **23 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; il piano frontend vive in `docs/FRONTEND-PLAN.md`.

## Now

### 1. Homepage candidata Astro verificata in CI

PR #63 implementa la terza slice M5 su:

```text
/astro-foundation
```

La route ora combina il shell statico con il catalogo `published` letto server-side da D1.

```text
D1
→ src/public-page-cards.ts
→ legacy home/listing + Astro
→ raw HTML
```

Read model:

```text
slug
page_type
title
meta_description
cluster
```

Query:

```text
featured:     status='published' AND featured=1, limit 9
destinations: status='published' AND page_type='destination', limit 6
```

CI #279 è completamente verde e verifica:

- righe `published` presenti;
- righe `review` e `draft` assenti;
- ordine e limiti;
- read model condiviso con la legacy;
- card verso route canoniche legacy;
- empty state reale;
- `noindex`, `no-store` e sitemap exclusion;
- apice `/` ancora legacy;
- vera 404;
- raw HTML senza island o script;
- desktop, mobile, tastiera e overflow;
- tutte le regressioni Control Room.

### 2. Chiudere PR #63 e verificare la produzione

Dopo la CI finale sul commit documentale:

```text
merge PR #63
→ deploy automatico da main
→ aprire https://senzaroaming.it/astro-foundation
```

Checkpoint live richiesto:

- le sezioni “Guide essenziali” e “Destinazioni principali” compaiono;
- soltanto contenuti realmente `published` sono visibili;
- le card aprono route canoniche legacy;
- layout mobile senza overflow;
- layout desktop a tre colonne quando ci sono abbastanza card;
- empty state leggibile se uno dei gruppi non contiene pagine;
- banner preview e apice legacy invariati.

Il checkpoint live non autorizza il cutover.

### 3. Non avviare ancora listing preview

La slice successiva sarà autorizzata soltanto dopo il riscontro live della homepage candidata:

```text
feat/public-listing-previews
```

Scope futuro:

- `/astro-foundation/destinazioni`;
- `/astro-foundation/guide`;
- `/astro-foundation/confronti`;
- stesso read model published-only;
- route canoniche legacy ancora intatte;
- route matrix e fail-fast.

Nessun codice di questa slice successiva viene anticipato nella PR #63.

### 4. Non attivare ancora Google measurement

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

### 5. Continuare M4 soltanto su branch separate

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni mutation richiede Access, conferma, state machine server-side, audit, idempotenza, reload e test end-to-end.

## Verifiche operative aperte

- homepage candidata nel dominio pubblico;
- desktop live e header HTTP delle preview;
- linkage claim → task nel browser reale;
- linkage audit → ID/versione draft nel browser reale;
- topic-mismatch sul primo run autorizzato;
- redirect `www → apex` definitivo;
- nessun Workflow avviato soltanto per creare dati di test.

## Separazioni obbligatorie

```text
homepage candidata ≠ apice migrato
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
- PR #63 — homepage candidata, CI #279 verde; checkpoint live aperto.

## Freeze immediato

- niente HTML applicativo nuovo nel Worker;
- niente accesso browser a D1;
- niente pubblicazione automatica;
- niente secret o PII nel client, URL, storage, log o repository;
- niente affiliazioni o tracking anticipati;
- niente listing preview prima del checkpoint live;
- niente cutover dell’apice;
- nessuna rimozione legacy finché resta un fallback operativo.
