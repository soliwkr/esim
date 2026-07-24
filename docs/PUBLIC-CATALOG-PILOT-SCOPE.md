# Public catalog pilot — scope M5.6

Data di riferimento: **24 luglio 2026**.

## Stato

Questa fase definisce un pilot editoriale pubblico piccolo, verificabile e fondato su evidenze reali.

```text
SEO and routing parity complete
→ candidate audit
→ release-candidate manifest
→ approved grounded pages kept in review
→ separate publication authorization
→ separate apex cutover
```

Branch documentale:

```text
docs/public-catalog-pilot-scope
```

Branch tecnica autorizzabile soltanto dopo il merge dello scope:

```text
feat/public-catalog-pilot-foundation
```

## Problema da risolvere

Il repository possiede già:

- brief accettabili e convertibili;
- claim atomici con fonti e scadenze;
- Page Readiness ed evidence bundle versionati;
- `publication_eligible` separato da `ready_for_publication`;
- approvazione umana del bundle;
- draft grounded con provenance field-level;
- approvazione umana del draft;
- materializzazione della pagina in `review`;
- renderer legacy e Astro capaci di leggere soltanto righe `published`.

Non possiede invece una capacità autorizzata che promuova una pagina:

```text
review → published
```

Una riga `pages.status='published'` sarebbe già visibile sul dominio live attraverso il renderer backend corrente, anche prima del cutover Astro.

M5.6 non può quindi confondere preparazione del catalogo e pubblicazione reale.

## Definizioni vincolanti

### Candidate

Una pagina individuata dall’audit come possibile membro del pilot.

Non è ancora approvata e può essere esclusa senza effetti pubblici.

### Release candidate

Una pagina che ha superato tutti i gate deterministici e umani richiesti dallo scope, ma resta:

```text
pages.status = review
```

È pronta per una successiva decisione di pubblicazione, non è pubblicata.

### Published

Una pagina con:

```text
pages.status = published
```

È pubblicamente raggiungibile e può entrare nella sitemap. Questa transizione non è autorizzata dalla branch di scope né dalla prima branch tecnica M5.6.

## Obiettivo esclusivo

Preparare un catalogo pilot con un massimo di quattro release candidate reali, selezionate da dati persistiti e non da ipotesi scritte a mano.

Il pilot deve dimostrare:

- intenti distinti;
- evidence bundle correnti;
- publication eligibility reale;
- approvazioni umane separate;
- draft grounded approvati;
- materializzazione coerente in `review`;
- assenza di cannibalizzazione evidente;
- tracciabilità completa tra manifest, brief, bundle, draft, claim e fonti;
- nessun effetto live prima della decisione separata di pubblicazione.

## Cap del pilot

```text
0 ≤ release candidates ≤ 4
```

Non esiste un minimo artificiale. Se nessuna pagina supera i gate, il risultato corretto è un manifest vuoto con blocker espliciti.

Composizione preferita, non obbligatoria:

```text
1 destinazione
1 guida informativa o di attivazione/compatibilità
1 confronto
+ 1 seconda destinazione soltanto se chiaramente distinta
```

Non vengono scelti Paesi, dispositivi o provider prima dell’audit dei dati reali.

## Fasi M5.6

### M5.6a — Candidate audit foundation

Branch proposta:

```text
feat/public-catalog-pilot-foundation
```

Scope:

- modello tipizzato server-only per l’audit;
- query read-only sui dati editoriali esistenti;
- validazione deterministica dei gate;
- rilevazione di bundle, draft o pagina non allineati;
- rilevazione di slug riservati o collisioni;
- rilevazione di intenti duplicati o manifest incoerente;
- manifest versionato con massimo quattro entry;
- fixture e smoke locali;
- nessuna mutation D1;
- nessuna pubblicazione;
- nessun deploy.

### M5.6b — Release-candidate preparation

Fase operativa successiva, una pagina alla volta.

Può usare capacità già esistenti per:

- completare brief e claim mancanti;
- verificare fonti;
- rivalutare Page Readiness;
- approvare il bundle per pubblicazione;
- generare o rigenerare il draft grounded;
- approvare il draft;
- mantenere la pagina materializzata in `review`;
- aggiornare il manifest con gli ID reali verificati.

Ogni operazione resta auditata. Nessun Workflow viene avviato soltanto per produrre dati fittizi.

### M5.6c — Publication decision

Non autorizzata da questo scope.

Richiede una branch e una decisione esplicite perché introduce una mutation pubblica irreversibile sul traffico reale.

La decisione dovrà stabilire se la prima pubblicazione avviene:

1. sul renderer legacy prima del cutover;
2. insieme al cutover Astro M5.7;
3. dopo il cutover.

La scelta non viene anticipata in M5.6a.

## Fonte dei candidati

I candidati devono derivare da dati reali persistiti:

```text
editorial_briefs
page_evidence_bundles
editorial_review_drafts
editorial_review_draft_field_claims
pages
editorial_claim_candidates
claim_verifications
source_registry
```

Keyword Planner, recent demand e segnali possono influire sulla priorità, ma non sostituiscono i gate di evidenza.

Una keyword con volume non rende pubblicabile una pagina.

## Gate obbligatori per una release candidate

Una entry è ammessa nel manifest soltanto quando tutte le condizioni seguenti sono vere.

### Identità e versione

- `brief_id` esiste;
- `bundle_id` esiste ed è l’ultima versione non superseded per il brief;
- `draft_id` esiste ed è la versione approvata scelta per il bundle;
- `page_slug` coincide in brief, bundle, draft, pagina e manifest;
- nessun ID o versione è ricavato da JSON opaco quando esiste una relazione canonica.

### Evidence bundle

- `publication_eligible = 1`;
- `review_status = 'approved_for_publication'`;
- `ready_for_publication = 1`;
- `blockers_json` è vuoto;
- `insufficient_count = 0`;
- `contradicted_count = 0`;
- `pending_count = 0`;
- `expired_count = 0`;
- `conflict_count = 0`;
- esiste almeno un claim verificato e corrente;
- tutte le fonti fattuali usate hanno URL HTTPS;
- il bundle non è superseded.

### Draft

- il draft appartiene allo stesso bundle;
- il renderer è quello grounded corrente autorizzato dal progetto;
- `status = 'approved'`;
- ogni campo top-level possiede provenance persistita;
- ogni sezione e FAQ fattuale possiede claim IDs;
- i claim usati appartengono al bundle e sono ancora validi;
- nessun claim escluso alimenta testo fattuale;
- il draft non è superseded o failed.

### Pagina materializzata

- `pages.status = 'review'`;
- `published_at IS NULL`;
- slug e page type coincidono con il draft;
- title, description, H1, contenuto, FAQ e fonti corrispondono al draft approvato;
- `source_checked_at` è presente e coerente con le evidenze;
- `featured = 0` durante la preparazione;
- nessuna pagina `published` esistente viene sovrascritta.

### Routing e sicurezza

- slug single-segment valido;
- slug non riservato;
- slug non simile a file probe;
- nessuna collisione con route statiche, SEO endpoint, API, Control Room, `/go/*` o asset;
- nessun token, secret o PII nel contenuto o nel manifest.

### Intento editoriale

- intento primario dichiarato;
- keyword primaria dichiarata;
- risposta diretta distinta dalle altre entry;
- nessuna coppia di entry con stesso intento e promessa sostanziale;
- confronti e pagine “migliore” non usano classifiche o superlativi senza un modello di scoring approvato;
- una pagina provider-specifica non viene presentata come confronto indipendente;
- domanda recente e verità commerciale restano separate.

## Manifest canonico

La branch tecnica deve introdurre un manifest versionato, proposto come:

```text
data/public-catalog-pilot.json
```

Schema minimo per entry:

```json
{
  "slug": "example-slug",
  "pageType": "destination | guide | comparison | provider",
  "primaryIntent": "testo normalizzato",
  "primaryKeyword": "testo normalizzato",
  "briefId": 1,
  "bundleId": 1,
  "bundleVersion": 1,
  "draftId": 1,
  "draftVersion": 1,
  "pageStatus": "review",
  "publicationEligible": true,
  "readyForPublication": true,
  "reviewedAt": "ISO-8601",
  "sourceCheckedAt": "ISO-8601",
  "claimIds": [1],
  "sourceUrls": ["https://example.com"],
  "notes": ""
}
```

Regole:

- massimo quattro entry;
- slug unici;
- ID positivi;
- versioni positive;
- URL HTTPS unici;
- nessun secret;
- nessuna entry `published` nella foundation;
- il manifest non rende una pagina pubblicabile da solo;
- il manifest deve poter essere rigenerato o invalidato se cambia un bundle, draft, claim o fonte.

## Candidate report

L’audit deve produrre un report leggibile con:

- candidati ammessi;
- candidati esclusi;
- blocker per candidato;
- warning non bloccanti;
- bundle e draft selezionati;
- claim scaduti o mancanti;
- collisioni di slug;
- collisioni di intento;
- pagine già pubblicate protette;
- conteggio finale del pilot.

Il report non deve mostrare maintenance token, JWT, secret o PII.

## Contratto di freshness

La verifica non si limita alla data memorizzata nel manifest.

Prima di dichiarare una release candidate pronta:

- le claim verification devono essere ancora valide al momento dell’audit;
- la source registry deve essere attiva;
- il bundle deve essere l’ultima versione;
- il draft deve appartenere a quel bundle;
- una nuova versione di bundle invalida la precedente entry;
- un claim scaduto invalida la release candidate;
- un draft rigenerato richiede una nuova approvazione e aggiornamento del manifest.

## Stato della pagina Cina

La pagina Cina esistente non viene promossa automaticamente nel pilot.

Lo stato canonico noto è:

```text
publication_eligible = false
page status = review
```

Può diventare candidata soltanto dopo una nuova valutazione reale che chiuda tutti i blocker e produca le approvazioni richieste. Lo scope non presume che questo accada.

## Test della foundation

La CI deve coprire almeno:

### Candidate valido

- latest bundle;
- bundle approved for publication;
- draft approved;
- page in review;
- provenance completa;
- claim correnti;
- manifest coerente.

### Bundle non idoneo

- `publication_eligible = 0`;
- insufficient;
- contradicted;
- pending;
- expired;
- conflict;
- superseded.

### Draft non idoneo

- generating;
- review non approvata;
- changes requested;
- failed;
- superseded;
- bundle mismatch;
- provenance mancante;
- claim escluso usato.

### Pagina non idonea

- draft/page drift;
- slug mismatch;
- page type mismatch;
- già published;
- reserved path;
- file probe;
- `published_at` valorizzato in review;
- featured anticipato.

### Manifest non valido

- oltre quattro entry;
- slug duplicati;
- ID o versioni non positivi;
- URL non HTTPS;
- intenti duplicati;
- entry riferita a bundle o draft non più correnti;
- secret-like data.

### Empty state

Zero release candidate è un esito valido e deve produrre un report esplicito, non un errore tecnico.

## Acceptance M5.6a

Sul medesimo head finale devono essere verdi:

- tipi Cloudflare;
- typecheck e build;
- migrazioni D1 invariate;
- quality gate e golden evaluation;
- Container build e smoke;
- regressioni pubbliche;
- route policy;
- canonical renderer parity;
- sitemap/robots parity;
- candidate audit fixtures;
- manifest validation;
- tutte le suite Control Room.

Inoltre deve essere dimostrato:

- nessuna mutation D1;
- nessuna route pubblica nuova;
- nessun endpoint di pubblicazione;
- nessuna riga promossa a `published`;
- nessun deploy;
- active matrix invariata;
- legacy renderer e Astro renderer invariati;
- nessuna sitemap submission;
- nessun tracking o affiliazione.

## Output della foundation

```text
read-only audit model
+ versioned manifest schema
+ candidate report
+ local fixtures and smoke
+ current ownership unchanged
```

La foundation può chiudersi con un manifest vuoto.

## Fasi successive separate

```text
M5.6a candidate audit foundation
→ M5.6b prepare real release candidates one by one
→ explicit publication capability decision
→ M5.7 apex cutover
→ M6 measurement and Search Console
```

L’ordine tra prima pubblicazione e cutover deve essere deciso esplicitamente dopo che esistono release candidate reali.

## Fuori scope

- scelta anticipata di Paesi o provider;
- generazione massiva;
- pSEO a template;
- keyword stuffing;
- ranking “migliore” senza scoring approvato;
- modifica dei gate Page Readiness;
- allentamento della freshness;
- mutation `review → published`;
- pulsante o endpoint di pubblicazione;
- deploy pubblico;
- cambio di `activePublicRouteDecision`;
- sitemap index;
- Search Console submission;
- GTM, GA4, CMP o Consent Mode;
- affiliazioni;
- rimozione dei renderer legacy.
