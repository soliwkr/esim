# Evidence Snapshot Spike — risultato live

Data: **3 agosto 2026**.

Questo documento chiude il checkpoint reale dello spike `SOURCE → EVIDENCE SNAPSHOT → DETERMINISTIC EXTRACTION → NORMALIZED DATUM → PENDING CLAIM CANDIDATE` introdotto dalla PR #104.

## Scope verificato

Una sola fonte pubblica allowlisted:

```text
https://cellulardata.ubigi.com/rates-and-coverage/italy-data-plans/italy-50gb-30-days/
```

Tre field soltanto:

```text
data_gb
validity_days
price
```

Nessuna scrittura D1, nessun crawler, nessuno scheduler, nessuna integrazione con maintenance queue o `claim_verifications`, nessuna capacità di pubblicazione e nessun deploy.

## Prima cattura reale

Eseguita manualmente sul checkout della branch `spike/evidence-snapshot`.

```text
fetchedAt: 2026-08-03T17:26:57.531Z
HTTP status: 200
content type: text/html; charset=UTF-8
requested URL = final URL
redirect chain: []
locale: en-GB
country context: IT
currency context: USD
byte length: 679521
ETag: absent
Last-Modified: absent
```

Identità:

```text
snapshotId:
snapshot:sha256:e5168ef951de1c11f8c041e8549175d88b4eef7b1da4750a91d33b5a3bbb6dd5

bodySha256:
sha256:dc75ee9379e3c73fe0612a18e27453e01e58bf14fa4d60b00e7166d91793245f

semanticFingerprint:
sha256:eea21123081ea860dff537dbb81cc51606da18b8fce2144b0b195ced79ca2e8c
```

Evidence heading:

```text
eSIM • ITALY • 50GB • 30 days • US$29
```

Candidate osservate:

```text
data_gb
  raw: 50GB
  normalized: { quantity: 50, unit: GB }
  status: pending

validity_days
  raw: 30 days
  normalized: { duration: 30, unit: day }
  warning: activation_trigger_out_of_scope
  status: pending

price
  raw: US$29
  normalized: { amount: 29, currency: USD }
  warning: downstream_price_eur_mapping_required
  status: pending
```

Il risultato dimostra che `destination=italy`, `locale=en-GB` e `currency=USD` devono restare contesti separati. La pagina Italy non autorizza né una deduzione `EUR` né una scrittura implicita in `price_eur`.

## Locator field-level verificati

Tutte e tre le candidate puntano allo stesso H1 visibile:

```text
visibleTextSha256:
3cba28183bbf0eb8264238260960acc4d35fd006aa49c1589db254a559f2df4a
```

Offset riprodotti manualmente contro l'heading catturato:

```text
50GB     → [15,19]
30 days  → [22,29]
US$29    → [32,37]
```

Ogni `textAnchor` coincide con la porzione dell'heading individuata da `start/end`.

## Seconda cattura reale e semantic diff

Una seconda cattura è stata eseguita pochi minuti dopo usando `--compare` contro il primo `snapshot.json`.

Secondo artifact:

```text
research/evidence/snapshots/2026-08-03T17-31-26-375Z-906ecfdbc014
```

Identità osservata nel benchmark successivo:

```text
snapshotId:
snapshot:sha256:dbce8f5c1fedfc86c95f8201f1e4fa942ac60f022f1776a796d63236044459fe

input bytes:
678220
```

Il secondo snapshot ID è diverso dal primo, quindi il raw source è cambiato.

Le tre candidate sono rimaste:

```text
data_gb: 50 GB
validity_days: 30 days
price: USD 29
```

Il semantic fingerprint è rimasto:

```text
sha256:eea21123081ea860dff537dbb81cc51606da18b8fce2144b0b195ced79ca2e8c
```

Output del confronto:

```text
Semantic changes: 0
```

Questo verifica sul provider reale il contratto:

```text
page/raw drift
≠
commercial fact drift
```

Un futuro monitor può quindi trattare un cambio dei byte come segnale da analizzare senza promuoverlo automaticamente a claim change.

## Bake-off Trafilatura

Trafilatura è stata installata soltanto in un virtual environment temporaneo fuori dal repository:

```text
/tmp/sr-trafilatura
```

Versione osservata:

```text
Trafilatura 2.2.0
```

Il benchmark offline ha lavorato sul secondo artifact già catturato; non ha effettuato fetch e non ha creato claim.

Risultato:

```text
inputBytes: 678220
extractedCharacters: 2859

50GB     retainedVerbatim: true
30 days  retainedVerbatim: true
US$29    retainedVerbatim: true
```

Interpretazione:

- Trafilatura conserva nel testo estratto tutti e tre i raw value utili allo spike;
- questo dimostra utilità come representation/extraction helper e benchmark;
- non dimostra che Trafilatura sappia scegliere scope, semantica commerciale o authoritative source;
- non sostituisce snapshot raw, hash, locator field-level, extractor versionato, normalizzazione o reviewer gate;
- non viene promossa a dependency del repository in questa fase.

Decisione:

```text
repository-owned field-specific extraction = percorso canonico dello spike
Trafilatura = helper/benchmark opzionale e offline
```

## Exit gate

Tutti i gate definiti in `docs/research/EVIDENCE-SNAPSHOT-SPIKE.md` risultano soddisfatti:

1. CI #540 verde sull'implementazione prima del checkpoint live;
2. diff ristretto allo spike e ai suoi contratti/test;
3. prima cattura reale coerente;
4. tre locator field-level riprodotti;
5. seconda cattura con raw drift ma zero semantic delta;
6. bake-off Trafilatura registrato senza nuova dependency canonica.

La PR deve eseguire nuovamente la CI dopo l'aggiunta di questo risultato documentale prima del merge.

## Conclusione

Lo snapshot contract può essere considerato **accettato per il perimetro dello spike**.

Questo non autorizza ancora generalizzazione multi-provider o ingest in D1.

Il prossimo gate corretto è il **Claims Coverage Audit**: misurare quali claim necessari alle prime pagine commerciali sono realmente coperti da fonti autorevoli e quali restano insufficienti/conflittuali prima di progettare monitoring e ingest su scala.
