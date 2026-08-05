# Italy Comparison Evidence Pack — live hardening

Data: **5 agosto 2026**.

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

## Primo probe della pagina esatta — 5 agosto 2026

Il primo probe diagnostico della pagina esatta ha verificato che il problema non è un redirect e non richiede browser automation.

Risultato reale:

```text
requestedUrl: https://www.airalo.com/it/italy-esim/mamma-mia-in-10days-unlimited
finalUrl:     https://www.airalo.com/it/italy-esim/mamma-mia-in-10days-unlimited
redirects:    0
HTTP:         200
content-type: text/html;charset=utf-8
locale:       it
bytes:        626388
body sha256:  c983837de2e4f35ab826bb0fccb0a5dbcb5e51378542fd452b617ba77aae06cd
visible sha:  c9e96d90fb85bed907536d6d3b3f312f3b3c94cbd5321c2556ce1763a179408f
```

Il testo SSR visibile contiene direttamente:

```text
10 giorni
Illimitato GB
29.00 €
Velocità ridotta a 1 Mbps dopo il consumo giornaliero di 3 GB.
```

Il raw HTML contiene inoltre il package identifier e lo stato SSR corrispondente:

```text
mamma-mia-in-10days-unlimited
29.00 €
Illimitato - 10 Giorni
Unlimited - 10 days
```

Questa osservazione ha individuato un secondo gap fra fixture e live source: la CI #558 verificava correttamente l'URL esatto e la provenance adapter, ma la fixture Airalo continuava a simulare la vecchia forma `$33.00 USD`. Il parser core cercava quindi ancora una riga USD che la pagina live italiana non espone.

Correzione bounded:

- `PACK_EXTRACTOR_VERSION` passa a `1.0.1`;
- la riga Airalo 10 giorni viene estratta dalla forma SSR realmente osservata;
- `29.00 €` viene normalizzato come `{ amount: 29, currency: "EUR" }`;
- la valuta deriva dal simbolo presente nella source e non da locale o conversione;
- non viene creato `price_eur` come derivazione separata;
- il live smoke usa una fixture strutturalmente coerente con la pagina esatta e verifica anche l'estrazione Airalo, non soltanto la richiesta HTTP;
- tutte le candidate restano `pending`;
- `activation_policy` e `radio_technology` Airalo restano `unknown` e `network` resta `partial` finché il bounded source set non prova di più;
- `ranking.status` resta `not_computed`.

## Perché non usare browser automation

La pagina esatta del pacchetto è sufficiente perché:

- lo scenario seleziona già il pacchetto Airalo 10 giorni illimitato;
- la response HTTP SSR espone durata, unlimited label, prezzo e rete primaria;
- il raw HTML contiene anche l'identificatore esatto del package;
- produce provenance più precisa;
- mantiene il comando read-only e dependency-free;
- non richiede Playwright, sessioni, cookie o credenziali.

Browser capture resta fuori scope finché una source esatta ufficiale soddisfa il contratto.

## `npm ci` locale

La cattura manuale non richiede installazione delle dependency.

Il comando usa Node 22 e moduli built-in. Il fallimento locale osservato durante `npm ci`:

```text
sharp: Attempting to build from source via node-gyp
sharp: Please add node-addon-api to your dependencies
```

è separato dal pack e non giustifica l'aggiunta di `node-addon-api` al repository:

- la CI remota completa installa correttamente le dependency;
- il pack non importa `sharp` o Miniflare;
- aggiungere una dependency applicativa per aggirare una configurazione locale nasconderebbe il problema invece di risolverlo.

Il checkpoint manuale richiede soltanto:

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
