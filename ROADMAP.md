# Senza Roaming — Roadmap

Ultimo aggiornamento: **23 luglio 2026**.

Questa è la roadmap canonica del repository `soliwkr/esim`.

## Documenti operativi

- `ROADMAP.md` — ordine dei blocchi e criteri di uscita;
- `docs/STATUS.md` — stato reale verificato;
- `docs/NEXT.md` — lavoro immediatamente eseguibile;
- `docs/ARCHITECTURE.md` — confini tecnici;
- `docs/DECISIONS.md` — decisioni accettate;
- `docs/FRONTEND-PLAN.md` — migrazione Astro e Control Room;
- `docs/PUBLIC-FRONTEND-PARALLEL-TRACK.md` — separazione M4/M5;
- `docs/PUBLIC-HOMEPAGE-CANDIDATE-SCOPE.md` — scope della prossima slice pubblica.

## Principi non negoziabili

1. L’AI non pubblica direttamente.
2. Brief, claim, readiness, draft, materializzazione e pubblicazione sono gate distinti.
3. Prezzo, copertura, rete, hotspot, fair use, durata e attivazione richiedono fonti identificabili e data di verifica.
4. Un claim insufficiente o scaduto non alimenta testo fattuale.
5. Il browser non accede direttamente a D1.
6. Una capacità mutabile usa branch, conferma, identità verificata, state machine, audit e test.
7. Il sito pubblico resta content-first e progressivamente migliorabile.
8. Una preview Astro non equivale a un cutover.
9. Una route pubblicata non equivale a una pagina pubblicabile.
10. Il repository è la memoria canonica.

## M0 — Fondazioni tecniche

**Stato: completato, salvo verifica definitiva `www → apex`.**

- [x] Worker pubblico Cloudflare;
- [x] D1 con migrazioni versionate;
- [x] deploy automatico;
- [x] dominio principale;
- [x] Container `last30days`;
- [x] Workflow recent-demand;
- [x] endpoint di manutenzione protetti;
- [x] vere 404 e noindex;
- [x] primo ciclo end-to-end;
- [ ] ricontrollare il redirect 308 `www`.

## M1 — Memoria, qualità e osservabilità

**Stato: quality gate operativo; osservabilità avanzata ancora aperta.**

- [x] documentazione canonica;
- [x] storico run e audit;
- [x] filtro freshness;
- [x] score zero deterministico;
- [x] golden evaluation in CI;
- [x] topic-mismatch gate;
- [x] snapshot aggregato Control Room;
- [x] audit repository esterni;
- [ ] verificare topic-mismatch sul primo nuovo run autorizzato;
- [ ] health runtime aggregato;
- [ ] log errori unificati;
- [ ] audit log unificato oltre la vista corrente.

## M2 — Motore AI editoriale controllato

**Stato: nucleo v1 operativo.**

- [x] AI Gateway e Vertex AI;
- [x] input limitato ai segnali idonei;
- [x] output strutturato;
- [x] opportunity, evidence e priority score;
- [x] brief persistiti;
- [x] accettazione e conversione umana legacy;
- [x] claim atomici;
- [x] matching claim/fonte;
- [x] esiti verified, contradicted, insufficient e dismissed;
- [x] primo evidence set;
- [x] nessuna pubblicazione automatica;
- [ ] deduplicazione semantica storica;
- [ ] Trust Score con fonti ufficiali, indipendenti e first-party.

## M3 — Page Readiness e draft grounded

**Stato: completato e verificato.**

- [x] aggregazione claim e conflitti;
- [x] separazione `readyForReviewDraft` / `readyForPublication`;
- [x] evidence bundle versionato;
- [x] provenance per campi, sezioni e FAQ;
- [x] esclusione dei claim insufficienti;
- [x] materializzazione soltanto in `review`;
- [x] primo draft grounded;
- [x] approvazione editoriale senza pubblicazione.

## M4 — Control Room definitiva

**Stato: parità read-only completa; prima mutation in produzione; mutation residue aperte.**

### Foundation e sicurezza

- [x] Astro shell e React island;
- [x] shadcn/ui;
- [x] custom Worker entrypoint;
- [x] Cloudflare Access;
- [x] validazione origine;
- [x] sessione server-side;
- [x] nessuna credenziale applicativa nel browser;
- [x] API legacy preservate.

### Letture migrate

- [x] overview e health;
- [x] radar, segnali e brief;
- [x] claim, fonti, scadenze e task;
- [x] readiness ed evidence bundle;
- [x] draft e dettaglio on demand;
- [x] queue e audit;
- [x] linkage claim → task;
- [x] linkage audit → versione draft;
- [x] audit sistematico di parità legacy.

### Mutation

- [x] decisione brief `proposed → accepted | dismissed`;
- [ ] conversione brief `accepted → converted`;
- [ ] operazioni claim;
- [ ] decisione draft;
- [ ] eventuale retry queue;
- [ ] rimozione legacy privata dopo parità mutabile.

**Criterio di uscita M4:** tutte le mutation necessarie sono migrate e la legacy non è più un fallback operativo.

## M5 — Frontend pubblico Astro e primo catalogo

**Stato: track parallela attiva; shell e trust pages in preview produttiva.**

### M5.0 — Public shell

- [x] `/astro-foundation` trasformata in preview noindex;
- [x] layout, metadata, header, menu e footer riusabili;
- [x] raw HTML utile senza JavaScript;
- [x] mobile e tastiera verificati;
- [x] apice `/` invariato;
- [x] preview fuori sitemap;
- [x] checkpoint mobile in produzione.

### M5.1 — Trust pages

- [x] Metodo editoriale preview;
- [x] Trasparenza preview;
- [x] Privacy preview;
- [x] componente condiviso;
- [x] navigazione preview-aware;
- [x] route canoniche legacy preservate;
- [x] CI completa;
- [x] checkpoint mobile produttivo 3/3.

### M5.2 — Homepage candidata

**Prossima branch:** `feat/public-homepage-candidate`.

- [ ] leggere server-side soltanto righe `published`;
- [ ] condividere il read model con la legacy senza query divergenti;
- [ ] renderizzare guide in evidenza e destinazioni principali;
- [ ] preservare raw HTML, noindex, no-store e sitemap exclusion;
- [ ] mantenere `/` sul renderer legacy;
- [ ] verificare fixture published/review ed empty state;
- [ ] checkpoint visuale live.

Scope: `docs/PUBLIC-HOMEPAGE-CANDIDATE-SCOPE.md`.

### M5.3 — Listing e architettura informativa

- [ ] Destinazioni preview;
- [ ] Guide preview;
- [ ] Confronti preview;
- [ ] internal linking deterministico;
- [ ] route matrix e fail-fast.

### M5.4 — Renderer editoriale Astro

- [ ] pagina articolo grounded;
- [ ] blocchi strutturati, non HTML AI grezzo;
- [ ] provenance e fonti;
- [ ] claim esclusi non presentati come fatti;
- [ ] related links deterministici.

### M5.5 — Parità SEO

- [ ] canonical;
- [ ] sitemap;
- [ ] robots;
- [ ] schema;
- [ ] disclosure condizionale;
- [ ] redirect provider;
- [ ] vere 404;
- [ ] drift/regression test.

### M5.6 — Catalogo pilot

- [ ] piccolo set di pagine con intento distinto;
- [ ] evidence e publication eligibility richieste;
- [ ] nessuna generazione massiva;
- [ ] verifica indicizzazione e click prima della scala.

### M5.7 — Cutover apex

- [ ] PR separata e autorizzazione esplicita;
- [ ] confronto route e metadata;
- [ ] schema, sitemap e 404 validi;
- [ ] provider redirect preservati;
- [ ] rollback documentato;
- [ ] nessuna pagina review esposta;
- [ ] rimozione renderer legacy solo dopo verifica.

## M6 — Misurazione e indicizzazione

**Stato: infrastruttura esterna preparata; integrazione non avviata.**

L’operatore ha dichiarato creati GTM, GA4, Search Console e un service account con accesso. Nessuna credenziale è configurata nel repository.

- [ ] CMP;
- [ ] Consent Mode;
- [ ] dizionario eventi canonico;
- [ ] GTM;
- [ ] GA4;
- [ ] Search Console e sitemap;
- [ ] verifica dati reali;
- [ ] report query, landing, CTR e indicizzazione;
- [ ] registro esperimenti.

M6 parte soltanto dopo la stabilizzazione delle route pubbliche. Nessun tracking sulle preview noindex.

## M7 — Intelligence SEO condivisa

**Stato: pianificato.**

- [ ] Search Console collegata operativamente;
- [ ] rank tracking e competitor set;
- [ ] Trends per momentum e stagionalità;
- [ ] opportunity score v2;
- [ ] audit tecnico, editoriale e GEO.

## M8 — Monetizzazione controllata

**Stato: non avviato.**

- [ ] programmi affiliate ufficiali;
- [ ] disclosure visibile;
- [ ] link come configurazione riservata;
- [ ] attivazione esplicita affiliate mode;
- [ ] tracking privacy-first;
- [ ] revenue score dopo dati sufficienti.

## M9 — Crescita e manutenzione

**Stato: futuro.**

- [ ] ciclo settimanale della domanda;
- [ ] refresh fonti scadute;
- [ ] discovery mensile cluster;
- [ ] aggiornamento pagine in perdita;
- [ ] espansione internazionale dopo stabilità italiana.

## Ordine operativo attuale

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
homepage candidata
→ listing
→ renderer articolo
→ parità SEO
→ catalogo pilot
→ cutover apex separato
```

### Dopo M5 stabile

```text
CMP e Consent Mode
→ GTM / GA4
→ Search Console
→ misurazione
→ monetizzazione controllata
```
