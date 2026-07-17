# Draft editoriali vincolati all'evidence bundle

Il renderer crea una bozza soltanto da un `page_evidence_bundle` approvato umanamente per il draft.

```text
bundle approved_for_draft
  -> claim verified e correnti
  -> Vertex AI con JSON strutturato
  -> validazione degli ID dei claim
  -> pagina materializzata con status=review
  -> preview privata noindex
  -> revisione umana separata
```

Il renderer non può pubblicare una pagina.

## Migrazione

`0016_editorial_review_drafts.sql` introduce:

- `editorial_review_drafts`: versioni della bozza collegate a un bundle immutabile;
- `editorial_review_draft_events`: audit di generazione e revisione;
- trigger D1 che richiedono un bundle approvato e impediscono di superare il gate di pubblicazione.

## Regole

1. Il bundle deve avere `reviewStatus=approved_for_draft` oppure `approved_for_publication`.
2. Sono passati al modello soltanto claim `verified`, non scaduti e dotati di fonte HTTPS.
3. Ogni sezione e FAQ deve dichiarare gli ID dei claim usati.
4. Gli ID restituiti dal modello vengono filtrati contro la whitelist del bundle.
5. Claim `insufficient`, scaduti, pendenti o contraddetti sono esclusi.
6. I conflitti di scope vengono aggiunti alla bozza come callout deterministici.
7. In assenza di test first-party viene aggiunto un limite editoriale esplicito.
8. La riga `pages` viene creata o aggiornata esclusivamente con `status=review`.
9. Le pagine in review non entrano in listing, sitemap o routing pubblico.
10. Una generazione identica è idempotente; `force=true` crea una nuova versione e consuma una nuova chiamata AI.

## Endpoint

### Approva prima il bundle

```http
POST /api/maintenance/page-readiness-action

{
  "bundleId": 1,
  "action": "approved_for_draft",
  "actor": "christian",
  "notes": "Bundle approvato per una bozza in review."
}
```

### Genera la bozza

```http
POST /api/maintenance/editorial-draft-generate
Authorization: Bearer <MAINTENANCE_TOKEN>
Content-Type: application/json

{
  "bundleId": 1,
  "actor": "christian"
}
```

### Elenca le bozze

```http
GET /api/maintenance/editorial-drafts?bundleId=1&limit=20
Authorization: Bearer <MAINTENANCE_TOKEN>
```

### Preview privata

```http
GET /api/maintenance/editorial-draft-preview?draftId=1
Authorization: Bearer <MAINTENANCE_TOKEN>
```

La preview restituisce HTML con `noindex`, `nofollow`, `no-store` e non usa il routing pubblico delle pagine.

### Decisione editoriale

```http
POST /api/maintenance/editorial-draft-action
Authorization: Bearer <MAINTENANCE_TOKEN>
Content-Type: application/json

{
  "draftId": 1,
  "action": "changes_requested",
  "actor": "christian",
  "notes": "Rendere più chiara la divergenza tra le pagine Holafly."
}
```

Azioni disponibili:

```text
changes_requested
approved
```

`approved` approva la qualità editoriale della bozza. Non rende la pagina pubblica. La pubblicazione richiede ancora `publicationEligible=true`, `approved_for_publication` sul bundle e un'operazione separata non inclusa in questo modulo.
