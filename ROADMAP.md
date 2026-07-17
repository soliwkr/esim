# Senza Roaming — Roadmap

Questa è la roadmap canonica del progetto `soliwkr/esim`. Descrive l'ordine con cui Senza Roaming passa da infrastruttura funzionante a proprietà editoriale, SEO e affiliate governabile.

Ultimo aggiornamento: **17 luglio 2026**.

## Come leggere i documenti

La roadmap non è l'inventario completo delle capacità.

- [`ROADMAP.md`](ROADMAP.md) — **quando** costruiamo e rilasciamo ogni blocco;
- [`docs/CAPABILITY-MAP.md`](docs/CAPABILITY-MAP.md) — **quali layer** compongono il sistema e dove vivono;
- [`docs/SKILL-REGISTRY.md`](docs/SKILL-REGISTRY.md) — **quali skill, repository e servizi** vengono adottati, condivisi, differiti o usati soltanto come riferimento;
- [`docs/STATUS.md`](docs/STATUS.md) — fotografia dello stato reale;
- [`docs/NEXT.md`](docs/NEXT.md) — prossime azioni eseguibili.

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
4. Un requisito generale non è un claim verificato: i claim fattuali devono essere atomici e riferiti a un soggetto preciso.
5. Ogni automazione deve essere osservabile, idempotente e protetta.
6. Il repository è la memoria canonica; la chat non è il database del progetto.
7. Senza Roaming resta un execution project autonomo. Il futuro Command Center dello studio potrà governarlo tramite API, senza assorbirne dati e logica specifici.
8. Una skill viene adottata soltanto se migliora una decisione, produce output strutturato e ha ownership e criterio di successo.

## Milestone M0 — Fondazioni tecniche

**Stato: completato, salvo ultima verifica canonica `www`**

- [x] Worker pubblico su Cloudflare.
- [x] D1 con migrazioni versionate.
- [x] Deploy manuale da GitHub Actions.
- [x] Dominio principale `senzaroaming.it` collegato.
- [x] Container `last30days` operativo.
- [x] Cloudflare Workflow per il radar della domanda.
- [x] Endpoint protetti di manutenzione.
- [x] Risposte 404 reali e noindex per file inesistenti e scanner.
- [x] Redirect canonico `www → apex` implementato e distribuito.
- [x] Prima istanza Workflow completata end-to-end.
- [x] Primo import di segnali verificato in D1.
- [ ] Verificare in produzione il `308` da `www.senzaroaming.it` al dominio principale.

**Layer:** L0, L1, base L2.  
**Criterio di uscita:** dominio canonico stabile, Worker sano, Container sano e almeno un run osservabile end-to-end.

## Milestone M1 — Memoria operativa, qualità e osservabilità

**Stato: quasi completato**

- [x] Roadmap, status, architettura, decisioni e prossime azioni.
- [x] Capability Map e Skill Registry.
- [x] Endpoint per lo stato di una singola istanza di ricerca.
- [x] Storico sintetico dei run con esito, segnali ed errore.
- [x] Quality gate recent-demand con `eligible`, `filtered` e override umano.
- [x] Riepilogo qualità pronto per dashboard.
- [x] Audit specifico di run, brief, claim e verifiche.
- [ ] Log degli errori recenti consultabile senza aprire più pannelli Cloudflare.
- [ ] Health aggregato di Worker, D1, Workflow, Container e AI Gateway.
- [ ] Audit log unificato delle azioni umane e automatiche.

**Layer:** L0, L1, L2.  
**Skill attivate:** `last30days`, Evidence Collector, Reality Checker, Security Engineer.  
**Criterio di uscita:** stato e qualità del sistema comprensibili da una singola interfaccia o risposta API.

## Milestone M2 — Motore AI editoriale controllato

**Stato: nucleo completato e verificato in produzione**

- [x] Cloudflare AI Gateway configurato.
- [x] Vertex AI BYOK configurato.
- [x] Google Cloud Billing riattivato.
- [x] Smoke test `SENZA_ROAMING_AI_OK` riuscito.
- [x] Input limitato ai segnali `eligible`.
- [x] Output JSON strutturato e validato.
- [x] Clustering dei segnali recenti.
- [x] Opportunity Score v1.
- [x] Evidence Score deterministico v1.
- [x] Priority Score deterministico v1.
- [x] Brief editoriali persistiti in D1.
- [x] Provenienza segnale → brief.
- [x] Idempotenza delle analisi.
- [x] Stati di revisione del brief.
- [x] Primo brief reale verificato in produzione.
- [x] Accettazione umana prima della conversione.
- [x] Conversione brief → requisiti di verifica.
- [x] Generazione automatica dei task `verify_claims`.
- [x] Decomposizione requisiti → claim atomici per soggetto.
- [x] Matching tra soggetto del claim e soggetto della fonte.
- [x] Esiti `verified`, `contradicted`, `insufficient`, `dismissed`.
- [x] Primo evidence set con 5 claim verificati e 1 insufficiente.
- [x] Nessuna pubblicazione automatica.
- [ ] Deduplicazione semantica rispetto a brief e pagine storiche.
- [ ] Trust Score che distingua dichiarazioni ufficiali, test first-party e corroborazione indipendente.

**Layer:** L2, L3, L4.  
**Skill attivate:** customer research, content strategy, AI SEO, Evidence Collector, Reality Checker.  
**Criterio di uscita:** raggiunto per il nucleo v1; l'AI trasforma segnali in brief e task verificabili senza poter pubblicare autonomamente.

## Milestone M3 — Page Readiness ed evidence bundle

**Stato: prossimo blocco**

- [ ] Aggregare claim verificati, insufficienti, in conflitto e scaduti.
- [ ] Distinguere dichiarazioni del provider e test first-party.
- [ ] Calcolare `readyForReviewDraft` separatamente da `readyForPublication`.
- [ ] Produrre un evidence bundle versionato per brief o pagina.
- [ ] Collegare ogni sezione proposta ai claim e alle fonti utilizzate.
- [ ] Bloccare frasi assertive basate su claim insufficienti o scaduti.
- [ ] Preservare conflitti documentali con scope differenti.
- [ ] Creare o aggiornare pagine soltanto in stato `review`.
- [ ] Garantire idempotenza sulla stessa versione dell'evidence bundle.
- [ ] Creare il primo draft `esim-cina-senza-vpn` in revisione.

**Layer:** L2, L3, L4, L5.  
**Skill attivate:** Evidence Collector, Reality Checker, content strategy, copywriting controllato.  
**Criterio di uscita:** un evidence set verificato può diventare un draft revisionabile, ma non una pagina pubblicata.

## Milestone M4 — Dashboard operativa del progetto

**Stato: pianificato; backend già in larga parte disponibile**

Dashboard specifica di Senza Roaming, non Command Center generale dello studio.

- [ ] Accesso privato tramite Cloudflare Access o autenticazione equivalente.
- [ ] Panoramica infrastruttura e health aggregato.
- [ ] Storico run e diagnosi errori.
- [ ] Radar della domanda con filtri `eligible` e `filtered`.
- [ ] Revisione e azioni sui segnali.
- [ ] Coda dei brief AI con Opportunity, Evidence e Priority Score.
- [ ] Accettazione, scarto e conversione dei brief.
- [ ] Claim generali, claim atomici e relativi task.
- [ ] Registro fonti, claim insufficienti, conflitti e scadenze.
- [ ] Page Readiness ed evidence bundle.
- [ ] Avvio manuale di ricerche e controlli senza `curl`.
- [ ] Anteprima dei contenuti prima della pubblicazione.
- [ ] Audit log delle azioni umane e automatiche.
- [ ] API stabili esportabili verso il futuro Control Plane dello studio.

**Layer:** L0, L4, L9.  
**Skill attivate:** Security Engineer, Experiment Tracker, workflow operations.  
**Criterio di uscita:** le operazioni quotidiane non richiedono terminale o accesso diretto a D1.

## Milestone M5 — Primo catalogo pubblicabile

**Stato: preparazione**

- [ ] Confermare le quattro pagine fondamentali già pubblicabili.
- [ ] Verificare le pagine commerciali Tier 1.
- [ ] Completare le prime destinazioni ad alta intenzione.
- [ ] Pubblicare guide su compatibilità, installazione e attivazione.
- [ ] Pubblicare confronti provider supportati da fonti.
- [ ] Convertire i draft approvati in pagine pubblicabili.
- [ ] Migliorare navigazione mobile, gerarchia e internal linking.
- [ ] Consolidare tono editoriale, design system e componenti.
- [ ] Testare schema markup, sitemap, canonical e pagina 404.
- [ ] Introdurre checklist editoriali per customer research, copywriting, schema e AI SEO.

**Layer:** L4, L5, L6.  
**Skill attivate:** product marketing, copywriting, content strategy, schema, programmatic SEO con quality gate.  
**Criterio di uscita:** nucleo di contenuti utile, verificato e navigabile, non una collezione di template vuoti.

## Milestone M6 — Misurazione e indicizzazione

**Stato: pianificato**

- [ ] Google Search Console.
- [ ] Invio e monitoraggio della sitemap.
- [ ] GA4.
- [ ] Google Tag Manager.
- [ ] CMP e consenso prima di tracking non essenziale.
- [ ] Eventi canonici per click, CTA e passaggi ai provider.
- [ ] Definizioni uniche delle metriche.
- [ ] Report su query, landing page, CTR e indicizzazione.
- [ ] Registro esperimenti con ipotesi, metrica, finestra e decisione.
- [ ] CRO soltanto su traffico e conversioni osservabili.

**Layer:** L6, L7.  
**Skill attivate:** analytics, CRO, Experiment Tracker.  
**Riferimento adottato:** principi metrici di Full Funnel AI Analytics, senza warehouse prematuro.  
**Criterio di uscita:** domanda, scoperta, comportamento e qualità tecnica misurabili senza ambiguità.

## Milestone M7 — Intelligence SEO e trend condivisa

**Stato: decisione architetturale presa, implementazione separata**

- [ ] OpenSEO distribuito come servizio dello studio, non incorporato nel Worker.
- [ ] Progetto OpenSEO dedicato a Senza Roaming.
- [ ] Cloudflare Access.
- [ ] Search Console collegata.
- [ ] Budget DataForSEO attribuito per progetto.
- [ ] Rank tracking e competitor set iniziale.
- [ ] Audit periodici e trasferimento delle opportunità nella coda del progetto.
- [ ] Trends MCP come segnale di momentum e stagionalità.
- [ ] Audit periodico `claude-seo` come ispettore esterno.
- [ ] Opportunity Score v2 con GSC, trend, SERP e conversioni.

**Layer:** L2, L6, L9.  
**Servizi:** OpenSEO, Trends MCP, Search Console, DataForSEO.  
**Playbook:** SEO audit, AI SEO, schema, Reality Checker.  
**Criterio di uscita:** il progetto riceve intelligence condivisa senza diventare un monolite.

## Milestone M8 — Monetizzazione controllata

**Stato: non avviato**

- [ ] Identificare programmi affiliate ufficiali.
- [ ] Approvazioni dei provider.
- [ ] Link conservati come secret.
- [ ] Disclosure visibile e coerente.
- [ ] Attivazione esplicita di `AFFILIATE_MODE=enabled`.
- [ ] Tracking click privacy-first.
- [ ] Attribuzione per pagina, destinazione, provider e posizione CTA.
- [ ] Monitoraggio di link rotti, programmi sospesi e condizioni cambiate.
- [ ] Revenue Score solo dopo dati sufficienti.

**Layer:** L7, L8.  
**Skill attivate:** product marketing, copywriting, CRO, analytics.  
**Criterio di uscita:** monetizzazione senza compromettere indipendenza editoriale, privacy o accuratezza.

## Milestone M9 — Crescita e manutenzione continua

**Stato: futuro**

- [ ] Ciclo settimanale della domanda recente.
- [ ] Controllo periodico delle fonti scadute.
- [ ] Discovery mensile di nuovi cluster.
- [ ] Aggiornamento delle pagine che perdono visibilità.
- [ ] Priorità basata su Opportunity, Trust e Revenue Score.
- [ ] Audit tecnico, editoriale e GEO ricorrente.
- [ ] Espansione internazionale solo dopo stabilità del modello italiano.
- [ ] Contratto API con il futuro Command Center dello studio.
- [ ] Valutare warehouse e attribuzione avanzata soltanto a scala reale.

**Layer:** tutti, con particolare peso su L6–L9.  
**Criterio di uscita:** crescita guidata da dati, fonti e risultati, non da produzione indiscriminata.

## Ordine operativo attuale

1. verificare definitivamente il redirect `www → apex`;
2. implementare Page Readiness ed evidence bundle;
3. creare il primo draft esclusivamente in stato `review`;
4. completare health aggregato e audit log;
5. costruire la Dashboard MVP del progetto;
6. costruire il primo blocco di contenuti verificati;
7. collegare Search Console, consenso e analytics;
8. attivare OpenSEO e trend intelligence condivisi;
9. attivare affiliazioni soltanto dopo quality gate e misurazione.

## Regola di aggiornamento

Ogni nuova idea deve aggiornare il documento corretto:

- cambia l'ordine o il rilascio → `ROADMAP.md`;
- aggiunge o modifica un layer → `docs/CAPABILITY-MAP.md`;
- introduce una skill, un repository o un servizio → `docs/SKILL-REGISTRY.md`;
- cambia una scelta architetturale → `docs/DECISIONS.md`;
- cambia ciò che è realmente operativo → `docs/STATUS.md`.
