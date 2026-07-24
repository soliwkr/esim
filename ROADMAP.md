# Senza Roaming — Roadmap

Ultimo aggiornamento: **24 luglio 2026**.

Questa è la roadmap canonica di `soliwkr/esim`.

## Documenti operativi

- `ROADMAP.md` — milestone e criteri di uscita;
- `docs/STATUS.md` — stato verificato;
- `docs/NEXT.md` — lavoro immediato;
- `docs/ARCHITECTURE.md` — confini tecnici;
- `docs/DECISIONS.md` — decisioni accettate;
- `docs/FRONTEND-PLAN.md` — migrazione Astro e Control Room;
- `docs/PUBLIC-SEO-ROUTING-OWNERSHIP-SCOPE.md` — route policy;
- `docs/PUBLIC-CANONICAL-ASTRO-PARITY-SCOPE.md` — renderer canonico Astro;
- `docs/PUBLIC-SEO-ENDPOINT-PARITY-SCOPE.md` — sitemap e robots;
- `docs/PUBLIC-CATALOG-PILOT-SCOPE.md` — catalogo pilot M5.6.

## Principi non negoziabili

1. L’AI non pubblica direttamente.
2. Brief, claim, readiness, draft, materializzazione e pubblicazione sono gate distinti.
3. I fatti commerciali richiedono fonti identificabili e data di verifica.
4. Claim insufficienti o scaduti non alimentano testo fattuale.
5. Il browser non accede direttamente a D1.
6. Ogni mutation richiede identità verificata, conferma, state machine, audit e test.
7. Astro è il frontend principale; React resta una island per interattività complessa.
8. Una preview Astro non equivale a un cutover.
9. Una riga `review` non equivale a contenuto pubblico.
10. Owner target, codice compilato e owner live sono concetti distinti.
11. Candidate, release candidate e pagina published sono stati distinti.
12. Il repository è la memoria canonica.

## M0 — Fondazioni tecniche

**Stato: completato salvo verifica definitiva `www → apex`.**

- [x] Worker e D1;
- [x] migrazioni versionate;
- [x] deploy automatico;
- [x] dominio principale;
- [x] Container e Workflow;
- [x] API manutenzione protette;
- [x] vere 404 e noindex;
- [ ] ricontrollare redirect `www`.

## M1 — Qualità e osservabilità

**Stato: quality gate operativo; osservabilità avanzata aperta.**

- [x] documentazione canonica;
- [x] storico run e audit;
- [x] freshness;
- [x] score zero deterministico;
- [x] golden evaluation;
- [x] topic-mismatch gate;
- [x] snapshot Control Room;
- [ ] verifica live topic-mismatch;
- [ ] health aggregato;
- [ ] log errori unificati.

## M2 — Motore AI editoriale

**Stato: nucleo v1 operativo.**

- [x] AI Gateway e Vertex;
- [x] segnali idonei soltanto;
- [x] brief strutturati e persistiti;
- [x] claim atomici e fonti;
- [x] esiti verificati;
- [x] nessuna pubblicazione automatica;
- [ ] deduplicazione semantica storica;
- [ ] Trust Score evoluto.

## M3 — Readiness e draft grounded

**Stato: completato e verificato.**

- [x] aggregazione claim e conflitti;
- [x] review-draft eligibility separata dalla publication eligibility;
- [x] evidence bundle versionato;
- [x] provenance field-level;
- [x] esclusione claim insufficienti;
- [x] materializzazione solo in `review`;
- [x] primo draft grounded approvato senza pubblicazione.

## M4 — Control Room definitiva

**Stato: letture complete; prima mutation in produzione; mutation residue aperte.**

- [x] Astro shell, React island e shadcn/ui;
- [x] Cloudflare Access e sessione server-side;
- [x] browser senza credenziali applicative;
- [x] letture e parità legacy read-only;
- [x] decisione brief `proposed → accepted | dismissed`;
- [ ] conversione brief;
- [ ] operazioni claim;
- [ ] decisione draft;
- [ ] eventuale retry queue;
- [ ] rimozione legacy privata dopo parità mutabile.

## M5 — Frontend pubblico Astro e catalogo

**Stato: M5.0–M5.5b.3 completate senza cutover; M5.6a implementata e verificata dalla CI applicativa #373, PR #77 ancora da chiudere.**

### M5.0–M5.4 — Preview e renderer pubblico

- [x] shell, trust pages, homepage e listing preview;
- [x] renderer articolo grounded;
- [x] published-only, 404 e fail-closed;
- [x] desktop, mobile e tastiera;
- [x] route canoniche live preservate.

### M5.5 — Parità SEO e routing

- [x] PR #69 — contratto SEO condiviso;
- [x] PR #71 — route policy, CI #329;
- [x] PR #73 — canonical Astro parity, CI #350;
- [x] PR #75 — sitemap/robots parity, CI #365;
- [x] owner live ancora backend;
- [ ] header HTTP live da controllo esterno dedicato.

### M5.6 — Catalogo pilot

Scope: `docs/PUBLIC-CATALOG-PILOT-SCOPE.md`.

#### M5.6a — Candidate audit foundation

```text
branch feat/public-catalog-pilot-foundation
PR #77
CI applicativa #373 completamente verde
```

- [x] modello tipizzato server-only;
- [x] loader D1 con sole query `SELECT`;
- [x] latest evidence bundle e latest draft;
- [x] publication eligibility e approvazioni umane;
- [x] grounded renderer e provenance;
- [x] claim, fonti e freshness correnti;
- [x] coerenza draft/pagina materializzata;
- [x] slug riservati e file probe esclusi;
- [x] collisioni di keyword e risposta diretta;
- [x] cap deterministico massimo quattro;
- [x] report selected/excluded con blocker e warning;
- [x] manifest versionato e validato;
- [x] manifest iniziale deliberatamente vuoto;
- [x] fixture eligible, blocked, stale, drift, duplicate, over-cap ed empty;
- [x] smoke sul D1 realmente migrato;
- [x] conteggi e stati identici before/after audit;
- [x] nessuna migration, mutation, route o endpoint publish;
- [x] active matrix invariata;
- [x] tutte le suite Control Room verdi nella CI applicativa;
- [ ] CI finale code + canonici;
- [ ] PR #77 pronta e merge.

#### M5.6b — Audit e preparazione release candidate reali

- [ ] definire un percorso read-only sicuro verso la D1 remota;
- [ ] eseguire l’audit sui dati reali senza scegliere nomi in anticipo;
- [ ] produrre report remoto con blocker;
- [ ] mantenere zero candidate se nessuna supera i gate;
- [ ] preparare una pagina alla volta tramite il ciclo editoriale esistente;
- [ ] aggiornare il manifest soltanto con ID e versioni reali verificati;
- [ ] massimo quattro release candidate, tutte ancora `review`.

#### M5.6c — Decisione di pubblicazione

**Non autorizzata da M5.6a.**

- [ ] scegliere se pubblicare prima, durante o dopo M5.7;
- [ ] branch mutation separata;
- [ ] transizione `review → published` server-side e auditata;
- [ ] conferma umana, idempotenza e freshness recheck;
- [ ] rollback/deindicizzazione;
- [ ] test end-to-end e verifica live.

La pagina Cina non entra automaticamente nel pilot: lo stato noto resta `publication_eligible=false` e `review`.

### M5.7 — Cutover apex

- [ ] PR separata e autorizzazione esplicita;
- [ ] modifica minima della matrice attiva;
- [ ] confronto route e metadata;
- [ ] schema, sitemap, robots e 404 validi;
- [ ] redirect provider preservati;
- [ ] rollback documentato;
- [ ] nessuna pagina review esposta;
- [ ] rimozione legacy solo dopo verifica.

## M6 — Misurazione e indicizzazione

**Stato: infrastruttura esterna preparata; integrazione non avviata.**

- [ ] CMP e Consent Mode;
- [ ] dizionario eventi;
- [ ] GTM e GA4;
- [ ] Search Console e submission sitemap;
- [ ] verifica dati reali e reporting.

## M7 — Intelligence SEO

- [ ] GSC operativa;
- [ ] rank tracking, competitor e Trends;
- [ ] opportunity score v2;
- [ ] audit tecnico/editoriale/GEO.

## M8 — Monetizzazione controllata

- [ ] programmi affiliate ufficiali e disclosure;
- [ ] configurazione riservata dei link;
- [ ] tracking privacy-first;
- [ ] revenue score dopo dati sufficienti.

## M9 — Crescita e manutenzione

- [ ] ciclo domanda settimanale;
- [ ] refresh fonti scadute;
- [ ] discovery cluster;
- [ ] aggiornamento pagine in perdita;
- [ ] espansione internazionale dopo stabilità italiana.

## Ordine operativo

### Track A — M4

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
→ rimozione legacy privata
```

### Track B — M5

```text
chiusura PR #77
→ audit remoto read-only
→ release candidate reali in review
→ decisione esplicita publication/cutover
→ M5.7 apex cutover
```

### Dopo M5 stabile

```text
CMP e Consent Mode
→ GTM / GA4
→ Search Console
→ misurazione
→ monetizzazione controllata
```
