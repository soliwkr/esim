# Page Readiness Gate ed evidence bundle

Il Page Readiness Gate separa tre decisioni che non devono essere confuse:

```text
claim verificati
  -> evidence bundle versionato
  -> idoneità a creare un draft in review
  -> revisione umana
  -> eventuale idoneità alla pubblicazione
```

Il gate non crea né pubblica automaticamente una pagina.

## Decisioni

- `reviewDraftEligible`: le evidenze permettono di costruire una bozza attribuita e sottoporla a revisione.
- `publicationEligible`: non esistono claim insufficienti, conflitti di scope, claim pendenti, contraddetti o scaduti.
- `readyForReviewDraft`: decisione operativa del gate per la creazione di un draft in `review`.
- `readyForPublication`: diventa `true` soltanto dopo `publicationEligible=true` e approvazione umana esplicita.

Un bundle può quindi restituire:

```json
{
  "reviewDraftEligible": true,
  "publicationEligible": false,
  "readyForReviewDraft": true,
  "readyForPublication": false
}
```

## Evidence bundle

La migrazione `0015_page_readiness_gate.sql` introduce:

- `page_evidence_bundles`: snapshot immutabili e versionati;
- `page_readiness_events`: audit delle valutazioni e delle decisioni umane.

Ogni bundle contiene:

- brief e punteggi originali;
- segnali recent-demand di provenienza;
- claim atomici e relativo scope;
- fonti, valori, evidenza e scadenza;
- claim insufficienti, contraddetti, pendenti o scaduti;
- conflitti deterministici rilevati;
- blocker, warning e regole editoriali;
- decisioni separate per draft e pubblicazione.

La stessa evidenza produce lo stesso `bundleKey` e non genera duplicati. Quando cambiano claim, fonti, valori o scadenze viene creata una nuova versione e la precedente viene marcata `superseded`.

## Regole v1

Un draft in revisione è idoneo quando:

1. il brief è `accepted` o `converted`;
2. esiste almeno un claim atomico verificato e corrente;
3. non esistono claim pendenti o in lavorazione;
4. non esistono verifiche scadute;
5. non esistono claim contraddetti.

La pubblicazione è idonea soltanto quando, oltre alle condizioni precedenti:

1. non esistono claim `insufficient`;
2. non esistono conflitti di scope tra fonti ufficiali;
3. una persona approva esplicitamente il bundle.

L'assenza di test first-party è un warning, non sempre un blocker: un explainer può attribuire dichiarazioni ufficiali, ma non trasformarle in garanzie indipendenti.

## Endpoint protetti

### Valuta un brief

```http
POST /api/maintenance/page-readiness-evaluate
Authorization: Bearer <MAINTENANCE_TOKEN>
Content-Type: application/json

{
  "briefId": 1,
  "actor": "christian"
}
```

Se il draft è idoneo, viene aperto anche un task `editorial_review` riferito all'evidence bundle.

### Leggi i bundle

```http
GET /api/maintenance/page-readiness?briefId=1&limit=20
Authorization: Bearer <MAINTENANCE_TOKEN>
```

Sono disponibili anche il filtro `bundleId` e la lista globale.

### Registra la decisione umana

```http
POST /api/maintenance/page-readiness-action
Authorization: Bearer <MAINTENANCE_TOKEN>
Content-Type: application/json

{
  "bundleId": 1,
  "action": "approved_for_draft",
  "actor": "christian",
  "notes": "Evidence bundle approvato per generare una bozza in review."
}
```

Azioni:

```text
approved_for_draft
changes_requested
approved_for_publication
```

D1 impedisce `approved_for_draft` quando il gate del draft è negativo e impedisce `approved_for_publication` quando `publicationEligible=false`.

## Confine editoriale

Il bundle impone queste regole:

- soltanto claim `verified` e non scaduti possono essere usati come fatti attribuiti;
- i claim `insufficient` non diventano frasi fattuali;
- dichiarazioni dei provider non diventano test indipendenti;
- formulazioni divergenti restano separate per documento e scope;
- la pagina resta in `review` fino a una decisione umana;
- nessun endpoint del modulo modifica una pagina in `published`.
