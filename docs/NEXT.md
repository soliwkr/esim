# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **23 luglio 2026**.

## Now

### 1. Public shell Astro verificato su mobile

La PR #59 è mergiata nel commit `1b7bfa7`, la CI finale #266 è completamente verde e uno screenshot reale del 23 luglio 2026 conferma `/astro-foundation` su mobile.

Sono attestati visivamente:

- banner preview non indicizzata;
- brand e controllo `Apri menu`;
- hero, CTA e card delle quattro domande;
- percorsi Destinazioni, Guide pratiche e Confronti;
- inizio della sezione Metodo;
- nessun taglio laterale o overflow visibile;
- gerarchia, spaziatura e leggibilità coerenti nella porzione osservata.

Lo screenshot non prova header HTTP, canonical, sitemap, desktop live o la parte inferiore non visibile. Questi contratti sono coperti dalla CI #266; la verifica esterna live residuale resta aperta.

### 2. Chiudere la seconda slice M5 — trust pages

PR aperta:

```text
#61 — feat/public-trust-pages
```

Route preview:

```text
/astro-foundation/metodo
/astro-foundation/trasparenza
/astro-foundation/privacy
```

Implementazione completata:

- `TrustPage.astro` condiviso;
- stili responsive dedicati;
- Metodo, Trasparenza e Privacy in raw HTML Astro;
- ownership di noindex/no-store/security headers centralizzata in `PublicLayout`;
- brand, Metodo e footer confinati nel namespace preview;
- Destinazioni, Guide e Confronti ancora collegati alle route legacy;
- canonical self-reference per ogni preview;
- nessuna island React e nessun JavaScript richiesto;
- nessuna modifica a Worker routing, backend, D1, Workflow, Container o publication state;
- nessuna CMP, analytics, Search Console o affiliazione.

CI #271 completamente verde:

- typecheck e build Astro;
- migrazioni D1;
- quality gate e golden evaluation;
- Container;
- `workerd` con public shell, tre trust preview e tre route legacy;
- canonical, noindex/no-store, sitemap e raw HTML;
- desktop, mobile, tastiera, `aria-current`, navigazione e overflow;
- tutte le regressioni Control Room.

Il primo run #270 ha correttamente bloccato una verifica sorgente rimasta legata alla vecchia ownership degli header. Il contratto è stato riallineato a `PublicLayout`; la prova HTTP reale è rimasta attiva.

Passi immediati:

1. attendere la CI finale del commit documentale;
2. rendere pronta e mergiare la PR #61;
3. verificare le tre route preview in produzione su mobile e desktop;
4. non sostituire `/metodo`, `/trasparenza` o `/privacy` durante il checkpoint.

### 3. Definire la terza slice M5 dopo il checkpoint live

Direzione canonica:

```text
candidato homepage Astro
→ listing destinazioni/guide/confronti
```

La branch e lo scope definitivo vengono fissati soltanto dopo il checkpoint produttivo della PR #61.

La slice candidato homepage deve chiarire almeno:

- quali dati pubblicati leggere server-side senza accesso D1 dal browser;
- come mantenere HTML content-first e JavaScript minimo;
- come preservare semanticamente home, navigation e card legacy;
- come separare preview, route canonica e cutover;
- quali contratti di canonical, sitemap, schema, 404 e rollback bloccheranno il passaggio successivo.

Non è autorizzato alcun cutover dell’apice.

### 4. Continuare M4 su branch separate

La track pubblica non chiude M4. L’ordine delle mutation resta:

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni capacità richiede una branch separata, conferma esplicita, identità Access, state machine server-side, audit persistito, idempotenza, reload e test end-to-end.

### 5. Verifiche operative ancora aperte

Da completare senza bloccare M5:

- trust pages preview in produzione dopo il merge della PR #61;
- desktop live e header/canonical/sitemap del public shell;
- linkage claim → task nel browser reale dietro Access;
- linkage audit → ID/versione draft nel browser reale;
- topic-mismatch sul primo nuovo run autorizzato;
- nessun Workflow avviato soltanto per produrre dati artificiali di test.

## Separazioni obbligatorie

```text
M5 preview ≠ public cutover
M5 progress ≠ M4 completato
preview trust page ≠ route canonica migrata
CI verde ≠ verifica produttiva completata
brief accepted ≠ brief converted
approved draft ≠ published page
draft status ≠ materialized page status
materialized page review ≠ publication eligibility
queue status ≠ decisione editoriale
audit event ≠ autorizzazione operativa
```

## Track successive M5

Dopo le trust pages e il relativo checkpoint live, una branch per slice:

```text
candidato homepage Astro
→ listing destinazioni/guide/confronti
→ renderer articolo grounded
→ parità canonical/sitemap/schema/404
→ piccolo catalogo pilot
→ PR separata di cutover apex
```

M6 — CMP, GA4, GTM e Search Console — parte soltanto dopo che il frontend pubblico ha route e contratti stabili.

## Checkpoint completati

- PR #31 — sessione server-side e un solo login Access;
- PR #32 — overview e health;
- PR #34 — radar e brief;
- PR #36 — score zero filtrato con `zero_relevance`;
- PR #37 — claim, fonti e scadenze;
- PR #39 + #40 — Page Readiness ed evidence bundle;
- PR #42 — draft, preview e decisioni read-only;
- PR #44 — queue e audit read-only;
- PR #45 — golden quality evaluation;
- PR #46 — topic-mismatch gate mergiato; verifica funzionale sul prossimo run aperta;
- PR #47 — dettaglio draft completo, CI #198 e verifica browser reale;
- PR #49 — audit legacy, merge `e0a39fa9`, CI #209;
- PR #50 — claim → task, merge `41a9beee`, CI #213;
- PR #52 — audit → versione draft, merge `35f56e82`, CI #220;
- PR #54 — decisione brief, merge `15ea0445`, CI #237 e checkpoint produttivo #244;
- PR #57 — audit repository esterni, merge `5dc7587`, CI #260;
- PR #58 — track M5 parallela, merge `431bf7b`, CI #262;
- PR #59 — public shell preview, merge `1b7bfa7`, CI finale #266 e checkpoint visuale mobile in produzione;
- PR #60 — checkpoint mobile del public shell, merge `21485b8`, CI #268.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret o dato personale in URL, HTML, JavaScript client, storage, log o repository;
- ogni nuova mutation richiede una branch e uno scope esclusivo;
- nessun cutover apex o delle route trust nella PR #61;
- nessuna rimozione della legacy finché resta un fallback operativo.
