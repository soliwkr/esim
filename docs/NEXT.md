# Prossime azioni

Ultimo aggiornamento: **23 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; il piano frontend vive in `docs/FRONTEND-PLAN.md`.

## Now

### 1. Trust pages Astro: checkpoint produttivo completato

PR #61 è mergiata nel commit `2c0caf5d`; la CI finale #273 è completamente verde.

Route preview:

```text
/astro-foundation/metodo
/astro-foundation/trasparenza
/astro-foundation/privacy
```

Gli screenshot reali del 23 luglio 2026 attestano tutte e tre le route su mobile:

- header e banner preview;
- hero e contenuto principale;
- pagina corrente evidenziata;
- navigazione interna tra le pagine di fiducia;
- card responsive;
- nessun overflow orizzontale visibile nelle porzioni osservate.

Il checkpoint mobile è quindi **3/3 completato**.

Restano distinti:

- header HTTP, canonical e sitemap: verificati in CI;
- desktop live: ancora da osservare esternamente;
- route canoniche `/metodo`, `/trasparenza` e `/privacy`: ancora legacy.

### 2. Avviare la terza slice M5

Branch:

```text
feat/public-homepage-candidate
```

Scope vincolante:

```text
docs/PUBLIC-HOMEPAGE-CANDIDATE-SCOPE.md
```

Obiettivo:

- evolvere `/astro-foundation` da shell statica a candidata homepage;
- leggere server-side soltanto pagine `published`;
- mostrare guide in evidenza e destinazioni principali;
- mantenere raw HTML e JavaScript non necessario;
- mantenere apice e route canoniche sul renderer legacy.

Read model ammesso:

```text
slug
page_type
title
meta_description
cluster
```

Query semantiche da preservare:

```text
featured:     status='published' AND featured=1, limit 9
destinations: status='published' AND page_type='destination', limit 6
```

La branch può estrarre il read model pubblico in un modulo server-only condiviso tra legacy e Astro, purché:

- non aggiunga API pubbliche;
- non esponga D1 al browser;
- non modifichi stati editoriali;
- non duplichi la logica in due query divergenti;
- non pubblichi righe `review`;
- non inventi contenuti quando il catalogo è vuoto.

Criteri di accettazione:

- fixture `published` presenti nel raw HTML;
- fixture `review` assenti;
- card collegate alle route canoniche legacy;
- empty state reale e non commerciale;
- `noindex`, `no-store` e sitemap exclusion preservati;
- `/` ancora legacy;
- desktop, mobile, tastiera e overflow verdi;
- tutte le suite Control Room verdi.

### 3. Non attivare ancora Google measurement

L’operatore ha preparato esternamente:

- Google Tag Manager;
- Google Analytics 4;
- Search Console;
- service account con accesso alle proprietà.

Questo non autorizza ancora l’integrazione.

M6 resta successiva alla stabilizzazione delle route pubbliche:

```text
CMP
→ Consent Mode
→ dizionario eventi
→ GTM
→ GA4
→ Search Console / sitemap
→ verifica dei dati
```

Regole immediate:

- nessun JSON o private key in chat o GitHub;
- nessuna credenziale nel frontend;
- nessun tracking sulle preview noindex;
- nessuna configurazione del service account fuori da una branch M6 esplicita.

### 4. Continuare M4 su branch separate

Ordine delle mutation residue:

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni capacità richiede:

- branch esclusiva;
- route privata;
- identità Cloudflare Access;
- conferma esplicita;
- state machine server-side;
- audit persistito;
- idempotenza;
- reload dello stato;
- test end-to-end.

## Verifiche operative aperte

Da completare senza bloccare la homepage candidata:

- desktop live e header HTTP delle preview;
- linkage claim → task nel browser reale;
- linkage audit → ID/versione draft nel browser reale;
- topic-mismatch sul primo nuovo run autorizzato;
- redirect `www → apex` definitivo;
- nessun Workflow avviato soltanto per produrre dati artificiali.

## Separazioni obbligatorie

```text
preview M5 ≠ cutover pubblico
homepage candidata ≠ apice migrato
published row ≠ review row
progressi M5 ≠ M4 completato
GA4/GTM creati ≠ tracking attivo
service account creato ≠ credenziale configurata
brief accepted ≠ brief converted
approved draft ≠ published page
```

## Track successive M5

Dopo il checkpoint live della homepage candidata:

```text
listing Destinazioni / Guide / Confronti
→ renderer articolo grounded
→ parità canonical / sitemap / schema / 404
→ piccolo catalogo pilot
→ PR separata di cutover apex
```

## Checkpoint completati recenti

- PR #54 — decisione brief, produzione verificata;
- PR #57 — audit repository esterni;
- PR #58 — track M5 parallela;
- PR #59 — public shell preview;
- PR #60 — checkpoint mobile public shell;
- PR #61 — trust pages preview, CI #273 e checkpoint mobile 3/3.

## Freeze immediato

- niente HTML applicativo nuovo nel Worker;
- niente accesso browser a D1;
- niente pubblicazione automatica;
- niente secret o PII in URL, HTML, JavaScript client, storage, log o repository;
- niente affiliazioni o tracking anticipati;
- niente cutover dell’apice nella homepage candidate;
- nessuna rimozione legacy finché resta un fallback operativo.
