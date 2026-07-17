# Verifica dei claim derivati dai brief editoriali

Questo modulo trasforma un brief editoriale **accettato da una persona** in una serie di affermazioni o requisiti di verifica distinti.

Un claim candidato non è un fatto verificato. Non può alimentare una pagina pubblicata finché non viene collegato a una fonte ammessa e a un record in `claim_verifications`.

## Flusso

```text
brief proposed
  -> decisione umana: accepted
  -> conversione controllata
  -> editorial_claim_candidates
  -> un task verify_claims per candidato
  -> raccolta e valutazione della fonte
  -> verified | contradicted | insufficient | dismissed
  -> claim_verifications solo per verified/contradicted
```

La conversione porta il brief da `accepted` a `converted`, ma non crea una pagina e non pubblica contenuti.

## Tabelle

### `editorial_claim_candidates`

Conserva:

- brief di provenienza;
- campo normalizzato;
- testo del claim candidato;
- domanda di verifica originale;
- tipologie di fonte ammesse;
- stato operativo;
- eventuale fonte collegata;
- eventuale record `claim_verifications`;
- evidenza e note.

Stati:

```text
pending
processing
verified
contradicted
insufficient
dismissed
```

### `editorial_claim_events`

Audit append-only delle azioni principali:

- creazione;
- inserimento in coda;
- presa in carico;
- riapertura;
- esito;
- scarto.

## Fonti ammesse per un esito fattuale

Un claim può diventare `verified` o `contradicted` soltanto con una fonte appartenente a una delle seguenti categorie:

```text
official_provider
official_help
official_terms
regulator
manufacturer
first_party_test
```

`editorial_reference`, Reddit, YouTube e altri contenuti di community non possono certificare prezzi, condizioni, rete, copertura, routing, VPN, hotspot, fair use, rimborsi o compatibilità.

Il database impedisce lo stato `verified` o `contradicted` quando mancano:

1. `source_id`;
2. `claim_verification_id`.

## Endpoint protetti

### Converti un brief accettato

```http
POST /api/maintenance/editorial-brief-convert
Authorization: Bearer <MAINTENANCE_TOKEN>
Content-Type: application/json

{
  "briefId": 1,
  "actor": "human-reviewer"
}
```

La conversione è idempotente. Ogni voce di `requiredVerifications` diventa un claim candidato e un task `verify_claims`.

Il brief deve essere già `accepted`. Un brief `proposed` viene respinto con `409`.

### Elenca i claim candidati

```http
GET /api/maintenance/editorial-claim-candidates?briefId=1&status=all&limit=50
Authorization: Bearer <MAINTENANCE_TOKEN>
```

La risposta include:

- claim e domanda di verifica;
- fonti richieste;
- stato e priorità del task;
- fonte utilizzata;
- eventuale esito persistito in `claim_verifications`.

### Registra l’esito

Esito positivo con nuova fonte:

```http
POST /api/maintenance/editorial-claim-result
Authorization: Bearer <MAINTENANCE_TOKEN>
Content-Type: application/json

{
  "candidateId": 1,
  "outcome": "verified",
  "actor": "human-reviewer",
  "source": {
    "kind": "official_help",
    "label": "Documentazione ufficiale del provider",
    "url": "https://example.com/help/article",
    "trustLevel": 5,
    "freshnessDays": 14
  },
  "value": {
    "supported": true
  },
  "confidence": 1,
  "evidence": "La documentazione dichiara esplicitamente ...",
  "notes": "Controllato manualmente."
}
```

È possibile usare una fonte già registrata tramite `sourceId`.

Esiti ammessi:

```text
verified
contradicted
insufficient
dismissed
```

`verified` e `contradicted` richiedono una fonte ammessa e un testo di evidenza. `insufficient` registra che le fonti consultate non bastano; non crea un claim verificato. `dismissed` chiude un candidato non utile o duplicato.

## Confine editoriale

Il modulo non:

- crea automaticamente una pagina;
- modifica una pagina pubblicata;
- considera la formulazione di Gemini una prova;
- promuove un claim senza fonte;
- sostituisce la revisione umana.

Il passaggio successivo, separato, potrà creare una pagina in stato `review` soltanto quando i claim necessari hanno esiti sufficienti e aggiornati.
