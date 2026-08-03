# Evidence Snapshot Spike

Data: **3 agosto 2026**.

## Obiettivo

Dimostrare il primo tratto mancante della supply chain fattuale di Senza Roaming senza introdurre crawler, scheduler, nuove tabelle o capacità editoriali:

```text
1 public source
→ immutable local evidence artifact
→ deterministic field extraction
→ normalized datum
→ pending claim candidate
→ semantic diff
```

Questo spike implementa il contratto definito da:

- `docs/research/evidence-contract.md`;
- `docs/research/claim-candidate-contract.md`;
- `docs/research/evidence-tool-fit-matrix.md`.

Non modifica `source_registry`, `claim_verifications`, evidence bundle, Page Readiness o publication gate.

## Fonte unica allowlisted

Lo spike può catturare **soltanto**:

```text
https://cellulardata.ubigi.com/rates-and-coverage/italy-data-plans/italy-50gb-30-days/
```

La pagina è stata scelta nel Source Universe Audit perché espone nello stesso scope pubblico:

- destinazione;
- data allowance;
- validità;
- prezzo e valuta;
- ulteriori informazioni plan-specific che restano fuori dallo scope di questa iterazione.

Il target pubblico osservato durante la progettazione mostrava nell'H1 `ITALY`, `50GB`, `30 days` e `US$29`. Questa osservazione serve a definire il fixture e **non sostituisce** il futuro artifact catturato dallo script.

## Perché l'URL è hardcoded

Il primo spike non è un crawler generico.

`evidence-snapshot-spike.mjs`:

- non accetta URL arbitrari;
- richiede HTTPS;
- consente soltanto `cellulardata.ubigi.com` anche durante redirect;
- limita i redirect;
- limita la dimensione della response;
- accetta soltanto HTML/XHTML;
- conserva requested URL, final URL e redirect chain;
- rimuove tracking params soltanto dalla canonical evidence URL, non dal requested URL osservato.

Questi vincoli sono intenzionali. La generalizzazione multi-source viene dopo il Claims Coverage Audit, non prima.

## Tre field e basta

L'extractor v1 legge esclusivamente un singolo `<h1>` e produce:

```text
data_gb
validity_days
price
```

### `data_gb`

Esempio normalizzato:

```json
{"quantity":50,"unit":"GB"}
```

### `validity_days`

Esempio normalizzato:

```json
{"duration":30,"unit":"day"}
```

Lo spike **non** deduce l'activation trigger dall'H1. La candidate conserva il warning:

```text
activation_trigger_out_of_scope
```

anche se la pagina contiene altrove informazioni di activation. Quella proprietà resta un field separato.

### `price`

Esempio normalizzato:

```json
{"amount":29,"currency":"USD"}
```

Il maintenance model esistente contiene `price_eur`, ma una fonte che presenta `US$29` non autorizza a scrivere `29` in `price_eur` e non autorizza una conversione valutaria implicita.

Per questo il layer pre-D1 usa deliberatamente:

```text
fieldName = price
```

con warning:

```text
downstream_price_eur_mapping_required
```

Questa incompatibilità è un **risultato utile dello spike**, non un errore da nascondere.

## Evidence locator

Ogni candidate contiene un locator field-level verso lo snapshot:

```json
{
  "type": "html",
  "selector": "h1",
  "visibleTextSha256": "...",
  "start": 16,
  "end": 20,
  "textAnchor": "50GB"
}
```

Il body completo resta in `raw.html`; la candidate conserva soltanto l'anchor minimo necessario a riprodurre l'estrazione.

## Snapshot identity e artifact

L'identità dello snapshot dipende da:

```text
source audit key
+ canonical final URL
+ SHA-256 del raw body
```

Quindi due catture con byte identici producono la stessa content identity anche se `fetchedAt` cambia.

L'esecuzione live scrive localmente:

```text
research/evidence/snapshots/<timestamp>-<short-hash>/raw.html
research/evidence/snapshots/<timestamp>-<short-hash>/snapshot.json
```

La directory è esclusa da Git.

Le scritture usano create-only semantics (`wx`) e lo script rifiuta un raw body il cui hash non coincide con i metadata. Un artifact esistente non viene sovrascritto.

## Semantic fingerprint

Lo snapshot conserva due concetti distinti:

```text
bodySha256
semanticFingerprint
```

`bodySha256` cambia a ogni modifica dei byte della pagina.

`semanticFingerprint` considera soltanto:

- subject;
- scope;
- field;
- normalized value.

Quindi:

```text
footer/title noise change
→ raw snapshot changed
→ semantic claim delta = 0
```

mentre:

```text
US$29 → US$31
→ raw snapshot changed
→ semantic delta = price only
```

Questo è il confine che un futuro monitor potrà usare senza promuovere ogni modifica HTML a claim change.

## Comandi

### Smoke deterministico, senza rete

```text
npm run smoke:evidence-snapshot-spike
```

Copre fixture sintetiche, non una copia della pagina Ubigi.

### Cattura live manuale

```text
npm run evidence:snapshot-spike
```

La cattura live è un checkpoint operativo separato dalla CI e non deve essere dichiarata riuscita finché un artifact reale non è stato ispezionato.

### Confronto con uno snapshot precedente

```text
npm run evidence:snapshot-spike -- --compare research/evidence/snapshots/<previous>/snapshot.json
```

Il comando continua a catturare l'unico URL allowlisted e poi stampa il numero dei field semanticamente cambiati.

## Bake-off Trafilatura

Trafilatura non è una dependency del repository e non è installata dalla CI.

Dopo una cattura reale, un ambiente locale isolato che abbia Trafilatura installata può eseguire:

```text
python scripts/benchmark-evidence-trafilatura.py \
  research/evidence/snapshots/<capture>/raw.html \
  research/evidence/snapshots/<capture>/snapshot.json
```

Il benchmark controlla soltanto se i raw value delle tre candidate sopravvivono verbatim all'estrazione generica.

Non:

- crea claim;
- decide che un valore sia vero;
- sostituisce i locator field-specific;
- scrive D1;
- entra nel percorso production.

L'obiettivo è misurare il valore incrementale di un generic extractor prima di adottarlo.

## Smoke acceptance

Il fixture deve provare:

- una sola H1 nello scope corretto;
- esattamente tre field;
- `50GB` → `data_gb`;
- `30 days` → `validity_days`;
- `US$29` → `price {amount:29,currency:USD}`;
- tutte le candidate nascono `pending`;
- tutte hanno locator verso `h1`;
- nessun `price_eur` viene inventato;
- stessa fixture con timestamp diverso → stesso snapshot ID e zero semantic delta;
- modifica HTML non pertinente → nuovo raw snapshot ma zero semantic delta;
- `US$29 → US$31` → un solo delta, `price`;
- doppio prezzo, doppio H1, scope errato e simbolo `$` ambiguo → fail closed;
- redirect off-host → fail closed;
- output/compare path fuori repository → fail closed;
- artifact esistente → non sovrascritto;
- raw body con hash incoerente → rifiutato.

## Stop condition

Questa branch si ferma prima di:

- D1 schema change;
- D1 local/remote application mutation;
- scrittura in `source_registry`;
- scrittura in `claim_verifications`;
- maintenance queue;
- Cloudflare Workflow;
- scheduler;
- changedetection.io runtime;
- ArchiveBox runtime;
- RSSHub runtime;
- Partner API credentials;
- multi-source crawling;
- AI extraction come source of truth;
- draft/content generation;
- ranking;
- affiliazione;
- pubblicazione;
- deploy.

## Exit gate

Lo spike può essere considerato tecnicamente riuscito soltanto quando:

1. CI completa è verde;
2. il diff resta dentro lo scope dichiarato;
3. una cattura reale dell'unico URL produce artifact coerente;
4. i tre locator sono ispezionabili e riproducono i valori;
5. una seconda cattura può essere confrontata senza falso semantic delta;
6. il benchmark Trafilatura viene registrato come risultato opzionale, senza promuoverlo automaticamente a dependency.

Solo dopo questo gate si decide se il prossimo passo è:

```text
snapshot contract accepted
→ Claims Coverage Audit
```

oppure una correzione del modello di evidence prima di scalare.
