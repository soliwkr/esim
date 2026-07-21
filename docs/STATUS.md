# Stato del progetto

Data di riferimento: **21 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | migrazioni versionate fino a `0017_editorial_draft_field_claims.sql` |
| API manutenzione | Operativa | accesso riservato con `MAINTENANCE_TOKEN` |
| Deploy | Automatico per modifiche operative su `main` | modifiche documentali escluse |
| Container e Workflow recent-demand | Operativi | prima istanza completata end-to-end |
| Quality gate ricerca | Operativo | segnali `eligible` e `filtered` separati |
| AI Gateway e Vertex AI | Operativi | `gemini-3.1-flash-lite` raggiunto attraverso AI Gateway |
| Motore brief | Operativo | primo brief creato, prioritizzato, accettato e convertito |
| Verifica claim | Operativa | claim atomici, fonti, esiti, scadenze e task persistiti |
| Page Readiness | Operativo | primo evidence bundle: score 77, draft sì, pubblicazione no |
| Renderer editoriale v2 | Operativo | campi principali e sezioni legati a claim verificati |
| Primo draft | Approvato editorialmente | draft `2` approved; pagina materializzata ancora `review` |
| Control Room legacy | Transitoria | v3 con client separato e smoke live |
| Frontend foundation | Operativa | `apps/web`, React island e custom entrypoint nello stesso bundle Worker |
| Control Room UI foundation | Operativa in sola lettura | shadcn/ui, una island React e snapshot reale |
| Cloudflare Access | Operativo e verificato | policy utente, service token CI e validazione JWT nell'origine |
| Sessione server-side Control Room | PR #31 in verifica | proxy GET-only implementato; live smoke e accesso manuale senza secondo token ancora da verificare |
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

```text
Worker
→ stringa HTML
→ CSS incorporato
→ JavaScript browser incorporato
→ listener e DOM manuali
```

Questo approccio ha prodotto fragilità non giustificata. La v3 resta disponibile soltanto come fallback transitorio e per bugfix critici.

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

Custom Worker entrypoint
├── Access guard
├── proxy read-only per la sessione browser
├── API e binding esistenti
└── Workflow e Container
```

Astro e React non accedono direttamente a D1. La fondazione usa shadcn/ui con sorgenti versionati nel repository. Il confronto con Mantine non è stato eseguito e non viene presentato come prova comparativa.

## Astro frontend foundation

Il custom entrypoint reale è `apps/web/src/worker.ts`:

```text
apps/web/src/worker.ts
├── /astro-foundation → handler Astro
├── /control-room-foundation* → Access guard
│   ├── pagina → handler Astro
│   └── /api/snapshot → proxy read-only verso l'API esistente
├── API, pagine legacy e redirect → router backend esistente
├── export RecentDemandWorkflow
└── export Last30DaysContainer
```

Il bundle conserva D1, secret, AI Gateway/Vertex e binding esistenti. Gli smoke CI avviano il bundle in `workerd`, verificano route Astro, Access, `/api/health`, API snapshot e assenza di route di pubblicazione.

## Control Room UI foundation

La route `/control-room-foundation` usa header e meta `noindex,nofollow`, `no-store` e CSP same-origin. La pagina monta una sola island React e mostra health, metriche, claim filtrabili con dettaglio laterale e metadati dell'ultimo draft.

In produzione al momento dell'apertura della PR #31, il meccanismo transitorio richiede ancora il maintenance token nel browser. La PR #31 sostituisce questo flusso con caricamento automatico tramite `GET /control-room-foundation/api/snapshot`.

La nuova implementazione prevista:

- non serializza il maintenance token;
- non usa `sessionStorage`;
- non invia `Authorization` dal browser;
- conserva l'API originale per agenti e consumer legacy;
- resta totalmente read-only;
- non introduce mutation o pubblicazione.

## Cloudflare Access

Cloudflare Access protegge realmente `/control-room-foundation*`. Sono stati verificati:

- login dell'identità operativa;
- policy deny-by-default;
- service token CI con policy Service Auth;
- Worker secrets `CF_ACCESS_TEAM_DOMAIN` e `CF_ACCESS_AUD`;
- firma RS256, issuer, audience e validità temporale nel Worker;
- richiesta anonima non autorizzata;
- richiesta CI autorizzata;
- shell Astro `200` con `no-store` e `noindex`.

Il guard restituisce `503` se la configurazione manca e `403` se il JWT manca o non è valido.

## Sessione server-side in PR #31

La PR #31 introduce un confine BFF minimo dentro il custom entrypoint:

```text
browser autenticato da Access
→ GET /control-room-foundation/api/snapshot
→ validazione JWT nell'origine
→ Authorization interno con MAINTENANCE_TOKEN
→ GET /api/maintenance/control-room
→ risposta read-only no-store/noindex
```

Il proxy accetta soltanto `GET`, non inoltra header arbitrari del browser e preserva il contratto dell'API esistente.

Questa capacità non è dichiarata operativa finché non passano CI, live smoke e verifica manuale nel browser senza secondo login.

## Rischi aperti

1. La PR #31 deve superare typecheck, build, `workerd`, Chromium e live smoke.
2. Il caricamento automatico deve essere verificato manualmente dopo il deploy.
3. Un errore del proxy deve restare fail-closed e non esporre secret.
4. L'API originale deve continuare a servire agenti autorizzati senza cambiare contratto.
5. La Control Room legacy deve restare limitata a fallback e bugfix critici.
6. shadcn/ui è operativo; l'eventuale confronto Mantine resta non eseguito.
7. Le verifiche editoriali attuali descrivono soprattutto dichiarazioni ufficiali, non test indipendenti sul campo.
8. Le fonti devono rientrare automaticamente nella coda alla scadenza.
9. Serve un health aggregato che includa runtime di Container, Workflow e AI Gateway.
10. Search Console, CMP e analytics non sono ancora disponibili.
11. Il repository pubblico non deve contenere credenziali o dati riservati.

## Prossimo checkpoint

Il prossimo checkpoint è raggiunto quando:

- PR #31 è mergiata con CI verde;
- pagina e proxy restano protetti da Access;
- il browser carica lo snapshot senza maintenance token;
- nessun secret compare in HTML, URL, bundle, storage o request browser;
- il proxy live restituisce `200`, `no-store`, `noindex` e `publicationAutomation:false`;
- l'API originale resta protetta e invariata;
- smoke runtime, Chromium e live sono verdi;
- nessun nuovo HTML/JS artigianale viene aggiunto;
- nessun gate editoriale o di pubblicazione regredisce.
