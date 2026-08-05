# Europe Regional Comparison Evidence Pack — Live Result

Data: **5 agosto 2026**.

PR: **#107 — Spike Europe regional comparison evidence pack**.

## Obiettivo

Verificare che il contratto evidence multi-provider già provato sul caso locale Italia generalizzi a uno scenario regionale multi-country prima di progettare schema canonico o ingest D1.

Scenario bounded:

```text
Region: Europe
Trip duration: 14 days
Scenario countries: Italy + France + Spain
Data use: high
Hotspot required: yes
Device: eSIM capable + unlocked
Providers: Airalo / Holafly / Ubigi
```

Il pack resta read-only, artifact-first e senza ranking, D1 write o deploy.

## Hardening precedente al checkpoint valido

Il primo run live sull'head `c5ba7461316291535ea2922d729728a6c8e1ee3f` era fallito chiuso su Airalo perché la fixture assumeva un deep link stabile e valori stale.

Il diagnostico ufficiale ha provato:

```text
historical exact-package URL
→ HTTP 302
→ https://www.airalo.com/europe-esim

visible commercial evidence:
41 Countries and Networks
15 days Unlimited GB 44.50 €
```

L'extractor è stato quindi hardenizzato alla store surface canonica, al country count dinamico e alla riga commerciale ancorata. Il dettaglio resta in:

```text
docs/research/EUROPE-REGIONAL-EVIDENCE-PACK-LIVE-HARDENING.md
```

## Head verificato per i due capture validi

```text
6a854047469a548ff2552d312cfee0ccb0e2c82b
```

La CI #576 su questo head è risultata completamente verde, incluso `smoke:runtime` con il nuovo contratto Airalo.

## Prima cattura valida

Comando:

```text
npm run evidence:europe-regional-pack
```

Risultato:

```text
Evidence pack: pack:sha256:23f36f8eac4314fc4c0bffc9a60d21fb9509f563b7caef89719a7fb0d5efa5dd
Artifact: research/evidence/packs/2026-08-05T20-23-10-466Z-23f36f8eac43
Capture window: 7424 ms
Semantic fingerprint: sha256:efb5924eee13f0c2f2a17381cf823c7e78873ab53925842949525982e96dbb89
Ranking: not_computed
```

L'artifact locale conteneva esattamente:

```text
pack.json
sources/airalo-europe-plan.html
sources/airalo-unlimited-fup.html
sources/holafly-europe-plan.html
sources/holafly-unlimited-faq.html
sources/ubigi-activation.html
sources/ubigi-europe-plan.html
```

Gli artifact raw restano locali, create-only e non vengono versionati.

## Seconda cattura con semantic compare

Baseline:

```text
research/evidence/packs/2026-08-05T20-23-10-466Z-23f36f8eac43/pack.json
```

Comando:

```text
npm run evidence:europe-regional-pack -- --compare <baseline-pack.json>
```

Risultato:

```text
Evidence pack: pack:sha256:d53bd50b002b6dcf1f5bcd3fc345a2145fe67a325382555720bddd466eb1d144
Artifact: research/evidence/packs/2026-08-05T20-30-42-499Z-d53bd50b002b
Capture window: 3089 ms
Semantic fingerprint: sha256:efb5924eee13f0c2f2a17381cf823c7e78873ab53925842949525982e96dbb89
Ranking: not_computed
Provider semantic changes: 0
```

I due pack hanno snapshot/raw artifact distinti ma lo stesso semantic fingerprint. Il checkpoint conferma quindi anche sul caso regionale il confine:

```text
raw/source drift
!=
commercial semantic drift
```

## Evidence osservata — Airalo

Offerta selezionata:

```text
Europe unlimited — 15 days
```

Candidate osservate, tutte `pending`:

```text
plan_type: regional / EUROPE
destination_coverage: declaredCountryCount=41
validity_days: 15
unlimited_policy: true
price: 44.5 EUR
fair_use_policy: 3 GB / 24h high-speed threshold; 1 Mbps after threshold; reset every 24h from activation
hotspot_policy: allowed
hotspot_share_limit: no separate tethering cap declared; overall FUP applies
```

Coverage preservata:

```text
destination_coverage: partial
data_gb: not_applicable
activation_policy: unknown
network: unknown
radio_technology: unknown
voice_sms_included: unknown
```

Il solo label `Europe` e il conteggio aggregato di 41 Paesi non vengono promossi a membership provata di Italia, Francia e Spagna.

## Evidence osservata — Holafly

Offerta selezionata:

```text
Europe unlimited — 15 days
```

Candidate osservate, tutte `pending`:

```text
plan_type: regional / EUROPE
destination_coverage: declaredCountryCount=33
validity_days: 15
price: 46.9 EUR
unlimited_policy: true
fair_use_policy: operator FUP may reduce speed; exact threshold unknown; recovery next day
activation_policy: arrival_and_esim_enabled
hotspot_policy: allowed
hotspot_share_limit: 1 GB/day
radio_technology: 4G LTE + 5G where available
voice_sms_included: data-only; no native voice/SMS
```

Coverage preservata:

```text
destination_coverage: partial
data_gb: not_applicable
fair_use_policy: partial
network: unknown
```

## Evidence osservata — Ubigi

Offerta selezionata:

```text
Europe 25GB — 30 days
```

Candidate osservate, tutte `pending`:

```text
plan_type: regional / EUROPE
data_gb: 25 GB
validity_days: 30
price: 29 USD
hotspot_policy: allowed
activation_policy: covered_area_connection; purchase while covered = immediate
radio_technology: 3G / 4G / 5G with country-exception caveat
voice_sms_included: data-only; no native voice/SMS
```

Coverage preservata:

```text
unlimited_policy: not_applicable
fair_use_policy: not_applicable
destination_coverage: unknown
hotspot_share_limit: unknown
network: unknown
radio_technology: partial
```

La static capture non ha preservato i blocchi coverage/network country-specific per tutti e tre i Paesi dello scenario. Il pack non inferisce quindi membership o operatori regionali.

## Boundary verificati

I due capture live confermano:

- `plan_type=regional` può essere rappresentato separatamente dalla membership dei singoli Paesi;
- aggregate country count non equivale a `countries[]` verificato;
- regional coverage può restare `partial` o `unknown` senza diventare `false`;
- operatori regionali non vanno appiattiti in una lista unica quando l'attribuzione è country-scoped;
- `network` e `radio_technology` restano distinti;
- unlimited, FUP e finite-data restano forme diverse e non vengono forzate in SKU isomorfi;
- hotspot allowed e share limit restano separati;
- source currency resta nativa (`EUR`, `EUR`, `USD`);
- nessun FX o `price_eur` implicito viene calcolato;
- voice/SMS data-only viene emesso solo quando provato;
- tutte le factual candidate restano `pending`;
- `ranking.status=not_computed` in entrambe le catture;
- nessun winner, score, cheapest/best label o performance claim viene prodotto.

## Mutation e deploy

Durante l'intero spike:

```text
D1 schema changes: none
D1 migrations: none
D1 writes: none
source_registry mutations: none
claim_verifications mutations: none
Worker/API changes: none
Workflow/scheduler changes: none
publication capability: none
affiliate activation: none
deploy: none
```

## Exit gate

Lo spike ha soddisfatto il gate previsto:

1. CI completa verde;
2. sei source ufficiali catturate entro la window;
3. artifact raw presenti localmente con i sei file attesi;
4. factual candidate tutte `pending`;
5. `plan_type=regional` source-grounded;
6. aggregate country count non promosso a membership;
7. country-scoped network boundary preservato anche quando i blocchi sono assenti;
8. `unknown`, `partial` e `not_applicable` preservati;
9. valute source-native;
10. `ranking.status=not_computed`;
11. seconda cattura con semantic compare: `Provider semantic changes: 0`.

## Stop condition

Non è emerso un difetto strutturale che giustifichi un terzo evidence pack esplorativo.

L'esplorazione evidence si ferma quindi qui.

Il prossimo scope deve essere una branch separata di:

```text
schema mapping / D1 design
```

Il design dovrà usare come input le forme realmente osservate in:

```text
Italy local evidence pack (#106)
+
Europe regional evidence pack (#107)
→ canonical schema mapping
```

Questo passaggio di design non autorizza ancora migration, ingest, ranking o pubblicazione.