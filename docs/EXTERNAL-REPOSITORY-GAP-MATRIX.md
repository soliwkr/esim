# Matrice gap e riuso

Data di riferimento: **23 luglio 2026**.

Questo documento confronta i candidati dell'audit esterno con il codice reale di `soliwkr/esim`. Serve a evitare di importare capacità già presenti nel renderer legacy o nella foundation Astro.

## Stato reale del frontend

### Foundation Astro

`apps/web` oggi contiene:

- output server Astro su Cloudflare;
- adapter Cloudflare;
- integrazione React;
- Tailwind 4;
- `site: https://senzaroaming.it`;
- una pagina foundation non pubblica;
- una Control Room privata completa nella sua prima mutation.

Non contiene ancora la foundation del sito pubblico:

- layout pubblico Astro;
- route pubbliche Astro;
- componenti editoriali pubblici;
- sitemap Astro;
- schema graph Astro;
- tracking/CMP;
- design system pubblico;
- quality gate SEO/GEO sul build pubblico.

### Renderer pubblico legacy

Il Worker legacy possiede già:

- home;
- listing destinazioni, guide e confronti;
- pagine statiche privacy, trasparenza e metodo;
- articolo da D1;
- canonical;
- schema `WebSite`, `Article` e `FAQPage`;
- disclosure affiliate condizionale;
- fonti esterne validate come HTTPS;
- related links per cluster;
- sitemap dinamica dalle sole pagine `published`;
- robots;
- 404 reale e noindex;
- redirect provider separato.

La migrazione M5 deve preservare questi comportamenti prima di migliorarli.

## Matrice sintetica

| Area | Esiste già | Gap M5/M6 | Candidato esterno | Decisione |
|---|---|---|---|---|
| Slug | slug persistiti, nessuna utility canonica trovata in Astro | normalizzazione deterministica per nuove route/tassonomie | Rank Empire | estrarre funzione e test solo se il nuovo modello route la richiede |
| Canonical | legacy | port Astro e test regressione | Rank Empire / Claude SEO | implementazione nativa, checklist esterna |
| Schema | legacy `WebSite`, `Article`, `FAQPage` | graph Astro domain-specific + provenienza | Rank Empire | adattare il pattern di funzione pura, non lo schema LocalBusiness |
| Sitemap | legacy dinamica da D1 | route Astro dinamica e test `published` only | pSEO engine / Rank Empire | non usare plugin build-time alla cieca; preservare query D1 server-side |
| Robots | legacy | migrare e verificare Access/API/go | Rank Empire | implementazione nativa |
| Internal linking | related per cluster | relazioni più ricche e hub/spoke | Claude SEO / Rank Empire | adattare dopo aver definito tassonomie canoniche |
| Thin-content gate | evidence/readiness editoriale | gate pagina pubblica e rollout | Claude SEO / Sprint | estrarre standalone-value e pilot discipline |
| SEO drift | smoke runtime, nessuna baseline SEO pubblica | baseline/diff pre/post deploy | Claude SEO / GEO Optimizer | spike esterno dopo prima route Astro pubblica |
| GEO audit | assente | audit struttura/citability | GEO Optimizer | spike CI, non generatore di verità |
| Analytics | non configurata | CMP, eventi, GTM/GA4, outbound | Sprint / analytics-auditor | definire contratto prima del codice |
| Attribution affiliate | redirect e log minimi | sub-ID, provider conversion, privacy | Sprint / advertising-hub | adattare dopo attivazione affiliate esplicita |
| Design pubblico | legacy CSS + foundation Control Room | direzione, componenti, mobile, accessibilità | Open Design | estrarre brief/pre-flight, non runtime |
| Semantic dedup storica | gap roadmap | dedup opportunità/pagine | Reddit engine | parcheggiare dopo M5 iniziale |
| Security scanner | CI e smoke già ampi | eventuali controlli mancanti | Last Mile / agent-skills | aggiungere solo regole specifiche, non piattaforma |

## Decisioni tecniche per candidato

### Rank Empire: valore ridotto ma concreto

Dopo il confronto, Rank Empire non sostituisce la foundation pubblica. Sono utili soltanto:

1. slug normalization italiana;
2. funzioni pure testabili per route/schema;
3. fail-fast su dati mancanti;
4. breadcrumb accessibile;
5. test della matrice route/dati.

Non è utile importare la sitemap build-time del template Rank Empire perché Senza Roaming usa output server e il catalogo canonico vive in D1. La route sitemap deve continuare a includere soltanto pagine con stato pubblico autorizzato.

**Impatto stimato rivisto:** 0,5–1,5 giorni risparmiabili, non 1–3 giorni garantiti.

### GEO Optimizer: dopo il primo renderer pubblico

Non può essere valutato seriamente sulla sola pagina foundation o sulla Control Room privata. Lo spike deve avvenire quando esistono almeno:

- home Astro;
- un listing;
- un articolo;
- sitemap/robots;
- canonical/schema;
- 404.

L'auditor deve misurare il build reale e non diventare prerequisito bloccante prima che esista la superficie da testare.

### Claude SEO: checklist da trasformare in test locali

Le skill sono utili come catalogo di failure mode. Le regole più importanti vanno convertite in test deterministici del repository, per esempio:

- route pubblicata presente in sitemap;
- route non pubblicata assente;
- canonical assoluta e coerente;
- noindex sulle superfici private e di review;
- una sola H1;
- schema JSON valido;
- 404 reale;
- link interni senza route morte;
- nessun claim insufficiente nel payload pubblico.

Non dipendere da un agente testuale per verifiche che la CI può eseguire direttamente.

### Sprint: contratto eventi prima di GA4

Sono da conservare i concetti:

- `event_id`;
- `page_path`;
- posizione CTA;
- provider;
- pagina sorgente;
- sub-ID;
- first-touch;
- click outbound distinto dalla conversione provider.

Prima del codice va definita una tabella canonica:

| Evento | Trigger | Parametri | Consenso | Destinazione |
|---|---|---|---|---|
| `affiliate_outbound_click` | redirect verso provider | provider, page, placement, sub_id, event_id | da definire | D1/GA4 |
| `comparison_view` | vista confronto | page, entities, event_id | da definire | GA4 |
| `destination_view` | vista destinazione | destination, page, event_id | da definire | GA4 |
| `provider_conversion` | conferma network/provider | provider, sub_id, value, currency, event_id | server-side | D1/report |

I nomi sono proposte dello spike, non contratti ancora adottati.

### Open Design: prima del codice M5

Il processo utile produce un brief pubblico approvabile con:

- pubblico primario;
- promesse consentite;
- architettura informativa;
- tono e direzione visuale;
- pagine pilota;
- componenti riusabili;
- CTA e disclosure;
- mobile e accessibilità;
- cosa non deve apparire;
- criteri di accettazione visuale.

Non serve installare daemon o design system esterni.

## Gap non coperti dai repository

Nessun candidato risolve automaticamente:

- il mapping fra evidence bundle e componenti pubblici Astro;
- il gate esplicito `review → published`;
- la scelta dei programmi affiliate e i loro contratti;
- la CMP italiana/europea;
- la tassonomia eSIM reale;
- il modello di refresh dei claim scaduti;
- la strategia iniziale di 8–12 pagine;
- il copy finale supportato da evidenze;
- la verifica conversioni lato network/provider.

Questi restano lavoro specifico di Senza Roaming.

## Sequenza raccomandata degli spike

La sequenza seguente evita fronti paralleli e dipendenze premature.

### 1. Brief visuale e architettura informativa

Fonte metodologica: Open Design.

Output: documento, nessun codice.

### 2. Spike Astro pubblico minimo

Implementare in una branch separata:

- layout;
- home;
- listing;
- articolo;
- 404;
- canonical/schema/sitemap/robots;
- nessuna pubblicazione nuova.

Usare i dati già `published` e preservare il fallback legacy durante lo spike.

### 3. Regression gate

Confrontare test locali, Claude SEO drift e GEO Optimizer sul renderer reale.

### 4. Contratto analytics

Definire CMP/eventi/sub-ID prima di integrare GTM/GA4.

### 5. Pilot content/catalog

Pubblicare soltanto dopo gate separato e con un cluster ristretto. Misurare prima di scalare.

## Impatto sulla stima di lancio

L'audit non giustifica un'accelerazione drastica. Elimina però falsi lavori:

- non costruire un nuovo motore pSEO;
- non adottare una piattaforma multi-agent;
- non duplicare sitemap/schema già presenti nel legacy senza migrazione;
- non installare un design runtime;
- non generare centinaia di pagine prima della misurazione.

La stima prudente resta:

- **12–18 giorni lavorativi** per un MVP pubblico serio, soltanto se M5 viene autorizzato nel percorso critico;
- possibile recupero netto dall'audit: **2–4 giorni di rework evitato**, non necessariamente giorni sottratti uno-a-uno al calendario;
- nessuna garanzia sui tempi di indicizzazione o conversione.

## Decisione ancora necessaria

La roadmap canonica colloca M5 dopo la migrazione operativa della Control Room. Questo audit non modifica implicitamente quell'ordine.

Prima di iniziare M5 occorre una decisione esplicita fra:

1. completare prima tutte le mutation M4;
2. autorizzare M5 pubblico come track parallelo, mantenendo la legacy come fallback operativo.

La scelta va registrata in `docs/DECISIONS.md`, `docs/NEXT.md` e `ROADMAP.md` prima del codice.
