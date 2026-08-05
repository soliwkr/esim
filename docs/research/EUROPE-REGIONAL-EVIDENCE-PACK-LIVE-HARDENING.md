# Europe Regional Evidence Pack — Live Hardening

Data: **5 agosto 2026**.

## Contesto

La prima implementazione della PR #107 era verde in CI sull'head:

```text
c5ba7461316291535ea2922d729728a6c8e1ee3f
```

Il primo capture reale è stato eseguito con:

```text
npm run evidence:europe-regional-pack
```

Il runner ha fallito chiuso prima della persistenza dell'artifact:

```text
Error: airalo declared country count: expected a match.
```

Nessun `pack.json` e nessun raw source artifact sono stati scritti dal run fallito.

## Diagnostico ufficiale Airalo

La source inizialmente configurata era:

```text
https://www.airalo.com/europe-esim/eurolink-15days-unlimited
```

La response reale osservata ha mostrato:

```text
HTTP 302
→ https://www.airalo.com/europe-esim
```

La surface finale canonica ha risposto:

```text
HTTP: 200
content type: text/html;charset=utf-8
locale: en
byte length: 1298478
body SHA-256: sha256:cd83ca74a51da1223dcd6b60c2a1e692de947059ef568e3e8561dc0e7d1b2a4a
visible-text SHA-256: sha256:c86a360b7ef1a3d5f9006bfa406b05d16fd3a4b94310e7ec415c224b632407d9
```

Il testo visibile della pagina ufficiale esponeva:

```text
Europe
41 Countries and Networks
15 days Unlimited GB 44.50 €
```

Il raw Nuxt state conservava anche lo slug del pacchetto:

```text
eurolink-in-15days-unlimited
```

Il locator preferito resta però il testo visibile della riga commerciale. Il raw state non viene usato per sostituire evidence già disponibile nella surface pubblica renderizzata.

## Gap della fixture iniziale

La fixture aveva codificato tre assunzioni non confermate dal live:

```text
exact package URL stabile
42 Countries and Networks
$49.00 USD
```

Il live ha invece provato:

```text
exact package URL → redirect alla store surface canonica
41 Countries and Networks
44.50 EUR
```

La causa del fallimento non era rete, browser o autenticazione. Era un contratto di estrazione troppo specifico e stale.

## Correzione evidence-driven

La versione extractor è stata portata a:

```text
1.0.1
```

La correzione bounded applica:

1. source canonica Airalo `https://www.airalo.com/europe-esim`;
2. country/network count estratto dinamicamente dalla forma `<N> Countries and Networks`;
3. selezione dell'offerta tramite una singola riga ancorata:

```text
15 days + Unlimited GB + source price
```

4. valuta EUR preservata senza FX o `price_eur` sintetico;
5. activation policy Airalo lasciata `unknown`, perché la store surface non prova il trigger esatto della riga selezionata;
6. nessuna membership di Italia, Francia o Spagna inferita dal solo label `Europe` o dal conteggio aggregato;
7. smoke dedicato al redirect storico verso la source canonica.

Il conteggio dichiarato resta `partial` rispetto allo scenario multi-country: un numero aggregato non prova da solo la membership dei tre Paesi richiesti.

## Boundary invariati

La correzione non introduce:

- D1 schema, migration o write;
- Worker/backend/API changes;
- crawler o browser automation;
- ranking, score, winner o cheapest label;
- FX conversion;
- pubblicazione;
- deploy.

Tutte le factual candidate restano:

```text
status = pending
```

Il prossimo gate resta un nuovo capture reale completo delle sei source, seguito soltanto dopo da una seconda cattura con `--compare`.
