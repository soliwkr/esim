# Stato del progetto

Data di riferimento: **8 agosto 2026**.

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
| Source onboarding remoto | Completato | run `31205724615`: 8 insert, target 15 rows, 9/9 resolved |
| Evidence importer | Local/fixture verificato | PR #124; CI tecnica #651 verde; 2 run / 12 snapshot / 18 observation / 8 candidate |
| Truth Engine | Prossimo gate: remote `0021` | richiede autorizzazione esplicita separata |
| Search Console | Collegata | dataset iniziale ancora minimo |
| CMP / GTM / GA4 | Live e consent-gated | Basic Consent Mode ricertificato |
| Affiliazioni | Disabilitate nel sito | `AFFILIATE_MODE=disabled`; partner work in parallelo |
| Google Ads / remarketing | Disabilitati | fuori scope |

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

Gli evidence slot restano non materializzati finché non esistono facts bounded, fresh e verificati.

## M7 / First Euro

Demand intelligence chiusa:

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

## Source identity / onboarding — chiuso

PR #119 ha definito il reconciliation fail-closed:

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

PR #121 aveva verificato il target iniziale a `0/9`; PR #122 aveva provato localmente 8 intent unici → 9/9 identity.

La mutation production autorizzata è poi riuscita:

```text
run:                      31205724615
registry rows before:     7
approved inserts:         8
registry rows after:      15
manifest resolved:        9/9
missing:                  0
ambiguous:                0
ready for importer gate:  yes
```

Verifica read-only indipendente:

```text
verified_at: 2026-08-07T18:11:04.432Z
registry rows: 15
resolved:      9/9
missing:       0
ambiguous:     0
```

Documento risultato:

```text
docs/research/EVIDENCE-SOURCE-REGISTRY-REMOTE-ONBOARDING-RESULT-2026-08-07.md
```

Nessuna migration `0021`, evidence ingest, claim write o deploy è stata eseguita insieme all'onboarding.

## Evidence importer local/fixture — PR #124

Il gate importer è stato implementato e verificato localmente contro D1 isolati con l'intera history delle migration.

Contratto:

```text
approved pack.json + immutable source artifacts
→ hash/content identity verification
→ environment source resolution
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ pending evidence_claim_candidates
```

Risultato primo import fixture:

```text
Italy:  1 run / 6 snapshot / 9 observation / 4 candidate
Europe: 1 run / 6 snapshot / 9 observation / 4 candidate
Totale: 2 run / 12 snapshot / 18 observation / 8 candidate
```

Rerun esatto di entrambi:

```text
runs: 0
snapshots: 0
observations: 0
candidates: 0
```

Guardrail verificati:

- source IDs risolti dall'ambiente, non hardcodati;
- artifact hash fail-closed;
- candidate content-address fail-closed anche quando la semantic fingerprint resta invariata;
- existing-key drift/partial state blocca invece di sovrascrivere;
- `observed|partial` soltanto possono produrre pending candidate;
- `unknown|not_applicable` restano observation non fattuali;
- `EUR` e `USD` restano source-native, nessun FX;
- multi-source provenance Ubigi conserva 2 ref;
- `source_registry`, `claim_verifications` e `plans` restano invariati;
- CLI `--remote` viene rifiutata.

Airalo Italy è stato riallineato senza mutation registry: la canonical registry identity resta il catalogo Italia, mentre l'exact-package URL live è ora requested provenance esplicitamente approvata/versionata, non fallback automatico.

Head tecnico certificato:

```text
PR #124
head 6b9cfd5a7176e378238d3c4f41fee6560834b366
CI #651: success
```

Documento risultato:

```text
docs/research/EVIDENCE-PACK-IMPORTER-LOCAL-RESULT-2026-08-08.md
```

La CI finale sull'head di closeout resta il gate prima del merge della PR.

## Prossimo Truth Engine gate — remote `0021`

Il prossimo passo è **separato** e non è autorizzato dal checkpoint importer:

```text
explicit remote 0021 authorization
→ migration apply
→ remote migration verification
```

Soltanto dopo una migration remota riuscita e verificata:

```text
separately authorized controlled evidence ingest
→ post-ingest audit
→ verification provenance bridge
→ bounded verified commercial facts
```

L'importer non scrive automaticamente `claim_verifications` e non pubblica pagine.

## Percorso verso production SEO + primo click affiliate

Gate chiusi:

```text
source reconciliation ✅
production source onboarding 9/9 ✅
local/fixture evidence importer ✅
```

Percorso restante:

```text
explicit remote 0021
→ controlled evidence ingest
→ verification provenance
→ bounded verified commercial facts
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

- niente remote `0021` senza nuova autorizzazione esplicita;
- niente controlled ingest remoto senza scope/autorizzazione separati;
- niente deploy implicito;
- niente source auto-registration;
- niente metadata overwrite automatico;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente provider winner universale;
- niente mass pSEO;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente pubblicazione autonoma dell'AI.
