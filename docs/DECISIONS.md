# Decisioni architetturali

Ultimo aggiornamento: **26 luglio 2026**.

Questo registro conserva le decisioni che cambiano il modo in cui Senza Roaming viene costruito. Le formulazioni estese e lo storico completo restano nel versionamento Git.

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

**Stato:** accettata come principio e applicata in M6.

**Decisione:** eventi e KPI devono avere definizioni canoniche prima di essere usati da dashboard o AI.

**Conseguenza:** `docs/MEASUREMENT-EVENT-DICTIONARY.md` precede GTM e GA4; nessun evento viene aggiunto direttamente nel container.

## ADR-010 — Affiliate mode esplicita e reversibile

**Stato:** accettata.

**Decisione:** `AFFILIATE_MODE` resta disabilitata finché programmi, disclosure, tracking e quality gate non sono pronti.

**Conseguenza:** la monetizzazione non precede accuratezza e trasparenza.

## ADR-011 — Astro come frontend principale

**Stato:** accettata e verificata live.

**Decisione:** Astro gestisce il sito pubblico e la shell della Control Room; React viene usato soltanto per isole realmente interattive.

**Conseguenza:** il sito pubblico resta content-first e non diventa una SPA generale.

## ADR-012 — Componenti comprovati prima del codice custom

**Stato:** accettata.

**Decisione:** primitive generiche accessibili non vengono riscritte da zero; servizi comprovati vengono preferiti per capacità generiche come la CMP.

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

**Conseguenza:** conversione, claim, draft e retry restano capacità separate.

## ADR-026 — M5 pubblico in parallelo alle mutation M4 residue

**Stato:** accettata.

**Decisione:** la migrazione pubblica Astro può procedere su branch separate mentre M4 continua con mutation ristrette.

**Conseguenza:** M5 non dichiara M4 completata e non autorizza la rimozione della legacy privata.

## ADR-027 — Contratto SEO condiviso, policy di route separate

**Stato:** accettata e verificata con PR #69.

**Decisione:** title, description, Open Graph e JSON-LD derivano da un modello server-only condiviso; canonical, robots e cache restano policy della route owner.

**Conseguenza:** preview e canonical condividono i dati senza confondere indicizzazione, URL e cache.

## ADR-028 — Ownership target esplicita e cutover tramite matrice versionata

**Stato:** accettata e verificata live con PR #81 e PR #82.

**Decisione:** current e target ownership sono separate; l’owner cambia soltanto tramite una PR di cutover esplicita.

**Conseguenza:** API, `/go/*`, asset tecnici e route private non vengono intercettati accidentalmente dal catch-all pubblico.

## ADR-029 — Renderer canonico Astro testato tramite Worker factory

**Stato:** accettata e verificata con PR #73.

**Decisione:** prima del cutover le route canoniche Astro vengono compilate e testate con `createPublicWorker(routeDecision)` e un resolver temporaneo.

**Conseguenza:** home, listing, trust, articolo e 404 sono stati verificati senza modificare prematuramente la matrice attiva.

## ADR-030 — Sitemap e robots condivisi prima del trasferimento di ownership

**Stato:** accettata e verificata con PR #75.

**Decisione:** query, validazione, XML, robots e response contract vivono in `src/public-seo-endpoints.ts`, condiviso da backend legacy e handler Astro.

**Conseguenza:** route statiche dalla policy, pagine `published` soltanto, output deterministico e fail-closed restano invariati durante il cambio owner.

## ADR-031 — Catalogo pilot come release candidate, non come pubblicazione implicita

**Stato:** accettata e verificata con PR #77.

**Decisione:** M5.6 costruisce un audit read-only e un manifest versionato con massimo quattro release candidate; una release candidate resta `review`.

**Conseguenza:** latest bundle e draft prevalgono, zero candidate è valido e `review → published` richiede una capacità separata.

## ADR-032 — Audit remoto privato prima del cutover, pubblicazione non bloccante

**Stato:** accettata e verificata live con PR #78 e PR #79.

**Decisione:** il primo audit dei dati editoriali remoti è esposto soltanto tramite una route Control Room privata, GET-only e protetta da Cloudflare Access.

**Conseguenza:** `esim-cina-senza-vpn` resta `review`, il manifest resta vuoto e publication capability resta separata.

## ADR-033 — Cutover apex tramite matrice target e Worker-first wildcard

**Stato:** accettata, mergiata con PR #81 e verificata live con PR #82.

**Decisione:** M5.7 attiva `targetPublicRouteDecision` e usa `run_worker_first = ["/*", "!/_astro/*"]`.

**Conseguenza:** Astro possiede home, listing, trust pages, articoli, sitemap, robots e 404; API, `/go/*`, Control Room ed execution plane restano backend-owned.

## ADR-034 — Consent Mode Basic e CMP fail-closed prima di GTM

**Stato:** accettata con PR #83, PR #84 e PR #85; deployment CMP-only verificato lato server il 26 luglio 2026; checkpoint UX vendor ancora aperto.

**Decisione:** la prima release usa Google Consent Mode Basic e un embed iubenda remoto. Nessun GTM, GA4 o ping Google può partire prima del consenso analytics esplicito.

Default:

```text
analytics_storage = denied
ad_storage = denied
ad_user_data = denied
ad_personalization = denied
```

Regole:

- il formato canonico è quello restituito dall’account reale: `https://embeds.iubenda.com/widgets/{uuid}.js`;
- `CMP_PROVIDER` e `CMP_EMBED_ID` sono validati server-side;
- configurazioni assenti o invalide falliscono chiuse;
- la CMP appare soltanto sulle pagine canonical indexable;
- preview, Control Room, API, `/go/*`, sitemap, robots, 404 e file probe restano esclusi;
- il layout emette un solo script remoto;
- il config sorgente resta CMP-off;
- il config compilato viene preparato deterministicamente per il deploy;
- `GTM_ID` deve restare vuoto;
- Ads, remarketing, affiliate tracking e Advanced Consent Mode restano fuori scope.

**Conseguenza:** `src/public-consent.ts` è il contratto fail-closed; l’UUID embed è configurazione pubblica versionata; GTM/GA4 attendono la chiusura del checkpoint UX reale.

## ADR-035 — Binding D1 remota risolta soltanto nel config compilato

**Stato:** accettata e verificata con il deploy CMP-only del 26 luglio 2026.

**Decisione:** il `wrangler.jsonc` sorgente conserva `REPLACE_WITH_D1_DATABASE_ID`. Durante `npm run deploy`, Wrangler elenca i database remoti e `scripts/prepare-production-d1-binding.mjs` risolve il solo database chiamato `senza-roaming`, valida il suo UUID e aggiorna esclusivamente `apps/web/dist/server/wrangler.json`.

Guardrail:

- un solo database remoto con nome esatto `senza-roaming`;
- un solo binding compilato `DB` coerente;
- UUID valido;
- nessuna stampa o versione dell’UUID;
- errore su database mancanti, duplicati, binding ambigue o ID discordanti;
- nessuna migration o mutation D1 implicita nel deploy.

**Razionale:** il config sorgente resta portabile e privo di identificatori account-specific, mentre il deploy rimane riproducibile e non dipende da copia manuale nella dashboard.

**Conseguenza:** il comando canonico è:

```text
build
→ prepare-production-consent-config
→ prepare-production-d1-binding
→ wrangler deploy
```

La CI include un contratto puro dedicato; il deploy reale del 26 luglio 2026 e la verifica HTTP post-deploy sono riusciti senza versionare l’UUID D1.
