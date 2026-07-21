# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **21 luglio 2026**.

## Now

### 1. Chiudere la PR #34 — Radar e brief

Branch:

```text
feat/control-room-radar-briefs
```

Obiettivo esclusivo: migrare in sola lettura `researchRuns`, `signals` e `briefs` già presenti nello snapshot protetto.

La fase non modifica backend, D1, Workflow, Container, AI, gate editoriali o contratti API.

### 2. Verificare i run del radar

La vista deve mostrare:

- query, sistema sorgente e tipo di run;
- data di generazione e finestra temporale;
- numero risultati e warning;
- conteggi `eligible` e `filtered`;
- filtri e dettaglio read-only;
- stato vuoto reale.

La UI non deve presentare un binding configurato come prova che un nuovo run sia stato eseguito correttamente.

### 3. Verificare i segnali recenti

La vista deve mostrare:

- titolo, topic, tipo e provenienza;
- data di pubblicazione e freshness;
- relevance score;
- stato e `eligible_for_editorial` canonico;
- quality flags;
- collegamento al run di origine tramite `run_id`.

I segnali community o recent-demand restano opportunità editoriali, non prove commerciali.

### 4. Verificare i brief

La vista deve mostrare:

- titolo proposto, cluster, slug, asset type e search intent;
- Opportunity, Evidence e Priority Score persistiti;
- stato e note;
- evidence bundle e readiness quando presenti;
- draft collegato e renderer quando presenti;
- filtri e dettaglio read-only.

La UI non ricalcola o reinterpreta i punteggi. Lo snapshot non espone un collegamento diretto segnale → brief e il client non deve inventarlo.

### 5. Verificare i contratti runtime

Validare esplicitamente:

- `researchRuns`;
- `signals`, `run_id`, idoneità e quality flags;
- `briefs`, punteggi e riferimenti nullable a bundle e draft.

Un record non conforme deve produrre un errore leggibile, non dati parzialmente inventati.

### 6. Definition of Done

Prima del merge devono passare:

- TypeScript strict e build Astro;
- migrazioni locali senza modifiche allo schema;
- build e smoke del Container invariati;
- bundle reale dentro `workerd`;
- snapshot reale con i tre array;
- Chromium desktop e mobile;
- filtri run → segnali e stato brief;
- dettagli Sheet via tastiera e focus;
- loading, error, contratto invalido ed empty state;
- nessuna richiesta browser diversa da `GET`;
- nessuna route o azione di pubblicazione;
- nessuna regressione su overview, claim e draft preview.

## Fuori scope immediato

- avvio manuale del Workflow;
- accettazione o conversione dei brief;
- decomposizione o verifica claim;
- readiness, approvazione draft o queue;
- nuovi endpoint o query D1;
- mutation di qualunque tipo;
- modifiche alla Control Room legacy.

Le azioni operative saranno introdotte soltanto in branch separate, con scope esplicito, conferme accessibili, audit e guardrail invariati.

## Checkpoint completati il 21 luglio 2026

### Sessione server-side

- PR #31 mergiata e verificata;
- un solo login Cloudflare Access;
- proxy snapshot read-only;
- nessuna credenziale applicativa nel browser;
- API originale invariata.

### Overview e health

- PR #32 mergiata con CI completa verde;
- deploy automatico completato;
- verifica manuale nel browser reale completata;
- 19 metriche overview visibili;
- capability, binding, timestamp e guardrail visibili;
- errori parziali e contratti runtime verificati;
- desktop e mobile utilizzabili;
- nessuna mutation o pubblicazione.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente nuovi componenti generici scritti a mano;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- backend editoriale, claim, evidence bundle e gate invariati;
- nessuna pubblicazione automatica;
- nessun bypass pubblico della policy Access;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository.

## Dopo la Control Room

1. migrare il sito pubblico ad Astro;
2. collegare Search Console e sitemap;
3. configurare CMP, GTM e GA4;
4. definire il dizionario canonico degli eventi;
5. attivare OpenSEO e trend intelligence;
6. attivare affiliazioni controllate.
