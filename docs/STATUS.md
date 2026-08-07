# Stato del progetto

Data di riferimento: **7 agosto 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming. Lo storico dettagliato resta nel versionamento Git e nei documenti risultato.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve Astro |
| Dominio `www` | Da ricontrollare | redirect implementato; checkpoint definitivo ancora aperto |
| Worker | Operativo | custom Worker; deploy production manual-only |
| D1 remoto | Operativo fino a `0020` | `0021` versionata/local-tested, non applicata al remoto |
| Workflow / Container / AI | Operativi | recent-demand, Container e AI Gateway verificati |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione autonoma dell'AI |
| Control Room | Operativa | read-only completo + prime mutation; legacy ancora fallback |
| Frontend pubblico Astro | Live | homepage, hub, trust pages, published-only routing, sitemap/robots |
| M7.0 SEO foundation | Live | ownership e on-page baseline applicate |
| M7.1 Demand Intelligence | Completata | PR #111 + PR #113 |
| First Money UI | Preview mergiata | PR #117; canonical `/migliore-esim` invariato |
| Evidence packs | Verificati live | Italy #106 + Europe #107 |
| Upstream evidence schema | Repository/local | #110 `0021`; remoto ancora `0020` |
| Source reconciliation | Completata | PR #119, fail-closed e bound ai pack reali |
| Target source verification | Completata | PR #121: target D1 = 0/9 resolved, 9 missing, 0 ambiguous |
| Source onboarding local | Verificato | PR #122: 8 insert → 9/9 resolved; repeat → 0 insert |
| Truth Engine | Gate corrente | explicit remote onboarding delle 8 registry identity approvate |
| Search Console | Collegata | dataset iniziale ancora minimo |
| CMP / GTM / GA4 | Live e consent-gated | Basic Consent Mode ricertificato |
| Affiliazioni | Disabilitate nel sito | `AFFILIATE_MODE=disabled`; partner work in parallelo |
| Google Ads / remarketing | Disabilitati | fuori scope |

## Main certificato prima della slice corrente

Ultimo merge stabile verificato:

```text
PR #121 — target evidence source registry read-only verification
merge/main: 4903b2caef0c82e51ac5cd1b458dc3f0e2f513e1
PR head:   c93718d893eb9df1913fd99850f5dd71c094f747
CI #637:   success
CI #638:   success
```

La slice corrente PR #122 prepara e verifica **solo localmente** l'onboarding source registry.

Checkpoint CI locale della slice:

```text
PR #122
head:    57b433269b744649bb14f1ff02f31c4a00dddc5c
CI #639: success
```

Nessun deploy production, nessuna source mutation remota e nessuna remote migration sono stati eseguiti da #119–#122.

## Frontend pubblico — stato commerciale

Il sito è live e indicizzabile, ma **non è ancora money-ready in produzione**.

Stato:

- homepage/hub sono live;
- `/migliore-esim` canonica resta provider-neutral e senza CTA affiliate;
- la UI consumer-first è disponibile come preview isolata `/astro-foundation/articoli/migliore-esim`;
- preview noindex/no-store;
- nessun `/go/*` nella money preview;
- nessun provider winner automatico;
- nessun nuovo claim commerciale provider-specifico materializzato;
- affiliate tracking resta disabilitato.

La preview implementa:

```text
destinazione
→ giorni
→ dati
→ hotspot
→ scenario
→ evidence slots
→ FAQ/obiezioni
→ supporting guides
```

Gli evidence slot restano non materializzati finché non esistono facts bounded, fresh e verificati.

## M7 / First Euro

Demand intelligence già chiusa:

- 1.623 keyword Planner uniche;
- A–Z autocomplete e SERP expansion;
- ownership/cannibalization/internal linking;
- top 20 execution order;
- brief `/migliore-esim` e `/esim-europa`.

Ordine iniziale:

```text
1  /migliore-esim
2  /esim-europa
3  /codice-sconto-holafly
4  /airalo-recensioni
5  /airalo-vs-holafly
6  /esim-usa
7  /esim-egitto
8  /esim-giappone
9  /esim-turchia
10 /esim-albania
```

`/esim-iphone` resta traffic feeder; `/esim-hotspot` problem/setup feeder.

## Evidence supply chain

Contratto canonico:

```text
source_registry
→ evidence_capture_runs
→ immutable evidence snapshots
→ deterministic field observations
→ pending evidence candidates
→ verification / conflict / freshness
→ evidence bundle
→ Page Readiness
→ grounded page
→ separate human publication gate
```

Remote D1 resta a `0020`.

Schema upstream repository/local:

```text
0021_evidence_upstream_storage.sql
```

Tabelle previste:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates
```

Invarianti:

- missing evidence != false;
- `partial` non diventa completezza;
- aggregate country count non prova membership;
- source-native price non viene convertito implicitamente;
- hotspot allowed e share limit restano distinti;
- technology != measured performance;
- ranking non appartiene al layer evidence.

## Source reconciliation — PR #119

Manifest:

```text
2 pack
12 source references
9 reconciliation identities
```

Contratto:

```text
sourceAuditKey
+ entity type/key
+ source kind
+ approved canonical registry URL
→ exactly one active source_registry row
```

Fail closed:

```text
0 match  → source_not_registered
1 match  → resolved
>1 match → source_registry_ambiguous
```

Nessun provider-root fallback, redirect auto-remap, importer auto-registration o environment ID versionato.

## Target source registry — PR #121

Due letture remote read-only indipendenti hanno prodotto lo stesso risultato:

```text
source_registry rows inspected: 7
manifest identities:             9
resolved:                        0
source_not_registered:           9
source_registry_ambiguous:       0
readyForImporter:                false
```

Questo ha corretto una precedente aspettativa repository: anche le due source Ubigi `registered_expected` non esistono realmente nel target.

Le 9 reconciliation identity richiedono **8 registry identity uniche** perché due mapping Ubigi convergono su:

```text
provider
ubigi
official_provider
https://cellulardata.ubigi.com/
```

## Source onboarding local — PR #122

Intent versionati:

```text
research/evidence/source-registry-onboarding-intents.json
```

Cardinalità:

```text
8 unique onboarding intents
→ cover 9 sourceAuditKeys
```

Ogni intent include identity, source kind, label, canonical URL, trust, freshness, active status e notes.

Guardrail:

```text
allowRemoteMutation=false
allowMetadataOverwrite=false
no provider-root fallback
no redirect auto-remap
no hardcoded environment IDs
```

Il preflight blocca una stessa identity D1 con metadata diversi; non esegue update automatici.

CI #639 ha verificato su D1 locale isolato e migrato:

```text
first onboarding:
8 inserts
8 exact rows after
9/9 reconciliation identities resolved
readyForImporter=true (local only)

second onboarding:
0 inserts
8 exact rows before/after
9/9 reconciliation identities resolved
readyForImporter=true (local only)
```

La CLI rifiuta `--remote`.

## Truth Engine — gate tecnico corrente

Il local-first onboarding gate è chiuso. Il target remoto resta invariato.

Prossimo gate, con autorizzazione esplicita separata:

```text
remote read-only preflight
→ 8 approved missing identities / 0 conflicts
→ explicit source_registry onboarding
→ remote read-only verifier rerun
→ require 9/9 resolved exactly-one
```

Solo dopo:

```text
idempotent importer
→ explicit remote 0021 authorization
→ controlled ingest
→ verification provenance bridge
→ bounded facts per First Money UI
```

## Percorso verso production SEO + primo click affiliate

Siamo nella corsia finale, ma il click non è ancora sbloccato:

```text
remote source onboarding
→ 9/9 source verification
→ evidence ingest
→ verified commercial facts
→ /migliore-esim canonical materialization
→ affiliate + measurement gate
→ manual production deploy
→ first real affiliate click
```

## Monetizzazione

Stato:

```text
AFFILIATE_MODE=disabled
affiliate tracking=disabled
```

Prima dell'attivazione affiliate servono:

1. facts commerciali bounded/fresh/verificati nella money page;
2. affiliate account/provider approval;
3. `/go/*` destination/redirect validato;
4. disclosure pubblica;
5. `provider_redirect_intent` measurement scope;
6. privacy/consent recheck;
7. partner secret/config fuori dal repository;
8. explicit `AFFILIATE_MODE` change;
9. deploy production manuale autorizzato;
10. live smoke redirect + disclosure.

## Checkpoint aperti

- explicit remote onboarding delle 8 source identity;
- remote post-verification 9/9;
- importer idempotente;
- explicit remote `0021` gate;
- controlled evidence ingest;
- verification provenance bridge;
- first bounded commercial fact materialization;
- canonical `/migliore-esim` cutover;
- affiliate/measurement gate;
- explicit money-ready production deploy;
- first affiliate click;
- `/esim-europa`;
- consumer-first homepage/hub follow-up;
- `www → apex` definitivo;
- GSC/GA4 feedback quando il dataset diventa sostanziale.

## Freeze

- niente source onboarding remoto senza autorizzazione esplicita;
- niente deploy implicito;
- niente remote migration implicita;
- niente importer prima del remote `9/9`;
- niente source auto-registration;
- niente metadata overwrite automatico;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente provider winner universale;
- niente mass pSEO;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente pubblicazione autonoma dell'AI.
