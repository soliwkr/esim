# Prossime azioni

Ultimo aggiornamento: **3 agosto 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile e i gate operativi già definiti.

## Evidence supply chain — coverage audit chiuso

Stato verificato:

```text
PR #103 — Source Universe Audit: merged
PR #104 — deterministic evidence snapshot spike: merged
merge #104: be9707a004b596b4c11b602ed33d1437803cbba4
CI #544: success
live source verified: 1 public Ubigi product page
first live capture: passed
second live capture: raw drift, semantic changes=0
Trafilatura 2.2.0 bake-off: 3/3 raw values retained
PR #105 — Claims Coverage Audit: closeout in corso
coverage matrix: 54 provider×field rows
current providers: Airalo, Holafly, Ubigi
D1 writes: none
provider credentials: none
deploy: none
```

Contratto verificato:

```text
SOURCE
→ immutable EVIDENCE SNAPSHOT
→ deterministic field extraction
→ NORMALIZED DATUM
→ PENDING CLAIM CANDIDATE
→ verification/conflict/freshness gates esistenti
```

Il Claims Coverage Audit ha verificato che le fonti ufficiali per gran parte del core commerciale esistono già, ma nessun provider è ancora comparison-ready nel sistema canonico: le catture sono asimmetriche, il contesto valuta non è uniforme, FUP/hotspot/activation hanno scope diversi e alcuni criteri richiedono field più strutturati.

Gap principali:

```text
destination_coverage: schema gap
plan_type locale/regionale/globale: schema gap
price: amount+currency upstream; price_eur non derivabile implicitamente
hotspot_share_limit + period: schema gap
network operators vs radio technology: da separare
refund: scenario/effective-date based
carrier_lock_state: user state, non provider truth
observed performance: protocollo di prova assente
routing/VPN: claim proprio non automatizzabile senza test osservativo
```

### Prossimo gate: Italy comparison evidence pack

Prima di D1 ingest o monitoring su scala, costruire uno spike read-only e bounded:

```text
one destination: Italy
three providers: Airalo / Holafly / Ubigi
one explicit decision scenario
same capture window
→ exact product/destination artifacts
→ complementary policy artifacts only where required
→ normalized core candidates
→ unknown/conflict preserved
→ zero provider winner
```

Core field target:

```text
destination_coverage
price + source currency
fixed data OR unlimited + FUP
validity
activation policy
hotspot + share limit
network operators + attributed radio technology
```

Scenario raccomandato per lo spike:

```text
10-day Italy trip
high data use
hotspot required
unlocked eSIM-capable device
```

Lo scenario serve a confrontare evidence disponibile, non a forzare SKU isomorfi o scegliere un vincitore.

Priorità source capture:

- Airalo: exact Italy package state + applicable FUP + exact activation/Validity Policy + expanded networks;
- Holafly: Italy page con explicit duration state + price/currency + unlimited/FUP + hotspot limit + activation + networks/technology;
- Ubigi: estendere l'exact plan già usato da PR #104 a activation, data sharing, networks e technologies senza perdere i locator esistenti.

Non introdurre ancora:

- crawler multi-source;
- changedetection.io/ArchiveBox/RSSHub runtime;
- Partner API credentials;
- D1 schema o writes;
- maintenance queue integration;
- scheduler/Workflow;
- FX conversion implicita;
- claim verification automatica;
- ranking/provider winner;
- pubblicazione o affiliazioni.

Documenti:

```text
docs/research/source-universe-audit.md
docs/research/evidence-tool-fit-matrix.md
docs/research/evidence-contract.md
docs/research/claim-candidate-contract.md
docs/research/EVIDENCE-SNAPSHOT-SPIKE.md
docs/research/EVIDENCE-SNAPSHOT-SPIKE-RESULT-2026-08-03.md
docs/research/claims-field-catalog.md
docs/research/claims-source-candidates.csv
docs/research/claims-coverage-matrix.csv
docs/research/CLAIMS-COVERAGE-AUDIT.md
```

## M6 measurement foundation — chiusa live

Stato verificato:

```text
PR #91: merged
CI main #468: success
GTM container version 2: published
production deploy: completed
server-side live verification: passed
browser live reject/grant/reload/revoke: passed
PR #93 cleanup workflow: merged
Ads: disabled
remarketing: disabled
affiliate tracking: disabled
```

Documenti risultato:

```text
docs/PUBLIC-MEASUREMENT-DEPLOY-RESULT-2026-07-27.md
docs/PRODUCTION-RECOVERY-CHECKPOINT-2026-07-29.md
```

Dopo la regressione del deploy automatico M7 #62, la configurazione M6 è stata ripristinata tramite la pipeline production corretta e ricertificata nel browser reale. Non riaprire la foundation per aggiungere eventi, Ads o affiliazioni. Ogni nuova capacità measurement richiede dizionario eventi, scope e branch separati.

## M7 baseline e Search Console — chiuse

```text
PR #95: baseline SEO M7 e keyword ownership
PR #96: exporter diretto Search Console
primo export live: 27 luglio 2026
range: 2026-07-26 → 2026-07-27
clicks: 0
impressions: 0
query/page rows: 0
data: incomplete dal 2026-07-26
```

L'assenza iniziale di query e pagine non modifica la keyword map e non autorizza nuove submission.

## Prima slice on-page M7 — live

PR #97 applica la baseline a:

```text
homepage
/destinazioni
/guide
/confronti
```

Stato verificato:

```text
homepage owner: esim viaggio
hub geografico: /destinazioni
hub pratico: /guide
hub comparativo: /confronti
CI branch: success
runtime smoke: success
Control Room smoke: success
deploy automatico storico #62: success
```

Il merge su `main` ha attivato automaticamente il vecchio deploy #62. La slice è live e verificata; quel trigger automatico è stato poi rimosso dalla pipeline production.

La slice contiene title, description, H1, promessa, criteri e internal linking verso sole URL esistenti. Preview e canonical usano URL coerenti con il rispettivo namespace.

Non contiene nuove route, pSEO, backend, D1, Workflow, Container, AI, publication capability, affiliazioni o nuovi eventi analytics.

## Slice M7 `/migliore-esim` — live

```text
PR #98: implementazione verificata
branch: feat/m7-migliore-esim-alignment
base: 006472311ed8f727873257c94c4f53f271ad5368
CI branch #519: success
deploy automatico storico #62: success
```

Anche questa slice è stata pubblicata dal deploy automatico #62 ed è stata verificata live senza ranking, provider vincitore, prezzi specifici o affiliazioni.

Implementato:

- ownership dell’intento commerciale `migliore esim`;
- title, meta description e H1 target;
- struttura decisionale con criteri, scenari, limiti e FAQ;
- nessun ranking, prezzo specifico, provider vincitore o claim commerciale nuovo;
- ponte legacy temporaneo limitato al solo seed `migliore-esim`;
- loader e query published-only esistenti riusati;
- link in uscita verso homepage, hub e guide pubblicate;
- nessuna riscrittura delle altre pagine per aggiungere link in entrata;
- preview e canonical namespace-safe;
- smoke dedicato canonical, preview, published-only, desktop, mobile e overflow;
- CMP, measurement e Control Room invariati.

Il ponte deve restare incapace di aggiungere fatti commerciali e deve essere rimosso quando la pagina sarà rimaterializzata tramite il workflow grounded.

## Recovery produzione M6 — chiuso live

Stato verificato:

```text
PR #99: merged
merge: fd511a5ffd51b55bce7b4b28b1d01b4f43ded8e4
PR #100: merged
merge: f2579346ab9591015e31cf54f3a9e4efa4791ceb
PR #101: merged
merge: f2df5cd6ef4bf4784205911e80786f55c28f3dd0
production run: 30439227471
production conclusion: success
Worker version: db76b202-2a62-4871-8abf-61c488316285
CMP live: restored
GTM/GA4 live: restored
AFFILIATE_MODE: disabled
D1 remote migration/mutation: none
```

Pipeline attiva:

```text
workflow_dispatch soltanto
→ npm ci
→ preflight M6 e AFFILIATE_MODE=disabled
→ npm run deploy come unica sequenza canonica
→ binding D1 read-only
→ nessuna creazione o migration D1
→ smoke live pubblici, preview, SEO, published-only, CMP, measurement e Control Room
```

Ricertificazione browser reale completata:

```text
pre-consenso: Google requests=0
rifiuto + reload: Google requests=0
consenso: GTM-W3LSK9RZ attivato
reload con consenso: GA4 collect HTTP 204
Measurement ID: G-GWJ9YPPVJW
evento reale: page_view
route verificata: /destinazioni
revoca + reload: Google requests=0
```

Il checkpoint production non richiede altri deploy. Eventuali modifiche future alla pipeline, CMP o measurement devono ripartire da un nuovo scope separato.

## Search Console

Completato:

```text
proprietà: sc-domain:senzaroaming.it
sitemap: https://senzaroaming.it/sitemap.xml
submission: 26 luglio 2026
exporter diretto read-only: verificato
primo snapshot: acquisito
```

Regole:

- non ripetere la submission;
- non usare la Indexing API;
- attendere dati sostanziali di scansione e ricerca;
- non trattare zero dati iniziali come errore;
- non cambiare ownership sulla base di uno snapshot incompleto;
- richieste manuali soltanto dopo keyword map applicata, copy forte e verifica live.

## Measurement — osservazione post-lancio

Nei prossimi giorni controllare senza modificare il container:

- presenza di `page_view` in GA4 Realtime;
- assenza di eventi inattesi;
- distribuzione di `route_class` e `page_type`;
- nessun parametro libero o ad alta cardinalità;
- nessun traffico da preview o Control Room;
- nessun `provider_redirect_intent` finché non viene progettato separatamente.

Non introdurre dashboard o automazioni sulla base di poche ore di dati.

## Track parallela M4

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

La legacy privata resta finché serve come fallback operativo.

## Freeze immediato

- niente Advanced Consent Mode o cookieless pings;
- niente tracking pre-consenso;
- niente eventi fuori dal dizionario;
- niente `provider_redirect_intent` senza branch e checkpoint dedicati;
- niente PII o dati editoriali interni;
- niente analytics nella Control Room o preview;
- niente Ads, remarketing o affiliate tracking;
- niente submission ripetute o Indexing API;
- niente secret o UUID D1 nel repository;
- niente mutation D1, Workflow, Container, AI o gate editoriali fuori scope;
- niente pubblicazione automatica;
- niente rimozione legacy durante la stabilizzazione.
