# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Checkpoint appena chiuso

```text
M5.7 — apex design cutover
PR #81
merge e62b570248bf97afaa3f283cfbb847ceea01f529
CI finale #404 completamente verde
verifica live completata
```

Controlli live confermati:

- homepage con nuovo design Astro;
- articolo `/migliore-esim`;
- `/sitemap.xml`;
- `/robots.txt`;
- redirect `/go/airalo`;
- navigazione e rendering operativi.

Documento:

```text
docs/PUBLIC-APEX-CUTOVER-RESULT-2026-07-24.md
```

## Now — M6 measurement foundation

### 1. Definire lo scope M6

Aprire una branch documentale dal `main` aggiornato:

```text
docs/measurement-consent-scope
```

Lo scope deve descrivere:

- quali dati vengono raccolti;
- finalità e basi di consenso;
- categorie di cookie e storage;
- data-flow browser → CMP → Consent Mode → GTM → GA4;
- proprietà e container Google già preparati;
- ambienti e domini coinvolti;
- responsabilità tra Astro, Worker e servizi Google;
- comportamento prima del consenso, dopo accettazione e dopo rifiuto;
- debug e verifica senza esporre ID sensibili inutilmente;
- rollback e disattivazione.

Nessun codice di tracking viene inserito nella PR documentale.

### 2. Inventariare l’infrastruttura Google esistente

Registrare senza secret:

- stato del container GTM;
- stato della proprietà GA4;
- stato della proprietà Search Console;
- service account e permessi, senza chiavi;
- dominio verificato;
- eventuali stream web esistenti;
- sitemap attuale e URL canonico.

Non assumere che “creato” equivalga a “collegato al sito”.

### 3. Scegliere e configurare la CMP

Criteri obbligatori:

- compatibilità con Consent Mode;
- nessun tracking non essenziale prima del consenso;
- accessibilità da tastiera e mobile;
- lingua italiana;
- gestione revoca/modifica consenso;
- policy versionata;
- impatto prestazionale misurabile;
- nessuna dipendenza dal renderer legacy.

La scelta della CMP richiede una decisione versionata prima dell’implementazione.

### 4. Versionare il dizionario eventi

Prima di collegare GTM o GA4 definire eventi e proprietà canoniche.

Prima versione minima:

```text
page_view
navigation_click
article_view
listing_view
provider_redirect_intent
consent_update
```

Per ogni evento definire:

- trigger;
- parametri consentiti;
- dati vietati;
- finalità;
- requisito di consenso;
- owner;
- metodo di verifica.

Non inviare PII, token, query operative o dati della Control Room.

### 5. Implementare Consent Mode prima di GTM/GA4

Branch tecnica separata, dopo scope e decisione CMP.

Acceptance:

- stato negato/default prima della scelta;
- aggiornamento coerente dopo consenso;
- rifiuto rispettato;
- revoca funzionante;
- nessun hit non consentito;
- nessun impatto sulla Control Room;
- nessun accesso browser a D1;
- noindex/no-store delle preview invariati;
- sito pubblico senza regressioni.

### 6. Collegare GTM e GA4

Solo dopo Consent Mode verificato:

- un solo caricamento del container;
- nessun doppio `page_view`;
- eventi conformi al dizionario;
- debug in ambiente controllato;
- verifica Network e DebugView;
- nessun evento dalla Control Room;
- nessun secret nel repository;
- performance e Core Web Vitals ricontrollati.

### 7. Search Console e sitemap submission

Dopo stabilizzazione di CMP, Consent Mode e tracking:

- verificare proprietà dominio;
- controllare canonical e robots live;
- controllare `/sitemap.xml`;
- inviare la sitemap;
- registrare data e risultato;
- verificare indicizzazione senza forzare pagine `review`;
- mantenere preview escluse.

## Track parallela M4

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

M4 può proseguire su branch separate. La legacy privata resta finché serve come fallback operativo.

## Publication capability resta separata

M6 non introduce:

```text
review → published
```

La prima pubblicazione richiede ancora:

- autorizzazione esplicita;
- branch mutation separata;
- identità verificata;
- conferma umana;
- state machine D1;
- audit append-only;
- idempotenza;
- freshness recheck;
- rollback/deindicizzazione;
- test end-to-end e verifica live.

## Freeze immediato

- niente tracking prima della decisione CMP e dello scope M6;
- niente snippet GTM o GA4 inseriti direttamente senza Consent Mode;
- niente eventi non versionati;
- niente PII o dati operativi nei payload analytics;
- niente analytics nella Control Room;
- niente sitemap submission prima del checkpoint tecnico;
- niente affiliazioni anticipate;
- niente rimozione della legacy privata;
- niente pubblicazione automatica;
- niente modifiche a D1, Workflow, Container, AI o gate editoriali durante la foundation M6.
