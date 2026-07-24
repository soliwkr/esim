# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now

### 1. Verificare la route privata sui dati remoti

Implementazione completata:

```text
PR #79
merge df890103310cf1591eb2d8137a8385135c665d71
CI finale #386
```

Route:

```text
https://senzaroaming.it/control-room-foundation/api/catalog-pilot-audit
```

Checkpoint richiesti dopo Cloudflare Access:

- risposta HTTP 200;
- `Cache-Control: no-store`;
- `X-Robots-Tag: noindex, nofollow`;
- `ok=true`;
- report leggibile;
- nessun token, secret o PII;
- selected count compreso tra zero e quattro;
- selected candidate ancora `review`;
- nessuna variazione osservata negli stati editoriali.

Una risposta 404 indica che il deploy non contiene ancora il merge. Una risposta Access/403 senza sessione è invece coerente con il perimetro privato.

### 2. Registrare il primo audit remoto

Possibili esiti:

```text
0 candidate → manifest resta vuoto
1–4 candidate → manifest con ID e versioni reali
>4 candidate → cap a quattro
```

Zero candidate è un risultato valido e non blocca il nuovo design.

Dopo il report:

- registrare soltanto dati sanitizzati;
- aggiornare `data/public-catalog-pilot.json` solo con ID reali verificati;
- mantenere tutte le entry in `pages.status='review'`;
- registrare blocker e warning;
- non generare lavoro editoriale fittizio;
- non pubblicare alcuna pagina.

### 3. Aprire M5.7 — apex design cutover

Il nuovo design diventa la priorità immediata dopo l’audit remoto.

Branch proposta:

```text
feat/public-apex-cutover
```

Scope esclusivo:

```text
activePublicRouteDecision
current → target
```

La PR trasferisce ad Astro soltanto:

- homepage canonica;
- Destinazioni, Guide e Confronti;
- Metodo, Trasparenza e Privacy;
- articoli canonici;
- sitemap, robots e 404 pubblica.

Restano backend-owned:

- `/api/*`;
- `/go/*`;
- Control Room nuova e legacy;
- D1, Workflow, Container e AI;
- gate editoriali e publication capability.

### 4. Acceptance M5.7

Sul medesimo head finale:

- types, typecheck e build;
- migrazioni invariate;
- quality gate e golden evaluation;
- Container;
- regressioni pubbliche e private;
- canonical metadata e JSON-LD;
- sitemap e robots;
- vere 404;
- provider redirect preservati;
- pagine `review` e `draft` sempre 404;
- pagine `published` valide servite da Astro;
- confronto current/target;
- rollback documentato.

Dopo deploy verificare live:

- `/`;
- `/destinazioni`;
- `/guide`;
- `/confronti`;
- trust pages;
- almeno un articolo published;
- `/sitemap.xml`;
- `/robots.txt`;
- 404;
- `/go/*`;
- Control Room;
- mobile e desktop;
- header cache e robots.

### 5. Publication capability resta separata

Il cutover del design non introduce:

```text
review → published
```

La prima pubblicazione richiede ancora:

- autorizzazione esplicita;
- branch mutation separata;
- identità verificata;
- conferma umana;
- state machine D1;
- audit append-only;
- idempotenza;
- freshness recheck;
- rollback/deindicizzazione;
- test end-to-end.

## Checkpoint chiusi

```text
PR #69  SEO contract
PR #71  route policy — CI #329
PR #73  canonical Astro parity — CI #350
PR #75  sitemap/robots parity — CI #365
PR #76  catalog pilot scope — CI #367
PR #77  catalog pilot foundation — CI #379
PR #78  remote audit scope — CI #381
PR #79  private remote audit route — CI #386
```

## Track M4 parallela

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

M4 non blocca M5.7, ma la legacy privata resta finché serve come fallback operativo.

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

M6 parte dopo il cutover e la stabilizzazione delle route canoniche.

## Freeze immediato

- niente pubblicazione automatica;
- niente endpoint o pulsante publish in M5.7;
- niente accesso browser diretto a D1;
- niente query SQL controllate dal client;
- niente secret o PII in URL, payload, log o repository;
- niente generazione massiva;
- niente analytics o affiliazioni anticipate;
- niente sitemap submission prima del cutover verificato;
- niente rimozione della legacy privata;
- niente modifica di API, redirect provider o gate editoriali durante M5.7.
