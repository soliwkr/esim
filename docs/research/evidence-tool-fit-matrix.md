# Evidence supply-chain tool fit matrix

Data di riferimento: **3 agosto 2026**.

Questo documento riconcilia il Source Universe Audit con i tool e i progetti già emersi nelle precedenti ricognizioni dedicate alla supply chain di ricerca/evidenza.

Non autorizza installazioni, dipendenze, crawler, monitoraggio schedulato, credenziali provider, scritture D1 o pubblicazione. Il suo scopo è evitare di reinventare primitive già studiate e, allo stesso tempo, evitare che un tool esterno diventi implicitamente fonte di verità.

## Contratto canonico da preservare

```text
SOURCE
  ↓
EVIDENCE SNAPSHOT
  ↓
DETERMINISTIC EXTRACTION
  ↓
NORMALIZED DATUM
  ↓
CLAIM CANDIDATE
  ↓
VERIFIED CLAIM
  ↓
PAGE READINESS
```

Il repository possiede già il registro fonti e i gate downstream. Questa matrice riguarda soltanto le capacità upstream mancanti o complementari.

## Livelli di provenienza dell'audit

I candidati non hanno tutti lo stesso livello di verifica storica.

### Candidati già analizzati nella ricognizione precedente

- `trendsearch` — valutato come segnale di domanda/trend, non come evidence fattuale;
- `EvidenceChain` — valutato come donor metodologico per scomposizione/provenance, non come sistema operativo da adottare;
- Tourist eSIM Partner API — valutata come sorgente commerciale strutturata candidata, con confine esplicito tra dato partner e claim verificato.

### Seed noti che la prima ricognizione non aveva approfondito

- `dgtlmoon/changedetection.io`;
- `ArchiveBox/ArchiveBox`;
- `adbar/trafilatura`;
- `DIYgod/RSSHub`.

La loro presenza in questa matrice chiude il debito di coverage dell'audit. Non equivale ad approvazione tecnica.

## Matrice decisionale

| Tool / sorgente | Punto della pipeline | Capacità utile | Decisione corrente | Cosa NON può provare | Primo test consentito |
|---|---|---|---|---|---|
| `dgtlmoon/changedetection.io` | change detection, dopo una baseline di snapshot | polling, diff, filtri CSS/XPath/JSONPath/jq, fetch non-JS o browser, webhook/alert | **DONOR / DEFER** | che il nuovo valore sia semanticamente corretto, completo o pubblicabile; non sostituisce snapshot canonico né verifica claim | nessuna installazione nel primo spike; confrontare in una fase successiva il suo modello di diff con il semantic diff deterministico del progetto |
| `ArchiveBox/ArchiveBox` | evidence preservation | snapshot multipli e durevoli: HTML, headers, WARC, PNG, PDF, TXT/JSON; CLI/API e storage ordinario | **DONOR FOR SNAPSHOT CONTRACT / DEFER RUNTIME** | quale campo commerciale estrarre, quale scope applicare, se una pagina sia autorevole per uno specifico claim | confrontare il nostro artifact minimo con il set di metadati/formati di ArchiveBox; nessun daemon o archivio production nello spike iniziale |
| `adbar/trafilatura` | extraction benchmark | HTML → testo/metadata/struttura; input live o HTML già scaricato; output JSON/Markdown/XML/CSV | **BENCHMARK IN SPIKE** | prezzo+valuta, hotspot allowance, FUP o activation policy come dato atomico corretto senza extractor specifico e locator verificabile | eseguire offline sulla stessa fixture dello spike e misurare cosa conserva/perde rispetto all'extractor deterministico field-specific |
| `DIYgod/RSSHub` | discovery / feed normalization | trasforma molte sorgenti in feed consumabili e facilita discovery/monitoring | **DISCOVERY ONLY / DEFER** | verità commerciale, valore corrente del piano, termini contrattuali o provenance atomica; il feed non diventa fonte probatoria | nessun uso nel primo spike; rivalutare soltanto per source discovery o signal intake |
| `trendsearch` | demand discovery | segnale Google Trends / domanda recente | **DISCOVERY ONLY** | prezzi, copertura, policy provider, compatibility, disponibilità tecnica o qualsiasi claim commerciale | nessun ruolo nell'evidence snapshot spike; può alimentare brief/research queue in una fase separata |
| `EvidenceChain` | provenance methodology | pattern concettuali di scomposizione e catena dell'evidenza | **METHOD DONOR ONLY** | non è automaticamente chain-of-custody operativa del progetto e non sostituisce hash, snapshot, locator e reviewer state del repository | prima di qualsiasi dipendenza, risolvere nuovamente l'upstream esatto e confrontare il modello con `evidence-contract.md`; nessun codice importato ora |
| Tourist eSIM Partner API / SDK ufficiali | structured commercial input | catalogo piani strutturato; country filters; price/currency; validazione piano; API autenticata | **DEFERRED CREDENTIALED SOURCE** | indipendenza della fonte, qualità reale di rete, verità universale sugli altri provider, oppure pubblicabilità automatica del dato ricevuto | nessuna credenziale nello spike; futuro spike separato read-only su catalog metadata con snapshot della risposta e source attribution esplicita |

## Verifica upstream eseguita in questo checkpoint

### changedetection.io

Repository risolto: `dgtlmoon/changedetection.io`.

Il progetto supporta monitoraggio di pagine e JSON API, filtri CSS/XPath/JSONPath/jq, fetcher HTTP o browser e notifiche/webhook. Questo lo rende un candidato naturale per il **segnale che qualcosa è cambiato**, non per stabilire quale sia il nuovo claim verificato.

Decisione:

```text
snapshot canonico Senza Roaming
→ semantic diff Senza Roaming
→ eventuale changedetection.io come monitor/trigger futuro
```

Non invertire il rapporto: l'output del monitor non diventa evidence canonicalizzato per il solo fatto di aver rilevato una differenza.

### ArchiveBox

Repository risolto: `ArchiveBox/ArchiveBox`.

È particolarmente pertinente al layer `EVIDENCE SNAPSHOT` perché conserva copie in formati standard e ridondanti, inclusi HTML, headers, WARC, TXT/JSON, screenshot e PDF. Il pattern più utile per Senza Roaming è la **durabilità dell'artefatto e la separazione fra snapshot e interpretazione**.

Per il primo spike sarebbe però eccessivo introdurre l'intero runtime. L'acceptance deve essere prima dimostrata con un artifact minimo repository-owned.

### Trafilatura

Repository risolto: `adbar/trafilatura`.

È un package/CLI Python per discovery, crawling, download ed estrazione di testo, metadata e struttura da HTML. Può lavorare anche su HTML già scaricato e produce formati strutturati. Questo lo rende un buon **benchmark offline dell'extraction layer**.

Non va però usato come scorciatoia per trasformare testo estratto direttamente in claim: un extractor generico può rimuovere proprio il contesto necessario a distinguere, per esempio, valuta, scope del piano, disclaimer o eccezioni.

### RSSHub

Repository risolto: `DIYgod/RSSHub`.

È una rete/engine di feed RSS con moltissime route. È utile quando una sorgente non offre un feed comodo o quando vogliamo normalizzare discovery e monitoring.

Per governance resta fuori dalla catena probatoria:

```text
RSSHub signal
→ source discovery / research opportunity
≠ verified factual evidence
```

La licenza upstream è AGPL-3.0; questo rafforza la decisione di non introdurlo come dipendenza nel percorso critico senza un bisogno dimostrato e una review dedicata.

### Tourist eSIM Partner API

Upstream ufficiale risolto almeno per lo SDK Node: `touristesim/touristesim-nodejs-sdk`.

Lo SDK dichiara OAuth 2.0 client-credentials, query del catalogo, paginazione e accesso a campi come nome, prezzo e valuta dei piani. È quindi potenzialmente prezioso per un futuro input commerciale strutturato.

Resta però una **fonte del partner stesso**, non una verifica indipendente. Qualsiasi dato futuro deve conservare:

- source identity;
- checked-at;
- response snapshot/hash;
- request scope;
- currency/locale context;
- evidence locator o field path;
- stato `claim candidate` prima della verifica.

Nessuna credenziale viene richiesta o usata in questa fase.

## Tool identity ancora da chiudere prima di qualsiasi adozione

I nomi storici `trendsearch` ed `EvidenceChain` non sono sufficienti, da soli, per scegliere oggi un repository upstream senza rischio di omonimia.

Quindi la regola è fail-closed:

```text
nome ricordato
≠ dipendenza identificata
```

Prima di importare o copiare codice da uno dei due sarà obbligatorio registrare repository esatto, commit/tag, licenza e capacità effettivamente usata.

La conclusione metodologica precedente resta valida anche senza una dependency scelta:

- trend data = domanda/discovery;
- evidence chain = modello di provenance/decomposition;
- nessuno dei due = fonte fattuale primaria.

## Cosa entra nel primo spike tecnico

Il prossimo spike deve deliberatamente usare **meno tool**, non più tool.

### In scope

```text
1 URL provider pubblico
→ fetch diretto e deterministico
→ raw response artifact
→ metadata snapshot
→ SHA-256
→ extractor repository-owned per max 3 field
→ field-level evidence locator
→ normalized datum
→ pending claim candidate
```

Più un bake-off offline:

```text
stessa fixture HTML
→ extractor repository-owned
vs
→ Trafilatura
```

Il confronto deve misurare perdita/retention del contesto utile, non soltanto quantità di testo estratto.

### Donor da confrontare senza installare in production

ArchiveBox fornisce il riferimento per:

- durability;
- raw artifact preservation;
- headers;
- multiple representation awareness;
- separation between capture and interpretation.

changedetection.io fornisce il riferimento per una futura fase:

- watch scheduling;
- noisy-change filtering;
- targeted selectors;
- notification/trigger boundary.

### Fuori scope dello spike

- changedetection.io runtime;
- ArchiveBox runtime;
- RSSHub runtime;
- trend ingestion;
- provider Partner API credentials;
- D1 writes;
- maintenance queue integration;
- Workflow scheduling;
- crawler fleet;
- AI extraction as source of truth;
- automated claim verification;
- public page generation;
- publication.

## Decisione architetturale proposta dallo spike

Lo spike non deve scegliere in anticipo uno stack. Deve rispondere a quattro domande:

1. Un artifact minimo repository-owned conserva abbastanza evidence per riprodurre un claim candidate?
2. Un extractor field-specific è più affidabile di un generic content extractor per i tre field scelti?
3. Il semantic diff può essere deterministico senza introdurre subito un monitor esterno?
4. Quale capability esterna rimane davvero necessaria dopo aver misurato questi risultati?

Solo dopo queste risposte si decide se adottare una dependency o un servizio.

## Acceptance del tool audit

Il debito di audit è chiuso quando:

- i tre candidati già studiati sono ricondotti al nuovo evidence contract;
- i quattro seed precedentemente omessi sono classificati;
- nessun tool di discovery è promosso a factual source;
- nessun tool di monitoring è promosso a verification engine;
- nessuna API partner è promossa a fonte indipendente;
- il primo spike resta eseguibile senza credenziali, scheduler, D1 remote o deploy;
- ogni eventuale adozione futura richiede uno spike e una decisione separati.
