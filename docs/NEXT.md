# Prossime azioni

Ultimo aggiornamento: **6 agosto 2026**.

Questa lista contiene soltanto lavoro immediatamente eseguibile e gate già definiti. Non è un changelog.

## Gate corrente — chiudere PR #113 Autocomplete A–Z + PAA / related

PR:

```text
#113 — M7.1: add reproducible autocomplete and PAA expansion
branch: research/m7-autocomplete-paa-expansion
```

Scope:

- collector Serper secret-safe;
- base + `a…z` per 17 seed prioritari;
- PAA / related quando esposti dalla risposta live;
- organic SERP shape;
- output locale con raw SHA provenance;
- summary versionato;
- nessun backend/D1/affiliate/deploy.

Capture reale completata:

```text
run: 31121790996
requests: 476
autocomplete rows: 3659
expanded unique queries: 2829
organic rows: 153
PAA: 0
related: 0
errors: 0
```

Diagnostic completato:

```text
run: 31122315355
control-us relatedSearches: 8
control-us PAA: 0
Italian P0 related/PAA: 0
```

Quindi PAA=0 resta un **zero-state osservato**, non una lacuna da riempire artificialmente.

Prima di ready/merge #113:

1. result document presente;
2. collector self-test verde in CI;
3. capture workflow manual-only;
4. diagnostic workflow temporaneo rimosso;
5. `STATUS/NEXT/ROADMAP` allineati;
6. main CI post-#111 ricertificata dopo il flake GitHub Actions;
7. CI completa verde sul final head #113;
8. diff senza backend, D1, affiliate activation o deploy.

## Decisione First Euro — invariata

PR #111 è mergiata.

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

L'A–Z non autorizza un riordino meccanico.

Nuovo candidate:

```text
/esim-hotspot
```

Ruolo previsto: **traffic/problem feeder**. La SERP è principalmente setup/support/tethering, quindi non trasformarla in money page solo perché l'Autocomplete è ampio.

## Dopo #113 — due track parallele

Non tornare a una roadmap puramente backend.

### Track A — First Money UI

Branch pubblica separata, preview-first:

```text
/migliore-esim consumer rewrite
```

Obiettivo:

```text
current foundation copy
→ consumer-first buying decision
```

La preview può implementare:

- hero orientato alla scelta;
- scenario cards;
- destinazione / giorni / dati / hotspot come percorso mentale;
- A–Z-derived questions e anchor quando coerenti con l'owner;
- evidence slots e `unknown/partial` states;
- internal links v2;
- disclosure placeholder non commerciale;
- mobile/desktop/accessibility smoke.

Non può ancora:

- pubblicare provider claims non verificati;
- attivare affiliate links;
- introdurre winner universale;
- cambiare `AFFILIATE_MODE`;
- fare deploy.

### Track B — Truth Engine minimo

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

Scope:

- definire quali `candidate_new` dei pack Italy/Europe vengono registrate;
- mutation source separata e auditabile se autorizzata;
- nessun importer nella stessa branch;
- nessuna remote migration implicita;
- nessun `claim_verifications` write;
- nessun deploy.

Gate seguente:

```text
idempotent fixture/artifact importer
→ capture run
→ snapshots
→ observations
→ pending evidence candidates
```

Soltanto dopo:

```text
remote 0021 apply — gate esplicito separato
→ controlled ingest
→ verification provenance bridge
```

## Evidence requirements emersi dall'A–Z

### `/esim-europa`

Il brief deve considerare esplicitamente:

```text
coverage
validity/duration
data amount / unlimited model
FUP
hotspot
voice/number availability when supported
source-native price
```

### `/esim-usa`

Prima della money page completa verificare anche:

```text
data-only
vs
voice/SMS/local number
```

Le query A–Z mostrano forte domanda per chiamate/numero, non soltanto GB.

### Provider pages

Mantenere intent separation:

```text
Airalo:
  /airalo-come-funziona
  /airalo-recensioni
  /airalo-vs-holafly

Holafly:
  /holafly-come-funziona
  /holafly-recensioni
  /codice-sconto-holafly
```

Non creare mega-guide provider che cannibalizzano setup, review e coupon.

## Affiliate applications — dipendenza esterna parallela

In corso:

```text
Airalo
Holafly
Ubigi
```

Regole:

- non incollare secret/token in chat o repository;
- partner IDs/tracking config restano secret/config appropriata;
- nessun link production senza disclosure + measurement gate.

## First affiliate activation gate

Prima di accendere monetizzazione:

1. almeno una money page consumer-ready;
2. facts commerciali bounded e fresh;
3. affiliate account approvato;
4. `/go/*` destination/redirect validato;
5. disclosure pubblica chiara;
6. `provider_redirect_intent` event design accettato;
7. consent/privacy regression rechecked;
8. `AFFILIATE_MODE` change esplicito;
9. production deploy manuale autorizzato;
10. live smoke redirect + disclosure + no secret leakage.

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
- non usare Indexing API;
- interrogare GSC quando il dataset diventa sostanziale.

Quando emergono query reali:

```text
impressions without clicks
positions 8–20
unexpected query-page matches
new long tails
```

→ alimentano refresh e priorità.

## Checkpoint aperti

- final CI + ready/merge #113;
- source reconciliation;
- preview-first `/migliore-esim`;
- affiliate approvals;
- first bounded evidence materialization;
- affiliate/measurement gate;
- first explicit production deploy money-ready;
- `/esim-europa`;
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
