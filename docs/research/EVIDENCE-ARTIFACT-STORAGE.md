# Evidence artifact storage — R2 content-addressed foundation

Data: **9 agosto 2026**.

## Perché questo gate esiste

Il mapping Evidence → D1 definisce `evidence_snapshots.artifact_ref` come riferimento opaco a storage immutabile e richiede che il raw body sia risolvibile insieme al `body_sha256` prima che l'evidence venga usata per una decisione di verifica.

La migration `0021_evidence_upstream_storage.sql` è ora applicata in produzione, ma il design #108 aveva deliberatamente lasciato aperta la scelta dello storage raw. Il controlled ingest non deve quindi persistere un `artifact_ref` che punti a una directory locale o effimera del runner.

Questo documento chiude la scelta architetturale, **non crea ancora infrastruttura remota**.

## Decisione

Usare **Cloudflare R2 privato** come storage dei raw evidence artifact e dei `pack.json` usati per gli ingest production.

R2 viene usato come blob store, non come database dei facts.

```text
official source bytes
→ sha256
→ create-only R2 object
→ resolvable artifact_ref
→ D1 evidence snapshot / capture run
```

D1 continua a conservare metadata, identità, stato di coverage e provenance strutturata; R2 conserva i byte originali necessari a ricostruire e verificare la chain-of-custody.

## Content-addressed object keys

### Raw source

```text
v1/raw/sha256/<first-2-hex>/<64-hex>.<extension>
```

Esempio logico:

```text
r2://evidence-artifacts/v1/raw/sha256/ab/abcdef...0123.html
```

La chiave dipende esclusivamente dal contenuto, non da provider, URL, prezzo, timestamp o ambiente.

### Pack JSON

```text
v1/packs/sha256/<first-2-hex>/<64-hex>.json
```

Il digest è lo SHA-256 dei byte esatti del `pack.json` importato. `evidence_capture_runs.pack_sha256` permette quindi di ricostruire deterministicamente la chiave dell'oggetto pack.

## Immutabilità operativa

R2 non fornisce Object Lock/WORM nel contratto S3 usato da questo progetto. L'immutabilità è quindi **applicativa e content-addressed**, non una garanzia WORM del provider.

Regole:

- bucket privato;
- create-only con conditional write equivalente a `If-None-Match: *`;
- nessun overwrite nel percorso operativo;
- nessun delete nel percorso operativo;
- stessa chiave già presente è accettabile soltanto dopo verifica di hash/size coerenti;
- una variazione dei byte produce una chiave nuova;
- nessun lifecycle automatico che cancelli evidence ancora referenziata;
- una eventuale repair/delete amministrativa è un gate separato, auditato e non appartiene all'importer.

Un attore con privilegi amministrativi Cloudflare potrebbe comunque cancellare o alterare oggetti: questa fondazione non dichiara WORM o legal hold.

## Integrità

Prima di qualsiasi ingest D1 production:

1. leggere i raw artifact locali;
2. verificare `body_sha256` e `byteLength` già presenti nel pack;
3. derivare la chiave content-addressed;
4. creare l'oggetto R2 solo se assente;
5. se già presente, verificare che l'oggetto risolva allo stesso contenuto atteso;
6. rileggere/HEAD l'oggetto e verificare size/checksum metadata;
7. soltanto dopo costruire `artifact_ref` R2 per la snapshot D1;
8. conservare anche i byte esatti del `pack.json` sotto la chiave derivata da `pack_sha256`.

L'importer non considera una upload riuscita equivalente a evidence verificata: è soltanto storage provenance.

## Content type support iniziale

Il contratto v1 ammette:

```text
text/html
application/xhtml+xml
application/json
application/pdf
```

I pack Italia/Europa correnti usano HTML. L'estensione è derivata da content type validato, non dal nome URL.

## Security boundary

- nessun bucket pubblico;
- nessun browser access diretto;
- nessuna credential R2 in repository, HTML, URL pubblici o bundle frontend;
- upload/read amministrativi eseguiti soltanto da un gate operativo esplicito;
- credenziali e bucket reale sono configurazione environment-specific;
- `artifact_ref` usa un alias logico `evidence-artifacts`, non richiede di versionare credential o endpoint firmati.

## Rapporto con D1

Lo schema `0021` non cambia.

```text
evidence_capture_runs.pack_sha256
→ pack object key derivabile

evidence_snapshots.body_sha256
→ raw object key derivabile

evidence_snapshots.artifact_ref
→ r2://evidence-artifacts/<content-addressed-key>
```

Non viene aggiunto raw HTML come TEXT in D1.

Non vengono modificati:

- `source_registry`;
- `plans`;
- `claim_verifications`;
- gate editoriali;
- frontend;
- publication capability.

## Artifact recovery blocker emerso il 9 agosto 2026

I pack live #106/#107 erano stati intenzionalmente salvati soltanto in directory locali ignorate da Git. I result documentano pack ID e semantic fingerprint, ma i bundle completi `pack.json + sources/` non sono presenti nel repository né negli artifact delle CI storiche.

È stato tentato un recovery read-only su GitHub Actions usando gli stessi runner canonici. Il run si è fermato correttamente sulla fonte Ubigi Italy con HTTP 403 prima di produrre un pack completo.

Quindi:

- nessun pack storico viene ricostruito dalla documentazione;
- nessun pasted diagnostic viene promosso a raw artifact;
- una nuova cattura con raw identity differente non viene assimilata automaticamente al pack storico anche se il semantic fingerprint coincide;
- il controlled ingest resta bloccato finché non vengono recuperati i bundle originali oppure una nuova coppia di capture viene esplicitamente approvata come replacement.

## Gate successivi

```text
storage contract local/CI
→ explicit remote R2 provisioning authorization
→ verify private/create-only artifact path
→ recover original pack bundles OR approve replacement captures
→ stage exact pack + raw bytes in R2
→ separately authorized controlled D1 ingest
→ post-ingest provenance audit
```

Il provisioning R2 non è autorizzato da questa branch.
Il controlled ingest D1 non è eseguito da questa branch.
