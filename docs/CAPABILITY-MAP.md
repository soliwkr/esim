# Senza Roaming — Capability Map

Questa mappa descrive **come è composto il sistema**, indipendentemente dall'ordine temporale della roadmap.

La roadmap risponde a: **quando viene costruito e rilasciato?**  
Questa mappa risponde a: **quali capacità servono, dove vivono e da cosa dipendono?**

Ultimo aggiornamento: **17 luglio 2026**.

## Legenda

- **Attivo** — funzionante in produzione.
- **Implementato** — presente su `main`, da distribuire o verificare.
- **In costruzione** — contratto e struttura definiti, lavoro incompleto.
- **Pianificato** — approvato ma non ancora implementato.
- **Condiviso** — capacità dello studio consumata da Senza Roaming tramite API o integrazione.
- **Riferimento** — metodo o pattern da cui estrarre procedure; non dipendenza runtime.

## L0 — Governance, sicurezza e controllo

**Proprietà:** Senza Roaming per il progetto; futuro Control Plane per la vista multi-progetto.

Capacità:

- repository come memoria canonica — **Attivo**;
- migrazioni e deploy versionati — **Attivo**;
- secret separati per manutenzione e AI Gateway — **Attivo**;
- API protette — **Attivo**;
- nessuna pubblicazione autonoma da parte dell'AI — **Attivo**;
- audit delle esecuzioni recent-demand — **Attivo**;
- audit delle analisi editoriali AI — **Implementato**;
- log delle azioni umane su segnali e brief — **In costruzione**;
- Cloudflare Access per la dashboard privata — **Pianificato**;
- rate limiting e policy di costo per azioni AI — **Pianificato**.

## L1 — Runtime, orchestrazione e dati

**Proprietà:** repository `soliwkr/esim`.

Componenti:

- Cloudflare Worker pubblico — **Attivo**;
- Cloudflare D1 — **Attivo**;
- Cloudflare Containers — **Attivo**;
- Cloudflare Workflows — **Attivo**;
- GitHub Actions CI e deploy — **Attivo**;
- routing canonico, 404, sitemap e robots — **Attivo**;
- health aggregato di Worker, D1, Workflow, Container e AI — **Pianificato**.

## L2 — Evidence e ricerca

**Regola:** community e trend generano opportunità; le fonti ufficiali verificano claim commerciali.

### Domanda recente

- `last30days` su Reddit, YouTube e web — **Attivo**;
- scheduling lunedì/giovedì — **Attivo**;
- storico run e stato live — **Attivo**;
- quality gate di freschezza — **Attivo**;
- distinzione `eligible`, `filtered`, `all` — **Attivo**;
- flag di bassa rilevanza, fonte unica e promozionalità — **Attivo**;
- override umano esplicito — **Attivo**.

### Evidenza commerciale

- registro fonti ufficiali — **Attivo**;
- claim verificabili e datati — **Attivo**;
- coda di manutenzione — **Attivo**;
- refresh automatico delle fonti — **Pianificato**;
- estrazione strutturata dei claim — **Pianificato**;
- rilevazione conflitti tra fonti — **Pianificato**;
- archivio raw dei report in R2 — **Pianificato**.

### Segnali condivisi

- Trends MCP per momentum e stagionalità — **Condiviso / Pianificato**;
- Search Console come domanda first-party — **Condiviso / Pianificato**;
- OpenSEO e DataForSEO per SERP, keyword e competitor — **Condiviso / Pianificato**.

## L3 — AI intelligence controllata

**Proprietà:** Senza Roaming usa AI Gateway; la governance dei modelli potrà diventare condivisa.

- Cloudflare AI Gateway BYOK — **Attivo**;
- Vertex AI `gemini-3.1-flash-lite` — **Attivo**;
- smoke test end-to-end — **Attivo**;
- input limitato ai segnali editorialmente idonei — **Implementato**;
- clustering editoriale — **Implementato**;
- brief strutturati con schema JSON — **Implementato**;
- opportunity score proposto dall'AI — **Implementato**;
- evidence score deterministico — **Implementato**;
- deduplicazione idempotente delle analisi — **Implementato**;
- deduplicazione semantica tra brief storici — **Pianificato**;
- creazione di task di verifica per claim mancanti — **In costruzione**;
- Trust Score composito — **Pianificato**;
- Revenue Score basato su dati reali — **Pianificato**;
- policy multi-modello e fallback — **Pianificato**.

## L4 — Operazioni editoriali

- coda segnali da revisionare — **Attivo via API**;
- coda brief AI — **Implementato**;
- stati `proposed`, `accepted`, `dismissed`, `converted` — **Implementato**;
- provenienza segnale → brief — **Implementato**;
- revisione e note umane — **Implementato**;
- conversione brief → task editoriale — **Pianificato**;
- conversione brief → pagina in `review` — **Pianificato**;
- calendario e capacità editoriale — **Pianificato**;
- gestione aggiornamenti delle pagine esistenti — **Pianificato**.

## L5 — Contenuto e product experience

- homepage e pagine fondamentali — **Attivo / da rifinire**;
- destinazioni — **In costruzione**;
- guide installazione e compatibilità — **In costruzione**;
- confronti provider — **In costruzione**;
- pagine provider — **In costruzione**;
- schema editoriale e commerciale — **Attivo / da testare**;
- internal linking — **Pianificato**;
- design system e componenti mobile — **Pianificato**;
- preview privata prima della pubblicazione — **Pianificato**.

## L6 — SEO, AEO e GEO

### Integrato nel progetto

- canonical, sitemap, robots, 404 — **Attivo**;
- dati strutturati — **Attivo / da validare**;
- page map da Keyword Planner — **Attivo**;
- risposte dirette e struttura AEO — **In costruzione**;
- fonti e provenance leggibili — **In costruzione**.

### Servizi e metodi condivisi

- OpenSEO — **Condiviso / Pianificato**;
- Search Console — **Condiviso / Pianificato**;
- DataForSEO — **Condiviso / Pianificato**;
- `claude-seo` come audit esterno periodico — **Riferimento / Pianificato**;
- skill `ai-seo`, `seo-audit`, `schema`, `programmatic-seo` — **Riferimento operativo**.

## L7 — Analytics, metriche ed esperimenti

- click provider privacy-first — **Attivo**;
- tassonomia eventi canonica — **Pianificato**;
- GA4, GTM e CMP — **Pianificato**;
- Search Console reporting — **Pianificato**;
- definizioni deterministiche delle metriche — **Pianificato**;
- dashboard query, landing, CTR e indicizzazione — **Pianificato**;
- registro esperimenti — **Pianificato**;
- CRO su CTA, posizione e copy — **Pianificato**;
- warehouse e attribuzione multi-touch — **Differito fino a volumi reali**.

## L8 — Monetizzazione

- redirect provider controllato — **Attivo**;
- modalità affiliate disabilitabile — **Attivo**;
- disclosure — **In costruzione**;
- programmi affiliate ufficiali — **Pianificato**;
- link affiliate come secret — **Pianificato**;
- attribuzione per pagina, provider e CTA — **Pianificato**;
- controllo link rotti e programmi sospesi — **Pianificato**;
- Revenue Score — **Pianificato dopo dati sufficienti**.

## L9 — Dashboard e integrazione studio

### Dashboard di Senza Roaming

Gestisce dati specifici del progetto:

- run e health;
- segnali e quality gate;
- brief editoriali;
- fonti e claim;
- pagine e anteprime;
- click e metriche specifiche.

**Stato:** **Pianificato**, con backend API in larga parte già disponibile.

### Futuro Command Center dello studio

Non assorbe logica e dati specifici. Consuma contratti API per:

- stato sintetico del progetto;
- costi e consumi;
- alert;
- avanzamento roadmap;
- KPI condivisi;
- apertura delle interfacce specialistiche.

**Stato:** decisione architetturale registrata; implementazione in un cantiere separato.

## Flusso operativo completo

```text
community + trend + SERP + Search Console
                  ↓
       segnali normalizzati e qualificati
                  ↓
      AI Gateway → Vertex AI → brief
                  ↓
        opportunity + evidence score
                  ↓
          revisione editoriale umana
                  ↓
      task di verifica delle fonti ufficiali
                  ↓
          pagina in review e anteprima
                  ↓
       pubblicazione controllata e tracking
                  ↓
       Search Console + analytics + ricavi
                  ↓
         aggiornamento delle priorità
```

## Confine fondamentale

Una capacità può essere:

1. **nativa del progetto**, quindi implementata in `soliwkr/esim`;
2. **condivisa dallo studio**, quindi consumata tramite integrazione;
3. **una skill operativa**, quindi metodo riutilizzabile per agenti e persone;
4. **un riferimento**, quindi sorgente di pattern senza dipendenza tecnica.

Non ogni skill deve diventare un servizio, un agente o una dipendenza npm.