# Evidence verification provenance bridge — design locale v1

Data: **20 agosto 2026**

## Esito

Il contratto del bridge è stato progettato e verificato con fixture esclusivamente locale. La production D1 resta a `21 / 0021_evidence_upstream_storage.sql`: questo lavoro non aggiunge una migration production, non modifica candidate remoti e non crea claim verificati.

## Problema

`claim_verifications` rappresenta uno stato corrente mutabile. Non conserva da sola la catena auditabile che collega una decisione alle candidate evidence, alle contraddizioni e alle revisioni precedenti. Usarla direttamente come destinazione dei 52 pending candidate renderebbe la provenance incompleta.

## Contratto v1

Il prototipo locale `research/evidence/verification-provenance-bridge-v1.sql` introduce tre oggetti append-only:

```text
evidence_claim_candidate_events
evidence_verification_decisions
evidence_verification_decision_candidates
```

e una projection read-only:

```text
evidence_verification_current
```

Invarianti:

- l'intake di una candidate richiede attore umano, nota e timestamp;
- ogni transizione di stato produce un evento non riscrivibile;
- ogni decisione è immutabile e revisionata con `supersedes_decision_id`;
- una fact identity ha una sola radice e una sola catena lineare;
- le evidence link distinguono `supports`, `contradicts` e `context`;
- candidate e decisione devono condividere subject, field e scope;
- `coverage_state=partial` può produrre `insufficient`, ma non `verified`;
- `verified` richiede una scadenza successiva alla decisione;
- `expired` può sostituire soltanto una decisione `verified`;
- il prototipo non scrive `claim_verifications`, `plans` o tabelle editoriali.

La v1 limita inoltre `actor_type` a `human`. Automazione e AI non possono creare autonomamente decisioni di verification.

## Fixture verificata

Lo smoke test locale copre:

- rifiuto di candidate ancora `pending`;
- audit obbligatorio sulle transizioni;
- immutabilità di eventi, decisioni ed evidence link;
- rifiuto di decisioni non umane;
- rifiuto di `partial → verified`;
- decisione `insufficient` su evidence parziale;
- revisione di un prezzo verificato con evidence precedente contraddittoria;
- rifiuto di una seconda radice e di un fork di revisione;
- expiry esplicita e current head deterministico;
- conteggi invariati in `claim_verifications`, `plans` ed `editorial_claim_candidates`.

Comando:

```text
npm run smoke:evidence-verification-provenance
```

## Confine production

Il file SQL resta intenzionalmente fuori da `migrations/`. Il merge del design non rende alcuna migration applicabile e non autorizza:

- mutation D1 remota;
- intake dei 52 candidate production;
- decisioni di claim verification;
- materializzazione in `claim_verifications` o `plans`;
- affiliate activation, publication o deploy.

## Gate successivo

Il prossimo gate deve trasformare il contratto verificato in una proposta di migration `0022`, con review separata, preflight remoto read-only e autorizzazione esplicita prima di qualsiasi apply production. L'eventuale intake/verification dei candidate resta un gate ulteriore e distinto dall'installazione dello schema.
