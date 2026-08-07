# Prossime azioni

Ultimo aggiornamento: **7 agosto 2026**.

Questa lista contiene soltanto lavoro immediatamente eseguibile e gate già definiti. Non è un changelog.

## Gate corrente — target-environment source registry verification

La source reconciliation fail-closed è stata mergiata con PR #119.

Checkpoint certificato:

```text
PR #119
head:       142279b73015994a230dfc49da3d3a6a41b5d37a
merge/main: 149dc3d7bb5907347d20327aa595fa171ebb680d
CI #633:    success
CI #634:    success
```

Nessun deploy production e nessuna mutation D1 remota sono stati eseguiti.

Il resolver è bound ai `SOURCE_CONFIG` reali dei due evidence pack:

```text
pack:                     2
source references:       12
unique source identities: 9
```

Contratto implementato:

```text
sourceAuditKey
+ entity type/key
+ source kind
+ approved registry canonical URL
→ exactly one active source_registry row
```

Fail closed:

```text
0 match  → source_not_registered
1 match  → resolved
>1 match → source_registry_ambiguous
```

Il manifest classifica oggi:

```text
registered_expected: 2 mapping entries
required:            7 mapping entries
```

Questi stati **non descrivono ancora il contenuto reale del D1 target**. In particolare `registered_expected` è un'aspettativa derivata dal source universe repository, non una certificazione ambientale.

### Prossima branch tecnica separata

Obiettivo esclusivo:

```text
read-only target-environment source_registry verification
```

Deve:

- interrogare o esportare in modo read-only il `source_registry` dell'ambiente target;
- eseguire il resolver versionato sulle 9 identity;
- produrre un risultato deterministico con `resolved`, `source_not_registered` e `source_registry_ambiguous`;
- identificare quali source richiedono realmente onboarding;
- preservare gli ID numerici come dati environment-specific, non versionati nel manifest;
- non fare INSERT/UPDATE durante la verifica;
- non applicare `0021` al remoto;
- non importare evidence pack;
- non scrivere `claim_verifications`;
- non fare ranking, publication o deploy.

## Gate successivo — source onboarding separato

Soltanto dopo la verifica read-only dell'ambiente target.

Se esistono identity `source_not_registered`, l'onboarding deve essere una mutation separata e auditabile.

Requisiti:

```text
approved manifest identity
+ exact entity type/key
+ exact source kind
+ exact canonical registry URL
→ explicit source_registry onboarding
```

Regole:

- nessun auto-registration;
- nessun provider-root fallback;
- nessun redirect target usato come remap implicito;
- nessun hardcoded environment ID;
- duplicate/ambiguous state deve bloccare, non essere “riparato” automaticamente;
- fixture/local verification prima del remoto;
- mutation remota soltanto con autorizzazione esplicita;
- nessun importer nella stessa branch;
- nessuna remote `0021` apply implicita;
- nessun deploy.

Il gate si chiude soltanto quando:

```text
all 9 source identities
→ exactly one active approved source_registry row ciascuna
```

## Gate seguente — importer idempotente

Soltanto dopo environment verification + onboarding chiusi:

```text
pack.json + immutable artifacts
→ resolved source IDs
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ pending evidence_claim_candidates
```

Requisiti:

- idempotenza/content-addressed identity;
- artifact hash verificato;
- source ID ottenuti dal resolver contro l'ambiente, non hardcoded;
- `observed` e il sotto-fatto realmente supportato da `partial` possono alimentare candidate;
- `unknown` e `not_applicable` non diventano factual candidate;
- nessun `claim_verifications` write;
- nessun ranking/publication;
- fixture locale prima di un ingest reale.

## Remote D1 — gate esplicito separato

D1 remoto resta a:

```text
0020
```

`0021_evidence_upstream_storage.sql` è versionata e local-tested.

Non applicarla al remoto come effetto collaterale di verifier, source onboarding, importer o deploy.

Sequenza prevista:

```text
environment source_registry verification
→ source onboarding where required
→ all sources exactly-one
→ importer local/fixture
→ explicit remote 0021 authorization
→ controlled ingest
→ verification provenance bridge
```

## First Money UI — stato invariato

Preview mergiata:

```text
/astro-foundation/articoli/migliore-esim
```

Canonical ancora invariato:

```text
/migliore-esim
```

La preview conserva:

- hero consumer-first;
- destinazione → giorni → dati → hotspot;
- scenario cards;
- sei evidence slot;
- FAQ/obiezioni A–Z-informed;
- internal links namespaced;
- noindex/no-store;
- published-only;
- nessun `/go/*`;
- nessun affiliate claim o winner.

I sei slot restano intenzionalmente:

```text
Da verificare per l'offerta
```

fino alla materializzazione di facts bounded, fresh e verificati.

## Decisione First Euro — invariata

Ordine iniziale:

```text
1  /migliore-esim        ← first existing-URL money slice
2  /esim-europa          ← first new evidence-native money page
3  /codice-sconto-holafly
4  /airalo-recensioni
5  /airalo-vs-holafly
6  /esim-usa
7  /esim-egitto
8  /esim-giappone
9  /esim-turchia
10 /esim-albania
```

`/esim-hotspot` resta candidate **traffic/problem feeder**, non money page automatica.
`/esim-iphone` resta high-demand compatibility feeder.

## Evidence requirements già emersi

### `/migliore-esim`

Per il primo confronto commerciale servono almeno, per offerte bounded:

```text
data amount / unlimited model
validity/duration
hotspot allowed
hotspot share limit when stated
FUP
activation trigger
voice/SMS availability when relevant
source-native price
```

Unknown resta unknown.

### `/esim-europa`

Verificare inoltre:

```text
regional product identity
itinerary country membership
country-scoped network statements
```

Il numero aggregato di Paesi non prova membership dell'itinerario.

### `/esim-usa`

Prima della money page completa verificare esplicitamente:

```text
data-only
vs
voice/SMS/local number
```

## Affiliate applications — dipendenza esterna parallela

In corso:

```text
Airalo
Holafly
Ubigi
```

Regole:

- non incollare secret/token in chat o repository;
- partner ID e tracking config restano in secret/config appropriata;
- nessun link affiliate production senza disclosure + evidence + measurement gate.

## First affiliate activation gate

Prima di `AFFILIATE_MODE=enabled`:

1. money page consumer-ready;
2. facts commerciali bounded, fresh e verificati;
3. affiliate account approvato;
4. `/go/*` destination/redirect validato;
5. disclosure pubblica chiara;
6. `provider_redirect_intent` event design accettato;
7. privacy/consent regression rechecked;
8. secret/config partner fuori dal repository;
9. `AFFILIATE_MODE` change esplicito;
10. production deploy manuale autorizzato;
11. live smoke redirect + disclosure + no secret leakage.

## Canonical cutover `/migliore-esim`

La preview mergiata **non autorizza** il cutover canonico.

Il cutover richiede branch separata dopo la materializzazione dei facts necessari e deve verificare:

```text
preview approved
+ facts verified/fresh
+ no unsupported claim
+ publication boundary preserved
→ canonical materialization
```

Affiliate activation e deploy production restano gate ulteriormente separati.

## M7.2 — Search-to-Social

La prima money page deve produrre un test bounded:

```text
1 money page
→ 5–10 evidence-backed angles
→ short/video/carousel drafts
→ human review
→ publication manuale
→ click/comment/branded-search feedback
```

Principio:

```text
query
→ tension
→ fact
→ twist
→ CTA
```

Nessun social claim commerciale può superare il freshness/evidence standard della pagina.

## Homepage e hub consumer-first

Dopo la prima money slice riallineare:

```text
/
/destinazioni
/confronti
```

Obiettivo:

- meno linguaggio su workflow/gate/ownership;
- più destinazioni, domande, scenari e CTA;
- metodo/governance su `/metodo` e `/trasparenza`;
- nessuna cannibalizzazione delle specialist pages.

## Search Console feedback loop

Stato osservato:

```text
2026-07-24: 1 impression
clicks: 0
query/page rows: insufficienti
```

Per ora:

- non cambiare ownership su GSC quasi vuota;
- non ripetere sitemap submission;
- non usare Indexing API.

Quando emergono query reali:

```text
impressions without clicks
positions 8–20
unexpected query-page matches
new long tails
```

→ alimentano refresh e priorità.

## Checkpoint aperti

- target-environment `source_registry` verification;
- source onboarding separato delle identity realmente mancanti;
- affiliate approvals;
- importer idempotente;
- explicit remote `0021` gate;
- controlled ingest;
- verification provenance bridge;
- facts materializzati nella First Money UI;
- canonical cutover separato `/migliore-esim`;
- affiliate/measurement gate;
- first explicit production deploy money-ready;
- `/esim-europa`;
- M7.2 bounded social test;
- consumer-first homepage/hub;
- `www → apex` definitivo.

## Freeze

- niente terzo evidence pack esplorativo salvo blocker strutturale;
- niente remote `0021` apply senza gate esplicito;
- niente importer prima che tutte le source dei pack risolvano exactly-one;
- niente source auto-registration;
- niente source onboarding remoto senza autorizzazione esplicita;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente ranking/provider winner universale;
- niente mass pSEO;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente deploy automatico;
- niente pubblicazione autonoma dell'AI.
