# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **23 luglio 2026**.

## Now

### 1. Audit repository esterni completato

La PR #57 è mergiata nel commit `5dc7587` dopo CI #260 completamente verde.

Il checkpoint documenta:

- capacità riusabili limitate e loro provenienza;
- gap reali rispetto al codice Senza Roaming;
- Ahmeego come riferimento di prodotto e trust, non come dipendenza;
- MGC come caso reale e corpus negativo di sicurezza, privacy, SEO e claim;
- nessun codice esterno importato;
- nessuna modifica runtime o pubblicazione.

### 2. Avviare M5 come track parallela controllata

La decisione operativa è descritta in `docs/PUBLIC-FRONTEND-PARALLEL-TRACK.md`.

Prima branch implementativa prevista:

```text
feat/public-astro-shell
```

Scope esclusivo:

- trasformare `/astro-foundation` da spike a preview noindex del shell pubblico;
- introdurre layout, metadata, header, footer, navigazione e token pubblici riusabili;
- comporre una prima homepage preview con copy statico non commerciale;
- mantenere `/` e tutte le route pubbliche correnti sul renderer legacy;
- non modificare backend, D1, Workflow, Container, gate editoriali o route di pubblicazione;
- non attivare affiliazioni, analytics o Search Console;
- aggiungere build e browser smoke dedicati.

Il cutover dell’apice resta una PR separata con rollback e autorizzazione esplicita.

### 3. Continuare M4 su branch separate

La track pubblica non chiude M4. L’ordine delle mutation resta:

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni capacità richiede una branch separata, conferma esplicita, identità Access, state machine server-side, audit persistito, idempotenza, reload e test end-to-end.

### 4. Verifiche operative ancora aperte

Da completare senza bloccare la preview M5:

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

Dopo l’accettazione del shell preview, una branch per slice:

```text
trust e metodologia
→ candidato homepage Astro
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
- PR #57 — audit repository esterni, merge `5dc7587`, CI #260.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret o dato personale in URL, HTML, JavaScript client, storage, log o repository;
- ogni nuova mutation richiede una branch e uno scope esclusivo;
- nessun cutover apex nella prima slice M5;
- nessuna rimozione della legacy finché resta un fallback operativo.
