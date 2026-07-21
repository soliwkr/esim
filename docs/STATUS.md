# Stato del progetto

Data di riferimento: **21 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | migrazioni versionate fino a `0017_editorial_draft_field_claims.sql` |
| API manutenzione | Operativa | accesso riservato e contratto invariato |
| Deploy | Automatico per modifiche operative su `main` | modifiche documentali escluse |
| Container e Workflow recent-demand | Operativi | prima istanza completata end-to-end |
| Quality gate ricerca | Operativo | segnali `eligible` e `filtered` separati |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato verificato |
| Motore brief | Operativo | primo brief creato, prioritizzato, accettato e convertito |
| Verifica claim | Operativa | claim atomici, fonti, esiti, scadenze e task persistiti |
| Page Readiness | Operativa | primo evidence bundle: score 77, draft sì, pubblicazione no |
| Renderer editoriale v2 | Operativo | campi principali e sezioni legati a claim verificati |
| Primo draft | Approvato editorialmente | draft `2` approved; pagina materializzata ancora `review` |
| Control Room legacy | Transitoria | v3 disponibile soltanto come fallback e per bugfix critici |
| Frontend foundation | Operativa | Astro, React island e custom entrypoint nello stesso Worker |
| Cloudflare Access | Operativo e verificato | policy utente, service token CI e validazione JWT nell’origine |
| Sessione server-side Control Room | Operativa | un solo login e snapshot automatico verificati nel browser reale |
| Overview e health nuova Control Room | PR #32 in verifica | frontend-only, contratti invariati e gestione degli errori parziali |
| Pubblicazione automatica | Assente | nessun endpoint pubblica automaticamente |
| Affiliazioni | Disabilitate | modalità affiliate non attiva |
| Analytics | Non configurata | CMP, GA4, GTM e GSC ancora da collegare |

## Primo ciclo editoriale controllato

Il primo segnale idoneo ha prodotto il brief:

```text
eSIM in Cina: funzionano davvero senza VPN?
```

```text
Opportunity Score: 85
Evidence Score:    54
Priority Score:    63
Priority Band:     medium
```

Flusso completato:

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

Il claim riferito alla pagina Holafly specifica per la Cina resta `insufficient`. Le formulazioni provenienti da documenti diversi restano separate per fonte e scope.

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

Draft corrente:

```text
id:                     2
version:                2
renderer:               editorial-page-draft-v2
status:                 approved
materialized page:      review
used claim IDs:         4, 5, 6, 8, 9
excluded claim IDs:     7
```

La pagina pubblica continua a restituire `404` con `noindex, nofollow`.

## Vincoli dimostrati

- Community e trend non diventano prove commerciali.
- Un requisito generale non diventa un fatto verificato.
- Un claim insufficiente non alimenta testo fattuale.
- Le dichiarazioni dei provider restano attribuite.
- Un draft approvato non diventa automaticamente una pagina pubblicata.
- Il livello dati conserva i gate di pubblicazione.

## Control Room definitiva

Architettura operativa:

```text
Cloudflare Access
→ validazione nell’origine
→ shell Astro
→ una React island
→ proxy snapshot read-only
→ API esistente
→ D1 soltanto server-side
```

Il browser non accede direttamente a D1 e non conserva credenziali operative. La Control Room legacy resta limitata a fallback e bugfix critici.

### Sessione server-side verificata

La PR #31 è mergiata e verificata in produzione:

- un solo login visibile;
- nessun campo token nella UI;
- nessuna credenziale applicativa nello storage del browser;
- snapshot reale caricato automaticamente;
- proxy read-only protetto;
- API originale invariata per agenti e consumer legacy;
- nessuna mutation o capacità di pubblicazione.

### PR #32 — Overview e health

La PR #32 migra la prima vista funzionale usando soltanto i dati già esposti:

- tutte le 19 metriche di overview;
- gruppi Fonti e coda, Ricerca recente, Brief e claim, Readiness e pagine;
- capability Worker, D1, maintenance API, Workflow, Container, AI Gateway e Vertex;
- timestamp dello snapshot;
- guardrail di pubblicazione e stato affiliate visibili;
- validazione runtime dei payload;
- caricamento indipendente di health e snapshot;
- dati validi preservati durante un errore parziale;
- claim e draft preview ancora in sola lettura.

La vista distingue una capability o un binding configurato da un vero probe end-to-end. Un health aggregato completo dei servizi esterni non è ancora dichiarato operativo.

## Rischi aperti

1. La PR #32 deve superare typecheck, build, runtime e browser smoke.
2. La nuova overview deve essere verificata manualmente su desktop e mobile dopo il deploy.
3. L’health corrente descrive soprattutto configurazione e binding.
4. L’API originale deve restare compatibile con gli altri consumer autorizzati.
5. La Control Room legacy deve restare congelata.
6. L’eventuale confronto Mantine resta non eseguito.
7. Le verifiche editoriali attuali descrivono soprattutto dichiarazioni ufficiali, non test indipendenti sul campo.
8. Le fonti devono rientrare automaticamente nella coda alla scadenza.
9. Search Console, CMP e analytics non sono ancora disponibili.
10. Il repository pubblico non deve contenere credenziali o dati riservati.

## Prossimo checkpoint

Il prossimo checkpoint è raggiunto quando:

- PR #32 è mergiata con CI completa verde;
- overview reale e timestamp sono visibili;
- health e snapshot falliscono in modo indipendente;
- payload non validi vengono rifiutati;
- claim e draft preview non regrediscono;
- live smoke e verifica manuale desktop/mobile sono verdi;
- nessun nuovo HTML o JavaScript artigianale viene aggiunto;
- nessun gate editoriale o di pubblicazione regredisce.
