# Decisioni architetturali

Questo registro conserva le decisioni che cambiano il modo in cui Senza Roaming viene costruito. Una decisione può essere sostituita, ma non cancellata senza lasciare traccia.

## ADR-001 — Cloudflare come runtime principale

**Stato:** accettata

**Decisione:** usare Worker, D1, Workflows, Containers e AI Gateway come piattaforma operativa principale.

**Razionale:** un solo piano infrastrutturale, deployment versionato, costi iniziali contenuti e assenza di un server permanente da amministrare.

**Conseguenza:** le nuove capacità devono essere valutate prima in termini di compatibilità con Cloudflare e isolamento dei guasti.

## ADR-002 — Nessuna pubblicazione autonoma dell'AI

**Stato:** accettata

**Decisione:** l'AI può creare cluster, brief, claim candidati e task, ma non può promuovere direttamente pagine a `published`.

**Razionale:** le informazioni eSIM cambiano e possono produrre danni concreti al viaggiatore se errate.

**Conseguenza:** ogni percorso editoriale commerciale include un gate umano e un audit log.

## ADR-003 — Separare domanda recente e verità commerciale

**Stato:** accettata

**Decisione:** Reddit, YouTube, web recente e trend alimentano opportunità editoriali; le fonti ufficiali alimentano claim verificabili.

**Razionale:** popolarità, testimonianze e discussioni non provano prezzo, copertura o condizioni contrattuali.

**Conseguenza:** i due tipi di dati vivono in tabelle e workflow distinti.

## ADR-004 — Versione fissata di last30days

**Stato:** accettata

**Decisione:** il Container usa un commit upstream fissato invece di seguire automaticamente l'ultima versione.

**Razionale:** riproducibilità, auditabilità e protezione da cambiamenti upstream inattesi.

**Conseguenza:** gli aggiornamenti dell'upstream richiedono revisione e nuovo smoke test.

## ADR-005 — Dashboard specifica del progetto

**Stato:** accettata

**Decisione:** costruire una dashboard privata per le operazioni specifiche di Senza Roaming.

**Razionale:** radar, fonti, claim, pagine e coda editoriale sono concetti specifici del progetto e devono restare vicini al suo execution plane.

**Conseguenza:** la dashboard deve usare API stabili, così un futuro Command Center può leggerne una sintesi senza duplicarne la logica.

## ADR-006 — Command Center multi-progetto separato

**Stato:** accettata come direzione, fuori dallo scope immediato

**Decisione:** il futuro Command Center sarà un control plane dello studio, non una sezione interna di Senza Roaming.

**Razionale:** infrastruttura, costi, alert, roadmap e servizi condivisi devono essere visibili su più proprietà senza trasformare un singolo sito nel sistema operativo dello studio.

**Conseguenza:** questa fase resta concentrata sul completamento di Senza Roaming. La governance dello studio sarà trattata in un cantiere separato.

## ADR-007 — OpenSEO come servizio condiviso

**Stato:** accettata come direzione

**Decisione:** distribuire OpenSEO come servizio specialistico dello studio con progetti separati, anziché incorporarlo in `soliwkr/esim`.

**Razionale:** keyword research, rank tracking, competitor intelligence, backlink e audit sono capacità riutilizzabili.

**Conseguenza:** Senza Roaming riceverà dati o task tramite integrazione, mantenendo indipendente la propria codebase.

## ADR-008 — GitHub come memoria canonica

**Stato:** accettata

**Decisione:** roadmap, stato, architettura, decisioni e prossime azioni vivono nel repository.

**Razionale:** una chat lunga non deve essere l'unica fonte di contesto e non garantisce continuità operativa tra sessioni.

**Conseguenza:** ogni milestone aggiorna almeno `STATUS.md`, `NEXT.md` e, quando necessario, questo registro.

## ADR-009 — Metriche definite una volta

**Stato:** accettata come principio

**Decisione:** eventi e KPI devono avere definizioni canoniche prima di essere mostrati in dashboard o interpretati dall'AI.

**Razionale:** dashboard, query e modelli non devono attribuire significati diversi allo stesso nome.

**Conseguenza:** prima dell'attivazione analytics verrà creato un dizionario delle metriche e degli eventi.

## ADR-010 — Affiliate mode esplicita e reversibile

**Stato:** accettata

**Decisione:** mantenere `AFFILIATE_MODE=disabled` finché programmi, disclosure, tracking e quality gate non sono pronti.

**Razionale:** la monetizzazione non deve precedere accuratezza e trasparenza.

**Conseguenza:** l'attivazione avviene tramite configurazione esplicita e può essere disabilitata senza modificare contenuti o routing pubblico.

## ADR-011 — Astro come frontend principale

**Stato:** accettata come direzione; integrazione da validare nello spike

**Decisione:** usare Astro come livello frontend del sito pubblico e come shell della Control Room. Usare React soltanto per isole con interattività applicativa complessa.

**Razionale:** Senza Roaming è principalmente una proprietà editoriale content-first, ma possiede una dashboard privata che richiede stato, form, tabelle e mutation. Astro evita di trasformare l'intero sito in una SPA e consente di caricare React soltanto dove serve.

**Conseguenza:** il Worker non deve più generare nuove interfacce tramite stringhe HTML, CSS e JavaScript. Il backend esistente resta invariato e viene integrato tramite custom Worker entrypoint o, solo se necessario, tramite un confine di deploy separato.

## ADR-012 — Componenti comprovati prima del codice custom

**Stato:** accettata

**Decisione:** non costruire da zero componenti generici, dashboard shell, gestione form, tabelle, dialog, toast, focus e stati applicativi già risolti da librerie mature.

**Razionale:** il valore specifico del progetto vive nei flussi editoriali, nei contratti e nei guardrail, non nella riscrittura di primitive UI.

**Conseguenza:** shadcn/ui è il candidato principale e Mantine il confronto dello spike. La scelta definitiva viene registrata con dati su codice custom, accessibilità, velocità, mobile, bundle, branding e manutenzione. Le nuove funzionalità della Control Room legacy sono congelate fino alla decisione.

## ADR-013 — Migrazione frontend incrementale

**Stato:** accettata

**Decisione:** aggiungere inizialmente `apps/web` senza spostare o riscrivere subito il backend esistente.

**Razionale:** una riorganizzazione completa del repository insieme al cambio di framework aumenterebbe il rischio senza migliorare direttamente il prodotto.

**Conseguenza:** prima si dimostrano Astro, Cloudflare, binding, Workflow, Container e tre viste Control Room. La ristrutturazione completa in monorepo viene valutata dopo il primo rilascio stabile.
