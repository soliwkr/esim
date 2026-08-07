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
| Target source verification | Completata | PR #121: target iniziale = 0/9 resolved, 9 missing, 0 ambiguous |
| Source onboarding local | Verificato | PR #122: 8 insert → 9/9; repeat → 0 insert |
| Source onboarding remoto | Completato | run `31205724615`: 8 insert, target 15 rows, 9/9 resolved |
| Truth Engine | Gate corrente | importer idempotente local/fixture; nessun ingest remoto ancora |
| Search Console | Collegata | dataset iniziale ancora minimo |
| CMP / GTM / GA4 | Live e consent-gated | Basic Consent Mode ricertificato |
| Affiliazioni | Disabilitate nel sito | `AFFILIATE_MODE=disabled`; partner work in parallelo |
| Google Ads / remarketing | Disabilitati | fuori scope |

## Main stabile prima del closeout corrente

Ultimo merge certificato:

```text
PR #122 — local evidence source registry onboarding
merge/main: 51bf26e7585a71ed914d868bd3a2afb18bbfda6a
PR head:   0fda349bc480da0aa09e6cb371a03b5978a8cbb2
CI #643:   success
CI #644:   success
```

La mutation source registry production è stata eseguita successivamente su branch operativa separata e verrà chiusa con questo checkpoint documentale.

Non è stato eseguito alcun deploy production e non è stata applicata `0021` al D1 remoto.

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

Due letture remote read-only indipendenti avevano prodotto:

```text
source_registry rows inspected: 7
manifest identities:             9
resolved:                        0
source_not_registered:           9
source_registry_ambiguous:       0
readyForImporter:                false
```

Le 9 reconciliation identity richiedevano **8 registry identity uniche** perché due mapping Ubigi convergono sulla stessa source commerce approvata.

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

CI #639/#643 ha verificato su D1 locale isolato:

```text
first onboarding:  8 inserts → 9/9 resolved
second onboarding: 0 inserts → 9/9 resolved
```

## Source onboarding remoto — completato

Documento risultato:

```text
docs/research/EVIDENCE-SOURCE-REGISTRY-REMOTE-ONBOARDING-RESULT-2026-08-07.md
```

Primo tentativo:

```text
run:    31205333567
result: failure
cause:  Cloudflare D1 code 7500 su BEGIN TRANSACTION
```

Un recheck read-only successivo (`31205451535`) ha provato che il target era rimasto invariato:

```text
7 rows
0/9 resolved
9 missing
0 ambiguous
```

Il retry è stato corretto a una sola `INSERT` multi-row, senza `BEGIN`, `SAVEPOINT` o `OR IGNORE`, e ricertificato read-only prima della mutation (`31205653115`).

Mutation riuscita:

```text
run:                      31205724615
head:                     a862b9d8e3fc152e65173cbe8cc19287dd016b59
registry rows before:     7
approved inserts:         8
registry rows after:      15
manifest resolved:        9/9
missing:                  0
ambiguous:                0
ready for importer gate:  yes
```

Verifica read-only indipendente immediata:

```text
verified_at: 2026-08-07T18:11:04.432Z
registry rows: 15
resolved:      9/9
missing:       0
ambiguous:     0
```

Artifact sanitizzato:

```text
id:     9004629906
digest: sha256:4f14933993b678221b54619ade7fc277ebf71d16a41855dd86c5b4eef60f1996
```

Nessuna migration remota, importer, claim write o deploy è stata eseguita insieme all'onboarding.

## Truth Engine — gate tecnico corrente

Il source gate production è **chiuso**:

```text
8 approved registry identities onboarded
→ 9/9 reconciliation identities exactly-one
```

Gate corrente:

```text
idempotent importer local/fixture
```

L'importer deve:

- consumare pack/artifact già approvati;
- risolvere gli environment source IDs, non hardcodarli;
- creare solo upstream evidence rows previste da `0021` in un D1 locale/fixture;
- essere content-addressed/idempotente;
- preservare `unknown`, `partial`, conflict e source-native currency;
- non scrivere `claim_verifications`;
- non fare ranking/publication;
- non applicare `0021` al remoto come effetto collaterale.

Solo dopo importer local/fixture verde:

```text
explicit remote 0021 authorization
→ controlled evidence ingest
→ verification provenance bridge
→ bounded facts per First Money UI
```

## Percorso verso production SEO + primo click affiliate

Primi due gate Truth Engine chiusi:

```text
source reconciliation ✅
remote source onboarding 9/9 ✅
```

Percorso restante:

```text
importer local/fixture
→ explicit remote 0021
→ controlled evidence ingest
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

- importer idempotente local/fixture;
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

- niente ulteriori source mutation remote senza scope/autorizzazione espliciti;
- niente deploy implicito;
- niente remote `0021` implicita;
- niente evidence ingest remoto prima di importer local/fixture + migration gate;
- niente source auto-registration;
- niente metadata overwrite automatico;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente provider winner universale;
- niente mass pSEO;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente pubblicazione autonoma dell'AI.
