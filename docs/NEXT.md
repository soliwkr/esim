# Prossime azioni

Ultimo aggiornamento: **7 agosto 2026**.

Questa lista contiene soltanto lavoro immediatamente eseguibile e gate già definiti. Non è un changelog.

## Gate corrente — source reconciliation / onboarding

PR #111, #113 e #117 sono mergiate.

La First Money UI di `/migliore-esim` esiste ora come preview consumer-first, ma il canonical e le affiliazioni restano invariati.

Prossima branch tecnica separata:

```text
source reconciliation / onboarding
```

Target:

```text
pack sourceAuditKey + canonical URL + provider/source role
→ exactly one approved source_registry row
```

Fail closed:

```text
0 match  → source_not_registered
>1 match → source_registry_ambiguous
```

Scope della branch:

- riconciliare le source dei pack Italy/Europe con `source_registry`;
- classificare le `candidate_new` realmente da registrare;
- produrre mapping versionato e validazione locale deterministica;
- eventuale source onboarding soltanto come mutation separata e auditabile se esplicitamente autorizzata;
- nessun importer nella stessa branch;
- nessuna remote migration implicita;
- nessun `claim_verifications` write;
- nessun ranking;
- nessun deploy.

Regole:

- nessun auto-registration di URL;
- nessun provider-root fallback;
- redirect target non sostituisce silenziosamente l'identità della fonte;
- una source reconciliation deve risolvere esattamente una source canonica oppure bloccare l'import.

## Gate seguente — importer idempotente

Soltanto dopo source reconciliation:

```text
pack.json + immutable artifacts
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ pending evidence_claim_candidates
```

Requisiti:

- idempotenza/content-addressed identity;
- artifact hash verificato;
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

Non applicarla al remoto come effetto collaterale di importer, deploy o source reconciliation.

Sequenza prevista:

```text
source reconciliation
→ importer local/fixture
→ explicit remote 0021 authorization
→ controlled ingest
→ verification provenance bridge
```

## First Money UI — stato dopo PR #117

Preview mergiata:

```text
/astro-foundation/articoli/migliore-esim
```

Canonical ancora invariato:

```text
/migliore-esim
```

La preview è stata verificata desktop/mobile e conserva:

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

fino alla materializzazione di facts bounded e fresh.

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

- CI post-merge #627 sul merge #117;
- source reconciliation / onboarding;
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
- niente importer prima di source reconciliation;
- niente source auto-registration;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente ranking/provider winner universale;
- niente mass pSEO;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente deploy automatico;
- niente pubblicazione autonoma dell'AI.
