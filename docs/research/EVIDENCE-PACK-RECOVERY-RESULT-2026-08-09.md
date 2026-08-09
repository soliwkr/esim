# Evidence pack recovery result — 9 agosto 2026

## Obiettivo

Verificare se i due bundle raw storici approvati in PR #106 e #107 potessero essere recuperati o ricreati in modo fail-closed usando gli stessi runner canonici, prima del controlled evidence ingest production.

Lo scope era **read-only rispetto a D1 e produzione applicativa**:

- nessuna migration;
- nessuna source_registry mutation;
- nessun evidence ingest;
- nessun `claim_verifications` write;
- nessun deploy;
- nessun affiliate activation.

## Contesto

I result documentati dei pack storici conservano pack ID e semantic fingerprint, ma i bundle completi:

```text
pack.json
sources/*.html
```

erano stati salvati soltanto localmente in `research/evidence/packs/...` e ignorati da Git.

La verifica delle CI storiche non ha trovato artifact GitHub Actions contenenti quei bundle.

Non è quindi consentito ricostruire raw body, locator o pack identity dalla sola documentazione.

## Tentativo di recovery

Branch one-shot:

```text
ops/evidence-pack-recovery-capture
```

Workflow:

```text
Evidence Pack Recovery Capture
```

Run:

```text
31313829528
```

Head:

```text
eacd770c5ff0f40ed8e9981916b2ac78c4bdd426
```

Il workflow avrebbe:

1. ricatturato lo scenario Italia con `scripts/run-italy-comparison-evidence-pack.mjs`;
2. ricatturato lo scenario Europa con `scripts/europe-regional-evidence-pack.mjs`;
3. richiesto gli stessi semantic fingerprint storici;
4. conservato `pack.json + sources/` come artifact GitHub soltanto dopo una cattura completa.

Nessuna nuova cattura sarebbe stata automaticamente considerata equivalente alla raw identity storica.

## Risultato

Il run ha fallito durante la cattura Italia **prima della persistenza di un pack completo**.

Errore esatto:

```text
Error: ubigi-italy-plan: HTTP 403 is not successful.
```

La failure è avvenuta nel percorso canonico `buildSourceSnapshot()` dopo la risposta HTTP 403 della pagina prodotto Ubigi Italia.

Conseguenze del fail-closed:

```text
Italy complete pack:    non creato
Europe capture:         non eseguita
workflow artifact:      non creato
D1 mutation:            nessuna
source_registry write:  nessuna
claim write:            nessuna
deploy:                 nessuno
```

## Decisione

Non vengono introdotti workaround per far passare la source:

- nessun browser/scraper alternativo usato per sostituire silenziosamente il runner canonico;
- nessun dato storico copiato dalla documentazione;
- nessun diagnostic HTML parziale promosso a source artifact;
- nessun 403 convertito in `unknown` dentro un pack apparentemente completo;
- nessuna nuova raw identity assimilata automaticamente a un pack storico sulla sola base del semantic fingerprint.

Il recovery automatico da GitHub Actions è quindi **non disponibile per il percorso Ubigi Italia osservato il 9 agosto 2026**.

## Impatto sul controlled ingest

Il controlled ingest resta bloccato finché non si verifica una delle due condizioni:

```text
A. recupero dei bundle originali #106/#107
```

oppure:

```text
B. nuova coppia di capture completa
→ review dei raw artifact e locator
→ confronto semantico
→ approvazione esplicita delle nuove raw identity come replacement
```

In entrambi i casi, prima dell'ingest D1 i raw artifact devono essere persistiti nel durable artifact store definito separatamente.

## Gate successivo

```text
durable artifact storage foundation
→ explicit remote storage provisioning
→ approved raw bundle availability
→ controlled evidence ingest
```

Questo result non autorizza R2 provisioning, controlled ingest, verification bridge, publication o deploy.
