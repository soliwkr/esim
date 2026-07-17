# Stato del progetto

Data di riferimento: **17 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | migrazioni versionate fino a `0017_editorial_draft_field_claims.sql` |
| API manutenzione | Operativa | accesso riservato |
| Container e Workflow recent-demand | Operativi | prima istanza completata end-to-end |
| Quality gate ricerca | Operativo | segnali `eligible` e `filtered` separati |
| AI Gateway e Vertex AI | Operativi | `gemini-3.1-flash-lite` raggiunto attraverso AI Gateway |
| Motore brief | Operativo | primo brief creato, prioritizzato, accettato e convertito |
| Verifica claim | Operativa | claim atomici, fonti, esiti, scadenze e task persistiti |
| Page Readiness | Operativo | primo evidence bundle: score 77, draft sì, pubblicazione no |
| Renderer editoriale v2 | Operativo | campi principali e sezioni legati a claim verificati |
| Primo draft | Approvato editorialmente | draft `2` approved; pagina materializzata ancora `review` |
| Dashboard privata | Implementata, da testare in produzione | Control Room MVP nella PR corrente |
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

## Control Room MVP

La prima dashboard include:

- snapshot aggregato;
- run recenti e segnali;
- brief, Priority Score e stato della pipeline;
- claim atomici, fonti, scadenze e task;
- evidence bundle e Page Readiness;
- draft e renderer;
- queue e audit recente;
- azioni operative senza accesso diretto a D1.

La shell è `noindex` e non incorpora dati. L'accesso ai dati usa la sessione operativa del browser. Non esiste un pulsante di pubblicazione.

## Rischi aperti

1. La Control Room deve essere distribuita e verificata in produzione.
2. Cloudflare Access deve diventare il perimetro esterno della dashboard.
3. Le verifiche attuali descrivono soprattutto dichiarazioni ufficiali, non test indipendenti sul campo.
4. Le fonti devono rientrare automaticamente nella coda alla scadenza.
5. Serve un health aggregato che includa anche controlli runtime di Container, Workflow e AI Gateway.
6. Search Console, CMP e analytics non sono ancora disponibili.
7. Il repository pubblico non deve contenere credenziali o dati riservati.

## Prossimo checkpoint

Il prossimo checkpoint è raggiunto quando:

- `/control-room` è operativo in produzione;
- lo snapshot aggregato restituisce i conteggi reali;
- ricerca, readiness, draft e verifica claim sono eseguibili dalla UI;
- la dashboard è protetta anche da Cloudflare Access;
- nessuna azione della dashboard può pubblicare una pagina;
- `docs/NEXT.md` e la roadmap descrivono il flusso operativo corrente.
