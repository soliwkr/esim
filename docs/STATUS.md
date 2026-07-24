# Stato del progetto

Data di riferimento: **24 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il custom Worker |
| Dominio `www` | Da ricontrollare | redirect 308 implementato |
| Worker e D1 | Operativi | stack remoto allineato fino a `0020`; topic-mismatch live ancora aperto |
| Workflow e Container | Operativi | primo ciclo recent-demand completato end-to-end |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato verificato |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione automatica |
| Primo draft | Approvato editorialmente | draft `2`; pagina materializzata ancora `review` |
| Control Room nuova | Operativa | parità read-only completa; prima mutation verificata in produzione |
| Control Room legacy | Transitoria e necessaria | fallback delle mutation residue |
| Preview Astro | Verificata in produzione | namespace noindex/no-store |
| Renderer canonico Astro | Compilato e verificato in CI | owner live ancora backend |
| Sitemap e robots parity | Completata | PR #75, CI finale #365 |
| Catalog pilot foundation | Implementata e verificata dalla CI applicativa #373 | PR #77 draft; manifest vuoto; nessuna pubblicazione |
| Affiliazioni | Disabilitate | nessun ranking o link remunerato attivo |
| Analytics | Proprietà preparate, integrazione assente | GTM, GA4 e GSC creati; nessun codice collegato |

## Ciclo editoriale controllato

```text
recent demand
→ brief AI
→ accettazione umana
→ claim atomici
→ fonti ufficiali
→ verifiche
→ Page Readiness
→ evidence bundle
→ draft grounded
→ approvazione editoriale
→ pagina materializzata in review
```

Nessuno di questi passaggi pubblica autonomamente una pagina.

```text
claim:                  6
verified:               5
insufficient:           1
readiness score:        77
review draft eligible:  true
publication eligible:   false
draft:                  2 / version 2 / approved
materialized page:      review
```

La pagina Cina non è autorizzata alla pubblicazione e non entra automaticamente nel pilot.

## Control Room

Completato:

- overview, health, radar, segnali e brief;
- claim, fonti, scadenze e task;
- readiness ed evidence bundle;
- inventario e dettaglio draft;
- queue e audit;
- linkage canonici;
- decisione brief `proposed → accepted | dismissed`.

Mutation residue:

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

M4 non è completato e la legacy privata non può ancora essere rimossa.

## Frontend pubblico Astro

```text
preview M5 ≠ cutover pubblico
owner target ≠ owner live
canonical Astro compilato ≠ canonical Astro servito
candidate ≠ release candidate ≠ published
```

Preview operative sotto `/astro-foundation`:

```text
/
metodo
trasparenza
privacy
destinazioni
guide
confronti
articoli/[slug]
```

Le route canoniche, sitemap e robots live restano backend-owned.

## M5.5 — SEO e routing parity

```text
PR #69  SEO contract
PR #71  route policy — CI #329
PR #73  canonical Astro parity — CI #350
PR #75  sitemap/robots parity — CI #365
```

Nessun cutover o deploy pubblico è stato eseguito.

## M5.6a — Candidate audit foundation

Scope: `docs/PUBLIC-CATALOG-PILOT-SCOPE.md`.

```text
branch feat/public-catalog-pilot-foundation
PR #77 — Add public catalog pilot audit foundation
CI applicativa #373 completamente verde
```

### Implementato

`src/public-catalog-pilot.ts` fornisce:

- modello tipizzato server-only;
- loader D1 read-only;
- latest evidence bundle per brief;
- latest draft per bundle;
- gate deterministici e approvazioni umane;
- controllo renderer grounded;
- provenance top-level, sezioni e FAQ;
- claim atomic/verified, source linkage e freshness;
- coerenza tra draft approvato e pagina materializzata;
- slug, route e file probe safety;
- collisioni di primary keyword e risposta diretta;
- selezione deterministica fino a quattro entry;
- candidate report con selected, excluded, blocker e warning;
- creazione e validazione del manifest.

### Manifest

```text
data/public-catalog-pilot.json
```

Stato corrente:

```json
{
  "schemaVersion": 1,
  "generatedAt": null,
  "entries": []
}
```

È deliberatamente vuoto. Non sono stati inventati Paesi, provider, ID, versioni o claim.

### Verifiche

Lo smoke puro copre:

- candidate valida;
- publication gate negativo;
- claim scaduto;
- latest draft non approved;
- drift draft/pagina;
- slug riservato;
- collisione keyword;
- cap oltre quattro;
- manifest invalido;
- empty state.

Lo smoke D1 aggiuntivo:

- transpila esplicitamente i moduli ESM temporanei;
- applica tutte le migrazioni reali;
- esegue le query contro lo schema D1 effettivo;
- confronta conteggi e stati prima e dopo l’audit;
- verifica che non avvenga alcuna mutation;
- conferma che ogni selected candidate resti `review`.

Il primo run D1 ha permesso di correggere due problemi prima del merge:

1. `primary_keyword` viene letto dalla pagina materializzata, non dal draft;
2. il Worker temporaneo no-bundle riceve JavaScript ESM transpiled, non TypeScript grezzo.

### Guardrail verificati

- nessuna migration nuova;
- nessun `INSERT`, `UPDATE`, `DELETE` o `REPLACE`;
- nessuna route o API pubblica;
- nessun endpoint o pulsante publish;
- nessuna transizione `review → published`;
- active matrix invariata;
- nessun deploy;
- tutte le suite Control Room verdi.

PR #77 resta draft fino alla CI finale sullo stesso head di codice e documentazione.

## Prossima fase M5.6b

Dopo il merge della foundation serve un audit **remoto e read-only** sui dati reali.

L’audit non sceglie pagine in anticipo e può produrre:

```text
0 candidate → blocker report
1–4 candidate → manifest reale
>4 candidate → cap e selezione motivata
```

La pubblicazione resta separata e non autorizzata.

## Google measurement

GTM, GA4, Search Console e service account sono preparati esternamente ma non collegati. Restano assenti CMP, Consent Mode, snippet, eventi e sitemap submission.

## Gap aperti

- CI finale e merge PR #77;
- percorso sicuro per audit remoto read-only;
- report sui dati reali e manifest eventuale;
- preparazione release candidate una pagina alla volta;
- decisione separata di pubblicazione;
- M5.7 cutover apex;
- header HTTP live delle preview;
- topic-mismatch sul primo run autorizzato;
- mutation M4 residue;
- M6 measurement e Search Console.

## Prossimo checkpoint

```text
canonici aggiornati su PR #77
→ CI finale code + documentazione
→ merge senza deploy o pubblicazione
→ audit remoto read-only
```
