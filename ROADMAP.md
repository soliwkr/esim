# Senza Roaming — Roadmap

Questa è la roadmap canonica del progetto `soliwkr/esim`. Descrive l'ordine con cui Senza Roaming passa da infrastruttura funzionante a proprietà editoriale, SEO e affiliate governabile.

Ultimo aggiornamento: **18 luglio 2026**.

## Come leggere i documenti

- [`ROADMAP.md`](ROADMAP.md) — quando costruiamo e rilasciamo ogni blocco;
- [`docs/FRONTEND-PLAN.md`](docs/FRONTEND-PLAN.md) — come migriamo frontend e Control Room;
- [`docs/CAPABILITY-MAP.md`](docs/CAPABILITY-MAP.md) — quali layer compongono il sistema;
- [`docs/SKILL-REGISTRY.md`](docs/SKILL-REGISTRY.md) — quali skill, repository e servizi vengono adottati;
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
- [x] Deploy da GitHub Actions.
- [x] Deploy automatico per modifiche operative su `main`.
- [x] Dominio principale collegato.
- [x] Container `last30days` operativo.
- [x] Cloudflare Workflow per il radar.
- [x] Endpoint protetti di manutenzione.
- [x] Vere 404 e noindex per scanner e file inesistenti.
- [x] Redirect `www → apex` implementato.
- [x] Primo run end-to-end e ingest in D1.
- [ ] Verificare definitivamente il `308` in produzione.

**Criterio di uscita:** dominio canonico stabile, Worker, Container e Workflow sani.

## M1 — Memoria, qualità e osservabilità

**Stato: quasi completato**

- [x] Roadmap, status, architettura, decisioni e next.
- [x] Capability Map e Skill Registry.
- [x] Storico e stato dei run.
- [x] Quality gate `eligible` / `filtered`.
- [x] Audit specifico di run, brief, claim e verifiche.
- [x] Snapshot aggregato iniziale per dashboard.
- [ ] Health aggregato runtime completo.
- [ ] Log errori recenti in una singola interfaccia.
- [ ] Audit log unificato.

**Criterio di uscita:** stato e qualità comprensibili da una singola UI o risposta API.

## M2 — Motore AI editoriale controllato

**Stato: nucleo v1 completato in produzione**

- [x] AI Gateway e Vertex AI BYOK.
- [x] Input limitato ai segnali idonei.
- [x] Output strutturato e validato.
- [x] Opportunity, Evidence e Priority Score.
- [x] Brief persistiti e provenienza segnale → brief.
- [x] Accettazione umana.
- [x] Conversione in requisiti e task.
- [x] Decomposizione in claim atomici.
- [x] Matching soggetto claim/fonte.
- [x] Esiti verificati, contraddetti, insufficienti e dismiss.
- [x] Primo evidence set: 5 verified, 1 insufficient.
- [x] Nessuna pubblicazione automatica.
- [ ] Deduplicazione semantica storica.
- [ ] Trust Score con prove ufficiali, first-party e indipendenti.

**Criterio di uscita:** l'AI crea lavoro verificabile senza poter pubblicare.

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

**Criterio di uscita:** raggiunto; un evidence set diventa un draft revisionabile, non una pagina pubblicata.

## M4 — Frontend foundation e Control Room definitiva

**Stato: checkpoint attuale**

### M4.0 — Freeze legacy

- [x] Riconoscere la Control Room HTML manuale come transitoria.
- [x] Separare il client v3 e aggiungere smoke live.
- [ ] Verificare v3 realmente nel browser.
- [ ] Limitare la legacy a bugfix critici.
- [ ] Bloccare nuove feature costruite con HTML/DOM manuale.

### M4.1 — Spike Astro e Cloudflare

- [x] Creare `apps/web` con Astro.
- [x] Aggiungere adapter Cloudflare e React integration.
- [x] Dimostrare custom Worker entrypoint.
- [x] Conservare API, D1, Workflow e Container nello stesso execution plane.
- [x] Verificare build e smoke runtime dentro `workerd` in CI.
- [ ] Dimostrare deploy automatico e smoke live.
- [x] Conservare un solo Worker: lo spike non ha dimostrato la necessità di separarlo.

La fondazione Astro è stata unita con la PR #26. L'espansione della Control Room resta incrementale e non viene collegata al traffico pubblico dalle pull request.

### M4.2 — Scelta UI comprovata

- [x] Installare e versionare shadcn/ui dentro `apps/web`.
- [x] Implementare overview/health campione in sola lettura.
- [x] Implementare tabella claim con filtro, selezione e dettaglio in sola lettura.
- [x] Implementare preview dei metadati draft esposti dallo snapshot.
- [ ] Confrontare shadcn/ui e Mantine.
- [ ] Misurare codice custom, accessibilità, mobile, tema, bundle e manutenzione.
- [x] Verificare hydration, stati applicativi, tastiera e viewport mobile con smoke browser.
- [ ] Adottare un dashboard block o starter ispezionato per la migrazione completa.
- [ ] Registrare una decisione comparativa definitiva in ADR.

### M4.3 — Migrazione Control Room

- [ ] Accesso privato tramite Cloudflare Access.
- [ ] API client tipizzato e gestione sessione.
- [ ] Overview e health.
- [ ] Radar e brief.
- [ ] Claim, fonti e scadenze.
- [ ] Page Readiness ed evidence bundle.
- [ ] Draft, preview e decisioni.
- [ ] Queue e audit.
- [ ] Test browser end-to-end.
- [ ] Rimozione legacy dopo parità funzionale.

**Criterio di uscita:** le operazioni quotidiane non richiedono terminale; la UI non contiene codice artigianale evitabile e non può pubblicare autonomamente.

## M5 — Frontend pubblico Astro e primo catalogo

**Stato: dopo M4**

- [ ] Migrare layout, home e navigazione.
- [ ] Migrare pagine statiche.
- [ ] Migrare listing destinazioni, guide e confronti.
- [ ] Migrare pagina articolo e preview.
- [ ] Conservare canonical, sitemap, schema e vere 404.
- [ ] Migliorare mobile, gerarchia e internal linking.
- [ ] Confermare le pagine fondamentali.
- [ ] Verificare pagine Tier 1 e destinazioni ad alta intenzione.
- [ ] Pubblicare soltanto contenuti supportati da evidence set.
- [ ] Eliminare renderer HTML/CSS/JS manuali.

**Criterio di uscita:** nucleo utile, verificato, navigabile e servito dal frontend Astro.

## M6 — Misurazione e indicizzazione

**Stato: pianificato**

- [ ] Google Search Console e sitemap.
- [ ] CMP e consenso.
- [ ] GA4 e GTM.
- [ ] Eventi canonici.
- [ ] Definizioni uniche delle metriche.
- [ ] Report query, landing, CTR e indicizzazione.
- [ ] Registro esperimenti.
- [ ] CRO soltanto su dati osservabili.

**Criterio di uscita:** domanda, scoperta, comportamento e qualità tecnica misurabili.

## M7 — Intelligence SEO e trend condivisa

**Stato: direzione presa, implementazione separata**

- [ ] OpenSEO come servizio dello studio.
- [ ] Progetto dedicato a Senza Roaming.
- [ ] Search Console collegata.
- [ ] Budget DataForSEO attribuito.
- [ ] Rank tracking e competitor set.
- [ ] Audit e trasferimento opportunità nella queue.
- [ ] Trends MCP per momentum e stagionalità.
- [ ] `claude-seo` come ispettore esterno.
- [ ] Opportunity Score v2.

**Criterio di uscita:** intelligence condivisa senza monolite.

## M8 — Monetizzazione controllata

**Stato: non avviato**

- [ ] Programmi affiliate ufficiali.
- [ ] Approvazioni provider.
- [ ] Link come secret.
- [ ] Disclosure visibile.
- [ ] `AFFILIATE_MODE=enabled` esplicito.
- [ ] Tracking privacy-first.
- [ ] Attribuzione per pagina, provider e CTA.
- [ ] Monitoraggio programmi e link.
- [ ] Revenue Score dopo dati sufficienti.

**Criterio di uscita:** monetizzazione senza compromettere accuratezza e indipendenza.

## M9 — Crescita e manutenzione continua

**Stato: futuro**

- [ ] Ciclo settimanale della domanda recente.
- [ ] Refresh automatico delle fonti scadute.
- [ ] Discovery mensile di cluster.
- [ ] Aggiornamento delle pagine in perdita.
- [ ] Priorità Opportunity, Trust e Revenue.
- [ ] Audit tecnico, editoriale e GEO.
- [ ] Espansione internazionale dopo stabilità italiana.
- [ ] Contratto API con il Command Center.
- [ ] Warehouse soltanto a scala reale.

## Ordine operativo attuale

1. verificare Control Room v3 nel browser;
2. eseguire spike Astro + custom Worker entrypoint;
3. confrontare shadcn/ui e Mantine sulle tre viste campione;
4. scegliere kit e dashboard starter;
5. migrare la Control Room;
6. aggiungere Cloudflare Access;
7. migrare il sito pubblico ad Astro;
8. collegare Search Console, consenso e analytics;
9. attivare OpenSEO e trend intelligence;
10. attivare affiliazioni soltanto dopo quality gate e misurazione.

## Regola di aggiornamento

- cambia ordine o rilascio → `ROADMAP.md`;
- cambia il piano frontend → `docs/FRONTEND-PLAN.md`;
- aggiunge o modifica un layer → `docs/CAPABILITY-MAP.md`;
- introduce skill, repository o servizio → `docs/SKILL-REGISTRY.md`;
- cambia una scelta architetturale → `docs/DECISIONS.md`;
- cambia ciò che è realmente operativo → `docs/STATUS.md`;
- cambia il lavoro immediato → `docs/NEXT.md`.
