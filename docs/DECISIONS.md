# Decisioni architetturali

Ultimo aggiornamento: **24 luglio 2026**.

Questo registro conserva le decisioni che cambiano il modo in cui Senza Roaming viene costruito. Lo storico completo delle formulazioni precedenti resta nel versionamento Git.

## ADR-001 — Cloudflare come runtime principale

**Stato:** accettata.

**Decisione:** usare Worker, D1, Workflows, Containers e AI Gateway come piattaforma operativa principale.

**Conseguenza:** ogni nuova capacità viene valutata per compatibilità Cloudflare, isolamento dei guasti e riproducibilità.

## ADR-002 — Nessuna pubblicazione autonoma dell’AI

**Stato:** accettata.

**Decisione:** l’AI può produrre segnali, brief, claim candidati e draft, ma non può promuovere una pagina a `published`.

**Conseguenza:** ogni pubblicazione commerciale richiede gate umano e audit.

## ADR-003 — Separare domanda recente e verità commerciale

**Stato:** accettata.

**Decisione:** community, trend e ricerca recente alimentano opportunità; fonti ufficiali alimentano claim fattuali.

**Conseguenza:** i due flussi restano distinti in dati, workflow e criteri di qualità.

## ADR-004 — Versione fissata di last30days

**Stato:** accettata.

**Decisione:** il Container usa un commit upstream fissato.

**Conseguenza:** ogni aggiornamento richiede revisione e smoke test.

## ADR-005 — Dashboard specifica del progetto

**Stato:** accettata.

**Decisione:** la Control Room appartiene a Senza Roaming e alle sue operazioni editoriali.

**Conseguenza:** un futuro Command Center legge contratti sintetici senza incorporare la logica di dominio.

## ADR-006 — Command Center multi-progetto separato

**Stato:** accettata come direzione, fuori dallo scope immediato.

**Decisione:** il control plane dello studio resta un progetto separato.

**Conseguenza:** `soliwkr/esim` non diventa il sistema operativo generale dello studio.

## ADR-007 — OpenSEO come servizio condiviso

**Stato:** accettata come direzione.

**Decisione:** keyword intelligence, rank tracking e audit SEO restano un servizio separato e riutilizzabile.

**Conseguenza:** Senza Roaming riceve dati o task tramite integrazioni senza incorporare quel prodotto.

## ADR-008 — GitHub come memoria canonica

**Stato:** accettata.

**Decisione:** roadmap, stato, architettura, decisioni e prossime azioni vivono nel repository.

**Conseguenza:** ogni milestone aggiorna i canonici pertinenti; la chat non sostituisce la documentazione versionata.

## ADR-009 — Metriche definite una volta

**Stato:** accettata come principio.

**Decisione:** eventi e KPI devono avere definizioni canoniche prima di essere usati da dashboard o AI.

**Conseguenza:** il dizionario eventi precede l’attivazione analytics.

## ADR-010 — Affiliate mode esplicita e reversibile

**Stato:** accettata.

**Decisione:** `AFFILIATE_MODE` resta disabilitata finché programmi, disclosure, tracking e quality gate non sono pronti.

**Conseguenza:** la monetizzazione non precede accuratezza e trasparenza.

## ADR-011 — Astro come frontend principale

**Stato:** accettata.

**Decisione:** Astro gestisce il sito pubblico e la shell della Control Room; React viene usato soltanto per isole realmente interattive.

**Conseguenza:** il sito pubblico resta content-first e non diventa una SPA generale.

## ADR-012 — Componenti comprovati prima del codice custom

**Stato:** accettata.

**Decisione:** primitive generiche accessibili non vengono riscritte da zero.

**Conseguenza:** il codice custom si concentra sui flussi e sui guardrail specifici del dominio.

## ADR-013 — Migrazione frontend incrementale

**Stato:** accettata.

**Decisione:** `apps/web` viene introdotta senza riscrivere simultaneamente il backend.

**Conseguenza:** Control Room e sito pubblico migrano per slice verificabili.

## ADR-014 — Un solo Worker con custom Astro entrypoint

**Stato:** accettata.

**Decisione:** `apps/web/src/worker.ts` è l’entrypoint Cloudflare reale e delega tra Astro e backend.

**Conseguenza:** API, D1, Workflow, Container, AI e frontend convivono nello stesso deploy senza duplicare l’execution plane.

## ADR-015 — shadcn/ui per la fondazione della Control Room

**Stato:** accettata.

**Decisione:** shadcn/ui con primitive Radix e sorgenti versionati è la base della nuova UI privata.

**Conseguenza:** nessun componente accede direttamente a D1 o introduce pubblicazione.

## ADR-016 — Cloudflare Access con validazione JWT nell’origine

**Stato:** accettata e verificata in produzione.

**Decisione:** `/control-room-foundation*` è protetto al bordo e nel custom Worker.

**Conseguenza:** una richiesta senza identità verificata non raggiunge la React island o le route private.

## ADR-017 — Sessione Control Room mediata dal Worker

**Stato:** accettata e verificata in produzione.

**Decisione:** il browser non gestisce il maintenance token; il Worker media letture e mutation autorizzate.

**Conseguenza:** nessuna credenziale applicativa vive in HTML, URL, bundle o storage browser.

## ADR-018 — Contratti runtime e guasti parziali

**Stato:** accettata.

**Decisione:** health, snapshot e risorse on-demand vengono validati a runtime e gestiti separatamente.

**Conseguenza:** un guasto parziale non cancella dati validi delle altre risorse.

## ADR-019 — Relevance zero come quality failure deterministica

**Stato:** accettata e verificata in produzione.

**Decisione:** `relevance_score = 0` rende un segnale non idoneo al lavoro editoriale automatico, salvo override umano esplicito.

**Conseguenza:** D1 persiste `zero_relevance` e riallinea i conteggi dei run.

## ADR-020 — Golden evaluation prima di un framework semantico

**Stato:** accettata e verificata in CI.

**Decisione:** misurare il gate D1 reale su un golden dataset prima di introdurre framework esterni.

**Conseguenza:** nuove dipendenze di valutazione richiedono un vantaggio dimostrabile.

## ADR-021 — Topic anchor deterministici prima di un grader semantico

**Stato:** accettata; verifica remota ancora aperta.

**Decisione:** run research e comparison persistono anchor informative e richiedono un match letterale per l’eligibility automatica.

**Conseguenza:** un mancato match produce `topic_mismatch`; sinonimi e impliciti restano limiti dichiarati.

## ADR-022 — Dettaglio draft on demand separato dallo snapshot

**Stato:** accettata e verificata in produzione.

**Decisione:** lo snapshot contiene l’inventario; corpo, FAQ, fonti e provenance vengono caricati soltanto all’apertura del draft.

**Conseguenza:** il dettaglio può fallire senza rendere indisponibile il resto della Control Room.

## ADR-023 — Parità legacy basata su capacità operative

**Stato:** accettata e verificata in CI.

**Decisione:** la parità read-only si misura su dati, relazioni, guardrail e capacità di ispezione, non sul template HTML legacy.

**Conseguenza:** la preview visuale appartiene al renderer pubblico Astro e la legacy resta soltanto finché serve come fallback operativo.

## ADR-024 — Identità audit e linkage draft da relazioni canoniche

**Stato:** accettata e verificata in CI.

**Decisione:** chiavi audit, `draft_id` e versione derivano dalle colonne relazionali, non da JSON opaco.

**Conseguenza:** il client riceve linkage stabile e validabile senza interpretare strutture implicite.

## ADR-025 — Una mutation per branch con identità Access e state machine D1

**Stato:** accettata e verificata in produzione.

**Decisione:** ogni mutation usa una route privata dedicata, attore derivato dal JWT, conferma esplicita, transizione D1 e audit append-only.

**Conseguenza:** la prima capacità è `proposed → accepted | dismissed`; conversione, claim, draft e retry restano fasi separate.

## ADR-026 — M5 pubblico in parallelo alle mutation M4 residue

**Stato:** accettata.

**Decisione:** la migrazione pubblica Astro può procedere su branch separate mentre M4 continua con mutation ristrette.

**Conseguenza:** nessuna preview o parità pubblica dichiara M4 completata o autorizza la rimozione della legacy privata.

## ADR-027 — Contratto SEO condiviso, policy di route separate

**Stato:** accettata e verificata con PR #69.

**Decisione:** title, description, Open Graph e JSON-LD derivano da un modello server-only condiviso; canonical, robots e cache restano policy della route owner.

**Conseguenza:** legacy e Astro possono essere confrontati senza trasformare una preview noindex in canonicale.

## ADR-028 — Ownership target esplicita e cutover tramite matrice versionata

**Stato:** accettata come target; non attiva.

**Decisione:** current e target ownership sono separate; l’owner live cambia soltanto tramite PR di cutover esplicita.

**Conseguenza:** API, `/go/*`, asset tecnici e legacy private non vengono intercettati da catch-all anticipati.

## ADR-029 — Renderer canonico Astro testato tramite Worker factory

**Stato:** accettata e verificata con PR #73.

**Decisione:** le route canoniche Astro vengono compilate e testate con `createPublicWorker(routeDecision)` e un wrapper locale temporaneo.

**Conseguenza:** home, listing, trust, articolo e 404 sono verificati senza modificare `activePublicRouteDecision` o distribuire flag di renderer.

## ADR-030 — Sitemap e robots condivisi prima del trasferimento di ownership

**Stato:** accettata e verificata con PR #75.

**Decisione:** query, validazione, XML, robots e response contract vivono in `src/public-seo-endpoints.ts`, condiviso da backend legacy e handler Astro.

**Conseguenza:** route statiche dalla policy, pagine `published` soltanto, output deterministico, fail-closed e parità legacy/Astro. PR #75 è mergiata in `8d52e7e316d632dcda0d5bb45b818a490df9fef6` dopo CI finale #365.

## ADR-031 — Catalogo pilot come release candidate, non come pubblicazione implicita

**Stato:** accettata e verificata con PR #77, merge `fa9ed9486e400e77ad915153284c7b277a51b4d0`, CI finale #379.

**Decisione:** M5.6a costruisce un audit read-only e un manifest versionato con un massimo di quattro release candidate. Una release candidate deve avere latest evidence bundle idoneo e approvato, latest draft grounded approvato, provenance completa, claim correnti e pagina materializzata coerente, ma resta `pages.status='review'`.

**Razionale:** il renderer backend live serve qualsiasi riga `published`, mentre non esiste ancora una mutation di pubblicazione autorizzata. Audit e pubblicazione devono restare separati.

**Conseguenza:**

- `src/public-catalog-pilot.ts` carica soltanto con `SELECT` e produce report deterministici;
- latest bundle e latest draft prevalgono sulle versioni precedenti;
- publication eligibility, `approved_for_publication` e `ready_for_publication` sono obbligatori;
- provenance, claim atomic/verified, fonti HTTPS attive e freshness vengono ricontrollati;
- la pagina deve restare `review`, `published_at=NULL`, `featured=0` e coerente col draft;
- slug riservati, file probe, collisioni di keyword e risposte duplicate bloccano l’entry;
- il cap è quattro e zero candidate è un esito valido;
- `data/public-catalog-pilot.json` è inizialmente vuoto e non inventa ID o pagine;
- fixture pure e Worker temporaneo su D1 migrato verificano i gate;
- conteggi e stati before/after restano identici;
- nessuna migration, mutation, route, endpoint publish, deploy o cambio della matrice viene introdotto;
- la prima transizione `review → published` richiede branch, autorizzazione, state machine, audit, idempotenza, freshness recheck e rollback separati.

## ADR-032 — Audit remoto privato prima del cutover, pubblicazione non bloccante

**Stato:** accettata come scope con PR #78 e verificata dalla CI applicativa #383 su PR #79; merge e verifica live ancora pendenti.

**Decisione:** il primo audit dei dati editoriali remoti viene esposto soltanto tramite una route Control Room privata, GET-only e protetta da Cloudflare Access. La route usa direttamente il binding D1 server-side e riutilizza il loader e l’audit M5.6a; non accetta query SQL, non richiede maintenance token nel browser e non modifica alcuno stato.

**Razionale:** un endpoint SQL generico o un export con credenziali aumenterebbero inutilmente la superficie di rischio. Il custom Worker possiede già identità Access, binding D1 e header privati coerenti.

**Conseguenza:**

- la route è `/control-room-foundation/api/catalog-pilot-audit`;
- una richiesta anonima viene bloccata prima dell’handler;
- soltanto GET è accettato;
- la risposta è `no-store`, `noindex` e `nosniff`;
- il payload contiene soltanto il report tipizzato e fallisce chiuso su dati secret-like;
- il browser non riceve maintenance token, JWT, query SQL o dump D1;
- snapshot editoriale before/after identico e smoke dedicato dimostrano l’assenza di mutation;
- zero release candidate è un esito valido;
- un manifest vuoto non blocca M5.7;
- il nuovo design può passare sull’apice continuando a servire soltanto righe `published`;
- nuove release candidate possono restare `review` durante e dopo il cutover;
- `review → published` resta una capability separata con autorizzazione, state machine, audit, freshness recheck e rollback;
- M5.7 modifica la matrice attiva in una PR separata e reversibile, senza includere publication capability, analytics o affiliazioni.
