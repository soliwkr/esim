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

**Stato:** accettata

**Decisione:** usare Astro come livello frontend del sito pubblico e come shell della Control Room. Usare React soltanto per isole con interattività applicativa complessa.

**Razionale:** Senza Roaming è principalmente una proprietà editoriale content-first, ma possiede una dashboard privata che richiede stato, form, tabelle e mutation. Astro evita di trasformare l'intero sito in una SPA e consente di caricare React soltanto dove serve.

**Conseguenza:** il Worker non deve più generare nuove interfacce tramite stringhe HTML, CSS e JavaScript. Il backend esistente resta invariato e viene integrato tramite custom Worker entrypoint.

## ADR-012 — Componenti comprovati prima del codice custom

**Stato:** accettata

**Decisione:** non costruire da zero componenti generici, dashboard shell, gestione form, tabelle, dialog, toast, focus e stati applicativi già risolti da librerie mature.

**Razionale:** il valore specifico del progetto vive nei flussi editoriali, nei contratti e nei guardrail, non nella riscrittura di primitive UI.

**Conseguenza:** shadcn/ui è operativo nella foundation. Un confronto Mantine resta separato e viene eseguito soltanto se produce un vantaggio misurabile.

## ADR-013 — Migrazione frontend incrementale

**Stato:** accettata

**Decisione:** aggiungere inizialmente `apps/web` senza spostare o riscrivere subito il backend esistente.

**Razionale:** una riorganizzazione completa del repository insieme al cambio di framework aumenterebbe il rischio senza migliorare direttamente il prodotto.

**Conseguenza:** la Control Room viene migrata una vista alla volta; la ristrutturazione completa in monorepo viene valutata dopo il primo rilascio stabile.

## ADR-014 — Un solo Worker con custom Astro entrypoint

**Stato:** accettata

**Decisione:** compilare `apps/web/src/worker.ts` come entrypoint Cloudflare reale. L'entrypoint delega le route Astro previste, inoltra le route restanti al router backend ed esporta nello stesso modulo `RecentDemandWorkflow` e `Last30DaysContainer`.

**Razionale:** build, runtime smoke e deploy dimostrano che Astro, React, API, D1, Workflow e Container possono convivere senza separare il deploy e senza riscrivere il backend.

**Conseguenza:** la separazione in due Worker non viene introdotta. L'espansione delle route Astro resta progressiva e conserva i publication guardrail.

## ADR-015 — shadcn/ui per la fondazione read-only della Control Room

**Stato:** accettata

**Decisione:** installare shadcn/ui direttamente in `apps/web`, versionando i sorgenti dei componenti e usando una sola island React dentro la shell Astro.

**Razionale:** la dashboard richiede componenti accessibili e responsive senza estendere la UI legacy o ricostruire primitive generiche.

**Conseguenza:** shadcn/ui è la base della migrazione corrente. Nessun componente può accedere direttamente a D1 o introdurre capacità di pubblicazione.

## ADR-016 — Cloudflare Access con validazione JWT nell'origine

**Stato:** accettata e verificata in produzione

**Decisione:** proteggere `/control-room-foundation*` con un'applicazione Cloudflare Access deny-by-default e validare nel custom Worker il JWT prima di servire pagina o proxy.

**Razionale:** la policy al bordo e la verifica nell'origine formano un perimetro fail-closed anche in presenza di errori di routing.

**Conseguenza:** una richiesta senza configurazione valida o identità autorizzata non raggiunge la React island. Backend editoriale, D1 e publication gate non cambiano.

## ADR-017 — Sessione Control Room mediata dal Worker

**Stato:** accettata e verificata in produzione

**Decisione:** il browser della nuova Control Room non gestisce il token operativo. Dopo Cloudflare Access richiama un endpoint read-only sotto `/control-room-foundation*`; il custom Worker valida nuovamente l'identità e delega al contratto esistente dello snapshot.

**Razionale:** chiedere un secondo token all'operatore rende l'accesso macchinoso e trasferisce inutilmente una credenziale nel browser.

**Conseguenza:** campo token, storage applicativo, header di autorizzazione dal browser e pulsante di blocco locale sono rimossi. Il proxy accetta soltanto `GET`; l'API originale resta disponibile per agenti e consumer legacy.

## ADR-018 — Contratti runtime e guasti parziali nella Control Room

**Stato:** accettata

**Decisione:** validare a runtime le risposte health e snapshot e gestirle come risorse indipendenti nel client. Un payload non conforme viene rifiutato; il fallimento di una risorsa non cancella i dati validi dell'altra.

**Razionale:** i tipi TypeScript non validano JSON ricevuto in esecuzione e un guasto parziale non deve rendere indisponibile l'intera dashboard.

**Conseguenza:** overview e health mostrano errori separati e il refresh conserva dati precedenti affidabili. Nessun endpoint backend viene modificato.

## ADR-019 — Relevance zero come quality failure deterministica

**Stato:** accettata e verificata in produzione

**Decisione:** un segnale recent-demand con `relevance_score = 0` non è idoneo al lavoro editoriale automatico. Il database lo conserva, imposta `eligible_for_editorial = 0` e aggiunge `zero_relevance`, salvo un override umano già esplicito.

**Razionale:** la Control Room ha mostrato un risultato su uno spettacolo comico associato al topic “Holafly recent experiences” con score zero ma eligibility positiva. Uno score esattamente nullo è una dichiarazione deterministica dell'upstream e non richiede un classificatore semantico per essere rifiutato.

**Conseguenza:** `0 < relevance_score < 0,35` resta un warning consultivo; `NULL` non viene bloccato automaticamente per non escludere run discovery privi di score. La regola vive in D1, riallinea i conteggi dei run e dispone di uno smoke di regressione dedicato. Framework di evaluation esterni vengono valutati soltanto dopo la costruzione di un dataset revisionato.
