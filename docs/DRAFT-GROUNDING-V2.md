# Draft grounding v2

Il renderer v2 corregge un limite emerso nel primo draft reale: sezioni e FAQ erano collegate a claim verificati, mentre `title`, `metaDescription`, `h1`, `directAnswer` e `intro` non avevano una provenienza persistita per campo.

## Regola centrale

```text
brief tematico sanificato
  + claim verificati e correnti
  -> renderer v2
  -> claimIds per ogni campo principale
  -> validazione deterministica
  -> pagina status=review
```

Il `directAnswer`, la rationale e l'outline del brief AI originale non vengono passati come fonte al renderer. Il brief conserva soltanto tema, titolo proposto, slug, asset type e search intent.

## Provenienza per campo

La migrazione `0017_editorial_draft_field_claims.sql` introduce `editorial_review_draft_field_claims`.

Sono tracciati:

- `title`;
- `meta_description`;
- `h1`;
- `direct_answer`;
- `intro`;
- ogni sezione;
- ogni FAQ.

Ogni mapping deve riferirsi a un claim atomico verificato appartenente allo stesso brief del bundle.

## Guardrail

Il renderer rifiuta l'output quando:

- un campo principale non contiene almeno un claim ID ammesso;
- `directAnswer`, intro o meta description non nominano i provider cui attribuiscono i claim;
- compaiono servizi specifici, come Google Maps o social network, non presenti nell'evidenza verificata;
- compaiono promesse assolute come “garantisce” o “funziona sempre”;
- una sezione o FAQ non ha claim verificati;
- il testo generalizza il claim di un provider a tutte o ad “alcune” eSIM.

Le fonti mostrate nella bozza sono soltanto quelle dei claim effettivamente usati.

## Compatibilità e versioni

Il prompt è versionato come:

```text
editorial-page-draft-v2
```

Una bozza v1 non viene considerata duplicata rispetto alla v2. Dopo una generazione v2 riuscita, le precedenti bozze in `review` o `changes_requested` vengono marcate `superseded`.

D1 impedisce inoltre:

- l'approvazione di una bozza legacy v1;
- l'approvazione di una v2 priva della provenienza completa per i cinque campi principali.

## Endpoint

La generazione continua a usare:

```http
POST /api/maintenance/editorial-draft-generate
```

Lo stato dettagliato della provenienza è disponibile con:

```http
GET /api/maintenance/editorial-draft-grounding?draftId=<id>
```

La bozza resta `review`, non entra nel routing pubblico e non può essere pubblicata attraverso questo modulo.
