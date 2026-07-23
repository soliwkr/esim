# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **22 luglio 2026**.

## Now

### 1. Chiudere la review della draft PR #54

Branch:

```text
feat/control-room-brief-decision-mutation
```

Scope esclusivo:

```text
proposed → accepted | dismissed
```

La CI #230 è completamente verde e verifica:

- un solo brief per richiesta;
- conferma esplicita dell’operatore;
- attore derivato dal JWT Cloudflare Access;
- state machine D1;
- audit append-only `editorial_brief_events`;
- retry della stessa decisione idempotente;
- conflitto sulla decisione opposta;
- motivo obbligatorio per il rifiuto;
- cancellazione del task editoriale aperto soltanto su `dismissed`;
- reload dello snapshot;
- endpoint reale e browser desktop/mobile;
- conteggio pubblicazioni invariato;
- `publicationTriggered: false`;
- regressioni delle altre viste e legacy parity.

Prima del merge:

- riallineare ROADMAP, FRONTEND-PLAN, STATUS, NEXT, DECISIONS e README;
- rieseguire la CI sul contenuto definitivo;
- mantenere esplicito che `0020` non è applicata remotamente;
- non dichiarare la mutation operativa in produzione.

La branch non include conversione brief, claim, readiness, bundle, draft, materializzazione, queue retry, pubblicazione o rimozione della legacy.

### 2. Gate produttivo separato

Dopo un eventuale merge della PR #54 restano separati:

- deploy del codice operativo su `main`;
- applicazione remota della migrazione `0020`;
- verifica browser reale dietro Cloudflare Access;
- conferma che accept e dismiss non attivino conversione o pubblicazione;
- controllo dell’audit persistito e della queue reale.

Merge, migrazione remota e deploy richiedono autorizzazione esplicita. La CI locale non sostituisce la verifica produttiva.

### 3. Verificare i linkage read-only nel browser reale

Da controllare dietro Access:

- claim con badge `task #<id>` e stato task;
- evento audit con `event_key` stabile;
- evento draft con ID e versione separati;
- eventi non-draft senza linkage draft;
- mobile, tastiera e Sheet reali.

Le CI #213 e #220 coprono contratti, D1 locale, `workerd`, desktop e mobile automatizzati.

### 4. Verificare separatamente il topic-mismatch gate

La PR #46 è mergiata nel commit `215470ae` e la CI #188 è verde. Restano:

- applicazione remota della migrazione `0019`;
- normalizzatore con anchor attivo sui nuovi run;
- nessun Workflow avviato automaticamente;
- nessun dato editoriale artificiale creato per il test.

La verifica funzionale completa avverrà sul primo nuovo run autorizzato.

## Separazioni editoriali

```text
brief accepted ≠ brief converted
brief dismissed ≠ contenuto cancellato altrove
approved draft ≠ published page
draft status ≠ materialized page status
materialized page review ≠ publication eligibility
queue status ≠ decisione editoriale
audit event ≠ autorizzazione operativa
```

## Next

Soltanto dopo merge, migrazione remota e verifica della decisione brief:

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni capacità richiede una nuova branch, conferma esplicita, idempotenza, audit persistito, reload dello stato e test end-to-end. La pubblicazione resta fuori scope.

La legacy resta disponibile finché tutte le mutation necessarie non sono migrate e verificate.

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
- PR #46 — topic-mismatch gate mergiato, verifica remota aperta;
- PR #47 — dettaglio draft completo, CI #198 e verifica browser reale;
- PR #49 — audit legacy, merge `e0a39fa9`, CI #209;
- PR #50 — claim → task, merge `41a9beee`, CI #213;
- PR #52 — audit → versione draft, merge `35f56e82`, CI #220.

## Checkpoint in review

- draft PR #54 — decisione brief controllata, CI #230 verde.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation diversa dalla decisione brief nella PR #54;
- nessuna rimozione della legacy finché resta un fallback operativo.
