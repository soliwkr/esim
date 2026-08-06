# Evidence source reconciliation gate

Data: **6 agosto 2026**.

## Scopo

Definire il gate che deve esistere tra le source allowlist dei pack evidence e `source_registry` prima di qualsiasi futuro ingest D1.

Questa fase è documentale. Non registra fonti, non modifica D1 e non importa artifact.

## Problema verificato

Gli evidence pack usano chiavi repository-owned (`sourceAuditKey`) e URL specifici per product page/help/policy.

Esempi Italia:

```text
candidate-airalo-italy-catalog
candidate-airalo-unlimited-fup
candidate-holafly-italy-product
candidate-holafly-unlimited-faq
provider-ubigi-commerce
candidate-ubigi-activation
```

Esempi Europa:

```text
candidate-airalo-europe-store-unlimited-15d
candidate-airalo-unlimited-fup
candidate-holafly-europe-product
candidate-holafly-unlimited-faq
candidate-ubigi-europe-25gb-30d
candidate-ubigi-activation
```

Il Claims Coverage Audit classifica molte di queste source come `candidate_new`; non sono quindi automaticamente equivalenti alle root provider inizialmente seedate in `source_registry`.

Per questo il futuro importer non può applicare:

```text
unknown sourceAuditKey
→ INSERT source_registry automatically
```

Un artifact bounded non deve diventare una nuova fonte canonica soltanto perché è stato catturato.

## Regola canonica proposta

`evidence_snapshots.source_id` resta **NOT NULL**.

Prima di creare uno snapshot in D1 deve esistere una riconciliazione univoca:

```text
pack sourceAuditKey + canonical source URL + provider/source role
→ exactly one approved source_registry.id
```

Se la mappatura è:

```text
0 righe  → fail closed: source_not_registered
>1 righe → fail closed: source_registry_ambiguous
1 riga   → snapshot import può proseguire
```

Il pack non è autorizzato a scegliere la riga più simile o la root provider come fallback.

## Source onboarding separato

Una source mancante richiede una decisione esplicita di onboarding, distinta dall'import del pack.

Il futuro onboarding deve almeno validare:

```text
entity_type + entity_key
source_kind
label
canonical URL
provider/subject scope
trust level
freshness policy
status=active
```

La scelta del `source_kind` usa l'enum D1 già accettato:

```text
official_provider
official_help
official_terms
regulator
manufacturer
first_party_test
editorial_reference
```

I ruoli evidence più specifici (`product_page`, `regional_store_page`, `official_policy`, ecc.) restano metadata semantici dell'observation/source mapping e non richiedono automaticamente un nuovo enum D1.

## Mapping role → source_kind iniziale

| Evidence role | `source_kind` candidato | Nota |
|---|---|---|
| `product_catalog` | `official_provider` | catalog/product commerce surface ufficiale |
| `product_page` | `official_provider` | exact product/package surface ufficiale |
| `regional_store_page` | `official_provider` | store regionale ufficiale |
| `regional_product_page` | `official_provider` | product surface regionale ufficiale |
| `official_help` | `official_help` | help/FAQ provider |
| `official_policy` | `official_terms` oppure `official_help` | scegliere in onboarding in base alla natura contrattuale/procedurale, non dal nome del ruolo |

`official_policy` non viene forzato meccanicamente a un solo source kind: la classificazione deve riflettere il documento reale.

## URL identity

La chiave di riconciliazione non usa soltanto string equality sul requested URL.

Conservare separatamente:

```text
registry canonical URL
snapshot requested URL
snapshot final URL
redirect chain
```

Il caso Airalo Europa ha dimostrato che un deep link può redirigere alla store surface canonica. Una redirect osservata non autorizza però a rimappare automaticamente una source a un'altra riga del registry.

La source map approvata deve dichiarare quale canonical surface identifica quella fonte.

## Pack source map proposta

Prima dell'import deve esistere un input revisionabile del tipo:

```json
{
  "sourceAuditKey": "candidate-airalo-unlimited-fup",
  "sourceRegistryId": 123,
  "canonicalUrl": "https://www.airalo.com/m/resources/unlimited-data-plans-fair-use-policy",
  "mappingVersion": 1
}
```

L'ID è ambiente-specifico e **non va hardcodato nei pack o nei documenti repository**.

Il repository può versionare chiavi/URL/role attesi; la risoluzione dell'ID avviene nell'ambiente D1 interessato e deve fallire chiusa.

## Idempotenza

L'onboarding di una source e l'import di uno snapshot sono due idempotency domain diversi.

```text
source onboarding key:
  entity_type + entity_key + canonical URL

snapshot key:
  source identity + final URL + raw hash + relevant capture context
```

Un nuovo snapshot non crea una nuova source quando cambia soltanto il contenuto commerciale.

## Non-goal

Questa decisione non autorizza:

- inserimento delle source candidates in D1;
- modifica dei seed provider;
- importer pack;
- update automatico di `source_registry.content_hash`;
- maintenance queue;
- refresh scheduler;
- claim verification;
- remote migration.

## Sequenza futura corretta

```text
1. schema upstream additive (local-only)
2. source reconciliation/onboarding scope separato
3. importer idempotente pack → evidence tables
4. verification provenance bridge
```

La sequenza 2 e 3 può essere progettata insieme ma non deve trasformarsi in auto-registration di URL arbitrari.
