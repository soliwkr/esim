# Public catalog remote audit — scope M5.6b

Data di riferimento: **24 luglio 2026**.

## Stato

M5.6a è completata e mergiata con:

```text
PR #77
merge fa9ed9486e400e77ad915153284c7b277a51b4d0
CI finale #379 completamente verde
```

La foundation possiede già un modello server-only, un loader D1 read-only, un audit deterministico e un manifest versionato con massimo quattro entry.

Questa fase autorizza soltanto il percorso necessario per eseguire lo stesso audit sui dati remoti reali.

## Sequenza operativa

```text
M5.6a audit foundation
→ M5.6b remote read-only audit
→ M5.7 apex design cutover
→ publication capability separata
→ M6 measurement
```

Un manifest remoto vuoto non blocca M5.7. Il nuovo design può essere portato sull’apice continuando a servire esclusivamente le righe già `published`.

La pubblicazione di nuove release candidate non è un prerequisito del cutover visuale.

## Obiettivo esclusivo

Eseguire un audit read-only dei dati editoriali remoti e produrre un risultato verificabile senza:

- modificare D1;
- creare un endpoint SQL generico;
- esporre token o secret;
- pubblicare pagine;
- cambiare la route ownership;
- distribuire il nuovo design sull’apice;
- attivare analytics o affiliazioni.

## Architettura autorizzata

La prima slice tecnica usa una route privata della Control Room mediata dal Worker:

```text
browser autenticato
→ Cloudflare Access
→ origin JWT validation
→ private GET route
→ loadPublicCatalogPilotSnapshot(env.DB)
→ auditPublicCatalogPilot(snapshot, now)
→ sanitized no-store response
```

Route proposta:

```text
/control-room-foundation/api/catalog-pilot-audit
```

Il nome può essere adattato alle convenzioni reali già presenti nella Control Room, ma la capacità deve restare privata, GET-only e specifica del catalog pilot.

## Perché non usare un endpoint SQL o un token nel browser

Il browser non deve:

- accedere direttamente a D1;
- ricevere il maintenance token;
- inviare query SQL;
- scegliere tabelle o colonne;
- ricevere credenziali Cloudflare;
- costruire il report lato client da dati grezzi.

Il Worker esegue soltanto le query `SELECT` fisse già versionate in `src/public-catalog-pilot.ts`.

## Contratto della route privata

### Metodo

```text
GET only
```

Ogni altro metodo restituisce `405` o il comportamento standard già adottato dalle route private.

### Autenticazione

- Cloudflare Access al bordo;
- validazione JWT nell’origine;
- nessun fallback al maintenance token nel browser;
- nessun token in URL, query string, HTML, bundle o storage.

### Cache e indicizzazione

La risposta deve includere i guardrail privati esistenti, almeno:

```text
Cache-Control: no-store
X-Robots-Tag: noindex, nofollow
```

### Payload

Il payload può contenere:

- timestamp dell’audit;
- conteggi candidate, eligible, selected ed excluded;
- release candidate selezionate;
- candidate escluse;
- blocker e warning tipizzati;
- brief, bundle, draft e versioni;
- slug, page type, intent e keyword;
- claim IDs e source URL HTTPS necessari alla tracciabilità;
- stato della pagina materializzata.

Non deve contenere:

- token o secret;
- JWT o header di autenticazione;
- PII;
- configurazione Cloudflare riservata;
- query SQL;
- raw database dump;
- dati non necessari al report;
- capacità o istruzioni di mutation.

## Risultati validi

### Zero candidate

```text
selectedCount = 0
manifest entries = []
```

È un risultato operativo valido. I blocker vengono registrati e nessun contenuto viene inventato per riempire il pilot.

Zero candidate non impedisce M5.7, purché il renderer target continui a leggere soltanto righe `published` e tutti i test di non-esposizione delle pagine `review` restino verdi.

### Da una a quattro candidate

Le entry possono essere trasferite nel manifest canonico soltanto dopo verifica dei dati reali e restano:

```text
pages.status = review
```

### Oltre quattro candidate

L’audit mantiene il cap a quattro con ordinamento deterministico. Nessuna espansione automatica del pilot.

## Gate del remote audit

La risposta remota deve usare gli stessi gate M5.6a:

- latest evidence bundle;
- `publication_eligible=1`;
- `approved_for_publication` umano;
- `ready_for_publication=1`;
- zero blocker e conteggi bloccanti;
- draft grounded corrente e `approved`;
- provenance completa;
- claim e fonti ancora correnti;
- pagina materializzata coerente in `review`;
- `published_at=NULL`;
- `featured=0`;
- slug e intento non collidenti;
- massimo quattro entry.

La route non allenta, sostituisce o ricostruisce questi gate.

## Verifica di assenza mutation

La slice tecnica deve dimostrare localmente e in CI:

```text
before editorial counts and page states
= after audit editorial counts and page states
```

Devono restare assenti:

- `INSERT`;
- `UPDATE`;
- `DELETE`;
- migration;
- publication endpoint;
- mutation UI;
- transizione `review → published`.

## Smoke richiesti

### Sicurezza privata

- richiesta non autenticata bloccata;
- identità Access valida accettata;
- nessun maintenance token nel client;
- GET valido;
- metodi non autorizzati respinti;
- no-store e noindex;
- payload senza secret-like data.

### Dati

- empty state;
- una candidate valida;
- candidate bloccate;
- cap massimo quattro;
- freshness runtime;
- latest bundle/draft;
- review page non pubblicata;
- pagina published protetta ed esclusa dal pilot;
- before/after invariati.

### Regressioni

Sul medesimo head finale devono restare verdi:

- types, typecheck e build;
- migrazioni locali;
- quality gate e golden evaluation;
- Container;
- runtime pubblico;
- route policy;
- canonical Astro parity;
- sitemap e robots parity;
- catalog pilot foundation;
- tutte le suite Control Room.

## Branch tecnica proposta

```text
feat/public-catalog-remote-audit
```

## Deploy e audit remoto

La branch tecnica non autorizza automaticamente un deploy.

Dopo CI verde serve un checkpoint esplicito per distribuire la sola capacità privata e leggere il report remoto reale.

Il deploy della route privata non equivale al cutover del design e non modifica `activePublicRouteDecision`.

## Gate che sblocca M5.7

M5.7 può iniziare quando sono veri tutti i seguenti punti:

- PR M5.6b tecnica mergiata;
- route privata verificata;
- audit remoto eseguito almeno una volta;
- report e manifest coerenti, anche se vuoti;
- nessuna mutation osservata;
- nessuna pagina `review` esposta;
- inventory `published` leggibile dal renderer Astro target;
- rollback del route owner già documentabile;
- autorizzazione esplicita al cutover.

## M5.7 — cosa cambia davvero

Il cutover del nuovo design richiederà una PR separata che modifica soltanto la matrice attiva per le route pubbliche autorizzate:

```text
activePublicRouteDecision
current → target
```

La PR M5.7 dovrà includere:

- home, listing, trust, articoli e 404 Astro;
- sitemap e robots condivisi;
- published-only e fail-closed;
- redirect provider preservati;
- API e Control Room ancora backend-owned;
- confronto metadata e HTML;
- smoke su route canoniche;
- piano di rollback immediato;
- verifica live dopo deploy.

## Publication boundary

M5.6b e M5.7 non introducono automaticamente la transizione:

```text
review → published
```

Le nuove release candidate possono restare in `review` durante il cutover del design.

La prima pubblicazione richiede ancora:

- branch mutation separata;
- identità verificata;
- conferma umana;
- freshness recheck;
- state machine D1;
- audit append-only;
- idempotenza;
- rollback o deindicizzazione;
- test end-to-end.

## Fuori scope

- endpoint SQL generico;
- dump D1 nel repository;
- secret GitHub o Cloudflare versionati;
- query controllate dal browser;
- pubblicazione di nuove pagine;
- modifica dei gate editoriali;
- generazione massiva;
- pSEO a template;
- analytics, CMP, GTM, GA4 o GSC;
- affiliazioni;
- cutover apex nella stessa branch;
- rimozione della legacy privata.