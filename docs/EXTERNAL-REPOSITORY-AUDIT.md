# Audit dei repository esterni

Data di riferimento: **23 luglio 2026**.

Questo documento registra la due diligence sui repository indicati per valutare capacità, pattern e codice potenzialmente riusabili in `soliwkr/esim`.

L'audit non autorizza alcuna integrazione. Ogni adozione futura richiede uno spike separato, una branch dedicata, test e una decisione esplicita.

## Obiettivo

Ridurre il lavoro necessario per portare Senza Roaming al frontend pubblico, alla misurazione e alla monetizzazione senza:

- indebolire i gate editoriali;
- introdurre pubblicazione automatica;
- duplicare il backend esistente;
- trasformare il Worker in un renderer HTML manuale;
- aggiungere dipendenze senza beneficio misurabile;
- importare sistemi interi quando basta estrarre una primitiva.

## Perimetro verificato

Sono accessibili **71 repository distinti**:

- 13 repository indicati direttamente, compresa la coppia `thesprint-uk` + `the-sprint-context`;
- 58 repository pubblici dell'account `itallstartedwithaidea`;
- 2 repository privati accessibili: `soliwkr/rankempire-italia` e `soliwkr/thesprint-uk`;
- nessun repository irraggiungibile.

Questa prima versione contiene l'analisi approfondita dei candidati ad alto impatto e una classificazione preliminare degli altri. Non dichiara conclusa la lettura integrale di tutti i 71 repository.

## Vincoli canonici usati per la valutazione

Ogni candidato viene confrontato con questi requisiti di Senza Roaming:

1. Astro è il frontend pubblico principale.
2. React è riservato alle interfacce fortemente interattive.
3. Il browser non accede direttamente a D1.
4. L'AI non pubblica autonomamente.
5. Brief, conversione, claim, evidence, draft e pubblicazione restano gate distinti.
6. Claim insufficienti, contraddetti o scaduti non alimentano testo fattuale.
7. OpenSEO e altri strumenti trasversali restano servizi separati dal Worker applicativo.
8. Ogni adozione deve migliorare una decisione o ridurre un rischio misurabile.
9. Il repository `soliwkr/esim` resta la memoria canonica.

## Scala decisionale

| Esito | Significato |
|---|---|
| **Adottare dopo spike** | capacità concreta e compatibile, da verificare in una branch separata |
| **Adattare** | pattern valido ma implementazione incompatibile o troppo generica |
| **Estrarre** | riusare una funzione, un contratto, una checklist o una tassonomia |
| **Parcheggiare** | utile in una milestone successiva, non per il lancio immediato |
| **Scartare** | incompatibile con governance, prodotto o architettura |

## Sintesi esecutiva

I repository non contengono un frontend pubblico completo da innestare direttamente in Senza Roaming. Contengono però primitive che possono ridurre rischi e lavoro in quattro aree:

1. **routing, slug, schema e internal linking Astro**;
2. **quality gate SEO/GEO e regression testing**;
3. **tracking, attribuzione e definizione degli eventi**;
4. **processo di design e rollout programmatico controllato**.

Il risultato più importante non è un motore da copiare, ma una conferma: Senza Roaming ha già una governance editoriale più sicura dei sistemi analizzati. Le parti utili vanno portate dentro quella governance, non il contrario.

## Candidati prioritari

### 1. `soliwkr/rankempire-italia`

**Esito preliminare: ESTRARRE + ADATTARE**

Il progetto contiene una factory Cloudflare/Astro più sostanziale di quanto emerga dal README assente. La documentazione di fase e i commit attestano:

- routing Astro per home, hub, pagine foglia e blog;
- funzioni pure per route, schema graph e fetch centralizzato;
- sitemap e robots;
- internal linking build-time;
- normalizzazione slug italiana con test;
- batch generation e upsert D1;
- pipeline GitHub/Cloudflare Pages con stato e idempotenza;
- test unitari ed E2E dichiarati nei checkpoint di progetto.

#### Primitive da estrarre o confrontare

- `slugify()` con normalizzazione degli accenti italiani e test deterministici;
- separazione fra funzioni pure e componenti Astro;
- fail-fast in build quando una relazione route/dato è incoerente;
- schema graph costruito da dati strutturati invece che da stringhe HTML;
- breadcrumb accessibili e internal linking build-time;
- pattern di idempotenza e stato osservabile della pipeline.

#### Parti da non importare

- generazione massiva di pagine direttamente dall'output AI;
- scrittura del body generato in D1 senza passare da claim ed evidence bundle;
- modello un repository e un progetto Cloudflare per ogni sito;
- logica rank-and-rent, ghost lead, outreach e multi-tenant;
- Directus, n8n e dashboard parallele che duplicherebbero l'execution plane esistente;
- schema `LocalBusiness` e FAQ generici, non pertinenti al dominio eSIM.

#### Nota critica

Il `BatchGenerator` valida soprattutto forma JSON e presenza dell'output, sanitizza HTML e fa upsert. Per Senza Roaming questo non basta: l'output deve attraversare brief, claim atomici, verifica, readiness, bundle, draft e decisione editoriale.

### 2. `Auriti-Labs/geo-optimizer-skill`

**Esito preliminare: ADOTTARE DOPO SPIKE come auditor esterno; NON adottare il generatore Astro as-is**

È il candidato tecnico più maturo per un quality gate SEO/GEO separato:

- CLI e libreria Python;
- output JSON e formati CI;
- audit singola URL e sitemap;
- baseline, drift e regression;
- controlli schema, citability, factual accuracy e bot access;
- test multipiattaforma Python, lint e dependency audit;
- licenza MIT.

#### Uso compatibile

- job CI opzionale sul build pubblico;
- audit pre/post deploy;
- report macchina conservato come artifact;
- eventuale servizio OpenSEO separato;
- confronto con una baseline Senza Roaming curata manualmente.

#### Limiti osservati

L'integrazione `astro-geoready`:

- deriva titoli e sezioni principalmente dagli slug;
- non conosce stato editoriale, claim o evidence;
- genera file AI-discovery generici;
- inserisce una riga promozionale nel file `llms.txt` prodotto;
- non deve sostituire file curati o contratti definiti dal progetto.

La dipendenza non è approvata finché uno spike non verifica:

- stabilità dell'output JSON;
- falsi positivi e falsi negativi su pagine reali;
- costo e durata CI;
- compatibilità con Astro/Cloudflare;
- valore incrementale rispetto agli smoke e ai quality gate esistenti.

### 3. `soliwkr/claude-seo`

**Esito preliminare: ESTRARRE checklist e modelli di audit**

Il repository è una suite di skill e agenti, non un runtime applicativo. Le aree più pertinenti sono:

- `seo-programmatic`;
- `seo-drift`;
- `seo-sitemap`;
- `seo-schema`;
- `seo-google`;
- `seo-content-brief`;
- `seo-geo`;
- `seo-visual`.

#### Pattern utili

- valutazione della qualità del dataset prima di generare route;
- distinzione fra blocchi statici e dati realmente unici;
- standalone value test per ogni pagina;
- rollout progressivo invece di pubblicazione massiva;
- hub/spoke, breadcrumb e cross-link da attributi reali;
- esclusione delle pagine deboli da sitemap e indicizzazione;
- baseline/diff di title, canonical, robots, heading, schema, status e hash;
- separazione fra audit raw HTML e verifica visuale browser.

#### Limiti

- le soglie numeriche del repository non sono automaticamente canoniche;
- molte istruzioni sono euristiche testuali, non test eseguibili;
- i riferimenti a policy e aggiornamenti devono essere verificati su fonti primarie prima dell'adozione;
- il sistema non conosce la governance claim/evidence di Senza Roaming.

### 4. `soliwkr/thesprint-uk` + `soliwkr/the-sprint-context`

**Esito preliminare: ESTRARRE lezioni di prodotto, tracking e rollout**

Il contesto del progetto documenta un precedente tentativo pSEO su scala molto ampia che non ha dimostrato indicizzazione o conversioni delle pagine programmatiche nel checkpoint osservato.

#### Lezione strategica da adottare

```text
persona / problema / intento
→ pilota ristretto
→ indicizzazione osservata
→ click outbound attribuito
→ conversione verificabile
→ soltanto allora scala
```

Questo sostituisce l'approccio:

```text
matrice geografica enorme
→ generazione
→ deploy
→ speranza di indicizzazione
```

#### Primitive tracking interessanti

- `event_id` condiviso per deduplicazione client/server;
- tassonomia evento + contesto pagina;
- sub-ID coerente per variante/intento;
- acquisizione first-touch in memoria di sessione prima della persistenza consentita;
- distinzione fra click CTA e conversione reale.

#### Parti da riscrivere

- l'intera landing è una React island `client:load`, troppo pesante per il sito pubblico content-first;
- cookie, durata, click ID e storage devono discendere dalla CMP e dalla valutazione privacy;
- claim e testimonianze hardcoded non sono compatibili con l'evidence model;
- il codice affiliate deve usare configurazione riservata e modalità esplicitamente attivata.

### 5. `itallstartedwithaidea/analytics-auditor`

**Esito preliminare: ADATTARE come checklist di verifica M6**

Utile dopo l'implementazione di CMP, GTM e GA4:

- rilevamento tag e consent mode;
- checklist GA4/GTM;
- convenzioni eventi;
- remediation e report JSON/CSV;
- controllo dei pixel effettivamente presenti.

Non va importata l'applicazione single-file né il modello con chiavi e chiamate API direttamente dal browser. Sono riusabili firme di rilevamento, checklist e casi di test.

### 6. `soliwkr/open-design`

**Esito preliminare: ESTRARRE il processo, non il runtime**

Il valore è nel metodo:

- brief strutturato prima della generazione;
- estrazione esplicita del brand o del riferimento;
- direzione visuale scelta e bloccata;
- piano visibile;
- pre-flight;
- autocritica prima della consegna;
- verifica dell'artifact reale.

Il repository è molto grande, in rapida evoluzione e introduce un daemon, molti agent adapter, design system e superfici non necessarie. Non diventa dipendenza di Senza Roaming.

### 7. `soliwkr/programmatic-seo-engine` e upstream `itallstartedwithaidea/programmatic-seo-engine`

**Esito preliminare: ESTRARRE algoritmi; SCARTARE il renderer**

Primitive utili:

- partizionamento sitemap;
- sitemap index;
- matrice route/dati;
- tiered indexing come concetto;
- canonical e schema per template;
- conteggio preventivo delle URL.

Parti incompatibili:

- HTML generato tramite template string in edge function;
- milioni di pagine come obiettivo primario;
- contenuto distinto dichiarato ma non dimostrato da un evidence model;
- FAQ/schema replicati automaticamente;
- assenza di gate editoriali equivalenti a Senza Roaming.

### 8. `itallstartedwithaidea/reddit`

**Esito preliminare: ESTRARRE deduplica e verifica; SCARTARE autopublish**

Pattern potenzialmente utili:

- semantic dedup storica;
- attribuzione della fonte community;
- state machine del lavoro;
- verifica live della route dopo il deploy;
- notifiche su failure.

La pipeline `discover → generate → commit → publish` è incompatibile. Community e trend possono generare opportunità editoriali, non pagine pubblicate autonomamente.

## Candidati da parcheggiare

### `soliwkr/hyperframes-student-kit`

Utile dopo il lancio per video, social e distribuzione. Sono interessanti brand token, `DESIGN.md`, storyboard e ciclo `lint → preview → render → frame verification`. Non riduce il percorso critico del frontend pubblico.

### `Soliwkr-pro/advertising-hub`

Parcheggiare fino a quando esistono eventi canonici e dati. Estrarre in seguito i pattern di tracking specialist e attribution analyst; non introdurre MCP advertising o gestione campagne durante il lancio organico.

### `itallstartedwithaidea/agent-skills`

Catalogo utile per consultare selettivamente skill Cloudflare, observability, security, verification loop e frontend. Non installare tutte le skill nel repository.

### `msitarzewski/agency-agents`

Usare come libreria di ruoli e checklist, non come architettura multi-agent. Potenzialmente pertinenti: codebase onboarding, minimal-change engineering, accessibility, technical writing e review.

### `itallstartedwithaidea/ContextOS`

Sono interessanti i concetti di sorgente live/warm/cold, staleness, fallback e context budget. Il runtime è troppo ampio e duplicherebbe memoria canonica, retrieval e orchestrazione. Il repository GitHub resta la fonte di verità.

## Candidati da scartare per il percorso corrente

### `Soliwkr-pro/geo-visual-opportunity-engine`

Il nome non corrisponde al caso d'uso: il progetto sintetizza prodotti, genera immagini e pubblica automaticamente su Shopify/WooCommerce. È incompatibile con il prodotto e con il divieto di autopubblicazione.

### `Soliwkr-pro/intel-harvester`

Contact harvesting, email inference e SMTP verification non appartengono a Senza Roaming. Si può consultare in futuro soltanto per pattern tecnici generici come sitemap-first discovery o ads transparency.

### `itallstartedwithaidea/business-discovery-engine`

Lead discovery, scraping di directory e contatti B2B non sono pertinenti. Checkpoint e crash recovery sono pattern già coperti meglio dai Workflow esistenti.

## Decisioni preliminari

### D1 — Non adottare alcun motore pSEO completo

Senza Roaming deve costruire il proprio catalogo pubblico sull'evidence model esistente. I motori analizzati possono fornire route, sitemap, controlli e rollout, ma non il contenuto fattuale finale.

### D2 — Separare generazione, rendering e indicizzazione

```text
brief approvato
→ claim verificati
→ evidence bundle
→ draft
→ decisione editoriale
→ renderer Astro
→ quality gate SEO/GEO
→ pubblicazione esplicita
→ verifica indicizzazione e conversione
```

Nessun repository analizzato giustifica la fusione di questi passaggi.

### D3 — Pilotare prima di scalare

Il primo catalogo non deve essere una matrice enorme. Il candidato iniziale resta un cluster ristretto di pagine commerciali e informative, selezionato per intento e supportato da evidenze.

La scala futura dipende da:

- indicizzazione reale;
- impression e query;
- click outbound;
- conversioni attribuite;
- costo di aggiornamento delle evidenze;
- assenza di duplicazione e thin content.

### D4 — Gli strumenti GEO sono quality gate, non generatori di verità

Uno score GEO non sostituisce fonti, claim atomici o revisione editoriale. Può misurare crawlability, struttura e regressioni dopo che il contenuto è stato approvato.

## Spike proposti

Gli spike restano separati dall'audit e non sono ancora autorizzati.

### Spike A — Primitive Astro da Rank Empire

Confrontare, senza copiare alla cieca:

- slug normalization;
- route builders;
- schema graph;
- breadcrumb/internal links;
- sitemap e robots;
- test build-time.

**Criterio di successo:** riduzione misurabile del lavoro M5 senza introdurre D1 diretto dal browser, HTML raw non governato o logica rank-and-rent.

### Spike B — SEO/GEO regression gate

Confrontare:

1. GEO Optimizer CLI;
2. drift checks di Claude SEO;
3. smoke e quality gate già presenti in `soliwkr/esim`.

**Criterio di successo:** trova regressioni reali con falsi positivi accettabili, output macchina stabile e costo CI sostenibile.

### Spike C — Contratto analytics e affiliate

Derivare dal progetto Sprint soltanto:

- nomi evento;
- parametri obbligatori;
- `event_id`;
- sub-ID;
- first-touch;
- click outbound;
- conversione confermata dal provider.

**Criterio di successo:** un solo dizionario eventi documentato, compatibile con CMP, GA4/GTM e tracking affiliate privacy-first.

### Spike D — Brief visuale frontend pubblico

Applicare il processo Open Design per produrre:

- pubblico e obiettivo;
- architettura pagine;
- direzione visuale;
- componenti necessari;
- mobile e accessibilità;
- checklist anti-template/anti-AI-slop;
- criteri di accettazione visivi.

**Criterio di successo:** una direzione approvabile prima di implementare M5, senza introdurre il runtime Open Design.

## Impatto preliminare sul lancio

Non si riduce ancora formalmente la stima di lancio. Le capacità non sono state integrate né testate in `soliwkr/esim`.

Stima preliminare, da confermare con gli spike:

- primitive Astro e slug: possibile risparmio **1–3 giorni**;
- checklist SEO/GEO e drift: possibile risparmio **1–2 giorni** e minore rischio regressioni;
- contratto tracking Sprint: possibile risparmio **1–2 giorni**;
- processo visuale Open Design: riduce soprattutto il rischio di rework, non necessariamente i giorni nominali.

I risparmi non sono sommabili automaticamente. Alcuni candidati aggiungono tempo di integrazione e manutenzione.

## Lavoro ancora aperto nell'audit

1. verificare i file sorgente principali di Rank Empire contro l'architettura attuale di `apps/web`;
2. eseguire la triage dei restanti repository `itallstartedwithaidea` per famiglie e duplicati;
3. approfondire le skill selettive di `agent-skills` e `agency-agents`;
4. confrontare licenze e provenienza del codice prima di qualunque estrazione;
5. trasformare i candidati confermati in una matrice costo/beneficio;
6. proporre una sola sequenza di spike, senza aprire più fronti contemporaneamente.

## Freeze durante l'audit

- nessuna modifica al backend Senza Roaming;
- nessuna nuova mutation;
- nessun workflow reale avviato;
- nessun contenuto pubblicato;
- nessuna affiliazione attivata;
- nessun deploy pubblico dovuto a questa branch documentale;
- nessun codice copiato dai repository analizzati.
