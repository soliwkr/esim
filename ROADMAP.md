# Senza Roaming — Roadmap

Questa è la roadmap canonica del progetto `soliwkr/esim`. Descrive l'ordine con cui Senza Roaming passa da infrastruttura funzionante a proprietà editoriale, SEO e affiliate governabile.

Ultimo aggiornamento: **21 luglio 2026**.

## Come leggere i documenti

- [`ROADMAP.md`](ROADMAP.md) — ordine dei blocchi e criteri di uscita;
- [`docs/FRONTEND-PLAN.md`](docs/FRONTEND-PLAN.md) — migrazione frontend e Control Room;
- [`docs/CAPABILITY-MAP.md`](docs/CAPABILITY-MAP.md) — layer del sistema;
- [`docs/SKILL-REGISTRY.md`](docs/SKILL-REGISTRY.md) — skill, repository e servizi adottati;
- [`docs/STATUS.md`](docs/STATUS.md) — stato operativo reale;
- [`docs/NEXT.md`](docs/NEXT.md) — lavoro immediatamente eseguibile.

## Layer coperti

```text
L0  Governance, sicurezza e controllo
L1  Runtime, orchestrazione e dati
L2  Evidence, ricerca e trend
L3  AI intelligence controllata
L4  Operazioni editoriali
L5  Contenuto e product experience
L6  SEO, AEO e GEO
L7  Analytics, metriche ed esperimenti
L8  Monetizzazione
L9  Dashboard e integrazione studio
```

## Principi non negoziabili

1. L'AI non pubblica direttamente.
2. Community e trend generano opportunità editoriali, non claim commerciali.
3. Prezzi, copertura, rete, hotspot, fair use, durata, attivazione, routing e accesso richiedono fonti identificabili e data di verifica.
4. Un requisito generale non è un claim verificato.
5. Ogni automazione deve essere osservabile, idempotente e protetta.
6. Il repository è la memoria canonica; la chat non è il database del progetto.
7. Senza Roaming resta un execution project autonomo.
8. Una capacità viene adottata soltanto se migliora una decisione e ha ownership e criterio di successo.
9. Non si riscrivono componenti generici già risolti da librerie mature.
10. Il sito pubblico resta content-first; JavaScript viene caricato soltanto dove serve.

## M0 — Fondazioni tecniche

**Stato: completato, salvo verifica canonica `www`**

- [x] Worker pubblico su Cloudflare.
- [x] D1 con migrazioni versionate.
- [x] Deploy automatico da GitHub Actions.
- [x] Dominio principale collegato.
- [x] Container `last30days` operativo.
- [x] Cloudflare Workflow per il radar.
- [x] Endpoint protetti di manutenzione.
- [x] Vere 404 e noindex per scanner e file inesistenti.
- [x] Redirect `www → apex` implementato.
- [x] Primo run end-to-end e ingest in D1.
- [ ] Verificare definitivamente il `308` in produzione.

## M1 — Memoria, qualità e osservabilità

**Stato: quasi completato**

- [x] Roadmap, status, architettura, decisioni e next.
- [x] Capability Map e Skill Registry.
- [x] Storico e stato dei run.
- [x] Quality gate `eligible` / `filtered`.
- [x] Audit specifico di run, brief, claim e verifiche.
- [x] Snapshot aggregato per dashboard.
- [ ] Health aggregato runtime completo.
- [ ] Log errori recenti in una singola interfaccia.
- [ ] Audit log unificato.

## M2 — Motore AI editoriale controllato

**Stato: nucleo v1 completato in produzione**

- [x] AI Gateway e Vertex AI BYOK.
- [x] Input limitato ai segnali idonei.
- [x] Output strutturato e validato.
- [x] Opportunity, Evidence e Priority Score.
- [x] Brief persistiti e provenienza segnale → brief nel backend.
- [x] Accettazione umana e conversione in requisiti e task.
- [x] Decomposizione in claim atomici.
- [x] Matching soggetto claim/fonte.
- [x] Esiti verificati, contraddetti, insufficienti e dismiss.
- [x] Primo evidence set: 5 verified, 1 insufficient.
- [x] Nessuna pubblicazione automatica.
- [ ] Deduplicazione semantica storica.
- [ ] Trust Score con prove ufficiali, first-party e indipendenti.

## M3 — Page Readiness e draft grounded

**Stato: completato e verificato in produzione**

- [x] Aggregazione claim verificati, insufficienti, conflitti e scadenze.
- [x] Separazione dichiarazioni provider e test first-party.
- [x] `readyForReviewDraft` separato da `readyForPublication`.
- [x] Evidence bundle versionato.
- [x] Provenienza claim per campi, sezioni e FAQ.
- [x] Blocco dei claim insufficienti come fatti.
- [x] Conflitti documentali preservati per scope.
- [x] Materializzazione soltanto in `review`.
- [x] Primo draft Cina v2 grounded.
- [x] Approvazione editoriale senza pubblicazione.

## M4 — Frontend foundation e Control Room definitiva

**Stato: checkpoint attuale**

### M4.0 — Freeze legacy

- [x] Control Room HTML manuale riconosciuta come transitoria.
- [x] Legacy limitata a fallback e bugfix critici.
- [x] Nessuna nuova funzione importante costruita con HTML e DOM manuale.

### M4.1 — Astro e Cloudflare

- [x] `apps/web` con Astro e React integration.
- [x] Custom Worker entrypoint.
- [x] API, D1, Workflow e Container nello stesso execution plane.
- [x] Build e smoke runtime dentro `workerd`.
- [x] Deploy automatico e live smoke.
- [x] Un solo Worker.

### M4.2 — UI foundation

- [x] shadcn/ui installato e versionato.
- [x] Shell dashboard responsive in una React island.
- [x] Overview, claim preview e draft preview read-only.
- [x] Hydration, loading, error, empty, tastiera e mobile verificati.
- [ ] Confronto Mantine soltanto se emerge un vantaggio misurabile.

### M4.3 — Perimetro privato e sessione

- [x] Cloudflare Access.
- [x] Validazione dell'identità nell'origine.
- [x] Sessione mediata dal Worker.
- [x] Secondo login applicativo rimosso.
- [x] Snapshot automatico senza credenziali nel browser.
- [x] API originale invariata per agenti e consumer legacy.

### M4.4 — Migrazione funzionale Control Room

Ordine:

- [x] Overview e health — PR #32 mergiata, distribuita e verificata.
- [x] Radar e brief — PR #34 mergiata, distribuita e verificata.
- [ ] Claim, fonti e scadenze — **prossima fase**.
- [ ] Page Readiness ed evidence bundle.
- [ ] Draft, preview e decisioni.
- [ ] Queue e audit.
- [ ] Azioni operative autorizzate, una per branch.
- [ ] Rimozione legacy dopo parità funzionale.

#### Radar e brief — risultato verificato

- run, segnali e brief reali sono visibili;
- il filtro run → segnali usa il `run_id` canonico;
- punteggi, stati, quality flags e valori nullable restano quelli persistiti;
- la UI non inventa un collegamento diretto segnale → brief non esposto dallo snapshot;
- contratti runtime, desktop, mobile e tastiera sono verificati;
- nessuna mutation o pubblicazione è stata introdotta.

#### Claim, fonti e scadenze — scope successivo

Usare esclusivamente i dati già presenti nello snapshot:

- claim, brief collegato, soggetto, campo, testo e stato;
- domanda di verifica, evidence e note;
- fonte, URL, trust level e source kinds richiesti;
- verification status, confidence, checked at e valid until;
- task status;
- filtri e dettaglio read-only;
- stato temporale della scadenza distinto dallo stato canonico del claim.

Non include modifica o verifica claim, gestione fonti, refresh, queue mutation, nuovi endpoint, query D1 o pubblicazione.

**Criterio di uscita M4:** le operazioni quotidiane sono disponibili nella nuova UI con contratti verificati; la legacy può essere rimossa senza perdere guardrail o funzioni necessarie.

## M5 — Frontend pubblico Astro e primo catalogo

**Stato: dopo M4**

- [ ] Migrare layout, home e navigazione.
- [ ] Migrare pagine statiche.
- [ ] Migrare listing destinazioni, guide e confronti.
- [ ] Migrare pagina articolo e preview.
- [ ] Conservare canonical, sitemap, schema e vere 404.
- [ ] Migliorare mobile, gerarchia e internal linking.
- [ ] Pubblicare soltanto contenuti supportati da evidence set.
- [ ] Eliminare renderer HTML, CSS e JavaScript manuali.

## M6 — Misurazione e indicizzazione

**Stato: pianificato**

- [ ] Google Search Console e sitemap.
- [ ] CMP e consenso.
- [ ] GA4 e GTM.
- [ ] Eventi canonici e definizioni uniche delle metriche.
- [ ] Report query, landing, CTR e indicizzazione.
- [ ] Registro esperimenti e CRO su dati osservabili.

## M7 — Intelligence SEO e trend condivisa

**Stato: direzione presa, implementazione separata**

- [ ] OpenSEO come servizio dello studio.
- [ ] Progetto dedicato a Senza Roaming.
- [ ] Search Console collegata.
- [ ] Rank tracking, competitor set e audit.
- [ ] Trends MCP per momentum e stagionalità.
- [ ] Opportunity Score v2.

## M8 — Monetizzazione controllata

**Stato: non avviato**

- [ ] Programmi affiliate ufficiali.
- [ ] Disclosure visibile.
- [ ] Link come configurazione riservata.
- [ ] Attivazione esplicita della modalità affiliate.
- [ ] Tracking privacy-first e attribuzione.
- [ ] Revenue Score dopo dati sufficienti.

## M9 — Crescita e manutenzione continua

**Stato: futuro**

- [ ] Ciclo settimanale della domanda recente.
- [ ] Refresh automatico delle fonti scadute.
- [ ] Discovery mensile di cluster.
- [ ] Aggiornamento delle pagine in perdita.
- [ ] Audit tecnico, editoriale e GEO.
- [ ] Espansione internazionale dopo stabilità italiana.
- [ ] Contratto API con il futuro Command Center.

## Ordine operativo attuale

1. migrare claim, fonti e scadenze in sola lettura;
2. migrare readiness ed evidence bundle;
3. migrare draft, preview e decisioni;
4. migrare queue e audit;
5. introdurre azioni operative soltanto con scope espliciti e separati;
6. rimuovere la legacy soltanto dopo parità funzionale;
7. migrare il sito pubblico ad Astro;
8. collegare Search Console, consenso e analytics;
9. attivare OpenSEO e trend intelligence;
10. attivare affiliazioni soltanto dopo quality gate e misurazione.

## Regola di aggiornamento

- cambia ordine o rilascio → `ROADMAP.md`;
- cambia il piano frontend → `docs/FRONTEND-PLAN.md`;
- cambia una scelta architetturale → `docs/DECISIONS.md`;
- cambia ciò che è realmente operativo → `docs/STATUS.md`;
- cambia il lavoro immediato → `docs/NEXT.md`.
