# Stato del progetto

Data di riferimento: **7 agosto 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming. Lo storico dettagliato resta nel versionamento Git e nei documenti risultato.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve Astro |
| Dominio `www` | Da ricontrollare | redirect implementato; checkpoint definitivo ancora aperto |
| Worker | Operativo | un solo custom Worker; deploy production manual-only |
| D1 remoto | Operativo fino a `0020` | `0021` è versionata e local-tested ma **non applicata al remoto** |
| Workflow / Container / AI | Operativi | recent-demand, Container e AI Gateway già verificati |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione autonoma dell'AI |
| Control Room | Operativa | read-only completo + prime mutation; legacy ancora fallback |
| Frontend pubblico Astro | Live | homepage, hub, trust pages, articoli published-only, sitemap/robots |
| M7.0 SEO foundation | Live | ownership e on-page baseline applicate |
| M7.1 First Euro Demand Intelligence | Completata | PR #111 + A–Z/PAA PR #113 mergiate |
| First Money UI | Preview mergiata | PR #117; canonical `/migliore-esim` ancora invariato |
| Evidence packs | Verificati live | Italy #106 + Europe #107, due capture ciascuno |
| Upstream evidence D1 | Schema repository/local | #108 design + #110 `0021`; remoto ancora `0020` |
| Truth Engine | Prossimo gate | source reconciliation / onboarding fail-closed |
| Search Console | Collegata | 1 impression osservata il 24 luglio; dataset ancora troppo piccolo |
| CMP / GTM / GA4 | Live e consent-gated | Basic Consent Mode ricertificato |
| Affiliazioni | Disabilitate nel sito | application Airalo/Holafly/Ubigi in parallelo; `AFFILIATE_MODE=disabled` |
| Google Ads / remarketing | Disabilitati | fuori scope |

## Main corrente

Ultimo merge:

```text
PR #117 — M7 first-money migliore eSIM preview
merge/main: ddd324714c2937f2f0d720f1c99978dbc5d61577
PR head:   79d4b7f3adac96d27ed6f055d4fd61441670db6a
```

Gate pre-merge:

```text
CI #626: success
M7 Migliore eSIM Preview Capture #5: success
```

CI post-merge:

```text
CI #627: success
merge SHA: ddd324714c2937f2f0d720f1c99978dbc5d61577
```

Non è stato eseguito alcun deploy production.

## Frontend pubblico — stato commerciale

Il sito è tecnicamente live e indicizzabile, ma **non è ancora money-ready in produzione**.

Stato reale:

- homepage e hub hanno struttura UX/SEO valida;
- parte del copy canonico racconta ancora workflow/gate interni più del problema del viaggiatore;
- `/migliore-esim` canonica è ancora la foundation provider-neutral e senza CTA affiliate;
- la nuova UI consumer-first è stata mergiata come **preview isolata** sotto `/astro-foundation/articoli/migliore-esim`;
- la preview è noindex/no-store e non contiene `/go/*`, ranking provider o claim commerciali nuovi;
- affiliazioni e provider redirect measurement commerciale restano disabilitati;
- le prime money page specialistiche non sono ancora pubblicate.

La preview #117 implementa:

```text
destinazione
→ giorni
→ dati
→ hotspot
→ scenario
→ sei evidence slot
→ FAQ/obiezioni
→ supporting guides
```

I sei slot restano intenzionalmente:

```text
Da verificare per l'offerta
```

finché la Truth Engine non fornisce fatti commerciali bounded, fresh e verificati.

## M7.1 — First Euro Demand Intelligence

PR #111 è mergiata e ha versionato:

- workbook Keyword Planner originale con **1.623 keyword uniche** realmente analizzato;
- long-tail priority universe;
- SERP competitor snapshot;
- question expansion da SERP, FAQ provider e community;
- cannibalization v2;
- internal linking v2;
- search-to-social angle bank;
- brief `/migliore-esim`;
- brief `/esim-europa`;
- execution order 1→20.

Decisione first-money:

```text
1  /migliore-esim        ← first existing-URL money slice
2  /esim-europa          ← first new evidence-native money page
3  /codice-sconto-holafly
4  /airalo-recensioni
5  /airalo-vs-holafly
6  /esim-usa
7  /esim-egitto
8  /esim-giappone
9  /esim-turchia
10 /esim-albania
```

L'ordine completo 1→20 vive in:

```text
research/seo/m7-first-euro-execution-order.csv
```

`/esim-iphone` resta un forte traffic feeder, non una money page primaria.

## Autocomplete A–Z + PAA / related — PR #113 chiusa

PR #113 è mergiata. Il collector riproducibile:

```text
scripts/seo-demand-expand.py
```

ha eseguito per 17 seed:

```text
seed
seed + a
...
seed + z
```

con `gl=it`, `hl=it`, `location=Italy`.

Capture reale:

```text
workflow run: 31121790996
request: 476
autocomplete rows: 3659
expanded unique queries: 2829
organic rows: 153
peopleAlsoAsk rows: 0
relatedSearches rows: 0
errors: 0
```

Un diagnostic separato ha provato che `relatedSearches` viene estratto quando la risposta lo espone:

```text
control-us q=google: relatedSearches=8, PAA=0
Italian P0: relatedSearches=0, PAA=0
```

Quindi PAA/related IT restano **zero-state osservato**. Nessuna domanda sintetica viene rinominata PAA.

Segnali utili assorbiti nei brief:

- `esim hotspot` → forte problem/setup feeder;
- USA → voice/calls/local-number come evidence requirement;
- Europe → unlimited/duration/data/voice dimensions;
- Airalo/Holafly → intent separation confermata;
- iPhone → model/compatibility feeder.

## First Money preview — PR #117

Preview:

```text
/astro-foundation/articoli/migliore-esim
```

Canonical:

```text
/migliore-esim
```

resta invariata.

Verifiche finali:

- CI #626 completamente verde;
- visual capture #5 verde;
- desktop `1365×900` review completata;
- mobile `390×844` review completata;
- CI post-merge #627 verde sul merge SHA;
- nessun overflow orizzontale;
- singolo H1;
- internal links namespaced;
- published-only preservato;
- preview noindex/no-store;
- nessun `/go/*`;
- nessun affiliate activation;
- nessun provider winner o factual claim nuovo.

## Evidence supply chain

Contratto:

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

D1 remoto resta a `0020`.

Schema `0021` è versionato e local-tested e comprende:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates
```

Regole invarianti:

- missing evidence != false;
- `partial` non diventa completezza;
- aggregate country count non prova membership;
- source-native price non viene convertito implicitamente;
- hotspot allowed e share limit restano separati;
- technology != measured performance;
- ranking non viene calcolato dal layer evidence.

## Truth Engine — gate tecnico corrente

```text
source reconciliation / onboarding
→ idempotent importer
→ explicit remote 0021 apply
→ controlled ingest
→ verification provenance bridge
```

Il **prossimo branch tecnico** deve fermarsi a source reconciliation/onboarding.

Target:

```text
sourceAuditKey + canonical URL + provider/source role
→ exactly one approved source_registry row
```

Fail closed:

```text
0 match  → source_not_registered
>1 match → source_registry_ambiguous
```

Regole:

- nessun auto-registration URL;
- nessun provider-root fallback;
- redirect target non sostituisce silenziosamente l'identità della fonte;
- importer fuori dalla stessa branch;
- nessuna remote `0021` apply implicita;
- nessun `claim_verifications` write;
- nessun deploy.

## Monetizzazione

Il sito resta:

```text
AFFILIATE_MODE=disabled
affiliate tracking=disabled
```

Le application partner Airalo/Holafly/Ubigi procedono in parallelo.

Prima dell'attivazione affiliate servono:

1. la First Money UI consumer-ready;
2. facts commerciali bounded e fresh materializzati nei relativi slot;
3. affiliate account approvato;
4. `/go/*` destination/redirect validato;
5. disclosure pubblica;
6. `provider_redirect_intent` measurement scope;
7. privacy/consent recheck;
8. partner secret/config fuori dal repository;
9. `AFFILIATE_MODE` change esplicito;
10. deploy production manuale autorizzato + live smoke.

## Search-to-Social

Direzione M7.2:

```text
search demand
→ money page
→ verified fact
→ creative angle
→ short / carousel / video
→ human review
→ publish manuale
→ click/comment/branded search
→ new demand candidates
```

Tool AI/video sono strumenti di produzione, non fonti di verità.

## Checkpoint aperti

- source reconciliation / onboarding;
- affiliate approval Airalo/Holafly/Ubigi;
- first bounded evidence materialization;
- importer idempotente in branch separata;
- explicit remote `0021` gate;
- verification provenance bridge;
- canonical cutover `/migliore-esim` separato e umano;
- affiliate/measurement gate;
- first explicit production deploy money-ready;
- `/esim-europa` come prima nuova money page;
- consumer-first rewrite homepage/hub dopo la prima money slice;
- ricontrollo definitivo `www → apex`;
- GSC/GA4 feedback quando il dataset diventa sostanziale.

## Freeze

- niente deploy implicito;
- niente remote migration implicita;
- niente importer prima di source reconciliation;
- niente source auto-registration;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente provider winner universale;
- niente mass pSEO;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente pubblicazione autonoma dell'AI.
