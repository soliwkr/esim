# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **23 luglio 2026**.

## Now

### 1. Public shell Astro mergiato

La PR #59 è mergiata nel commit `1b7bfa7` e la CI finale #266 è completamente verde.

La prima slice M5 include:

- `/astro-foundation` come preview noindex del shell pubblico;
- layout documento e metadata Astro riusabili;
- header, navigazione progressiva e footer in Astro puro;
- token e stili pubblici isolati dalla Control Room;
- homepage preview statica e non commerciale;
- contenuto primario disponibile nel raw HTML;
- nessuna island React e nessun JavaScript richiesto;
- canonical self-reference, `noindex,nofollow`, `no-store` e header di sicurezza;
- apice `/` ancora servito dal renderer legacy;
- `/astro-foundation` escluso dalla sitemap;
- smoke desktop, primo Tab, menu mobile, overflow, runtime e regressioni Control Room verdi.

### 2. Checkpoint visuale mobile in produzione completato

Uno screenshot reale del 23 luglio 2026 conferma su mobile:

- route `/astro-foundation` realmente servita dal dominio pubblico;
- banner preview non indicizzata;
- brand e controllo `Apri menu`;
- hero, CTA e card delle quattro domande;
- percorsi Destinazioni, Guide pratiche e Confronti;
- inizio della sezione Metodo;
- nessun taglio laterale o overflow visibile;
- gerarchia, spaziatura e leggibilità coerenti nella porzione osservata.

Lo screenshot non prova header HTTP, canonical, sitemap, desktop live o la parte inferiore non visibile. Questi contratti sono coperti dalla CI #266; la verifica esterna live residuale resta aperta senza bloccare la seconda slice M5.

### 3. Avviare la seconda slice M5

Branch separata:

```text
feat/public-trust-pages
```

Scope autorizzato:

- migrare in Astro Metodo editoriale, Trasparenza e Privacy;
- riusare `PublicLayout`, header, footer e token pubblici;
- preservare contenuto, significato e link delle route legacy;
- servire le nuove pagine sotto un namespace preview, senza sostituire le route canoniche;
- aggiungere metadata, canonical preview, raw HTML, mobile e tastiera;
- nessuna CMP, analytics, Search Console, affiliazione o mutation;
- nessuna modifica a backend, D1, Workflow, Container o publication state;
- nessun cutover dell’apice o delle route trust legacy.

Criteri di accettazione:

- tre route Astro preview distinte e noindex;
- contenuto essenziale presente senza JavaScript;
- header/footer condivisi senza duplicare il shell;
- route legacy `/metodo`, `/trasparenza` e `/privacy` ancora servite dal backend;
- preview escluse dalla sitemap;
- desktop/mobile, tastiera, overflow e metadata verificati;
- tutte le suite runtime e Control Room ancora verdi.

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
brief accepted ≠ brief converted
approved draft ≠ published page
draft status ≠ materialized page status
materialized page review ≠ publication eligibility
queue status ≠ decisione editoriale
audit event ≠ autorizzazione operativa
```

## Track successive M5

Dopo le trust pages, una branch per slice:

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
- PR #59 — public shell preview, merge `1b7bfa7`, CI finale #266 e checkpoint visuale mobile in produzione.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret o dato personale in URL, HTML, JavaScript client, storage, log o repository;
- ogni nuova mutation richiede una branch e uno scope esclusivo;
- nessun cutover apex o delle route trust nella seconda slice M5;
- nessuna rimozione della legacy finché resta un fallback operativo.
