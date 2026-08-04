# Italy Comparison Evidence Pack — live hardening

Data: **4 agosto 2026**.

## Trigger

La prima cattura reale della PR #106 ha verificato correttamente il confine operativo fra fixture CI e source live:

```text
CI #552: green
live capture: failed closed
reason: Airalo generic catalog surface did not expose the expected 10-day unlimited row to the bounded static extractor
```

Nessun artifact incompleto è stato persistito e nessun dato è stato inventato.

## Decisione

Per il percorso live, la source Airalo viene ristretta dalla pagina catalogo generica alla pagina ufficiale del pacchetto esatto:

```text
https://www.airalo.com/it/italy-esim/mamma-mia-in-10days-unlimited
```

La source mantiene:

- key `airalo-italy-plan`;
- provider `airalo`;
- offer key `airalo:italy:unlimited-10d`;
- host/path allowlist;
- stessa policy FUP complementare;
- estrazione field-specific e fail-closed.

Il live runner è:

```text
scripts/run-italy-comparison-evidence-pack.mjs
```

Il core extractor e le fixture restano separati:

```text
italy-comparison-evidence-pack.mjs
→ model, extraction, semantic diff, persistence

run-italy-comparison-evidence-pack.mjs
→ exact live source selection and manual orchestration
```

## Perché non usare browser automation

La prima correzione deve ridurre l'ambiguità della source, non aggiungere un browser crawler.

La pagina esatta del pacchetto è preferibile perché:

- lo scenario seleziona già il pacchetto Airalo 10 giorni illimitato;
- evita di cercare una singola riga dentro un catalogo multi-offerta;
- produce provenance più precisa;
- mantiene il comando read-only e dependency-free;
- non richiede Playwright, sessioni, cookie o credenziali.

Browser capture resta fuori scope finché una source esatta ufficiale può soddisfare il contratto.

## `npm ci` locale

La cattura manuale non richiede installazione delle dependency.

Il comando usa Node 22 e moduli built-in. Il fallimento locale osservato durante `npm ci`:

```text
sharp: Attempting to build from source via node-gyp
sharp: Please add node-addon-api to your dependencies
```

è separato dal pack e non giustifica l'aggiunta di `node-addon-api` al repository:

- CI #552 ha completato `npm ci` e tutta la suite;
- il pack non importa `sharp` o Miniflare;
- aggiungere una dependency applicativa per aggirare una configurazione locale nasconderebbe il problema invece di risolverlo.

Il nuovo checkpoint manuale richiede soltanto:

```text
git pull --ff-only
npm run evidence:italy-pack
```

L'ambiente npm locale verrà diagnosticato separatamente soltanto se serve per build/test completi.

## Guardrail preservati

La correzione non introduce:

- URL arbitrari;
- crawler o browser automation;
- dependency nuova;
- D1 write/migration;
- FX conversion;
- ranking;
- pubblicazione;
- deploy.

La PR resta draft fino a nuova CI verde e cattura reale completa.
