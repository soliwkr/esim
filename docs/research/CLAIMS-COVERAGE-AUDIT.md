# Claims Coverage Audit

Data: **3 agosto 2026**.

## Obiettivo

Misurare se Senza Roaming possiede già una catena di evidence sufficiente per i fatti richiesti dalle prime pagine commerciali, prima di generalizzare snapshot, monitoraggio o ingest D1.

La domanda non è:

> esiste una pagina ufficiale?

ma:

> esiste una fonte adatta a questo field, con questo scope, freshness e contesto, e il nostro modello può rappresentarla senza perdere significato?

## Input canonici

Repository:

- `research/seo/m7-keyword-map.csv`;
- `migrations/0005_published_pages.sql`;
- `docs/research/source-registry.csv`;
- `docs/research/evidence-contract.md`;
- `docs/research/claim-candidate-contract.md`;
- `docs/research/unsupported-evidence-areas.md`;
- `docs/research/EVIDENCE-SNAPSHOT-SPIKE-RESULT-2026-08-03.md`.

Verifica esterna read-only del 3 agosto 2026 limitata a superfici ufficiali Airalo, Holafly e Ubigi.

Output:

```text
docs/research/claims-field-catalog.md
docs/research/claims-source-candidates.csv
docs/research/claims-coverage-matrix.csv
```

## 1. Cosa devono poter sostenere le pagine

La baseline M7 definisce `/migliore-esim` come decision page senza ranking automatico. I suoi criteri reali sono:

```text
destinazione
durata
dati
hotspot
attivazione
rete
prezzo datato
```

La pagina `/esim-estero` aggiunge:

```text
locale vs regionale vs globale
Paesi inclusi
voice/SMS quando rilevante
```

La guida compatibilità richiede:

```text
modello esatto
variante / mercato hardware
carrier lock come controllo del singolo device
```

Il seed storico di `/migliore-esim` cita anche la velocità, ma l'audit conferma che:

```text
network / 5G statement
≠
observed performance
```

Quindi nessuna product page provider è evidence sufficiente per proclamare il provider “più veloce”.

## 2. Stati di coverage usati

### `verified_snapshot`

Il field è già stato osservato in un artifact immutabile secondo ADR-038, con locator e candidate `pending`.

### `source_identified`

Esiste una fonte ufficiale adatta allo scope, osservata nell'audit, ma non è ancora passata nel nostro snapshot contract.

### `partial_scope`

La fonte è ufficiale ma generica, incompleta o incapace di sostenere tutto il valore richiesto.

### `conflict_scope_required`

Esistono fonti ufficiali che devono essere mantenute separate per scenario, product type, canale o effective date; semplificarle in un boolean sarebbe scorretto.

### `unsupported_method`

Non manca soltanto una URL: manca un metodo di prova adeguato.

### `user_state_only`

Il fatto appartiene al singolo device/account dell'utente e non può essere precomputato come claim provider/model.

## 3. Coverage reale del core M7

### Destination coverage

Per l'Italia esistono oggi superfici ufficiali per tutti e tre i provider.

- Airalo: pagina/catalogo Italia;
- Holafly: product page Italia;
- Ubigi: exact Italy 50GB/30-day product page.

Solo Ubigi è già passata nello snapshot contract PR #104. Per Airalo e Holafly la fonte è identificata ma non canonicalizzata.

**Conclusione:** source coverage sì, comparison readiness no.

### Price

Stato osservato nello stesso giorno:

```text
Airalo Italy surface → USD
Holafly Italy surface → EUR
Ubigi captured Italy plan → USD
```

Questa è una barriera reale alla comparazione numerica.

Il sistema non deve fare:

```text
29 USD → price_eur=29
```

né confrontare direttamente importi in valute diverse.

Serve una decisione futura fra:

1. catturare i provider nello stesso purchase/currency context quando possibile;
2. oppure introdurre una derivazione FX separata, datata e provata.

**Conclusione:** nessuna tabella prezzo cross-provider è ancora autorizzata.

### Data allowance / unlimited / fair use

Airalo espone sia fixed data sia unlimited. La sua pagina Italia e la FUP ufficiale rendono visibile che un'etichetta `unlimited` può convivere con una soglia high-speed package-specific.

Holafly Italia presenta unlimited data; la guidance ufficiale chiarisce che la velocità può essere ridotta secondo FUP e rimanda alle Technical Specs della destinazione per i dettagli.

Ubigi nel piano snapshot-tato presenta 50GB fixed data.

Quindi il confronto non può comprimere tutto in:

```text
data = unlimited | 50GB
```

Deve preservare almeno:

```text
data allowance / unlimited label
FUP
high-speed threshold when known
post-threshold behavior when known
```

**Conclusione:** data coverage forte; FUP ancora asimmetrica e non comparison-ready.

### Validity

Tutti e tre possiedono superfici che espongono durata/piano.

- Ubigi 30 days è già snapshot-verificata;
- Airalo espone duration per package;
- Holafly usa durata selezionabile e prezzo dipendente dalla selezione.

**Conclusione:** field copribile, ma per Holafly la selection state deve far parte dell'evidence context.

### Activation

È il primo criterio dove la differenza di scope diventa decisiva.

Airalo dichiara esplicitamente che il trigger può variare fra package e chiede di controllare la `Validity Policy` del pacchetto.

Holafly Italia dichiara che il piano parte quando l'utente arriva a destinazione e attiva la eSIM.

Ubigi descrive SmartStart e l'attivazione all'arrivo in una covered area; il piano può partire immediatamente se l'utente è già in area coperta al momento dell'acquisto.

**Conclusione:** non esiste un `provider default` sicuro per Airalo. Activation deve restare exact-package.

### Hotspot

Le tre fonti dimostrano perché `hotspot=true` è un modello troppo povero.

Airalo:

- help generico: hotspot possibile se device e rete lo supportano;
- unlimited FUP: tethering personale consentito e nessun cap tethering dichiarato, mentre il consumo high-speed del pacchetto può comunque avere FUP.

Holafly Italia:

- hotspot disponibile;
- share allowance osservata: **1 GB per day** per il prodotto Italia corrente.

Ubigi:

- product page: data sharing allowed;
- help: tethering supportato;
- nessun exact share cap è stato dimostrato nello scope attuale.

**Conclusione:** `hotspot_share_limit` è un vero schema gap e deve restare separato da `hotspot_policy`.

### Network

Airalo Italia mostra una rete primaria e un controllo `+2 others`; una cattura statica della sola superficie visibile non basta per salvare tutta la lista.

Holafly Italia dichiara Vodafone Italy / WINDTRE e 4G/LTE/5G where available.

Ubigi Italy 50GB dichiara Iliad e WindTre, con indicatori di tecnologie disponibili.

**Conclusione:** fonti identificate per tutti, ma l'extractor dovrà distinguere:

```text
operators[]
technologies[]
```

La tecnologia dichiarata non alimenta un performance score.

## 4. Refund: il conflict handling non è teorico

Il registry aveva già previsto che terms, FAQ e policy potessero divergere.

L'audit corrente conferma che una comparazione del tipo:

```text
refund = yes/no
```

sarebbe fuorviante.

Per Holafly i criteri dipendono da canale, activation/use e scenario.

Per Ubigi terms e help corrente usano formulazioni che devono essere separate almeno per:

```text
preloaded web eSIM
QR scanned vs not scanned
data used vs not used
carrier lock / incompatibility
technical issue
request window
```

Non è compito del claim candidate scegliere la formulazione più favorevole.

**Conclusione:** refund è coperto da fonti primarie ma non è comparison-ready finché non esiste uno schema scenario-based o un output editoriale attribuito e circoscritto.

## 5. Device compatibility

Il source registry ha già fonti manufacturer Apple, Google e Samsung.

Gerarchia confermata:

```text
manufacturer exact model + region
→ provider requirement / commercial list
→ user checks carrier lock
```

Il carrier lock non è un claim sul modello: è stato classificato `user_state_only`.

**Conclusione:** la guida compatibilità può diventare molto forte senza dipendere da liste aggregate provider, ma richiede model code/market e non solo il nome commerciale.

## 6. Performance e routing restano fuori dal truth layer automatico

### Performance

Provider statement:

```text
4G / 5G
fast
reliable
```

non equivale a:

```text
measured Mbps
latency
best network
```

Nessun provider ha status comparison-ready per `observed_performance`.

### Routing / VPN

Il caso storico `esim-cina-senza-vpn` resta deliberatamente fuori dall'automazione fattuale.

Una statement provider può essere pubblicata come statement attribuito se verified/scoped. Per dire che un servizio funziona realmente senza VPN serve ancora un protocollo osservativo first-party in-destination.

**Conclusione:** nessun ranking o promise “senza VPN” viene sbloccato da questo audit.

## 7. Schema gap emersi

Il maintenance layer ha già:

```text
price_eur
validity_days
data_gb
unlimited_policy
hotspot_policy
fair_use_policy
activation_policy
refund_policy
network
device_compatibility
```

Per le prime pagine di mercato emergono almeno questi gap/necessità di split:

```text
destination_coverage
plan_type
price amount + source currency upstream
hotspot_share_limit + period
radio_technology separata da performance
voice_sms_included
carrier_lock_state come user-state, non D1 truth
```

Inoltre i field esistenti `hotspot_policy`, `network`, `refund_policy`, `unlimited_policy` e `fair_use_policy` richiedono struttura interna più ricca per evitare boolean/stringhe opache.

Questo documento non autorizza una migration.

## 8. Comparison Readiness

### Stato attuale

```text
Airalo   → official source coverage buona, snapshot coverage core = 0
Holafly  → official source coverage buona, snapshot coverage core = 0
Ubigi    → official source coverage buona, 3 core field snapshot-verificati
```

Nessuno dei tre è ancora `comparison-ready` come row strutturata completa.

Motivi principali:

1. catture non simmetriche;
2. valuta non uniforme;
3. FUP/hotspot con scope diverso;
4. Airalo activation package-specific;
5. network UI non sempre disponibile in una singola representation;
6. refund scenario-based;
7. performance non osservata;
8. alcuni field richiesti non hanno ancora schema canonico.

Questa è una **buona** conclusione: il blocco è ora specifico e misurabile.

## 9. Cosa possiamo già sostenere editorialmente

Con i gate esistenti e senza nuovo automation layer:

### Sì, se scoped e datato

- un exact plan ha un certo prezzo/valuta;
- un exact plan ha X GB o dichiara unlimited;
- un exact plan dura N giorni;
- un provider dichiara determinati operatori/tecnologie per quel piano/destinazione;
- una product/technical page dichiara hotspot e relativo limite;
- una policy ufficiale descrive activation/refund/FUP per lo scope applicabile;
- un manufacturer dichiara eSIM capability per modello/mercato.

### No, non ancora come claim proprio automatico

- “provider X è il migliore”;
- “provider X è il più veloce”;
- “copertura migliore” senza protocollo;
- “illimitato senza limiti”;
- “hotspot illimitato” per inferenza;
- “funziona sempre senza VPN”;
- price ranking tra valute/context non normalizzati;
- refund sì/no senza scenario.

## 10. Prossimo technical gate raccomandato

Non un crawler.

Non una migration.

Non un ranking.

Il prossimo spike ad alto valore è un **Italy comparison evidence pack** read-only:

```text
one destination: Italy
three providers: Airalo / Holafly / Ubigi
one bounded decision scenario
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
price + currency
fixed data OR unlimited + FUP
duration
activation
hotspot + share limit
network + technology statement
```

### Perché uno scenario e non “stesso SKU”

I provider non vendono prodotti perfettamente isomorfi. Forzare:

```text
10 days / 50 GB / same price currency
```

può produrre un confronto artificiale.

Meglio definire prima uno scenario, per esempio:

```text
10-day Italy trip
high data use
hotspot needed
unlocked eSIM-capable device
```

e lasciare che ogni provider presenti l'opzione realmente disponibile per quello scenario.

Lo spike deve produrre evidence, non scegliere il vincitore.

## 11. Priorità delle prossime catture

### P0 — Airalo

- Italy package/catalog state;
- exact unlimited package state;
- applicable Fair Use Policy;
- exact package activation/Validity Policy;
- expanded network list.

### P0 — Holafly

- Italy product with explicit duration state;
- price in capture currency;
- unlimited label;
- hotspot 1 GB/day statement;
- activation statement;
- networks/technology;
- destination Technical Specs/FUP context.

### P0 — Ubigi

Riutilizzare il contract PR #104 e ampliare lo stesso exact plan soltanto per:

- activation;
- hotspot/data sharing;
- networks;
- technologies;

senza perdere i tre locator già verificati.

### P1 — policies

Refund viene dopo il core plan comparison pack perché richiede scenario modeling. Device compatibility può procedere in parallelo come family/model evidence, non come provider ranking input.

## 12. Decisione sui tool

L'audit non cambia la Tool Fit Matrix:

- Trafilatura: helper/benchmark opzionale;
- changedetection.io: futuro change signal;
- ArchiveBox: donor per preservation;
- RSSHub/trendsearch: discovery, non truth;
- Partner API: input commerciale attribuito e credentialed, fase separata.

Il fatto che ora conosciamo le fonti da catturare non giustifica ancora un runtime di monitoring.

## 13. Stop condition rispettata

Questa fase non introduce:

- codice runtime;
- D1 schema/write/migration;
- crawler;
- scheduler/Workflow;
- provider credentials;
- claim verification automatica;
- ranking;
- affiliazioni;
- nuove pagine;
- publication capability;
- deploy.

## Conclusione

Il Source Universe Audit ha risposto **dove cercare**.

Lo Evidence Snapshot Spike ha risposto **come conservare e derivare un candidate senza trasformarlo in verità pubblicabile**.

Il Claims Coverage Audit risponde ora **cosa manca davvero per confrontare**.

La risposta è concreta:

> Le fonti primarie esistono già per gran parte del core commerciale. Il prossimo vantaggio non viene da più contenuto o più crawling, ma dalla cattura simmetrica e scoped degli stessi criteri per i tre provider, con currency, FUP, hotspot, activation e network trattati come dati separati e con unknown/conflict preservati.
