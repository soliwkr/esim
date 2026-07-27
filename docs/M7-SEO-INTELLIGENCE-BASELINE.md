# M7 — SEO intelligence baseline

Data: **27 luglio 2026**.

## Stato

```text
milestone: M7 — Intelligence SEO
phase: baseline e keyword ownership
branch: docs/m7-seo-intelligence-baseline
base: e80d30eb52ff820a7386bc193a54437b49d430e2
runtime changes: none
live copy changes: none
deploy: not authorized
```

Questa baseline definisce l'ownership degli intenti prima di qualsiasi modifica al copy pubblico. Non introduce nuove route, contenuti pubblicati, tracking, mutation o automazioni.

## Fonti usate

| Fonte | Data o riferimento | Uso | Limite |
|---|---|---|---|
| `research/keyword-planner/README.md` | importazione 16 luglio 2026; periodo 1 luglio 2025–30 giugno 2026 | domanda potenziale e priorità | i volumi Planner sono fasce arrotondate |
| `research/keyword-planner/page-map.csv` | repository al commit base | keyword, cluster, intento e blueprint storici | le somme aggregate possono sovrapporsi |
| `migrations/0005_published_pages.sql` | repository al commit base | quattro pagine fondamentali iniziali | seed versionato, non fotografia autonoma del D1 remoto |
| route e componenti Astro | repository al commit base | title, H1, promessa e linking correnti | descrive il codice distribuito, non una nuova scansione esterna |
| `docs/STATUS.md` e risultato M6 | 27 luglio 2026 | superficie pubblica e checkpoint live già verificati | non sostituisce Search Console |
| Search Console | proprietà `sc-domain:senzaroaming.it`; export live 27 luglio 2026 | domanda osservata, pagine e query | snapshot 26–27 luglio fresco: 0 click, 0 impression, 0 righe dimensionali |

Regole:

- nessun volume viene inventato;
- un campo senza fonte resta vuoto;
- `0` significa zero osservato soltanto quando la fonte lo dichiara;
- Planner misura domanda potenziale, non traffico previsto;
- Search Console misura domanda osservata, non volume di mercato;
- una keyword non equivale automaticamente a una pagina.

## Superficie pubblica di acquisizione

La matrice canonica espone:

```text
/
/destinazioni
/guide
/confronti
/metodo
/trasparenza
/privacy
/{slug-published}
```

Per M7 la prima mappa copre:

```text
/
/destinazioni
/guide
/confronti
/migliore-esim
/esim-estero
/esim-come-funziona
/esim-telefoni-compatibili
```

`/metodo`, `/trasparenza` e `/privacy` sono pagine trust. Restano indicizzabili secondo il contratto corrente, ma non ricevono un target commerciale forzato.

## Inventario corrente

| URL | Ruolo | Title corrente | H1 corrente | Stato M7 |
|---|---|---|---|---|
| `/` | ingresso e orientamento | `eSIM da viaggio: guide e confronti | Senza Roaming` | `Trova la eSIM giusta prima di partire.` | da specializzare come umbrella |
| `/destinazioni` | hub geografico | `eSIM per destinazione | Senza Roaming` | `eSIM per destinazione` | hub, non pagina Paese |
| `/guide` | hub informativo | `Guide pratiche sulle eSIM | Senza Roaming` | `Guide pratiche sulle eSIM` | hub, non risposta monografica |
| `/confronti` | hub comparativo | `Confronti tra eSIM e provider | Senza Roaming` | `Confronti tra eSIM e provider` | hub, non classifica unica |
| `/migliore-esim` | pagina decisionale | `Migliore eSIM per viaggiare: come scegliere | Senza Roaming` | `La migliore eSIM dipende dal viaggio` | owner di `migliore esim` |
| `/esim-estero` | guida commerciale | `eSIM per l’estero: guida alla scelta | Senza Roaming` | `Come scegliere una eSIM per l’estero` | owner di `esim estero` |
| `/esim-come-funziona` | guida fondamentale | `eSIM: come funziona, vantaggi e limiti | Senza Roaming` | `eSIM: come funziona davvero` | owner di `esim come funziona` |
| `/esim-telefoni-compatibili` | guida compatibilità | `Telefoni compatibili con eSIM: come verificare | Senza Roaming` | `Come verificare se un telefono supporta eSIM` | owner di `telefoni con esim` |

## Tassonomia degli intenti

La keyword map usa un livello editoriale più preciso senza modificare lo schema D1:

| Intento M7 | Definizione | Esempio |
|---|---|---|
| `informational` | capire un concetto o completare una procedura | `esim come funziona` |
| `commercial-investigation` | valutare una soluzione prima della scelta | `migliore esim`, `esim estero` |
| `comparative` | confrontare direttamente alternative o criteri | `airalo vs holafly` |
| `transactional` | cercare acquisto, promozione o attivazione immediata | `codice sconto holafly` |
| `navigational` | raggiungere un brand o servizio noto | `airalo` |
| `trust` | capire metodo, trasparenza o privacy | `metodo editoriale` |

Il campo D1 `search_intent` resta invariato. Un'eventuale migrazione della tassonomia richiederà scope separato.

## Ownership delle query

### Homepage

Owner dell'ombrello `eSIM da viaggio` / `esim viaggio` e della navigazione fra bisogni. Non deve diventare la risposta completa a `migliore esim`, `esim estero`, `esim come funziona` o alle query Paese.

Promessa target:

> Orientare il lettore verso il percorso corretto — destinazione, guida pratica o confronto — senza fingere che una sola eSIM sia migliore per tutti.

### `/destinazioni`

Hub di scoperta per Paese. Deve distribuire autorità e utenti alle pagine destinazione pubblicate. Non deve tentare di possedere `esim USA`, `esim Giappone` o altre query Paese specifiche.

### `/guide`

Hub dei problemi pratici: funzionamento, compatibilità, installazione, attivazione, consumi e limiti. Non deve sostituire le risposte monografiche di `/esim-come-funziona` o `/esim-telefoni-compatibili`.

### `/confronti`

Hub comparativo. Deve spiegare quali confronti esistono e distribuire verso pagine comparative distinte. `/migliore-esim` resta la pagina decisionale generale; i futuri confronti provider restano URL autonome.

### `/migliore-esim`

Owner di `migliore esim` e varianti equivalenti. La promessa non è una classifica automatica, ma un metodo decisionale verificabile basato su destinazione, durata, dati, hotspot, rete, attivazione e prezzo datato.

### `/esim-estero`

Owner di `esim estero`. Risponde alla scelta fra piano locale, regionale o globale in funzione dell'itinerario. Non deve assorbire la query generale `migliore esim` né le query Paese.

### `/esim-come-funziona`

Owner informativo del funzionamento della eSIM. Deve coprire profilo digitale, installazione, attivazione, dual SIM e limiti generali senza trasformarsi in pagina di scelta provider.

### `/esim-telefoni-compatibili`

Owner della verifica di compatibilità del modello esatto. Le future pagine iPhone, Samsung o Xiaomi potranno approfondire famiglie specifiche, ma dovranno supportare questo hub senza duplicarne la promessa.

## Blueprint storico da non materializzare automaticamente

La page map storica contiene `/esim-viaggio` con keyword `esim viaggio`. In questa baseline l'intento umbrella viene assegnato alla homepage. `/esim-viaggio` non deve essere creato o pubblicato senza una nuova prova di intento distinto.

La page map contiene inoltre pagine `provider`, mentre il catalogo pubblico ha listing soltanto per `destination`, `guide` e `comparison`. Questa PR non crea un hub provider e non modifica il routing.

## Target on-page

I target completi sono versionati in:

```text
research/seo/m7-keyword-map.csv
```

Ogni riga definisce:

- ruolo della route;
- intento primario e fase del viaggio;
- keyword primaria e secondarie;
- fonte e volume disponibile;
- title e H1 correnti;
- title e H1 target;
- promessa;
- sezioni richieste;
- query da non presidiare;
- priorità e criterio di successo.

I target sono specifiche editoriali, non copy approvato per la produzione.

## Cannibalizzazione

La matrice è versionata in:

```text
research/seo/m7-cannibalization-matrix.csv
```

Principi:

1. una sola URL possiede ogni keyword primaria;
2. gli hub distribuiscono, non duplicano, le risposte monografiche;
3. la homepage presidia l'ombrello, non tutte le query commerciali;
4. una pagina Paese possiede la propria destinazione;
5. una pagina confronto possiede la coppia o il criterio specifico;
6. le varianti lessicali con intento identico convergono nello stesso URL;
7. un blueprint storico non autorizza una nuova route.

## Internal linking target

La matrice è versionata in:

```text
research/seo/m7-internal-linking-targets.csv
```

Gerarchia:

```text
homepage
├── /destinazioni
├── /guide
└── /confronti

/destinazioni
└── pagine Paese pubblicate

/guide
├── /esim-come-funziona
├── /esim-telefoni-compatibili
└── /esim-estero

/confronti
└── /migliore-esim
```

La matrice iniziale contiene soltanto URL esistenti. I futuri target non devono ricevere link live finché la route non è pubblicata e idonea.

## Search Console

Stato noto:

```text
property: sc-domain:senzaroaming.it
sitemap: https://senzaroaming.it/sitemap.xml
submission: 26 luglio 2026
```

Primo export diretto eseguito il 27 luglio 2026:

```text
source: Search Console Search Analytics API
range: 2026-07-26 → 2026-07-27
dataState: all
daily rows: 2
query rows: 0
page rows: 0
query-page rows: 0
country rows: 0
device rows: 0
clicks: 0
impressions: 0
firstIncompleteDate: 2026-07-26
```

Conseguenze:

- l'accesso read-only, la proprietà dominio e l'export diretto sono verificati;
- nessuna impression, posizione, CTR o click viene inserita nella keyword map oltre agli zero realmente osservati nello snapshot;
- i dati sono ancora incompleti e possono cambiare;
- l'assenza di righe dimensionali non modifica l'ownership delle query;
- la submission della sitemap non viene ripetuta;
- non viene usata la Indexing API;
- zero righe non viene trattato come errore di indicizzazione;
- gli export restano locali e non vengono commitati automaticamente.

## Acceptance criteria della baseline

- [x] route pubbliche prioritarie inventariate;
- [x] dati Planner esistenti separati dai dati GSC;
- [x] primo snapshot GSC reale acquisito e registrato senza inferenze premature;
- [x] intenti informativi, commerciali e comparativi distinti;
- [x] una sola ownership primaria per URL e keyword;
- [x] cannibalizzazioni principali esplicitate;
- [x] title, H1, promessa e outline target definiti;
- [x] internal linking target definito;
- [x] volumi mancanti lasciati vuoti;
- [x] nessuna nuova route o pagina;
- [x] nessuna modifica a runtime, copy live, D1 o measurement;
- [x] nessun deploy.

## Fase successiva

Una PR distinta potrà applicare il primo riallineamento on-page, con scope ristretto e testabile. L'ordine raccomandato è:

```text
homepage e tre listing
→ verifica preview e smoke
→ /migliore-esim
→ prime richieste manuali soltanto per URL realmente pronte
```

Questa baseline non autorizza pubblicazione, nuove pagine, pSEO, rank tracking, eventi analytics, affiliazioni o modifiche ai gate editoriali.
