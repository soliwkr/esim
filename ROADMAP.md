# Senza Roaming — Roadmap

Questa è la roadmap canonica del progetto `soliwkr/esim`. Descrive ciò che deve essere costruito e rilasciato per portare Senza Roaming da infrastruttura funzionante a proprietà editoriale, SEO e affiliate governabile.

Ultimo aggiornamento: **17 luglio 2026**.

## Principi non negoziabili

1. L'AI non pubblica direttamente.
2. Community e trend generano opportunità editoriali, non claim commerciali.
3. Prezzi, copertura, rete, hotspot, fair use, durata e attivazione richiedono fonti ufficiali e data di verifica.
4. Ogni automazione deve essere osservabile, idempotente e protetta.
5. Il repository è la memoria canonica; la chat non è il database del progetto.
6. Senza Roaming resta un execution project autonomo. Il futuro Command Center dello studio potrà governarlo tramite API, senza assorbirne dati e logica specifici.

## Milestone M0 — Fondazioni tecniche

**Stato: sostanzialmente completato**

- [x] Worker pubblico su Cloudflare.
- [x] D1 con migrazioni versionate.
- [x] Deploy manuale da GitHub Actions.
- [x] Dominio principale `senzaroaming.it` collegato.
- [x] Container `last30days` operativo.
- [x] Cloudflare Workflow per il radar della domanda.
- [x] Endpoint protetti di manutenzione.
- [x] Risposte 404 reali e noindex per file inesistenti e scanner.
- [x] Redirect canonico `www → apex` implementato nel codice.
- [ ] Verificare in produzione il redirect `www → senzaroaming.it` dopo l'ultimo deploy.
- [ ] Verificare l'esito completo della prima istanza Workflow e i segnali importati.

**Criterio di uscita:** dominio canonico stabile, Worker sano, Container sano, Workflow completato e almeno un run osservabile end-to-end.

## Milestone M1 — Memoria operativa e osservabilità

**Stato: in corso**

- [x] `ROADMAP.md`.
- [x] `docs/STATUS.md`.
- [x] `docs/ARCHITECTURE.md`.
- [x] `docs/DECISIONS.md`.
- [x] `docs/NEXT.md`.
- [ ] Endpoint per leggere lo stato di una singola istanza di ricerca.
- [ ] Storico sintetico dei run con durata, esito, numero di segnali ed errore.
- [ ] Log degli errori recenti consultabile senza aprire più pannelli Cloudflare.
- [ ] Health aggregato di Worker, D1, Workflow, Container e AI Gateway.

**Criterio di uscita:** lo stato del sistema è comprensibile da una singola interfaccia o risposta API.

## Milestone M2 — Dashboard operativa del progetto

**Stato: pianificato**

Dashboard specifica di Senza Roaming, non Command Center generale dello studio.

- [ ] Accesso privato tramite Cloudflare Access o autenticazione equivalente.
- [ ] Panoramica infrastruttura e run recenti.
- [ ] Radar della domanda con filtri e azioni.
- [ ] Coda editoriale per stato.
- [ ] Registro fonti e claim scaduti.
- [ ] Avvio manuale di ricerche e controlli senza `curl`.
- [ ] Anteprima dei contenuti prima della pubblicazione.
- [ ] Audit log delle azioni umane e automatiche.
- [ ] API stabili esportabili verso il futuro Control Plane dello studio.

**Criterio di uscita:** le operazioni quotidiane del progetto non richiedono terminale o accesso diretto a D1.

## Milestone M3 — Motore AI controllato

**Stato: bloccato parzialmente da Google Cloud Billing**

- [x] Cloudflare AI Gateway configurato.
- [x] Vertex AI BYOK configurato.
- [x] Endpoint `/api/maintenance/ai-smoke` distribuito.
- [ ] Riattivazione dell'account di fatturazione Google Cloud.
- [ ] Smoke test con risposta `SENZA_ROAMING_AI_OK`.
- [ ] Clustering dei segnali recenti.
- [ ] Deduplicazione semantica.
- [ ] Opportunity Score spiegabile.
- [ ] Generazione di brief editoriali strutturati.
- [ ] Creazione di task di verifica per claim mancanti.
- [ ] Gate umano obbligatorio prima della pubblicazione.

**Criterio di uscita:** l'AI trasforma segnali in brief e task verificabili senza poter pubblicare autonomamente.

## Milestone M4 — Primo catalogo pubblicabile

**Stato: preparazione**

- [ ] Confermare le quattro pagine fondamentali già pubblicabili.
- [ ] Verificare le pagine commerciali Tier 1.
- [ ] Completare le prime destinazioni ad alta intenzione.
- [ ] Pubblicare guide su compatibilità, installazione e attivazione.
- [ ] Pubblicare confronti provider supportati da fonti.
- [ ] Migliorare navigazione mobile, gerarchia e internal linking.
- [ ] Consolidare tono editoriale, design system e componenti.
- [ ] Testare schema markup, sitemap, canonical e pagina 404.

**Criterio di uscita:** esiste un nucleo di contenuti utile, verificato e navigabile, non una collezione di template vuoti.

## Milestone M5 — Misurazione e indicizzazione

**Stato: pianificato**

- [ ] Google Search Console.
- [ ] Invio e monitoraggio della sitemap.
- [ ] GA4.
- [ ] Google Tag Manager.
- [ ] CMP e consenso prima di tracking non essenziale.
- [ ] Eventi canonici per click, CTA e passaggi ai provider.
- [ ] Definizioni uniche delle metriche.
- [ ] Report su query, landing page, CTR e indicizzazione.

**Criterio di uscita:** possiamo misurare domanda, scoperta, comportamento e qualità tecnica senza ambiguità sulle metriche.

## Milestone M6 — Intelligence SEO condivisa

**Stato: decisione architetturale presa, implementazione separata**

- [ ] OpenSEO distribuito come servizio dello studio, non incorporato nel Worker di Senza Roaming.
- [ ] Progetto OpenSEO dedicato a Senza Roaming.
- [ ] Cloudflare Access.
- [ ] Search Console collegata.
- [ ] Budget e consumo DataForSEO attribuiti per progetto.
- [ ] Rank tracking e competitor set iniziale.
- [ ] Audit periodici e trasferimento delle opportunità nella coda di Senza Roaming.
- [ ] Valutare Trends MCP come segnale di momentum e stagionalità.

**Criterio di uscita:** Senza Roaming riceve intelligence SEO e trend da servizi condivisi senza diventare un monolite.

## Milestone M7 — Monetizzazione controllata

**Stato: non avviato**

- [ ] Identificare programmi affiliate ufficiali.
- [ ] Approvazioni dei provider.
- [ ] Link conservati come secret.
- [ ] Disclosure visibile e coerente.
- [ ] Attivazione esplicita di `AFFILIATE_MODE=enabled`.
- [ ] Tracking click privacy-first.
- [ ] Attribuzione per pagina, destinazione, provider e posizione CTA.
- [ ] Monitoraggio di link rotti, programmi sospesi e condizioni cambiate.

**Criterio di uscita:** il progetto monetizza senza compromettere indipendenza editoriale, privacy o accuratezza.

## Milestone M8 — Crescita e manutenzione continua

**Stato: futuro**

- [ ] Ciclo settimanale della domanda recente.
- [ ] Controllo giornaliero o periodico delle fonti scadute.
- [ ] Discovery mensile di nuovi cluster.
- [ ] Aggiornamento delle pagine che perdono visibilità.
- [ ] Priorità basata su Opportunity, Trust e Revenue Score.
- [ ] Espansione internazionale solo dopo stabilità del modello italiano.
- [ ] Contratto API con il futuro Command Center dello studio.

**Criterio di uscita:** la crescita è guidata da dati, fonti e risultati, non da produzione indiscriminata di pagine.

## Ordine operativo attuale

1. Verificare redirect `www` in produzione.
2. Verificare esito e output del primo Workflow.
3. Aggiungere osservabilità dei run.
4. Costruire Dashboard MVP del progetto.
5. Ripetere AI smoke quando GCP riattiva la fatturazione.
6. Costruire il primo blocco di contenuti verificati.
7. Collegare Search Console, consenso e analytics.
8. Integrare intelligence SEO condivisa.
9. Attivare affiliazioni solo dopo quality gate e misurazione.
