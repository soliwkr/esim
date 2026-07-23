# Prossime azioni

Ultimo aggiornamento: **23 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; il piano frontend vive in `docs/FRONTEND-PLAN.md`.

## Now

### 1. Homepage candidata Astro verificata in produzione

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

PR #63 è mergiata nel commit `7ba767d`; la CI finale #284 è completamente verde e verifica:

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

Checkpoint live completato:

- desktop con quattro guide pubblicate in griglia a tre colonne;
- mobile con le card in colonna singola, testi e CTA leggibili e nessun overflow visibile;
- “Destinazioni principali” con empty state remoto leggibile;
- transizione verso “Il metodo” stabile;
- link verso route canoniche legacy;
- banner preview e apice legacy invariati.

Il checkpoint live non autorizza il cutover.

### 2. Avviare listing preview

Prossima branch autorizzata:

```text
feat/public-listing-previews
```

Scope:

- `/astro-foundation/destinazioni`;
- `/astro-foundation/guide`;
- `/astro-foundation/confronti`;
- stesso read model published-only;
- route canoniche legacy ancora intatte;
- route matrix e fail-fast.

Guardrail della slice:

- nessun cambio alle route canoniche legacy;
- nessuna mutation, pubblicazione o accesso browser a D1;
- nessun cutover dell’apice;
- route matrix e fail-fast prima del checkpoint live.

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

- header HTTP delle preview;
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
- PR #63 — homepage candidata, merge `7ba767d`, CI finale #284 e checkpoint live desktop/mobile completati.

## Freeze immediato

- niente HTML applicativo nuovo nel Worker;
- niente accesso browser a D1;
- niente pubblicazione automatica;
- niente secret o PII nel client, URL, storage, log o repository;
- niente affiliazioni o tracking anticipati;
- niente sostituzione delle route listing canoniche nella slice preview;
- niente cutover dell’apice;
- nessuna rimozione legacy finché resta un fallback operativo.
