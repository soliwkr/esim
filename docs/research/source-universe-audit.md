# Source Universe Audit

Data audit: **3 agosto 2026**.

Branch: `research/source-universe-audit`

## Executive conclusion

Senza Roaming **non ha bisogno di un secondo sistema di fonti**.

Il repository possiede già la parte downstream corretta:

```text
source_registry
claim_verifications
freshness
conflict handling
Page Readiness
evidence bundle
field-level provenance
human review
```

Il problema emerso è upstream:

```text
URL vivo
→ [MISSING: snapshot immutabile]
→ [MISSING: estrazione riproducibile]
→ [MISSING: datum normalizzato]
→ [MISSING: claim candidate separato]
→ claim verificato
```

Questa è la priorità prima di qualsiasi espansione fattuale/pSEO.

## Scope

Audit read-only di:

1. schema e contratti già presenti nel repository;
2. tre provider già nel catalogo: Airalo, Holafly, Ubigi;
3. manufacturer e standard tecnici per compatibilità eSIM;
4. regulator/institutional sources per le destinazioni già presenti;
5. confine tra demand sources e commercial truth.

Non sono stati aggiunti provider nuovi al catalogo.

Non sono stati eseguiti:

- deploy;
- migration D1;
- mutation D1;
- crawler;
- scraping autenticato;
- bypass anti-bot;
- modifiche ai gate editoriali;
- modifiche al Worker/Workflow/Container/AI;
- affiliazioni;
- pubblicazione.

## Artefatti

```text
docs/research/source-registry.csv
docs/research/evidence-contract.md
docs/research/claim-candidate-contract.md
docs/research/unsupported-evidence-areas.md
docs/research/source-universe-audit.md
```

## 1. Stato del repository prima dell'audit

### Source registry già esistente

`migrations/0007_ai_maintenance.sql` definisce `source_registry` con:

```text
entity_type
entity_key
source_kind
label
url
trust_level
freshness_days
status
last_checked_at
last_changed_at
content_hash
http_etag
http_last_modified
last_http_status
consecutive_failures
```

Source kind v1:

```text
official_provider
official_help
official_terms
regulator
manufacturer
first_party_test
editorial_reference
```

Quindi trust, freshness e change detection metadata sono già concetti canonici.

### Verified claims già esistenti

`claim_verifications` conserva:

```text
entity
field
value_json
source_id
verification_status
confidence
checked_at
valid_until
evidence
```

### Page Readiness già separa evidenza e pubblicazione

Il gate esistente impedisce a claim insufficienti, conflitti, claim pendenti/contraddetti/scaduti di diventare facts publication-eligible.

Questo audit non cambia quei gate.

## 2. Inventario auditato

`source-registry.csv` contiene **30 source candidates**:

```text
provider-related:       13
manufacturer:            4
technical standard:      1
regulator/policy:        12
--------------------------------
total:                  30
```

Stato URL nell'audit:

```text
validated:                         28
candidate_needs_direct_capture:     2
```

I due candidati che richiedono cattura diretta prima di poter sostenere claim sono:

- INDOTEL Dominican Republic root;
- MIC Japan root.

La loro autorità istituzionale è identificata, ma questo audit non finge di avere una cattura diretta affidabile del documento specifico necessario a un claim.

## 3. Provider universe

### Airalo

Fonti utili identificate:

- official root;
- Terms of Use;
- hotspot/tethering help;
- validity help.

Osservazione:

Airalo dichiara che il tethering è utilizzabile quando supportato da device e network. Questo è evidence per una **provider statement generica**, non per un boolean universale di ogni plan/destination.

La pagina validity dichiara che l'inizio della validità varia e invita a leggere la policy del singolo package. Quindi il trigger di attivazione è plan-scoped.

### Holafly

Fonti utili identificate:

- official root;
- prepaid Terms & Conditions;
- subscription Terms & Conditions;
- Refund Policy;
- hotspot FAQ.

Osservazione critica:

prepaid e subscription sono contratti diversi e non devono essere fusi.

La hotspot FAQ dichiara che **molte** eSIM consentono data sharing e rimanda alla destination plan per verificare quantità/limite. Quindi una futura matrice hotspot deve essere plan + destination scoped.

### Ubigi

Fonti utili identificate:

- corporate root già presente nel catalogo;
- commerce/catalog root;
- Terms & Conditions;
- tethering help.

Le product page Ubigi osservate durante l'audit contengono nello stesso documento:

- data allowance;
- validity;
- price/currency;
- activation statement;
- data sharing;
- network partner;
- technology;
- eventuale Fair Use Policy.

Sono quindi candidate molto forti per un futuro spike di evidence snapshot.

Sono anche una prova del problema: la stessa famiglia di pagine può essere resa con currency diversa a seconda del contesto. Un parser che salva solo il numero del prezzo produrrebbe dati falsamente canonici.

## 4. Manufacturer e technical truth

### Apple

Fonti manufacturer identificate per:

- requisiti eSIM iPhone;
- setup;
- carrier/provider support per paese.

Manufacturer evidence è primaria per capacità hardware, ma Apple mantiene requisiti e differenze per mercato/carrier.

### Google Pixel

La guida Pixel documenta nano-SIM/eSIM e caveat generazionali/di mercato.

### Samsung Galaxy

La pagina Samsung Italia, aggiornata nel 2026, contiene:

- modelli Galaxy eSIM-compatible;
- eccezioni regionali per alcuni modelli;
- operatori supportati per specifiche modalità di activation/transfer.

Samsung afferma esplicitamente che il supporto può variare per paese e operatore.

### GSMA

GSMA pubblica lo stato delle specifiche eSIM consumer e IoT.

È la fonte corretta per standard tecnico e version lineage, ma non dimostra che un determinato telefono o travel provider implementi una specifica capacità.

Gap schema emerso:

```text
source_kind non possiede standards_body
```

In v1 l'audit mappa GSMA a `editorial_reference` e registra il gap. Nessuna migration viene proposta in questa PR.

## 5. Regulator universe

Sono state identificate fonti regulator/institutional per le destinazioni già presenti nel catalogo:

```text
Egitto                 NTRA
Turchia                BTK
Thailandia             NBTC
Albania                AKEP
Svizzera               OFCOM / BAKOM
Dubai / Emirati        TDRA
Oman                   TRA
Zanzibar / Tanzania    TCRA
USA                     FCC
Rep. Dominicana        INDOTEL candidate
Giappone               MIC candidate
```

Più:

```text
EU roaming/fair use    European Commission
```

### Regulator role

Un regulator può sostenere:

- chi regola il mercato;
- licenze e obblighi;
- consumer rights;
- spectrum/coverage methodology;
- normative specifiche.

Non sostiene automaticamente:

- che Airalo/Holafly/Ubigi funzioni in un luogo;
- il prezzo di un piano;
- il routing del travel eSIM;
- la velocità reale;
- il limite hotspot.

### FCC example

La National Broadband Map distingue coverage provider-reported/modelled e specifica i contesti di utilizzo della mappa. È utile come metodologia/coverage reference, non come garanzia della performance del roaming partner di una travel eSIM.

### UAE example

TDRA regola vendita e attività telecom. Una regola relativa a SIM/local licensees non deve essere applicata automaticamente a un travel-eSIM provider senza definire il soggetto giuridico e lo scope.

## 6. Source-role matrix

| Role | Autorità tipica | Claim consentiti | Claim non consentiti da sola |
|---|---|---|---|
| provider root | provider | identità, generic statements | price/plan specifics |
| product page | provider | plan price/data/validity/network claimed | observed performance |
| official help | provider | procedure/policy claimed | universal plan fact when scoped caveat exists |
| official terms | provider | contractual terms | service quality |
| manufacturer | OEM | device capability | travel-provider performance |
| regulator | authority | law/rule/methodology | provider experience |
| standards body | GSMA | technical standard | device/provider implementation |
| first-party test | Senza Roaming | observed result in test scope | general terms/commercial policy |
| demand source | users/search | question/opportunity | commercial truth |

## 7. Demand Universe

Il repository ha già recent-demand separato dai claim commerciali. Questo confine è corretto e va mantenuto.

### Demand-only inputs

```text
Google Search Console
Google Trends
Reddit
YouTube
community/forums
SERP/competitor discovery
```

Possono alimentare:

```text
opportunity
question
brief
source discovery
refresh priority
```

Non alimentano direttamente:

```text
verified claim
price
coverage
refund condition
provider winner
```

### Esempio

```text
Reddit: "Holafly hotspot in Japan?"
→ demand signal
→ verification question
→ Holafly destination/product source
→ snapshot
→ candidate
→ verification
```

Non:

```text
Reddit answer
→ commercial fact
```

## 8. Gap principale: evidence preservation

`source_registry` oggi può conservare hash, ETag e Last-Modified, ma non conserva un artifact immutabile che consenta di riprodurre l'estrazione.

Questo è il gap più importante dell'intera supply chain.

Senza snapshot:

- una fonte cambia e il vecchio contenuto sparisce;
- un reviewer non può ricostruire quale testo sostenesse il claim;
- un parser aggiornato non può essere rieseguito sullo stesso input;
- un conflitto storico può diventare invisibile;
- un claim scaduto non è auditabile fino al documento osservato.

### Direzione consigliata

```text
source_registry
  ↓
evidence_snapshot (immutable artifact + capture metadata)
  ↓
extraction result
  ↓
claim candidate
  ↓
existing claim_verifications
```

Questo aggiunge provenance upstream senza sostituire il sistema downstream.

## 9. Gap di scope

Il modello `entity_type + entity_key + field_name` è valido, ma per claim commerciali serve rappresentare con disciplina:

```text
provider
plan/sku
destination
device model
device region
customer/product type
currency/locale context
```

Il problema non richiede necessariamente una nuova tabella subito. Prima serve dimostrare con fixture reali quale chiave sia stabile.

## 10. Freshness

La freshness non può essere unica per provider.

Baseline proposta:

```text
price/SKU                    1–3d
plan data/validity/network   3–7d
hotspot/fair use             7d
provider help                14d
refund/terms                 14–30d
manufacturer devices         30d
carrier compatibility        14d
regulator operational        90d
stable regulator framework   180d
GSMA standard                90d/event-driven
```

`source_registry` supporta già `freshness_days`; lo spike futuro dovrà stabilire se la granularità delle source rows è sufficiente prima di cambiare schema.

## 11. Unsupported factual areas

Le aree a rischio più alto risultano:

1. price/current availability;
2. unlimited + fair use;
3. exact hotspot limits;
4. network partner drift;
5. real coverage;
6. speed/latency;
7. routing/IP/VPN behavior;
8. regional device variants;
9. refund/terms conflicts;
10. app-only/browser-context data.

Il dettaglio e la publication consequence sono in `unsupported-evidence-areas.md`.

## 12. Decisioni dell'audit

### A. Non creare un nuovo source database

**Decisione:** riusare `source_registry` come registry canonico futuro.

### B. Inserire uno snapshot boundary

**Decisione:** la prossima capacità tecnica da studiare è un evidence snapshot immutabile tra source e extraction.

### C. Separare candidate da verified claim

**Decisione:** un extractor non scrive direttamente una `claim_verification` come verità.

### D. Non usare provider root per plan facts

**Decisione:** URL ufficiale non è sufficiente; deve essere pertinente al field e allo scope.

### E. Demand resta separata dalla truth supply chain

**Decisione:** preservare ADR-003.

### F. First-party test è un tipo di evidence diverso

**Decisione:** test routing/speed/availability non possono essere sostituiti da marketing copy o regulator maps.

## 13. Primo spike tecnico raccomandato

Non un crawler.

### Scope

Una sola product page pubblica Ubigi, scelta esplicitamente e senza credenziali.

Perché Ubigi:

- HTML pubblico indicizzabile;
- contiene più field nello stesso scope;
- espone price/currency context;
- data + validity;
- network/technology;
- data sharing;
- activation;
- fair-use link per alcuni plan;
- evidenzia immediatamente i problemi di localizzazione/valuta.

### Acceptance

Lo spike dovrà dimostrare:

```text
1 URL
→ snapshot artifact immutabile
→ requested + final URL
→ locale/currency context
→ sha256
→ extractor versionato
→ 3 field massimo
→ evidence locator per field
→ claim candidate pending
→ seconda cattura identica = no semantic delta
→ fixture modificata = delta deterministico
```

Field consigliati per il pilot:

```text
data_gb / unlimited marker
validity_days
price amount + currency
```

Non scrivere in `claim_verifications` nella prima iterazione.

### Stop condition

Lo spike deve fermarsi prima di:

- D1 remote write;
- maintenance queue integration;
- multi-provider crawling;
- scheduled monitoring;
- content generation;
- ranking;
- affiliate logic;
- publication.

## 14. Sequenza raccomandata dopo questo audit

```text
Source Universe Audit
→ evidence snapshot spike su 1 fonte
→ deterministic extractor + claim candidate fixture
→ review del modello di scope/freshness
→ Claims Coverage Audit sui field necessari alle prime pagine
→ solo dopo: monitoraggio multi-source controllato
→ solo dopo evidenza sufficiente: factual provider/comparison expansion
```

Non saltare direttamente a pSEO.

## 15. Exit criteria dell'audit

Questa fase è completa quando:

- [x] source universe iniziale dei provider correnti è inventariato;
- [x] manufacturer/standard/regulator roles sono separati;
- [x] demand source boundary è esplicito;
- [x] evidence snapshot contract è definito;
- [x] claim candidate contract è definito;
- [x] unsupported evidence areas sono documentate;
- [x] freshness iniziale è proposta;
- [x] primo spike tecnico è ristretto a una fonte;
- [x] nessuna capacità production è stata introdotta.
