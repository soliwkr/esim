# Decisioni architetturali

Ultimo aggiornamento: **9 agosto 2026**.

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

**Stato:** accettata con PR #83, PR #84 e PR #85; deploy CMP-only verificato con PR #90 il 26 luglio 2026; banner reale confermato nel browser; checkpoint UX completo ancora aperto.

**Decisione:** la prima release usa Google Consent Mode Basic e un embed iubenda remoto. Nessun GTM, GA4 o ping Google può partire prima del consenso esplicito alla Misurazione.

Default:

```text
analytics_storage = denied
ad_storage = denied
ad_user_data = denied
ad_personalization = denied
```

Regole:

- formato canonico `https://embeds.iubenda.com/widgets/{uuid}.js`;
- `CMP_PROVIDER` e `CMP_EMBED_ID` validati server-side;
- configurazioni assenti o invalide falliscono chiuse;
- CMP soltanto sulle pagine canoniche indicizzabili;
- preview, Control Room, API, `/go/*`, sitemap, robots, 404 e probe esclusi;
- config sorgente CMP-off e config compilato preparato deterministicamente;
- Ads, remarketing, affiliate tracking e Advanced Consent Mode fuori scope.

**Conseguenza:** `src/public-consent.ts` è il contratto fail-closed; persistenza, revoca, rete vendor e performance restano checkpoint separati prima dell’accettazione definitiva del vendor.

## ADR-035 — Binding D1 remota risolta soltanto nel config compilato

**Stato:** accettata e verificata con il deploy CMP-only del 26 luglio 2026.

**Decisione:** il `wrangler.jsonc` sorgente conserva `REPLACE_WITH_D1_DATABASE_ID`. Durante `npm run deploy`, Wrangler risolve il solo database remoto `senza-roaming`, valida UUID e binding e aggiorna esclusivamente `apps/web/dist/server/wrangler.json`.

Guardrail:

- un solo database remoto con nome esatto `senza-roaming`;
- un solo binding compilato `DB` coerente;
- UUID valido;
- nessuna stampa o versione dell’UUID;
- errore su database mancanti, duplicati o discordanti;
- nessuna migration o mutation D1 implicita nel deploy.

**Conseguenza:** il config sorgente resta portabile e il deploy riproducibile senza copia manuale dell’UUID.

## ADR-036 — GTM inerte e contesto analytics bounded dopo il consenso

**Stato:** accettata, mergiata e verificata live il 27 luglio 2026. Il deploy automatico M7 #62 ha successivamente pubblicato configurazione M6 vuota; il contratto resta valido e fallisce chiuso.

**Decisione:** il layout pubblico può emettere il bootstrap GTM soltanto quando CMP, GTM ID, GA4 Measurement ID e contesto pagina sono tutti validi. Prima del consenso lo script resta inerte come `type="text/plain"`, classe `_iub_cs_activate` e purpose iubenda `4` — Misurazione.

Regole:

- `wrangler.jsonc` conserva vuoti `GTM_ID` e `GA4_MEASUREMENT_ID`;
- il preparatore production valorizza esclusivamente il config compilato con `GTM-W3LSK9RZ` e `G-GWJ9YPPVJW`;
- l’embed iubenda precede lo script analytics;
- nessun fallback GTM `noscript`, perché produrrebbe una richiesta pre-consenso incompatibile con Basic Mode;
- un guard globale impedisce doppia esecuzione;
- un solo `dataLayer` espone contesto bounded e l’evento tecnico `sr_page_view_ready`;
- `page_location` è sempre `origin + pathname`, senza query string o hash;
- preview, Control Room, API, `/go/*`, sitemap, robots, 404 e probe non ricevono il bootstrap;
- `provider_redirect_intent` resta differito finché il `page_view` base non è verificato;
- Ads, Custom HTML non revisionato, remarketing e affiliate tag restano vietati.

**Razionale:** Basic Consent Mode richiede assenza completa di richieste Google prima del consenso. Il contesto viene prodotto server-side con enum e slug validati per evitare cardinalità libera, PII e dati operativi interni.

**Conseguenza:** codice, workspace GTM, pubblicazione container, merge e deploy restano gate distinti. Tag Assistant, Network, DebugView, rifiuto, consenso, reload, revoca, anti-duplicazione e performance sono stati verificati prima del checkpoint live M6.

## ADR-037 — Deploy production manual-only senza mutation D1

**Stato:** accettata, mergiata con PR #99 e verificata end-to-end dal recovery run `30439227471`.

**Decisione:** `.github/workflows/deploy-production.yml` è avviabile soltanto tramite `workflow_dispatch` e invoca l'unico comando canonico `npm run deploy`. La configurazione CMP/GTM/GA4 arriva esclusivamente da Actions secrets o variables, viene validata fail-closed e non viene stampata. Il preflight richiede `AFFILIATE_MODE=disabled`.

Il workflow può elencare read-only il database D1 per risolvere il binding compilato, ma non può creare database, applicare migration remote o eseguire altre mutation D1. Le migration production restano un'operazione separata, esplicita e fuori dal deploy frontend.

**Conseguenza:** merge e deploy sono gate distinti. Un deploy manuale fallisce prima della pubblicazione se la configurazione M6 è assente o invalida, e dopo la pubblicazione verifica route M7, preview e header, sitemap/robots, published-only, CMP, measurement consent-gated e Control Room protetta. Il recovery ha confermato assenza di migration/mutation D1 e `AFFILIATE_MODE=disabled`.

## ADR-038 — Snapshot evidence immutabile e claim candidate separata dalla verifica

**Stato:** accettata per il perimetro dello spike e verificata su una fonte Ubigi reale, poi generalizzata live dai pack #106 e #107.

**Decisione:** il layer upstream della verità commerciale viene separato esplicitamente in:

```text
SOURCE
→ immutable EVIDENCE SNAPSHOT
→ deterministic field extraction
→ NORMALIZED DATUM
→ PENDING CLAIM CANDIDATE
→ VERIFIED CLAIM
```

Lo snapshot conserva requested/final URL, redirect chain, timestamp, content type, locale/country/currency context, hash del raw body e locator field-level. L'identità raw e il semantic fingerprint restano distinti: un cambio dei byte non equivale a un cambio del fatto commerciale.

Regole iniziali:

- una candidate nasce sempre `pending`;
- il raw artifact non viene sovrascritto;
- l'extractor field-specific repository-owned resta il percorso canonico dello spike;
- un generic extractor può essere helper/benchmark, non source-of-truth;
- `locale`, `destination` e `currency` restano contesti separati;
- un prezzo USD non viene mappato implicitamente a `price_eur`;
- un field non deduce proprietà adiacenti non provate dal locator, per esempio la validità non deduce l'activation trigger;
- change detection futura può segnalare raw drift ma non verificare automaticamente il nuovo claim;
- nessun D1 write, scheduler, crawler multi-source o publication gate viene introdotto da questo contratto.

**Verifica:** lo spike Ubigi e i pack multi-provider Italia/Europa hanno dimostrato ripetutamente che snapshot raw differenti possono conservare lo stesso semantic fingerprint e zero semantic changes.

**Conseguenza:** il Claims Coverage Audit e i due evidence pack hanno chiuso l'esplorazione delle forme core. Il passo successivo è il mapping D1, senza confondere evidence capture, verifica e pubblicazione.

## ADR-039 — Upstream evidence D1 separato da catalogo e workflow editoriale

**Stato:** accettata e mergiata con PR #108 (`9689dd20e1a5b477a16a7cd938788a4200fe0baf`); CI main #587 `success`. Non ancora implementata in D1.

**Decisione:** materializzare il layer evidence con oggetti upstream dedicati:

```text
source_registry
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ evidence_claim_candidates
→ verification gate
→ claim_verifications
```

Vincoli della decisione:

- `source_registry` resta l'unico registro canonico delle fonti;
- ogni snapshot richiede source reconciliation univoca prima dell'import;
- l'importer non auto-registra URL e fallisce chiuso su source assente o ambigua;
- `editorial_claim_candidates` resta brief-scoped e non viene usata come deposito evidence;
- `plans` v1 non è un ingest target perché single-destination e `price_eur` obbligatorio causerebbero mapping lossy;
- il capture run conserva scenario, capture window, pack identity e semantic fingerprint;
- snapshot e field observations sono immutabili;
- `coverage_state` è first-class: `observed`, `partial`, `unknown`, `not_applicable`;
- `unknown` non viene convertito in `false`, `0` o lista vuota;
- un valore partial conserva qualifier/completeness e non diventa un field verificato come se fosse completo;
- source-native price resta `{amount,currency}` senza FX implicito;
- network country-scoped non viene appiattito;
- URL, raw hash e prezzo non definiscono l'identità del piano;
- `plan_type=local` non viene dedotto automaticamente da `destination_coverage.scope=local` se il field non è stato emesso esplicitamente;
- `claim_verifications` resta il current verified state downstream;
- il bridge fra verification decision e evidence candidate deve avere provenance append-only/revisioned prima di essere automatizzato.

**Conseguenza:** la prima implementation slice può essere soltanto una migration locale/versionata e additiva per le tabelle upstream, con constraint/index/immutability smoke e senza runtime ingest o migration remota. Source onboarding, importer, verification bridge e qualsiasi redesign `plans` restano gate separati.

## ADR-040 — Raw evidence artifact in R2 privato e content-addressed

**Stato:** accettata come fondazione locale; provisioning remoto non ancora autorizzato.

**Decisione:** `evidence_snapshots.artifact_ref` deve risolvere a raw bytes persistenti in un logical store R2 privato `evidence-artifacts`. Raw source e `pack.json` usano chiavi content-addressed SHA-256; il percorso operativo crea soltanto oggetti assenti con condizione equivalente a `If-None-Match: *`, non sovrascrive e non cancella.

Il contratto v1 è:

```text
raw:  v1/raw/sha256/<prefix>/<digest>.<extension>
pack: v1/packs/sha256/<prefix>/<digest>.json
ref:  r2://evidence-artifacts/<object-key>
```

R2 non viene dichiarato WORM: Object Lock non è disponibile nel contratto usato. L'immutabilità è applicativa/content-addressed e un attore amministrativo Cloudflare resta capace di alterazioni fuori dal percorso operativo.

Prima dell'ingest D1 production i byte devono essere verificati localmente, creati o riconciliati in R2, riletti/HEAD-checkati e soltanto allora trasformati in `artifact_ref` D1. Il browser non accede al bucket e credential/endpoint environment-specific non vengono versionati.

**Conseguenza:** il controlled evidence ingest è preceduto da un gate storage separato. La branch di design non crea bucket, credential, oggetti R2 o righe evidence D1. I pack storici #106/#107 restano inoltre non ingeribili finché i bundle raw originali non vengono recuperati oppure nuove capture vengono approvate esplicitamente come replacement.
