# Evidence Pack Importer — local result

Data: **8 agosto 2026**

## Scope

Questo checkpoint chiude esclusivamente il gate **importer evidence idempotente local/fixture**.

Non sono state eseguite:

- migration D1 remote `0021`;
- evidence ingest sul D1 production;
- scritture in `claim_verifications`;
- ranking/provider winner;
- publication mutation;
- affiliate activation;
- deploy production.

## Contratto importato

```text
approved pack.json + immutable source artifacts
→ verify pack/source hashes and content identities
→ resolve source_registry IDs from the target environment
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ pending evidence_claim_candidates
```

L'importer resta local-only in questo checkpoint e rifiuta `--remote`.

## Implementazione verificata

L'importer:

- risolve le source tramite il reconciliation contract esistente; non hardcoda ID D1 environment-specific;
- non auto-registra fonti;
- non usa provider-root fallback o redirect auto-remap;
- verifica hash degli artifact e identità content-addressed prima delle write evidence;
- ricomputa e verifica la candidate identity;
- usa identità deterministiche per run, snapshot, observation e candidate;
- blocca existing-key drift e stati parzialmente preesistenti invece di sovrascriverli;
- mappa `scenario_offer` del pack a `subject_type=plan` richiesto da `0021`, conservando `packSubjectType=scenario_offer` nello scope;
- preserva `observed`, `partial`, `unknown` e `not_applicable` come stati distinti;
- genera pending candidate soltanto da `observed` e `partial` bounded;
- preserva la valuta source-native senza FX implicito;
- conserva tutte le evidence ref multi-source in `evidence_locator_json`, con una snapshot anchor deterministica per la FK di `0021`;
- non modifica `source_registry`, `claim_verifications` o `plans`.

## Airalo Italy provenance alignment

Il pack Italia live approvato usa l'URL exact-package Airalo, mentre il reconciliation manifest precedente era rimasto legato soltanto alla canonical registry identity del catalogo Italia.

Questo checkpoint riallinea la provenance senza creare o modificare righe production:

```text
canonical registry URL:
https://www.airalo.com/it/italy-esim/

approved requested provenance URL:
https://www.airalo.com/it/italy-esim/mamma-mia-in-10days-unlimited
```

La stessa `sourceAuditKey`/role canonica resta il punto di reconciliation. L'exact-package URL è una requested provenance esplicitamente versionata, non un fallback o un remap implicito.

## D1 local smoke — risultato verificato

La CI standard esegue `smoke:evidence-pack-importer` dentro `smoke:runtime` su D1 isolati con l'intera history delle migration applicata localmente.

Prima dell'import, il source onboarding locale porta il resolver a:

```text
resolved manifest identities: 9/9
readyForImporter: true
```

Primo import fixture:

```text
Italy:
  runs:         1
  snapshots:    6
  observations: 9
  candidates:   4

Europe:
  runs:         1
  snapshots:    6
  observations: 9
  candidates:   4

Totale:
  runs:         2
  snapshots:    12
  observations: 18
  candidates:   8
```

Rerun esatto di entrambi i pack:

```text
action: existing_exact
inserted:
  runs:         0
  snapshots:    0
  observations: 0
  candidates:   0
```

La suite verifica inoltre:

- presenza reale di `partial`, `unknown` e `not_applicable` nelle observation;
- nessuna candidate collegata a observation fuori da `observed|partial`;
- valute osservate `EUR` e `USD` preservate come source-native;
- tutte le 18 observation materializzate con `subject_type=plan` e `packSubjectType=scenario_offer` nello scope;
- evidence multi-source Ubigi activation con **2 ref** e snapshot key deterministiche;
- conteggio `source_registry` invariato dall'import;
- conteggio `claim_verifications` invariato dall'import;
- conteggio `plans` invariato dall'import.

## Fail-closed verification

La suite prova esplicitamente:

1. **raw artifact tamper** → `evidence_import_artifact_hash_mismatch:*`; nessun nuovo capture run;
2. **candidate raw-value tamper** che non cambia la semantic projection → semantic fingerprint invariata ma `evidence_import_candidate_identity_mismatch:*`;
3. **missing source registry resolution** → `evidence_import_source_resolution_failed:*` e zero capture run;
4. CLI `--remote` → `remote_evidence_import_forbidden`.

Il controllo candidate content-addressed è quindi indipendente dalla semantic fingerprint del pack e protegge campi che non appartengono alla sua projection.

## CI

Head tecnico certificato prima del closeout documentale:

```text
PR:   #124
head: 6b9cfd5a7176e378238d3c4f41fee6560834b366
CI:   #651
state: success
```

CI #651 ha completato con successo typecheck/build/deploy-safety, migration validation, research quality/golden eval, container smoke, runtime/workerd con i nuovi evidence importer smoke e tutte le suite Control Room.

Il merge resta subordinato a una nuova CI verde sull'head finale che include questo documento e gli aggiornamenti canonici.

## Stato production invariato da questo checkpoint

```text
source_registry reconciliation: 9/9 già ready
D1 remote migration level:      0020
0021 remote:                    NOT applied
evidence upstream ingest:       NOT executed
claim_verifications write:      NOT executed
canonical /migliore-esim:       unchanged
AFFILIATE_MODE:                 disabled
production deploy:              NOT executed
```

## Prossimo gate

Il gate importer local/fixture è chiuso tecnicamente.

Il prossimo gate Truth Engine è separato:

```text
explicit remote 0021 authorization
→ remote migration apply + verification
→ separately authorized controlled evidence ingest
→ post-ingest audit
→ verification provenance bridge
→ bounded verified commercial facts
```

La precedente autorizzazione al source onboarding e questo checkpoint locale **non autorizzano** né la migration remota `0021` né l'evidence ingest production.