# Evidence artifact storage — R2 content-addressed + native bucket lock

Data: **9 agosto 2026**.

## Perché questo gate esiste

Il mapping Evidence → D1 definisce `evidence_snapshots.artifact_ref` come riferimento opaco a storage immutabile e richiede che il raw body sia risolvibile insieme al `body_sha256` prima che l'evidence venga usata per una decisione di verifica.

La migration `0021_evidence_upstream_storage.sql` è applicata in produzione, ma il design #108 aveva deliberatamente lasciato aperta la scelta dello storage raw. Il controlled ingest non deve persistere un `artifact_ref` che punti a una directory locale o effimera del runner.

Questo documento chiude la scelta architetturale, **non crea ancora infrastruttura remota**.

## Decisione

Usare **Cloudflare R2 privato** come storage dei raw evidence artifact e dei `pack.json` usati per gli ingest production.

R2 viene usato come blob store, non come database dei facts.

```text
official source bytes
→ sha256
→ create-only R2 object
→ native bucket lock sul namespace evidence
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

## Immutabilità — contratto corretto

Cloudflare R2 non implementa **S3 Object Lock** nella API S3-compatible, ma offre **R2 Bucket Locks nativi** che possono impedire overwrite e delete per una durata definita o indefinitamente.

Per il namespace evidence il contratto richiede quindi entrambe le difese:

1. content addressing + conditional create;
2. native R2 Bucket Lock provider-enforced.

Regola canonica:

```json
{
  "id": "evidence-v1-indefinite",
  "prefix": "v1/",
  "enabled": true,
  "condition": { "type": "Indefinite" }
}
```

La regola copre sia:

```text
v1/raw/...
v1/packs/...
```

Regole operative:

- bucket privato;
- create-only con conditional write equivalente a `If-None-Match: *`;
- native bucket lock `Indefinite` attivo su prefix `v1/` prima di accettare artifact production;
- nessun overwrite nel percorso operativo;
- nessun delete nel percorso operativo;
- stessa chiave già presente è accettabile soltanto dopo verifica di hash/size coerenti;
- una variazione dei byte produce una chiave nuova;
- nessun lifecycle automatico di cancellazione sul namespace evidence;
- il gate di provisioning deve verificare la lock rule leggendo la configurazione R2 remota;
- se lock assente, disabilitata o driftata, il gate evidence fallisce chiuso.

Bucket Locks hanno precedenza sulle lifecycle rules che tentassero di cancellare oggetti coperti.

### Cosa non dichiariamo

Il native Bucket Lock è una protezione provider-enforced finché la regola resta configurata, ma un amministratore Cloudflare con permessi sufficienti può modificare/rimuovere la configurazione della lock rule. Il progetto **non dichiara** quindi legal hold, compliance WORM irrevocabile o equivalenza con S3 Object Lock.

La protezione attesa è:

```text
content-addressed identity
+ conditional create
+ native indefinite bucket lock
+ operational no-delete/no-overwrite
+ audit separato per qualsiasi repair amministrativa
```

## Integrità

Prima di qualsiasi ingest D1 production:

1. leggere i raw artifact locali;
2. verificare `body_sha256` e `byteLength` già presenti nel pack;
3. derivare la chiave content-addressed;
4. verificare che la native bucket lock canonica sia attiva sul namespace `v1/`;
5. creare l'oggetto R2 solo se assente;
6. se già presente, verificare che l'oggetto risolva allo stesso contenuto atteso;
7. rileggere/HEAD l'oggetto e verificare size/checksum metadata;
8. soltanto dopo costruire `artifact_ref` R2 per la snapshot D1;
9. conservare anche i byte esatti del `pack.json` sotto la chiave derivata da `pack_sha256`.

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
- `r2.dev` deve risultare disabilitato;
- nessun custom domain pubblico collegato;
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

È stato tentato un recovery read-only su GitHub Actions usando gli stessi runner canonici. Il run `31313829528` si è fermato correttamente sulla fonte Ubigi Italy con HTTP 403 prima di produrre un pack completo.

Documento risultato:

```text
docs/research/EVIDENCE-PACK-RECOVERY-RESULT-2026-08-09.md
```

Quindi:

- nessun pack storico viene ricostruito dalla documentazione;
- nessun pasted diagnostic viene promosso a raw artifact;
- una nuova cattura con raw identity differente non viene assimilata automaticamente al pack storico anche se il semantic fingerprint coincide;
- il controlled ingest resta bloccato finché non vengono recuperati i bundle originali oppure una nuova coppia di capture viene esplicitamente approvata come replacement.

## Gate successivi

```text
storage contract local/CI
→ explicit remote R2 provisioning authorization
→ create/verify private bucket
→ disable/verify r2.dev + zero custom domains
→ install/verify indefinite native bucket lock on v1/
→ verify create-only artifact path
→ recover original pack bundles OR approve replacement captures
→ stage exact pack + raw bytes in R2
→ separately authorized controlled D1 ingest
→ post-ingest provenance audit
```

Il provisioning R2 non è autorizzato da questa branch.
Il controlled ingest D1 non è eseguito da questa branch.
