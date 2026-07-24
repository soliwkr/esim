# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now

### 1. Chiudere PR #75 — M5.5b.3

```text
branch feat/public-seo-endpoint-parity
PR #75 — Add shared sitemap and robots parity
CI applicativa #359 completamente verde
```

Stato verificato:

- builder sitemap/robots server-only condivisi;
- legacy e Astro delegano allo stesso contratto;
- pagine D1 `published` soltanto;
- route statiche derivate dalla route policy;
- slug, date, origin, duplicati e limite URL validati;
- XML deterministico, ordinato e correttamente escapato;
- `lastmod` normalizzato;
- robots esatto e newline finale;
- GET, HEAD, query string e trailing slash coerenti;
- populated, empty e invalid state;
- fallimento chiuso senza XML parziale;
- body e header legacy/Astro equivalenti;
- tutte le suite pubbliche e Control Room verdi;
- `activePublicRouteDecision` invariata;
- sitemap e robots live ancora backend-owned.

Prima del merge restano obbligatori:

```text
sei canonici aggiornati sullo stesso head
→ CI finale code + documentazione
→ PR pronta per review
→ merge senza deploy e senza cutover
```

### 2. Aprire lo scope M5.6 dopo il merge

Branch documentale proposta:

```text
docs/public-catalog-pilot-scope
```

Obiettivo esclusivo:

```text
small evidence-backed catalog
+ explicit publication gates
+ no mass generation
+ no apex cutover
```

La discovery deve definire:

- numero massimo di pagine del pilot;
- intenti distinti e non cannibalizzanti;
- criteri per scegliere destinazioni, guide e confronti;
- evidence bundle minimo per pagina;
- claim richiesti, freshness e fonti ufficiali;
- publication eligibility separata dall’approvazione del draft;
- revisione umana e audit;
- processo di materializzazione e pubblicazione autorizzata;
- criteri di rollback o deindicizzazione;
- metriche minime prima della scala;
- confine con M5.7 cutover e M6 measurement.

La PR di scope non deve pubblicare pagine, cambiare D1, modificare il Worker o fare deploy.

### 3. Definire il pilot prima del codice o dei contenuti

Il pilot deve restare piccolo e verificabile. Ipotesi iniziale da validare nello scope:

```text
2 destinazioni
+ 1 guida dispositivo/attivazione
+ 1 confronto provider
= massimo 4 pagine
```

Ogni pagina deve avere:

- intento primario distinto;
- slug definitivo;
- fonti ufficiali identificabili;
- claim con data di verifica;
- evidence bundle;
- draft grounded;
- approvazione editoriale;
- publication eligibility esplicita;
- nessuna dipendenza da claim insufficienti o scaduti.

Non vengono scelti Paesi o provider prima dell’audit della domanda e dello stato reale dei claim.

### 4. Tenere separate le fasi

```text
M5.5b.3 sitemap/robots parity
→ M5.6 catalog pilot ristretto
→ M5.7 cutover apex separato
→ M6 measurement e Search Console
```

M5.6 non modifica automaticamente la matrice attiva. M5.7 richiede una PR dedicata e autorizzazione esplicita.

## Checkpoint chiusi

### M5.5a — SEO contract

```text
PR #69
merge 46f1d66a591dd7860c101c86cb8295d97e4a2106
```

Metadata e JSON-LD condivisi tra legacy e Astro.

### M5.5b.1 — Route policy

```text
PR #71
merge bd51faddddbb54647c22c3361dd04c5bc65e7681
CI finale #329
```

Current matrix attiva; target matrix inattiva.

### M5.5b.2 — Canonical Astro parity

```text
PR #73
merge b3a6625bfe6e3a06a46412e58f89a033dc82b9ff
CI finale #350
```

Home, listing, trust, articolo e 404 canonici compilati e testati senza switch live.

### Scope M5.5b.3

```text
PR #74
merge 6a0cea5ab5a012fb24facbd8ba00bfe43b2e8dfe
CI #352
```

Contratto sitemap/robots e test plan approvati.

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
- nessuna sitemap submission durante M5.5b.3 o lo scope M5.6.

## Verifiche operative aperte

- header HTTP live delle preview;
- linkage claim → task nel browser reale;
- linkage audit → ID/versione draft nel browser reale;
- topic-mismatch sul primo run autorizzato;
- redirect `www → apex` definitivo;
- nessun Workflow avviato soltanto per creare dati di test.

## Freeze immediato

- niente HTML applicativo nuovo nel Worker;
- niente accesso browser a D1;
- niente pubblicazione automatica;
- niente secret o PII nel client, URL, storage, log o repository;
- niente affiliazioni o tracking anticipati;
- niente cambio della matrice attiva prima di M5.7;
- niente migrazione live di sitemap, robots o provider redirect nella PR #75;
- niente Search Console submission;
- niente cutover dell’apice;
- nessuna rimozione legacy finché resta un fallback operativo.
