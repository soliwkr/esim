# Stato del progetto

Data di riferimento: **18 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | migrazioni versionate fino a `0017_editorial_draft_field_claims.sql` |
| API manutenzione | Operativa | accesso riservato |
| Deploy | Automatico per modifiche operative su `main` | modifiche documentali escluse |
| Container e Workflow recent-demand | Operativi | prima istanza completata end-to-end |
| Quality gate ricerca | Operativo | segnali `eligible` e `filtered` separati |
| AI Gateway e Vertex AI | Operativi | `gemini-3.1-flash-lite` raggiunto attraverso AI Gateway |
| Motore brief | Operativo | primo brief creato, prioritizzato, accettato e convertito |
| Verifica claim | Operativa | claim atomici, fonti, esiti, scadenze e task persistiti |
| Page Readiness | Operativo | primo evidence bundle: score 77, draft sì, pubblicazione no |
| Renderer editoriale v2 | Operativo | campi principali e sezioni legati a claim verificati |
| Primo draft | Approvato editorialmente | draft `2` approved; pagina materializzata ancora `review` |
| Control Room legacy | Transitoria | v3 con client separato e smoke live; verifica browser da chiudere |
| Frontend foundation | Implementata, non distribuita | `apps/web`, React island e custom entrypoint nello stesso bundle Worker |
| Frontend target | Decisione presa | confronto UI e Control Room completa restano fasi successive |
| Pubblicazione automatica | Assente | nessun endpoint pubblica automaticamente |
| Affiliazioni | Disabilitate | link ufficiali non remunerati |
| Analytics | Non configurata | CMP, GA4, GTM e GSC ancora da collegare |

## Primo ciclo editoriale controllato

Il primo segnale idoneo ha prodotto il brief:

```text
eSIM in Cina: funzionano davvero senza VPN?
```

Punteggi:

```text
Opportunity Score: 85
Evidence Score:    54
Priority Score:    63
Priority Band:     medium
```

Il ciclo completato è:

```text
recent demand
→ brief AI
→ accettazione umana
→ requisiti generali
→ claim atomici
→ fonti ufficiali
→ esiti verificati
→ Page Readiness
→ evidence bundle
→ draft v2 grounded
→ approvazione editoriale
```

Nessuno di questi passaggi ha pubblicato la pagina.

## Evidence set Cina

```text
claim atomici: 6
verified:       5
insufficient:   1
pending:        0
```

Claim verificati:

- Airalo dichiara routing attraverso gateway fuori dalla Cina continentale;
- Airalo dichiara che non serve una VPN aggiuntiva;
- Nomad dichiara che non serve una VPN aggiuntiva;
- una FAQ generale Holafly dichiara che non offre un servizio VPN incorporato;
- una pagina prodotto globale Holafly dichiara una VPN integrata automaticamente per i viaggi in Cina.

Il claim riferito alla pagina Holafly specifica per la Cina resta `insufficient`.

Le due formulazioni Holafly restano separate per documento e scope.

## Page Readiness e draft

Evidence bundle `1`:

```text
readiness score:        77
review draft eligible:  true
publication eligible:   false
verified:               5
insufficient:           1
conflicts:              1
first-party tests:      0
```

Draft finale corrente:

```text
id:                     2
version:                2
renderer:               editorial-page-draft-v2
status:                 approved
materialized page:      review
used claim IDs:         4, 5, 6, 8, 9
excluded claim IDs:     7
```

La bozza v1 è `superseded`. Il renderer v2 salva la provenienza di title, meta description, H1, direct answer, intro, sezioni e FAQ.

La pagina pubblica continua a restituire `404` con `noindex, nofollow`.

## Vincoli dimostrati

- Un segnale community non diventa una prova commerciale.
- Un requisito generale non può diventare un fatto verificato.
- Un claim atomico richiede soggetto, campo, affermazione e fonte compatibile.
- Un claim insufficiente non alimenta frasi fattuali.
- Le dichiarazioni dei provider restano attribuite e non diventano test indipendenti.
- Il brief AI originale non viene usato come fonte nel renderer v2.
- Un draft approvato non cambia automaticamente `pages.status` da `review` a `published`.
- D1 blocca la pubblicazione quando i gate non sono soddisfatti.

## Control Room legacy

La dashboard manuale ha dimostrato le API e il flusso operativo, ma non è la base definitiva.

Problema osservato:

```text
Worker
→ stringa HTML
→ CSS incorporato
→ JavaScript browser incorporato
→ listener e DOM manuali
```

Questo approccio ha prodotto fragilità non giustificata. La v3 resta disponibile solo come soluzione transitoria e per bugfix critici.

Nessuna nuova funzione importante deve essere aggiunta alla Control Room legacy.

## Frontend target

La direzione approvata è:

```text
Astro
├── sito pubblico
├── layout, SEO e pagine
└── shell Control Room

React island
└── Control Room interattiva

Worker esistente
└── execution plane, API e binding
```

Il candidato principale per la UI è shadcn/ui usando componenti e dashboard block esistenti. Mantine viene confrontato nello spike sulle stesse tre viste.

Il piano completo vive in `docs/FRONTEND-PLAN.md`.

## Astro frontend foundation

La branch `feat/astro-frontend-foundation` aggiunge una fondazione non pubblica e mantiene un solo execution plane:

```text
apps/web/src/worker.ts
├── /astro-foundation → handler Astro
├── API, pagine legacy e redirect → router backend esistente
├── export RecentDemandWorkflow
└── export Last30DaysContainer
```

Il bundle generato conserva D1, secret, AI Gateway/Vertex e i binding esistenti. Lo smoke CI avvia il bundle in `workerd`, richiede realmente la pagina Astro e `/api/health`, verifica Workflow e Container e conferma che le route di pubblicazione candidate restituiscano `404`.

La pagina di fondazione è `noindex,nofollow`. Nessun deploy pubblico è stato eseguito e la Control Room completa non fa parte di questa fase.

## Rischi aperti

1. La Control Room v3 deve essere verificata realmente nel browser.
2. La fondazione Astro deve essere revisionata e restare non distribuita finché la PR non viene unita intenzionalmente.
3. Il kit UI deve essere scelto con uno spike misurato, non per preferenza estetica.
4. Cloudflare Access deve diventare il perimetro esterno della dashboard.
5. Le verifiche attuali descrivono soprattutto dichiarazioni ufficiali, non test indipendenti sul campo.
6. Le fonti devono rientrare automaticamente nella coda alla scadenza.
7. Serve un health aggregato che includa runtime di Container, Workflow e AI Gateway.
8. Search Console, CMP e analytics non sono ancora disponibili.
9. Il repository pubblico non deve contenere credenziali o dati riservati.

## Prossimo checkpoint

Il prossimo checkpoint è raggiunto quando:

- Control Room v3 è verificata nel browser;
- `apps/web` Astro esiste;
- React island e custom Worker entrypoint funzionano con i binding esistenti;
- tre viste campione sono implementate;
- shadcn/ui e Mantine sono confrontati;
- la decisione UI definitiva è registrata;
- nessuna nuova UI artigianale viene aggiunta;
- nessun gate editoriale o di pubblicazione regredisce.
