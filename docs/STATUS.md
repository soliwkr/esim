# Stato del progetto

Data di riferimento: **6 agosto 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming. Lo storico dettagliato resta nel versionamento Git e nei documenti risultato.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve Astro |
| Dominio `www` | Da ricontrollare | redirect implementato; checkpoint definitivo ancora aperto |
| Worker | Operativo | un solo custom Worker; deploy production manual-only |
| D1 remoto | Operativo fino a `0020` | `0021` è versionata ma **non applicata al remoto** |
| Workflow / Container / AI | Operativi | recent-demand, Container e AI Gateway già verificati |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione autonoma dell'AI |
| Control Room | Operativa | read-only completo + prime mutation; legacy ancora fallback |
| Frontend pubblico Astro | Live | homepage, hub, trust pages, articoli published-only, sitemap/robots |
| M7.0 SEO foundation | Live | ownership e on-page baseline applicate |
| M7.1 First Euro | Mappa principale mergiata | PR #111 merged; A–Z/PAA enrichment in draft PR #113 |
| Evidence packs | Verificati live | Italy #106 + Europe #107, due capture ciascuno |
| Upstream evidence D1 | Schema locale versionato | #108 design + #110 `0021` schema local-only |
| Search Console | Collegata | 1 impression osservata il 24 luglio; dataset ancora troppo piccolo |
| CMP / GTM / GA4 | Live e consent-gated | Basic Consent Mode ricertificato |
| Affiliazioni | Disabilitate nel sito | application Airalo/Holafly/Ubigi in parallelo; `AFFILIATE_MODE=disabled` |
| Google Ads / remarketing | Disabilitati | fuori scope |

## Main corrente

Ultimo merge:

```text
PR #111 — M7.1 First Euro Demand Intelligence
merge/main: cf6c440981fecfbae5bd77b6ee675015218d0074
```

La prima CI post-merge #610 non ha eseguito il codice perché GitHub Actions ha fallito durante `Set up job` con `Service Unavailable`; il rerun successivo è stato cancellato dal runner. Un nuovo rerun infrastrutturale è stato richiesto durante la PR #113. Questo non viene trattato come regressione applicativa.

## Frontend pubblico — stato commerciale

Il sito è tecnicamente live e indicizzabile, ma **non è ancora money-ready**.

Stato reale:

- homepage e hub hanno struttura UX/SEO valida;
- parte del copy racconta ancora workflow/gate interni più del problema del viaggiatore;
- `/migliore-esim` è live ma provider-neutral e senza CTA affiliate;
- affiliazioni e provider redirect measurement commerciale restano disabilitati;
- le prime money page specialistiche non sono ancora pubblicate.

Trasformazione richiesta:

```text
foundation/dev-facing copy
→ consumer-first decision surfaces
→ verified commercial facts
→ affiliate CTA con disclosure e measurement bounded
```

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

## PR #113 — Autocomplete A–Z + PAA / related enrichment

Branch:

```text
research/m7-autocomplete-paa-expansion
```

Collector:

```text
scripts/seo-demand-expand.py
```

Capture reale:

```text
workflow run: 31121790996
seed: 17
request: 476
autocomplete rows: 3659
expanded unique queries: 2829
organic rows: 153
peopleAlsoAsk rows: 0
relatedSearches rows: 0
errors: 0
```

Il collector ha eseguito per ogni seed:

```text
seed
seed + a
...
seed + z
```

con `gl=it`, `hl=it`, `location=Italy`.

Artifact:

```text
normalized id: 8974174736
normalized sha256: 67387293e0b29d1cde0499d9daf5d3ddd16b9c8adb62ff256c7421067fa94e24
raw id: 8974174775
raw sha256: de78b47f43415d0b3fd04e368e2957f8d1c267e516c1cdbbbb81ab6f9fcec031
```

`SERPER_API_KEY` è rimasta esclusivamente GitHub Actions Secret e mascherata nei log.

### PAA / related zero-state

Un diagnostic separato ha verificato che il parser `relatedSearches` funziona live:

```text
control-us q=google:
  relatedSearches=8
  peopleAlsoAsk=0

migliore esim IT:
  relatedSearches=0
  peopleAlsoAsk=0

esim europa IT:
  relatedSearches=0
  peopleAlsoAsk=0

come funziona esim IT:
  relatedSearches=0
  peopleAlsoAsk=0
```

Quindi le PAA non vengono inventate. Nella capture corrente restano **zero-state osservato**.

### Nuovi segnali utili

- `esim hotspot`: 227 suggestion uniche, quasi interamente setup/tethering/problem intent → candidate traffic/problem feeder, non money page primaria;
- `esim usa`: forte domanda su voice/calls/local number oltre ai dati → nuovo evidence requirement per la futura USA page;
- `esim europa`: unlimited, durata, dati, prezzo e voice/number emergono come dimensioni esplicite;
- Airalo/Holafly: attivazione, troubleshooting, hotspot, compatibilità, review e coupon confermano la necessità di intent separation;
- `esim iphone`: 260 suggestion uniche, quasi interamente model/compatibility/setup → manufacturer-first feeder.

Documento risultato:

```text
docs/research/M7-AUTOCOMPLETE-PAA-RESULT-2026-08-06.md
```

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

Schema `0021` è soltanto versionato/local-tested e comprende:

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

## Truth Engine — prossimo gate tecnico

```text
source reconciliation / onboarding
→ idempotent importer
→ explicit remote 0021 apply
→ controlled ingest
→ verification provenance bridge
```

Source reconciliation deve essere fail-closed:

```text
sourceAuditKey + canonical URL + provider/source role
→ exactly one approved source_registry row

0 match  → source_not_registered
>1 match → source_registry_ambiguous
```

Nessun auto-registration URL.

## Monetizzazione

Il sito resta:

```text
AFFILIATE_MODE=disabled
affiliate tracking=disabled
```

Le application partner Airalo/Holafly/Ubigi procedono in parallelo.

Prima dell'attivazione affiliate servono:

1. almeno una money page consumer-ready;
2. facts commerciali bounded e fresh;
3. affiliate account approvato;
4. `/go/*` destination/redirect validato;
5. disclosure pubblica;
6. `provider_redirect_intent` measurement scope;
7. privacy/consent recheck;
8. partner secret/config fuori dal repository;
9. deploy production manuale autorizzato;
10. live smoke redirect + disclosure.

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

- final CI + closeout #113;
- source reconciliation / onboarding;
- affiliate approval Airalo/Holafly/Ubigi;
- preview-first `/migliore-esim` consumer rewrite;
- first bounded evidence materialization;
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
