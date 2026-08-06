# Prossime azioni

Ultimo aggiornamento: **6 agosto 2026**.

Questa lista contiene soltanto lavoro immediatamente eseguibile e gate già definiti. Non è un changelog.

## Gate corrente — chiudere M7.1 First Euro Demand Intelligence

PR corrente:

```text
#111 — M7.1: start first-euro demand intelligence
branch: research/m7-first-euro-demand-intelligence
```

La branch è research/docs-only: nessun backend, D1 write, affiliate activation o deploy.

Output già presenti:

```text
docs/M7-FIRST-EURO-DEMAND-INTELLIGENCE.md
docs/research/M7-LONG-TAIL-CORPUS-SUMMARY.md
docs/research/FIRST-MONEY-PAGE-BRIEF-MIGLIORE-ESIM.md
docs/research/FIRST-MONEY-PAGE-BRIEF-ESIM-EUROPA.md
research/seo/m7-first-euro-demand-seeds.csv
research/seo/m7-long-tail-priority-universe.csv
research/seo/m7-first-euro-money-pages.csv
research/seo/m7-first-euro-execution-order.csv
research/seo/m7-first-euro-serp-snapshot-2026-08-06.csv
research/seo/m7-p0-question-expansion.csv
research/seo/m7-first-euro-cannibalization-v2.csv
research/seo/m7-internal-linking-v2.csv
research/seo/m7-search-to-social-angle-bank.csv
```

### Decisione first-money

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

L'ordine completo 1→20 è versionato in `m7-first-euro-execution-order.csv`.

### Acceptance #111

Prima di ready/merge:

1. corpus Planner originale 1.623 keyword realmente letto;
2. long-tail commercial/destination/provider subset versionato;
3. P0 SERP competitor snapshot completato;
4. query/question expansion da SERP, provider FAQ e community acquisita;
5. cluster ownership/cannibalization v2 definita;
6. top 20 execution order definito;
7. brief `/migliore-esim` completo;
8. brief `/esim-europa` completo;
9. evidence requirements per le prime money page espliciti;
10. internal linking v2 definito;
11. search-to-social angle bank definito;
12. STATUS/NEXT allineati;
13. CI completa verde sul final head.

Google raw Autocomplete non è un gate bloccante se l'endpoint diretto non è disponibile nell'ambiente: non inventare suggestions. Il corpus viene espanso con Planner completo + SERP/query surfaces reali e può ricevere un successivo autocomplete capture riproducibile senza cambiare ownership automaticamente.

## Dopo #111 — due track parallele

Non tornare a una roadmap puramente backend.

### Track A — Truth Engine minimo

Prossima branch tecnica separata:

```text
source reconciliation / onboarding
```

Base:

```text
PR #110 merged
0021 versionata
D1 remote ancora 0020
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

- definire esattamente quali `candidate_new` dei pack Italy/Europe vengono registrate;
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

### Track B — First Money UI

Dopo merge #111 può partire in parallelo una branch pubblica **preview-first** per `/migliore-esim`.

Obiettivo:

```text
current dev/foundation copy
→ consumer-first buying decision
```

La preview può implementare:

- hero orientato alla scelta;
- scenario cards;
- destinazione / giorni / dati / hotspot come percorso mentale;
- evidence slots e states;
- internal links v2;
- disclosure placeholder non commerciale;
- mobile/desktop/accessibility smoke.

Non può ancora:

- pubblicare nuovi provider claims non verificati;
- attivare affiliate links;
- introdurre winner universale;
- cambiare `AFFILIATE_MODE`;
- fare deploy.

La final materialization commerciale si collega alla Track A quando i fatti bounded sono disponibili.

## Affiliate applications — dipendenza esterna parallela

L'utente sta aprendo:

```text
Airalo
Holafly
Ubigi
```

Quando arrivano approval / account details:

- non incollare secret o token in chat/repository;
- registrare soltanto lo stato non sensibile necessario;
- partner IDs / tracking config restano in secret/config appropriata;
- non attivare link in produzione senza disclosure + measurement gate.

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
10. live smoke del redirect + no secret leakage.

## M7.2 — Search-to-Social

Non aspettare una grande content library.

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

Tool AI/video sono execution tools, non fonti di verità.

Nessun social claim commerciale può superare il freshness/evidence standard della pagina da cui deriva.

## Homepage e hub consumer-first

Dopo la prima money slice, riallineare:

```text
/
/destinazioni
/confronti
```

Obiettivo:

- meno linguaggio su workflow/gate/ownership;
- più destinazioni, domande, scenari e CTA verso pagine utili;
- metodo e governance spostati verso `/metodo` e `/trasparenza`;
- nessuna cannibalizzazione delle specialist pages.

Non fare un rewrite generale prima di avere almeno una destinazione commerciale reale verso cui inviare l'utente.

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
- continuare a interrogare GSC quando il dataset diventa sostanziale.

Quando emergono query reali:

```text
impressions without clicks
positions 8–20
unexpected query-page matches
new long tails
```

→ alimentano M7.1/M7.2 e refresh priority.

## M4 parallela

Le mutation residue della Control Room possono continuare soltanto su branch ristrette e non devono bloccare il first-money path:

```text
brief conversion
claim operations
draft decisions
retry queue
```

Legacy privata resta fallback finché necessario.

## Checkpoint aperti

- final CI + ready/merge #111;
- source reconciliation;
- affiliate approvals;
- preview-first `/migliore-esim` consumer rewrite;
- first bounded evidence materialization;
- affiliate/measurement gate;
- first explicit production deploy money-ready;
- `/esim-europa` come prima nuova money page;
- ricontrollo definitivo `www → apex`.

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
