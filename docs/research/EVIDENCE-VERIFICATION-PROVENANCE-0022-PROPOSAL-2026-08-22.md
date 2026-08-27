# Evidence verification provenance `0022` — proposta locale

Data: **22 agosto 2026**

## Esito

La migration candidate:

```text
migrations/0022_evidence_verification_provenance.sql
```

è stata applicata e verificata esclusivamente su un database D1 temporaneo locale dopo tutte le migration `0001–0021`.

```text
local migrations: 22
latest:           0022_evidence_verification_provenance.sql
tables:           3
indexes:          4
triggers:         19
views:            1
```

## Contratto verificato

- candidate creati esclusivamente come pending, senza metadata decisionali;
- intake candidate con attore umano, note e timestamp;
- eventi di transizione append-only e non forgiabili con insert diretto;
- candidate storici non cancellabili;
- decisioni umane immutabili e revisionate;
- una sola catena lineare per fact identity;
- evidence link `supports`, `contradicts` e `context` immutabili;
- `partial` può risultare `insufficient`, mai `verified`;
- `verified` richiede `valid_until` futuro rispetto a `decided_at`;
- `expired` può sostituire soltanto una decisione verificata;
- current head deterministico tramite `evidence_verification_current`;
- zero write in `claim_verifications`, `plans` ed editorial candidates.

Verifica:

```text
npm run smoke:evidence-verification-provenance
```

## Stato production

```text
remote migrations: 21
remote latest:     0021_evidence_upstream_storage.sql
candidate:         52 pending
claims verified:   false
```

Questa proposta non ha eseguito D1 remote apply, candidate intake, claim verification, materializzazione, affiliate activation, publication o deploy.

## Gate successivi

```text
review + merge della migration proposal
→ read-only remote 0022 preflight
→ explicit remote apply authorization
→ separately authorized schema apply
→ separate human candidate intake / verification gate
```
