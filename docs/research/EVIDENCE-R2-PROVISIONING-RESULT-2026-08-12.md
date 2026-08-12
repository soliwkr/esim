# Evidence R2 provisioning result — 12 agosto 2026

## Scope

Checkpoint operativo limitato al provisioning dello storage raw della Truth Engine.

Autorizzazione utente:

```text
procedi
```

Scope autorizzato:

```text
create bucket if absent
set exact native Bucket Lock
read-only verification
```

Fuori scope e non eseguiti:

```text
repair di stato driftato
object upload
evidence ingest D1
claim verification
publication
affiliate activation
production deploy
```

## Base autorizzata

```text
main: 4e3dd85db37eb464c8337149c77cb73dfedf3880
PR #129 merge commit
```

Il run ha verificato che `origin/main` coincidesse esattamente con questo SHA e che il branch operativo differisse soltanto per marker di autorizzazione e workflow one-shot.

## Preflight precedente

Run read-only:

```text
31588635704
```

Risultato:

```text
target:             senza-roaming-evidence-artifacts
status:             absent
readyToProvision:   true
alreadyProvisioned: false
issues:             []
```

Nessuna mutation è stata eseguita dal preflight.

## Provisioning

Run:

```text
31600420207
```

Head operativo:

```text
6e86c3a05d7f5f58cf03360d7f76e20b9e62bbbf
```

Risultato mutation:

```text
mutation: created_bucket_and_set_lock
verified: true
```

Mutation ammesse ed eseguite dal gate canonico:

```text
POST create bucket
PUT exact native Bucket Lock
```

Nessun altro percorso di configurazione o write era disponibile nel workflow one-shot.

## Stato remoto finale verificato

```text
exists: true
bucketName: senza-roaming-evidence-artifacts
jurisdiction: default
storageClass: Standard
managedPublicAccess: false
customDomainCount: 0
protectedLifecycleDeletes: []
issues: []
```

Bucket Lock canonica:

```text
id:        evidence-v1-indefinite
prefix:    v1/
enabled:   true
condition: Indefinite
```

Lo stato finale è classificato come:

```text
compatible
```

## Audit artifact

GitHub Actions artifact:

```text
name: evidence-r2-provision-once
artifact id: 9142838561
retention: 30 giorni
zip sha256: 4981c73e1f2fe8f3b40ffd9254e54058ff8db90eab331cb6511aa30e1da3772a
```

Contiene:

```text
evidence-r2-preflight.json
evidence-r2-provisioning.json
evidence-r2-result.json
```

## Cosa non è successo

Il provisioning non ha:

- caricato raw evidence o `pack.json`;
- scritto `evidence_capture_runs`, `evidence_snapshots`, `evidence_field_observations` o `evidence_claim_candidates`;
- scritto `claim_verifications` o `plans`;
- modificato route pubbliche;
- attivato affiliazioni;
- effettuato deploy production.

## Gate successivo

Lo storage production non è più il blocker.

Il blocker immediato è la disponibilità di un bundle raw approvato Italy/Europe:

```text
original approved bundle recovery
OR
new complete capture
→ raw review
→ semantic comparison
→ explicit replacement approval
```

Solo dopo:

```text
stage exact raw + pack in locked R2
→ verify hash / byte length / artifact_ref
→ D1 read-only preflight
→ separately authorized controlled evidence ingest
→ verification provenance
→ bounded verified facts
→ First Money materialization
```
