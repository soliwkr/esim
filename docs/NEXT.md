# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now

### 1. Chiudere PR #77 — M5.6a

```text
branch feat/public-catalog-pilot-foundation
PR #77 — Add public catalog pilot audit foundation
CI applicativa #373 completamente verde
```

Verificato:

- modello server-only tipizzato;
- loader D1 con sole query `SELECT`;
- latest bundle e latest draft;
- publication eligibility e approvazioni;
- grounded renderer e provenance;
- claim, source linkage e freshness;
- coerenza draft/pagina `review`;
- safety slug, route e file probe;
- collisioni di intenti operativi;
- cap massimo quattro;
- report selected/excluded;
- manifest validato;
- manifest iniziale vuoto;
- fixture complete;
- schema D1 reale e before/after invariato;
- nessuna migration, mutation, route o publication capability;
- tutte le suite Control Room verdi.

Prima del merge:

```text
sei canonici sullo stesso head
→ CI finale code + documentazione
→ PR pronta per review
→ merge senza deploy
```

### 2. Definire l’audit remoto M5.6b

Dopo il merge serve una branch separata per un audit operativo read-only.

Branch documentale proposta:

```text
docs/public-catalog-remote-audit-scope
```

La discovery deve scegliere il percorso più sicuro tra:

1. comando locale autenticato che interroga D1 remote con output sanitizzato;
2. endpoint maintenance GET-only protetto e mai esposto al browser pubblico;
3. export manuale read-only verificato.

Criteri obbligatori:

- nessun maintenance token nel browser;
- nessuna private key o secret in chat o repository;
- nessuna mutation;
- output senza PII;
- report riproducibile;
- conteggi/stati before e after invariati;
- nessuna pagina scelta prima del risultato.

### 3. Eseguire l’audit sui dati reali

Il report deve mostrare:

- brief valutati;
- latest bundle per brief;
- latest draft per bundle;
- pagine materializzate;
- candidate selected ed excluded;
- blocker e warning;
- claim scaduti o fonti inattive;
- collisioni di slug e keyword;
- conteggio finale.

Possibili esiti:

```text
0 candidate → manifest resta vuoto
1–4 candidate → manifest con ID/versioni reali
>4 candidate → cap a quattro, selezione motivata
```

Non viene generato lavoro editoriale fittizio per riempire il pilot.

### 4. Preparare release candidate una pagina alla volta

Soltanto dopo l’audit:

```text
brief reale
→ claim e fonti
→ evidence bundle
→ approved_for_publication
→ grounded draft approved
→ materialized page review
→ manifest entry
```

Una release candidate resta `review`.

### 5. Tenere separata la pubblicazione

La transizione `review → published` richiede:

- autorizzazione esplicita;
- branch mutation separata;
- identità verificata;
- conferma;
- state machine D1;
- audit append-only;
- idempotenza;
- freshness recheck;
- rollback/deindicizzazione;
- test end-to-end.

Deve essere deciso se pubblicare prima, durante o dopo M5.7.

## Checkpoint chiusi

```text
PR #69  SEO contract
PR #71  route policy — CI #329
PR #73  canonical Astro parity — CI #350
PR #75  sitemap/robots parity — CI #365
PR #76  catalog pilot scope — CI #367
```

## Track M4 parallela

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

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

## Verifiche operative aperte

- header HTTP live delle preview;
- linkage recenti Control Room nel browser reale;
- topic-mismatch sul primo run autorizzato;
- redirect `www → apex` definitivo;
- nessun Workflow avviato soltanto per creare dati di test.

## Freeze immediato

- niente pubblicazione automatica;
- niente endpoint o pulsante publish;
- niente scelta anticipata di pagine;
- niente generazione massiva;
- niente accesso browser a D1;
- niente secret o PII nel client, URL, manifest, log o repository;
- niente tracking o affiliazioni anticipate;
- niente cambio della matrice attiva prima di M5.7;
- niente sitemap submission;
- niente cutover dell’apice;
- nessuna rimozione legacy finché resta un fallback operativo.
