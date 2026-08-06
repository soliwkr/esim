# M7.1 — First Euro Demand Intelligence

Data di riferimento: **6 agosto 2026**.

## Perché questa fase esiste

Senza Roaming ha una foundation tecnica e una evidence supply chain molto più mature del prodotto pubblico attuale.

Il problema commerciale ora è esplicito:

```text
macchina live
+ SEO foundation live
+ evidence reale
≠
prodotto consumer già capace di monetizzare bene
```

Homepage e hub pubblici sono strutturalmente corretti ma una parte del copy racconta ancora il metodo editoriale, la ownership delle route e i gate interni più di quanto aiuti il viaggiatore a scegliere e comprare una eSIM.

La fase M7.1 sposta il baricentro da **foundation SEO** a **demand capture e first-money execution**.

Non sostituisce la truth engine. La usa per decidere quali pagine vale la pena alimentare per prime.

## Principio operativo

Da questa fase ogni nuova capacità viene valutata anche con questa domanda:

> Riduce in modo verificabile la distanza fra una domanda reale, una pagina utile e un click affiliate?

La catena commerciale target è:

```text
SEARCH DEMAND
      +
VERIFIED EVIDENCE
      ↓
CONSUMER MONEY PAGE
      ↓
AFFILIATE CLICK
      ↓
ATTRIBUTED SALE
```

La catena di verità resta invariata e separata:

```text
source_registry
→ capture run
→ immutable snapshot
→ field observation
→ pending evidence candidate
→ verification
→ page evidence
```

## Baseline disponibile

### Keyword Planner

Il foglio originale versionato come fonte di ricerca contiene:

```text
1.623 keyword uniche
1.531 keyword con volume > 0
38 blueprint editoriali
28 Tier 1
8 Tier 2
2 Tier 3
```

Periodo:

```text
1 luglio 2025 → 30 giugno 2026
mercato: Italia
lingua: italiano
```

La precedente PR #95 ha correttamente definito ownership e cannibalizzazione, ma non deve essere interpretata come ricerca SEO completata.

Le query commerciali principali già visibili nel dataset includono:

```text
migliore esim                 5.000
esim usa                      5.000
esim giappone                 5.000
esim turchia                  5.000
esim egitto                   5.000
esim thailandia               5.000
esim albania                  5.000
e sim svizzera                5.000
airalo recensioni             5.000
airalo come funziona          5.000
holafly come funziona         5.000
holafly codice sconto         5.000
codice sconto holafly         5.000
```

I volumi sono bucket del Planner, non una previsione di traffico e non vengono sommati ingenuamente come mercato indirizzabile.

Il nuovo file:

```text
research/seo/m7-first-euro-demand-seeds.csv
```

estrae dalla sorgente Planner un primo set commerciale/destination/provider da espandere con SERP, autocomplete, PAA, related searches e dati GSC futuri.

## Search Console — checkpoint reale

GSC Wizard è tornato operativo senza nuova sottoscrizione.

Query aggregata per data sul periodo disponibile:

```text
2026-07-24: 1 impression
click: 0
altre date riportate: 0 impression
```

La query `query + page` restituisce ancora zero righe utili.

Interpretazione:

- esiste già un primo segnale reale di impression;
- il dataset è troppo piccolo per cambiare keyword ownership o priorità;
- query/page a bassissimo volume possono non essere esposte;
- GSC diventerà un feedback loop, non la fonte primaria della roadmap in questa fase iniziale.

Non vengono inventati query, CTR o ranking mancanti.

## SERP live — primo snapshot competitivo

Snapshot:

```text
research/seo/m7-first-euro-serp-snapshot-2026-08-06.csv
```

Osservazioni iniziali:

1. **Tom's Hardware Italia** pubblica guide consumer-first recenti per USA, Giappone, Albania e viaggio all'estero. Le pagine iniziano dal problema del viaggiatore e arrivano a provider, piani, hotspot, copertura e limiti.
2. **esims.io** compete con superfici larghe di comparazione provider/piani per destinazione.
3. Le SERP provider includono **fonti ufficiali**, **Trustpilot**, review editoriali e contenuti video.
4. `Airalo vs Holafly` e confronti travel-eSIM esistono anche come contenuti YouTube affiliate, nonostante il vecchio page-map Planner non assegni volume alla comparison.
5. `esim europa` presenta una SERP commerciale attiva anche se la corrente esportazione Planner italiana non quantifica il cluster.

Conclusione:

```text
Keyword Planner baseline
≠
intero universo di domanda
```

La SERP reale e il social/video discovery devono espandere il corpus.

## Affiliate readiness osservata

### Airalo

Programma affiliate ufficiale attivo.

Osservato il 6 agosto 2026:

```text
standard commission: 10% del valore finale della vendita
tracking: Impact
custom links/codes: supportati
```

### Holafly

Programma affiliate ufficiale attivo.

La pagina pubblica conferma:

```text
commissione per vendita
coupon affiliate personalizzato
tracking vendite
supporto/account management
```

Non espone nella pagina pubblica osservata una percentuale standard fissa; non viene inventata.

### Ubigi

Programma affiliate ufficiale attivo tramite Impact per publisher eSIM/travel.

Questa fase **non attiva** alcun programma, link o tracking. Verifica soltanto che il percorso commerciale esista.

## Prima matrice money-page

File:

```text
research/seo/m7-first-euro-money-pages.csv
```

La priorità non è determinata solo dal volume.

Valutiamo insieme:

```text
demand
× intent commerciale
× evidence readiness
× affiliate path
× current route state
× SERP shape
× content differentiation
```

### Candidati P0

#### `/esim-europa`

Perché è strategica:

- SERP commerciale reale;
- comparison intent naturale;
- abbiamo già due capture reali stabili Airalo/Holafly/Ubigi per lo scenario Europa;
- dati osservati includono price, validity, finite/unlimited, FUP, hotspot, activation e technology;
- può essere la prima **nuova** money page fortemente evidence-backed.

Limite:

- il volume italiano del cluster non è ancora quantificato nel Planner corrente;
- autocomplete/PAA/related searches devono essere acquisiti prima del brief finale.

#### `/migliore-esim`

Perché è strategica:

- URL già live;
- cluster Planner 5.000 / aggregate 12.050;
- può essere trasformata da pagina provider-neutral generica a decision page consumer-first con scenari bounded.

Vincolo:

- nessun winner universale;
- provider recommendation deve restare scenario-specific ed evidence-backed.

#### `/codice-sconto-holafly`

Perché è strategica:

- query esplicitamente transazionale;
- Planner 5.000 + 5.000 sulle due varianti principali;
- programma affiliate e coupon personalizzati esistono.

Vincolo:

- coupon e applicabilità sono dati ad alta volatilità;
- `checked_at`, validità e fonte ufficiale devono essere first-class;
- non creare una pagina che copia soltanto il codice ufficiale.

#### `/airalo-recensioni`

Perché è strategica:

- Planner 5.000;
- forte pre-purchase intent;
- programma affiliate ufficiale;
- grande volume di recensioni terze disponibile.

Vincolo:

- facts ufficiali e user sentiment restano categorie diverse;
- aneddoti non diventano performance claim.

#### Destinazioni ad alta domanda

```text
/esim-usa
/esim-giappone
/esim-egitto
/esim-turchia
/esim-albania
/esim-svizzera
```

Tutte mostrano bucket Planner importanti e intenti commerciali chiari.

Non vengono però pubblicate solo perché hanno volume: richiedono evidence destination-specific prodotta tramite la pipeline non esplorativa che seguirà reconciliation/importer.

## Consumer-first rewrite

La homepage pubblica non deve essere il manifesto del workflow interno.

Target:

```text
Dove vai?
→ quanti giorni?
→ quanti dati?
→ hotspot?
→ quale piano è verificato per questo scenario?
```

Il metodo editoriale resta un trust asset, non la principale proposta di valore della homepage.

Le sezioni dev-oriented del copy vengono progressivamente spostate verso `/metodo` e `/trasparenza`.

## M7.2 — Search-to-Social Content Engine

Il social non è un canale editoriale scollegato.

Target:

```text
keyword / SERP question
→ money page
→ verified facts
→ social angle bank
→ creative brief
→ video / carousel / short
→ human review
→ publish
→ commenti / click / branded search
→ nuove query candidates
```

Primo angle bank:

```text
research/seo/m7-search-to-social-angle-bank.csv
```

Ogni angle conserva:

```text
HOOK
TENSION
EVIDENCE FACT NEEDED
TWIST
CTA
FORMAT
```

Regola creativa:

- umorismo secco, contrasto e punchline possono attirare attenzione;
- il corpo del contenuto torna rapidamente al fatto verificato;
- niente shock gratuito;
- niente claim performance derivati da aneddoti;
- niente pubblicazione automatica;
- l'AI produce draft creativo, non decide la pubblicazione.

Tool come HeyGen, Hyperframes o equivalenti sono mezzi di produzione, non il sistema editoriale. Il format viene scelto dopo l'angle.

## Due track parallele verso il primo euro

### Track A — Truth Engine

```text
#110 schema local-only: merged
→ source reconciliation/onboarding
→ importer idempotente
→ remote migration separata e autorizzata
→ ingest controllato
→ verification provenance
```

### Track B — Traffic & Money

```text
M7.1 demand expansion
→ autocomplete / PAA / related searches
→ SERP clustering
→ money-page briefs
→ homepage/hub consumer rewrite
→ first money page
→ M7.2 search-to-social
→ affiliate activation separata
```

Le due track si incontrano sulla pagina, non devono aspettarsi inutilmente a vicenda.

## Prossimi output M7.1 richiesti

Questa branch apre lo sprint ma non dichiara la ricerca completa finché non esistono almeno:

1. corpus long-tail esteso oltre il Planner seed;
2. autocomplete per cluster P0;
3. People Also Ask / related questions ove disponibili;
4. snapshot SERP italiano per tutti i cluster P0;
5. competitor/content-type map;
6. cluster ownership con cannibalization check;
7. top 10–20 URL ordinati;
8. page brief per la prima money slice;
9. evidence requirements per ogni money page;
10. social angle yield per le prime pagine;
11. nuova internal-link matrix;
12. GSC feedback loop definito quando le impression diventano sostanziali.

## Stop condition

Non si apre una produzione massiva di pagine.

La fase termina quando possiamo rispondere con evidenza a:

```text
Qual è la prima pagina che pubblichiamo?
Per quale cluster?
Contro quale SERP?
Con quale differenziazione?
Con quali fatti verificati?
Con quale programma affiliate?
Con quali 5–10 angle social?
```

A quel punto si costruisce la prima vertical slice commerciale e si misura.

## Non-goals di questa branch

- nessun deploy;
- nessuna nuova route pubblica;
- nessuna mutation D1;
- nessuna remote migration;
- nessun importer;
- nessuna pubblicazione;
- nessun affiliate link attivo;
- nessun nuovo evento analytics;
- nessun ranking provider inventato;
- nessuna automazione social in produzione.
