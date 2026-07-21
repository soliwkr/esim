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
| Overview e health nuova Control Room | Operative e verificate | PR #32 mergiata; CI, deploy e verifica manuale completati |
| Radar e brief nuova Control Room | Operativi e verificati | PR #34 mergiata; run, segnali e brief visibili in produzione |
| Claim, fonti e scadenze | Prossima fase | migrazione read-only sugli oggetti già presenti nello snapshot |
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

### Overview e health verificate

La PR #32 è mergiata, distribuita e verificata nel browser reale:

- tutte le 19 metriche di overview sono visibili;
- capability, binding e limiti dei probe hanno semantica esplicita;
- timestamp e guardrail sono visibili;
- i payload vengono validati a runtime;
- un errore parziale non nasconde l’altra risorsa valida;
- desktop e mobile sono utilizzabili;
- nessuna mutation, pubblicazione o credenziale browser è stata introdotta.

L’health corrente descrive soprattutto configurazione e binding. Un health aggregato con probe end-to-end dei servizi esterni non è ancora dichiarato operativo.

### Radar e brief verificati

La PR #34 è mergiata nel commit `53f8b8f`, con CI completa verde, deploy e verifica nel browser reale:

- gli ultimi run mostrano query, sistema sorgente, tipo, finestra, risultati, warning e conteggi eligible/filtered;
- i segnali mostrano topic, provenienza, freshness, relevance score, stato, idoneità e quality flags;
- il filtro run → segnali usa esclusivamente il `run_id` canonico;
- i brief mostrano cluster, titolo, slug, intent, punteggi persistiti, bundle, readiness e draft nullable;
- filtri e Sheet di dettaglio sono utilizzabili;
- i tre array sono validati a runtime;
- punteggi, stati, flag e valori `null` non vengono ricalcolati o reinterpretati;
- lo snapshot non espone un collegamento diretto segnale → brief e la UI non lo inventa;
- overview, claim preview e draft preview non sono regrediti;
- nessuna mutation o nuova capacità di pubblicazione è stata introdotta.

## Prossima fase — Claim, fonti e scadenze

La fase successiva usa inizialmente i claim già presenti nello snapshot e i relativi campi di fonte, verifica e validità.

Scope iniziale:

- elenco claim con soggetto, campo, testo, stato e brief collegato;
- fonte con tipo, etichetta, URL e trust level quando presente;
- verifica con esito, confidenza, data di controllo e scadenza;
- evidenza, note, domanda di verifica e source kinds richiesti;
- stato del task di manutenzione;
- filtri per stato, fonte, scadenza e brief;
- dettaglio read-only, empty state, errori, tastiera e mobile;
- validazione runtime estesa senza cambiare il contratto backend.

Restano fuori scope:

- decomposizione, modifica o verifica dei claim;
- creazione o modifica delle fonti;
- refresh manuale e mutation della queue;
- nuovi endpoint o query D1;
- readiness, draft decisions e pubblicazione.

## Rischi aperti

1. Lo snapshot espone soltanto i campi già selezionati dal backend; relazioni non presenti non devono essere ricostruite nel client.
2. La semantica di scadenza deve distinguere data assente, futura e superata senza cambiare lo stato canonico del claim.
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

- claim, fonti e scadenze reali sono leggibili nella nuova Control Room;
- contratti runtime coprono i campi necessari senza inventare relazioni;
- stato canonico e stato temporale della scadenza restano distinti;
- filtri, dettagli, desktop, mobile, tastiera, loading, error ed empty state sono verificati;
- nessuna richiesta browser diversa da `GET` viene introdotta;
- overview, radar, brief e draft preview non regrediscono;
- nessuna mutation o capacità di pubblicazione viene introdotta;
- backend, D1, Workflow, Container, AI e gate restano invariati.
