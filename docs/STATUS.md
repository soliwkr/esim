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
| Frontend foundation | Unita con PR #26 | `apps/web`, React island e custom entrypoint nello stesso bundle Worker |
| Control Room UI foundation | Unita con PR #27 | shadcn/ui, una island React e snapshot protetto in sola lettura |
| Cloudflare Access guard | Implementato su feature branch | JWT validato nell'origine; configurazione Access e secret ancora da completare |
| Frontend target | Incrementale | migrazione operativa completa non eseguita |
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

La fondazione della nuova Control Room usa shadcn/ui con sorgenti versionati nel repository. Il confronto con Mantine non è stato eseguito in questa fase e non viene presentato come prova comparativa.

Il piano completo vive in `docs/FRONTEND-PLAN.md`.

## Astro frontend foundation

La PR #26 ha aggiunto la fondazione Astro e mantiene un solo execution plane:

```text
apps/web/src/worker.ts
├── /astro-foundation → handler Astro
├── /control-room-foundation → Access guard → handler Astro
├── API, pagine legacy e redirect → router backend esistente
├── export RecentDemandWorkflow
└── export Last30DaysContainer
```

Il bundle generato conserva D1, secret, AI Gateway/Vertex e i binding esistenti. Gli smoke CI avviano il bundle in `workerd`, verificano le route Astro e `/api/health`, controllano Workflow e Container e confermano che le route di pubblicazione candidate restituiscano `404`.

## Control Room UI foundation

La PR #27 ha aggiunto `/control-room-foundation` con header e meta `noindex,nofollow`, `no-store` e una CSP limitata allo stesso origin.

La pagina monta una sola island React. I componenti shadcn/ui `Button`, `Card`, `Badge`, `Input`, `Select`, `Table`, `Alert`, `Skeleton`, `Sheet` e `Sonner` sono installati e versionati sotto `apps/web/src/components/ui`.

La sessione riusa `srMaintenanceToken` in `sessionStorage`. Il token viene letto soltanto dopo l'hydration, inviato nell'header `Authorization` e non serializzato da Astro. Senza sessione la UI resta bloccata e non interroga lo snapshot.

La dashboard legge esclusivamente `/api/health` e `GET /api/maintenance/control-room`. Mostra health, metriche, claim filtrabili con dettaglio laterale e metadati dell'ultimo draft. Non contiene mutation, accesso browser a D1, route o pulsanti di pubblicazione. Il backend e i gate editoriali restano invariati.

## Cloudflare Access guard

La branch `feat/control-room-access-guard` aggiunge un controllo fail-closed nel custom Worker entrypoint prima del rendering Astro.

Il guard:

- richiede `CF_ACCESS_TEAM_DOMAIN` e `CF_ACCESS_AUD` come configurazione runtime non versionata;
- legge il JWT soltanto dall'header `Cf-Access-Jwt-Assertion`;
- accetta soltanto firme RS256;
- verifica chiave pubblica, issuer, audience, scadenza, `nbf` e `iat`;
- restituisce `503` se la configurazione manca;
- restituisce `403` se il JWT manca o non è valido;
- non modifica le API di manutenzione né la sessione applicativa.

Gli smoke locali usano una coppia RSA effimera e non versionano chiavi. Il workflow di produzione viene predisposto per verificare sia il blocco anonimo sia l'accesso tramite service token. La protezione non è dichiarata operativa finché l'app Access, le policy e i secret descritti in `docs/CONTROL-ROOM-ACCESS.md` non sono configurati e verificati dal live smoke.

## Rischi aperti

1. La Control Room v3 deve essere verificata realmente nel browser.
2. L'app Cloudflare Access e le policy devono essere configurate prima del merge del guard.
3. Worker secrets e GitHub service-token secrets devono essere presenti senza comparire nel repository.
4. Il primo deploy del guard deve superare smoke anonimo e autenticato; un fallimento deve lasciare la route fail-closed.
5. shadcn/ui è installato per questa fondazione; un eventuale confronto Mantine resta non eseguito.
6. Le verifiche attuali descrivono soprattutto dichiarazioni ufficiali, non test indipendenti sul campo.
7. Le fonti devono rientrare automaticamente nella coda alla scadenza.
8. Serve un health aggregato che includa runtime di Container, Workflow e AI Gateway.
9. Search Console, CMP e analytics non sono ancora disponibili.
10. Il repository pubblico non deve contenere credenziali o dati riservati.

## Prossimo checkpoint

Il prossimo checkpoint è raggiunto quando:

- l'app Cloudflare Access protegge `/control-room-foundation*`;
- il Worker valida realmente il JWT Access;
- richiesta anonima e JWT invalido non raggiungono Astro;
- service token CI e identità operativa raggiungono la shell;
- la sessione applicativa continua a proteggere lo snapshot;
- smoke runtime, Chromium e live sono verdi;
- Control Room v3 è verificata nel browser;
- nessun nuovo HTML/JS artigianale viene aggiunto;
- nessun gate editoriale o di pubblicazione regredisce.
