# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now

### 1. Chiudere i canonici su PR #81

Branch e PR:

```text
feat/public-apex-cutover
PR #81 — Cut over canonical public routes to Astro
CI applicativa #397 completamente verde
```

Già verificato sul codice:

- `activePublicRouteDecision = targetPublicRouteDecision`;
- Cloudflare Assets con `run_worker_first = ["/*", "!/_astro/*"]`;
- homepage, listing, trust pages, articoli, sitemap, robots e 404 serviti da Astro;
- API, `/go/*`, Control Room e asset tecnici ancora backend-owned;
- righe `published` soltanto;
- pagine `review` e `draft` sempre 404;
- preview ancora noindex/no-store;
- provider redirect preservato;
- nessuna publication capability;
- tutte le suite pubbliche e private verdi.

Prima del merge devono essere sullo stesso head:

```text
ROADMAP
STATUS
NEXT
ARCHITECTURE
DECISIONS
FRONTEND-PLAN
remote audit result
```

### 2. Eseguire la CI finale

La CI finale deve ripassare:

- tipi Cloudflare;
- typecheck e build;
- migrazioni D1 invariate;
- quality gate e golden evaluation;
- Container build e smoke;
- runtime pubblico completo con matrice target attiva;
- canonical metadata e JSON-LD;
- sitemap, robots e vere 404;
- review/draft hidden;
- API health e maintenance;
- `/go/*`;
- preview Astro;
- catalog pilot audit privato;
- asset `/_astro/*`;
- tutte le suite Control Room.

Non si usa il verde #397 come scorciatoia dopo gli aggiornamenti documentali.

### 3. Rendere pronta e mergiare PR #81

Soltanto dopo la CI finale verde:

```text
aggiornare descrizione PR
→ ready for review
→ merge con expected head SHA
```

Il merge non equivale ancora a verifica live.

### 4. Verificare il deploy del nuovo design

Dopo il merge attendere che il deploy automatico abbia distribuito il commit M5.7.

Controllare live:

```text
/
/destinazioni
/guide
/confronti
/metodo
/trasparenza
/privacy
/migliore-esim
/sitemap.xml
/robots.txt
```

Verifiche obbligatorie:

- nuovo design Astro visibile sull’apice;
- canonical URL senza `/astro-foundation`;
- `index,follow,max-image-preview:large` sulle route canoniche;
- JSON-LD `WebSite`, `Article` e `FAQPage` dove previsto;
- `Cache-Control: public,max-age=300` sulle pagine valide;
- sitemap soltanto canonica e published-only;
- robots corretto;
- URL inesistente, file probe e pagina `review` restituiscono vera 404 noindex/no-store;
- `/go/airalo` o altro provider noto conserva il redirect backend;
- `/api/health` resta operativo;
- Control Room anonima bloccata e autenticata operativa;
- `/astro-foundation*` resta noindex/no-store;
- nessun overflow desktop o mobile;
- nessun JavaScript applicativo sul sito pubblico.

### 5. Rollback se il checkpoint fallisce

Rollback di ownership:

```ts
export const activePublicRouteDecision = currentPublicRouteDecision;
```

Il rollback richiede una PR/versione esplicita e nuovo deploy. Non esistono flag, query string o header che cambino renderer a runtime.

Non rimuovere il renderer pubblico legacy prima del checkpoint live concluso.

### 6. Chiudere M5.7

Dopo verifica live positiva:

- registrare commit di merge e deploy verificato;
- aggiornare ROADMAP, STATUS, NEXT, ARCHITECTURE e DECISIONS;
- decidere in una fase separata quando rimuovere il renderer pubblico legacy;
- mantenere separata la publication capability;
- avviare M6 soltanto dopo stabilizzazione delle route canoniche.

## Audit remoto chiuso

Risultato live del 24 luglio 2026:

```text
candidateCount: 1
eligibleCount: 0
selectedCount: 0
excludedCount: 1
```

La candidate `esim-cina-senza-vpn` resta `review`, non è pubblicabile e non entra nel manifest.

Documento:

```text
docs/PUBLIC-CATALOG-REMOTE-AUDIT-RESULT-2026-07-24.md
```

Zero selected candidate è un esito valido e non blocca il cutover visuale.

## Publication capability resta separata

M5.7 non introduce:

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
- test end-to-end e verifica live.

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
PR #80  remote audit closeout — CI #388
```

## Track M4 parallela

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

M4 non blocca M5.7, ma la legacy privata resta finché serve come fallback operativo.

## M6 dopo il cutover

```text
CMP
→ Consent Mode
→ dizionario eventi
→ GTM
→ GA4
→ Search Console / sitemap submission
→ verifica dati reali
```

## Freeze immediato

- niente pubblicazione automatica;
- niente endpoint o pulsante publish in M5.7;
- niente accesso browser diretto a D1;
- niente query SQL controllate dal client;
- niente secret o PII in URL, payload, log o repository;
- niente generazione massiva;
- niente analytics o affiliazioni anticipate;
- niente sitemap submission prima del cutover verificato;
- niente rimozione della legacy pubblica o privata prima dei checkpoint;
- niente modifica di API, redirect provider o gate editoriali durante M5.7.
