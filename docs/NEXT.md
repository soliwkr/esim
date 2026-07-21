# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **21 luglio 2026**.

## Now

### 1. Chiudere la PR #37 — Claim, fonti e scadenze

Branch:

```text
feat/control-room-claims-sources
```

Obiettivo esclusivo: sostituire la preview iniziale dei claim con una vista read-only completa sui campi già presenti nello snapshot protetto.

La fase non modifica backend, D1, Workflow, Container, AI, gate editoriali o contratti API.

### 2. Verificare il contratto claim

Ogni record deve validare esplicitamente:

- ID e brief collegato;
- soggetto, campo, testo e domanda di verifica;
- stato canonico;
- evidence e note;
- created at e updated at;
- source kind, label, URL e trust level;
- verification status, confidence, checked at e valid until;
- task status;
- array `required_source_kinds`;
- valore persistito senza reinterpretazione.

Un campo non conforme deve rendere il payload invalido. Il client non ricostruisce dati mancanti.

### 3. Verificare la vista read-only

La vista deve offrire:

- filtri per stato, brief, fonte, verifica e scadenza;
- tabella con stato canonico e stato temporale distinti;
- dettaglio accessibile da tastiera;
- fonte separata dall'evidenza;
- URL esterno soltanto per protocolli HTTP/HTTPS;
- empty state reale e empty state dei filtri;
- layout utilizzabile su desktop e mobile.

Lo stato temporale deriva soltanto da `valid_until`:

```text
null                    → senza scadenza
data futura             → valida
data passata o presente → scaduta
```

Non riscrive lo stato canonico e non rende utilizzabile un claim insufficiente o scaduto.

### 4. Definition of Done

Prima del merge devono passare:

- TypeScript strict e build Astro;
- migrazioni locali, incluso il quality gate `0018`;
- smoke del quality gate invariato;
- build e smoke del Container invariati;
- bundle reale dentro `workerd`;
- smoke Chromium generale della Control Room;
- smoke Chromium dedicato a claim, fonti e scadenze;
- filtri, Sheet, tastiera, mobile, contratto invalido ed empty state;
- nessuna richiesta browser diversa da `GET`;
- nessuna credenziale o accesso diretto a D1;
- nessuna route o azione di pubblicazione;
- nessuna regressione su overview, radar, segnali, brief e draft preview.

### 5. Verificare il deploy reale

Dopo il merge:

- aprire `https://senzaroaming.it/control-room-foundation`;
- verificare il titolo “Claim, fonti e scadenze”;
- provare almeno un filtro di stato e uno di scadenza;
- aprire il dettaglio di un claim reale;
- verificare fonte, verifica, validità e task quando presenti;
- controllare desktop e mobile;
- confermare che non esistano azioni di modifica o pubblicazione.

### 6. Fase successiva

Dopo la verifica reale:

```text
feat/control-room-readiness-evidence
```

Scope previsto: Page Readiness ed evidence bundle in sola lettura, senza approvazioni o generazione draft nella stessa fase.

## Fuori scope immediato

- decomposizione o modifica dei claim;
- verifica, dismiss o refresh manuale;
- creazione o modifica delle fonti;
- mutation della maintenance queue;
- nuovi endpoint o query D1;
- readiness actions, approvazione draft o pubblicazione;
- modifiche alla Control Room legacy;
- framework esterni di data quality.

## Checkpoint completati il 21 luglio 2026

### Sessione server-side

- PR #31 mergiata e verificata;
- un solo login Cloudflare Access;
- proxy snapshot read-only;
- nessuna credenziale applicativa nel browser.

### Overview e health

- PR #32 mergiata e verificata;
- metriche, capability, binding, timestamp e guardrail visibili;
- errori parziali e contratti runtime verificati.

### Radar e brief

- PR #34 mergiata e verificata;
- run, segnali e brief visibili;
- filtro run → segnali basato su `run_id`;
- punteggi, flag e nullable preservati;
- nessun linkage segnale → brief inventato.

### Quality gate score zero

- PR #36 mergiata nel commit `2927419`;
- CI, migrazione e deploy completati;
- segnale reale con score zero ora filtrato;
- flag `zero_relevance` visibile;
- conteggi riallineati;
- nessuna modifica automatica a brief o claim.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation nella PR read-only #37.
