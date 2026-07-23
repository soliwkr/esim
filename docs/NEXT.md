# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **23 luglio 2026**.

## Now

### 1. Track parallela M5 autorizzata

La PR #58 è mergiata nel commit `431bf7b` dopo CI #262 completamente verde.

La decisione operativa vive in `docs/PUBLIC-FRONTEND-PARALLEL-TRACK.md`:

```text
Track A — mutation M4 residue
Track B — frontend pubblico Astro M5
```

M5 può avanzare senza dichiarare M4 completato. Il cutover dell’apice e la rimozione delle due superfici legacy restano decisioni separate.

### 2. Chiudere il checkpoint del public shell preview

La PR #59 implementa la prima slice M5 e ha superato CI #264:

- `/astro-foundation` trasformato in preview noindex del shell pubblico;
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

Dopo il merge:

1. attendere il deploy automatico;
2. verificare in produzione `/astro-foundation` su desktop e mobile;
3. verificare header `noindex`/`no-store`, canonical e sitemap reale;
4. non cambiare `/` durante questo checkpoint.

### 3. Preparare la seconda slice M5

Branch separata, dopo il checkpoint produttivo della preview:

```text
feat/public-trust-pages
```

Scope candidato:

- migrare in Astro Metodo editoriale, Trasparenza e Privacy;
- riusare `PublicLayout`, header e footer;
- preservare contenuto e semantica delle route legacy;
- mantenere le nuove route Astro dietro un namespace preview finché la parità non è verificata;
- nessuna CMP, analytics, affiliazione o mutation;
- test di metadata, canonical, raw HTML, mobile e tastiera.

La forma definitiva della branch viene confermata dopo la verifica visuale della PR #59.

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

- linkage claim → task nel browser reale dietro Access;
- linkage audit → ID/versione draft nel browser reale;
- topic-mismatch sul primo nuovo run autorizzato;
- nessun Workflow avviato soltanto per produrre dati artificiali di test.

## Separazioni obbligatorie

```text
M5 preview ≠ public cutover
M5 progress ≠ M4 completato
brief accepted ≠ brief converted
approved draft ≠ published page
draft status ≠ materialized page status
materialized page review ≠ publication eligibility
queue status ≠ decisione editoriale
audit event ≠ autorizzazione operativa
```

## Track successive M5

Dopo il public shell e le trust pages, una branch per slice:

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
- PR #59 — public shell preview, CI #264; checkpoint produttivo aperto.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret o dato personale in URL, HTML, JavaScript client, storage, log o repository;
- ogni nuova mutation richiede una branch e uno scope esclusivo;
- nessun cutover apex durante il checkpoint del public shell;
- nessuna rimozione della legacy finché resta un fallback operativo.
