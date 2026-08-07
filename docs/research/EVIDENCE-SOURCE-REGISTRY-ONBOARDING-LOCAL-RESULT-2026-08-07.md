# Evidence source registry onboarding — local result

Data: **7 agosto 2026**.

## Scope

Materializzare e verificare **soltanto in D1 locale isolato** l'onboarding delle source richieste dai due evidence pack dopo la target verification della PR #121.

Questa slice non esegue mutation sul D1 remoto.

## Stato di partenza verificato

La PR #121 ha interrogato in sola lettura il `source_registry` target e ha osservato, in due run indipendenti:

```text
source_registry rows inspected: 7
manifest identities:             9
resolved:                        0
source_not_registered:           9
source_registry_ambiguous:       0
readyForImporter:                false
```

Le nove identity di reconciliation deduplicano a **otto registry identity D1 uniche**, perché:

```text
provider-ubigi-commerce
candidate-ubigi-europe-25gb-30d
```

convergono intenzionalmente sulla stessa canonical commerce identity Ubigi.

## Artefatti della slice

```text
research/evidence/source-registry-onboarding-intents.json
scripts/evidence-source-registry-onboarding.mjs
scripts/smoke-evidence-source-registry-onboarding.mjs
```

Lo smoke è integrato in `smoke:runtime` tramite:

```text
smoke:evidence-source-onboarding
```

## Intent manifest

Il manifest di onboarding contiene **8 intent espliciti** che coprono **tutti i 9 `sourceAuditKey`** del reconciliation manifest.

Ogni intent dichiara:

```text
intentKey
sourceAuditKeys[]
entityType
entityKey
sourceKind
label
canonicalUrl
trustLevel
freshnessDays
status
notes
```

Regole versionate:

```text
allowRemoteMutation=false
allowMetadataOverwrite=false
allowProviderRootFallback=false
allowRedirectAutoRemap=false
hardcodeEnvironmentSourceRegistryIds=false
```

## Contratto di onboarding

Preflight:

```text
same entity_type + entity_key + canonical URL
→ 0 row: insert candidate
→ 1 exact row: existing_exact
→ >1 row: block
```

Una riga con la stessa identity D1 ma metadata diversi blocca con:

```text
source_registry_metadata_conflict
```

I metadata confrontati sono:

```text
source_kind
label
trust_level
freshness_days
status
notes
```

La slice **non corregge** e non sovrascrive automaticamente una riga esistente.

## Mutation locale

Per gli intent mancanti viene generata una transaction locale con soli:

```text
INSERT OR IGNORE INTO source_registry(...)
```

Non vengono generati:

```text
UPDATE
DELETE
remote mutation
maintenance_queue writes
```

La CLI rifiuta esplicitamente:

```text
--remote
```

con:

```text
remote_source_onboarding_forbidden
```

## Verifica reale locale

CI:

```text
PR #122
head:    57b433269b744649bb14f1ff02f31c4a00dddc5c
CI #639: success
```

Lo smoke crea un persist path D1 temporaneo, applica tutte le migration repository e poi esegue due volte l'onboarding.

Primo run:

```text
intentCount:                  8
manifestIdentityCount:        9
inserted:                     8
existingExactBefore:          0
existingExactAfter:           8
resolvedManifestIdentities:   9
readyForImporter:             true
```

Secondo run sullo stesso D1 locale:

```text
intentCount:                  8
manifestIdentityCount:        9
inserted:                     0
existingExactBefore:          8
existingExactAfter:           8
resolvedManifestIdentities:   9
readyForImporter:             true
```

Quindi l'onboarding locale è idempotente rispetto al suo dominio:

```text
8 unique registry identities
→ 9/9 manifest identities resolve exactly-one
→ repeat
→ 0 new rows
→ 9/9 still resolve exactly-one
```

## Guardrail verificati

Lo smoke prova inoltre che:

1. le 8 identity coprono tutti i 9 `sourceAuditKey` una sola volta;
2. nessun `sourceRegistryId` environment-specific è versionato;
3. il read query è SELECT-only;
4. il generated onboarding SQL contiene 8 insert nel caso vuoto e nessun update/delete;
5. metadata conflict blocca;
6. sourceAuditKey mancanti bloccano;
7. hardcoded source ID blocca;
8. `--remote` blocca;
9. il postcondition richiede 8/8 metadata exact;
10. il reconciliation resolver richiede 9/9 identity resolved.

## Stato remoto invariato

Questo risultato **non cambia il D1 target**.

Finché non viene eseguito un onboarding remoto esplicitamente autorizzato, lo stato target resta quello osservato dalla PR #121:

```text
0/9 manifest identities resolved
8 unique registry identities da onboardare
readyForImporter=false
```

Anche `0021_evidence_upstream_storage.sql` resta non applicata al remoto.

## Prossimo gate

La prossima mutation è separata e richiede autorizzazione esplicita:

```text
read-only remote preflight
→ exactly 8 approved onboarding intents missing and 0 conflicts
→ explicit remote source_registry onboarding
→ read-only verifier rerun
→ 9/9 manifest identities resolved exactly-one
```

Solo dopo questo postcondition può aprirsi il gate importer.

L'onboarding remoto non deve includere:

- evidence importer;
- remote `0021` apply;
- `claim_verifications` writes;
- ranking;
- affiliate activation;
- publication;
- deploy.
