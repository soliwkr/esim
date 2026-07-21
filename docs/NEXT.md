# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **21 luglio 2026**.

## Now

### 1. Chiudere la hotfix del contratto warning readiness

Branch:

```text
fix/control-room-readiness-warning-contract
```

Contesto osservato nel browser reale:

```text
Access verificato
→ shell disponibile
→ snapshot HTTP disponibile
→ client: Contratto snapshot non valido
```

Causa:

```text
Page Readiness canonico → warnings come oggetti strutturati
fixture PR #39          → warnings come stringhe
parser frontend         → richiedeva stringhe
```

La hotfix resta frontend-only e non modifica backend, D1, Workflow, Container, AI, gate editoriali o contratti API.

### 2. Allineare il contratto warning

Ogni warning deve essere un oggetto:

```text
{
  code: string non vuota,
  message?: string,
  ...metadati persistiti non interpretati dal client
}
```

Regole:

- l'array `warnings` è obbligatorio;
- una stringa legacy non è valida;
- `code` è obbligatorio e non vuoto;
- `message`, quando presente, deve essere una stringa;
- campi aggiuntivi come `claimIds` e `conflicts` vengono preservati;
- il client non deduce nuovi blocker, score o gate dai warning.

### 3. Correggere vista e fixture

La vista deve:

- mostrare `warning.code`;
- mostrare `warning.message` quando presente;
- non renderizzare direttamente oggetti JSON come figli React;
- continuare a filtrare per presenza o assenza di warning;
- mantenere i quattro gate e tutti i conteggi invariati.

La fixture deve usare gli stessi warning prodotti da `src/page-readiness.ts`, inclusi:

- `insufficient_claims`;
- `scoped_source_conflicts`;
- `no_first_party_test`;
- `provider_statements_require_attribution`.

### 4. Definition of Done hotfix

Prima del merge devono passare:

- TypeScript strict e build Astro;
- migrazioni locali e smoke del quality gate invariati;
- build e smoke del Container invariati;
- runtime `workerd`;
- smoke Chromium generale;
- smoke Chromium claim, fonti e scadenze;
- smoke Chromium readiness con warning strutturati;
- regressione per stringa legacy, codice mancante e messaggio non testuale;
- nessuna richiesta browser diversa da `GET`;
- nessuna credenziale o accesso diretto a D1;
- nessuna route o azione di approvazione, generazione o pubblicazione;
- nessuna regressione su overview, radar, segnali, brief, claim e draft preview.

### 5. Verificare il deploy reale

Dopo il merge:

- aprire `https://senzaroaming.it/control-room-foundation`;
- verificare che lo snapshot sia disponibile;
- aprire “Evidence bundle e gate”;
- aprire il bundle reale del primo ciclo editoriale;
- verificare score 77;
- verificare draft eligibility positiva e publication eligibility negativa;
- verificare conteggi, conflitto, warning strutturati e zero first-party tests;
- controllare desktop e mobile;
- confermare che non esistano azioni di approvazione, generazione o pubblicazione.

### 6. Fase successiva

Soltanto dopo la verifica reale della hotfix:

```text
feat/control-room-draft-decisions
```

Scope previsto: draft, preview e decisioni editoriali. Le eventuali mutation richiederanno una branch separata, contratti espliciti e conferme accessibili; non vengono introdotte automaticamente nella fase readiness.

## Fuori scope immediato

- modifica del formato backend dei warning;
- valutazione o ricalcolo della readiness;
- approvazione dell'evidence bundle;
- generazione draft;
- modifica claim o fonti;
- mutation della maintenance queue;
- nuovi endpoint o query D1;
- pubblicazione;
- modifiche alla Control Room legacy;
- framework esterni di data quality.

## Checkpoint completati il 21 luglio 2026

### Sessione server-side

- PR #31 mergiata e verificata;
- un solo login Cloudflare Access;
- proxy snapshot read-only;
- nessuna credenziale applicativa nel browser.

### Overview e health

- PR #32 mergiata e verificata;
- metriche, capability, binding, timestamp e guardrail visibili;
- errori parziali e contratti runtime verificati.

### Radar e brief

- PR #34 mergiata e verificata;
- run, segnali e brief visibili;
- filtro run → segnali basato su `run_id`;
- punteggi, flag e nullable preservati;
- nessun linkage segnale → brief inventato.

### Quality gate score zero

- PR #36 mergiata nel commit `2927419`;
- segnale reale con score zero filtrato;
- flag `zero_relevance` visibile;
- conteggi riallineati;
- nessuna modifica automatica a brief o claim.

### Claim, fonti e scadenze

- PR #37 mergiata nel commit `6a71174`;
- CI, deploy e verifica browser completati;
- cinque filtri e dettaglio read-only verificati;
- stato canonico e stato temporale separati;
- fonte ed evidenza distinte;
- payload non validi rifiutati;
- nessuna richiesta browser diversa da `GET`;
- nessuna mutation o pubblicazione.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation nella hotfix readiness read-only.
