# Evidence source registry target verification — result

Data: **7 agosto 2026**.

## Scope

Verificare in sola lettura il `source_registry` del D1 target contro il manifest di reconciliation mergiato con PR #119.

Questa verifica non esegue:

- `INSERT`, `UPDATE` o `DELETE`;
- migration apply;
- evidence importer;
- `claim_verifications` write;
- ranking o publication;
- deploy.

## Run certificata

```text
workflow: Evidence Source Registry Verification
run:      31198150723 (#3)
head:     00519caddd26f5bd23cb8c0aa2421b06434db442
verified: 2026-08-07T16:34:02.634Z
result:   success
```

Il workflow:

1. esegue lo smoke locale del verifier;
2. risolve il D1 target tramite il resolver di binding già usato dal deploy, senza versionare il UUID;
3. esegue una sola query `SELECT` sul `source_registry` remoto;
4. applica il resolver fail-closed del manifest;
5. produce un artifact sanitizzato senza `sourceRegistryId` numerici.

## Stato osservato del target

```text
source_registry rows inspected: 7
manifest source identities:      9
resolved:                        0
source_not_registered:           9
source_registry_ambiguous:       0
readyForImporter:                false
```

Tutte le nove identity del manifest risultano quindi bloccate come `source_not_registered` nell'ambiente target verificato.

Questo include le due entry che il manifest classificava `registered_expected` verso la commerce identity Ubigi: l'aspettativa repository non corrisponde alla presenza reale della riga nel D1 target.

## Cardinalità onboarding

Le nove audit identity non richiedono nove righe D1 distinte.

Due entry:

```text
provider-ubigi-commerce
candidate-ubigi-europe-25gb-30d
```

convergono intenzionalmente sulla stessa registry identity:

```text
entity_type: provider
entity_key:  ubigi
source_kind: official_provider
url:         https://cellulardata.ubigi.com/
```

Dopo deduplica sulla registry identity approvata, il prossimo gate riguarda quindi:

```text
8 unique source_registry onboarding intents
→ 9 manifest identities resolved exactly-one
```

Le otto identity D1 desiderate sono:

1. Airalo Italy catalog — `official_provider` — `https://www.airalo.com/it/italy-esim/`;
2. Airalo unlimited FUP — `official_terms` — `https://www.airalo.com/m/resources/unlimited-data-plans-fair-use-policy`;
3. Holafly Italy product — `official_provider` — `https://esim.holafly.com/it/esim-italia/`;
4. Holafly unlimited FAQ — `official_help` — `https://esim.holafly.com/it/faq/informazioni-sulle-esim/esim-con-traffico-dati-illimitato/`;
5. Ubigi commerce surface — `official_provider` — `https://cellulardata.ubigi.com/`;
6. Ubigi activation help — `official_help` — `https://cellulardata.ubigi.com/help-center/faq/esim-data-plan/when-does-my-ubigi-data-plan-activate/`;
7. Airalo Europe store — `official_provider` — `https://www.airalo.com/europe-esim`;
8. Holafly Europe product — `official_provider` — `https://esim.holafly.com/it/esim-europa/`.

## Guardrail confermati

- nessun provider-root fallback;
- nessun redirect auto-remap;
- nessun ID D1 environment-specific nel repository o nell'artifact;
- zero match resta `source_not_registered`;
- zero ambiguity osservata;
- la verifica non modifica il registry;
- importer resta bloccato.

## Nota sul primo tentativo

Il primo probe ha fallito prima dell'esecuzione SQL perché Wrangler stava leggendo il placeholder `REPLACE_WITH_D1_DATABASE_ID` dal config repository.

La correzione riusa `scripts/prepare-production-d1-binding.mjs` per risolvere il UUID nel solo config compilato temporaneo. Il run certificato sopra è quello successivo e riuscito.

## Prossimo gate

Source onboarding separato e auditabile.

Obiettivo:

```text
8 approved registry identities
→ explicit idempotent onboarding
→ re-run read-only verifier
→ 9/9 manifest identities resolved
→ only then importer gate may open
```

La mutation remota non è autorizzata da questo documento e richiede scope esplicito separato.

`0021_evidence_upstream_storage.sql` resta un gate ulteriore e non viene applicata come effetto collaterale dell'onboarding.
