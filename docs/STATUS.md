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
| Control Room nuova | Operativa | parità read-only completa; prima mutation verificata in produzione |
| Control Room legacy | Transitoria e necessaria | fallback delle mutation residue |
| Preview Astro | Verificata in produzione | namespace noindex/no-store |
| Renderer canonico Astro | Compilato e verificato in CI | owner live ancora backend |
| Sitemap e robots parity | Completata | PR #75, CI finale #365 |
| Catalog pilot foundation | Completata | PR #77, merge `fa9ed9486e400e77ad915153284c7b277a51b4d0`, CI finale #379 |
| Remote catalog audit | Implementato e verificato dalla CI applicativa #383 | PR #79 draft; non ancora verificato sui dati remoti live |
| Nuovo design sull’apice | Non ancora live | previsto in M5.7 dopo il primo audit remoto |
| Affiliazioni | Disabilitate | nessun ranking o link remunerato attivo |
| Analytics | Proprietà preparate, integrazione assente | GTM, GA4 e GSC non collegati |

## Ciclo editoriale controllato

```text
recent demand
→ brief AI
→ accettazione umana
→ claim atomici e fonti
→ verifiche
→ Page Readiness
→ evidence bundle
→ draft grounded
→ approvazione editoriale
→ pagina materializzata in review
```

Nessuno di questi passaggi pubblica autonomamente una pagina.

Lo stato noto della pagina Cina resta:

```text
publication eligible: false
materialized page: review
```

Non entra automaticamente nel pilot.

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
candidate ≠ release candidate ≠ published
```

Sono operative sotto `/astro-foundation` homepage, trust pages, listing e renderer articolo. Le route canoniche, `/sitemap.xml` e `/robots.txt` live restano ancora backend-owned.

Parità completate:

```text
PR #69  SEO contract
PR #71  route policy — CI #329
PR #73  canonical Astro parity — CI #350
PR #75  sitemap/robots parity — CI #365
```

## M5.6a — Candidate audit foundation

```text
PR #77
merge fa9ed9486e400e77ad915153284c7b277a51b4d0
CI finale #379
```

La foundation contiene:

- modello tipizzato server-only;
- loader D1 con sole query `SELECT`;
- latest bundle e latest draft;
- publication eligibility e approvazioni umane;
- renderer grounded e provenance;
- claim, fonti e freshness;
- coerenza draft/pagina `review`;
- safety di slug, route e file probe;
- collisioni di keyword e risposta diretta;
- cap deterministico massimo quattro;
- report selected/excluded;
- manifest versionato e validato;
- fixture e smoke sul D1 realmente migrato;
- before/after invariato senza mutation.

Manifest corrente:

```json
{
  "schemaVersion": 1,
  "generatedAt": null,
  "entries": []
}
```

È deliberatamente vuoto: non sono stati inventati Paesi, provider o ID.

## M5.6b — Remote catalog audit

Scope:

```text
docs/PUBLIC-CATALOG-REMOTE-AUDIT-SCOPE.md
PR #78
merge bc0050b891b93678631fa80d3d46ac36a1fbb2fd
CI #381
```

Branch tecnica:

```text
feat/public-catalog-remote-audit
PR #79 — Add private read-only catalog audit route
CI applicativa #383 completamente verde
```

Implementato:

```text
GET /control-room-foundation/api/catalog-pilot-audit
```

Contratto:

- protetto da Cloudflare Access e validazione JWT nell’origine;
- D1 letto server-side;
- riuso del loader e dell’audit M5.6a;
- nessun maintenance token nel browser;
- GET-only;
- no-store, noindex e nosniff;
- payload fail-closed se contiene dati secret-like;
- nessun dump D1 o query controllata dal browser;
- nessuna mutation o capacità di pubblicazione.

Lo smoke dedicato dimostra:

- richiesta anonima bloccata;
- metodo non GET respinto;
- report valido con massimo quattro selected;
- selected candidate ancora `review`;
- credenziali assenti dal payload;
- snapshot editoriale identico prima e dopo la chiamata.

La route non è ancora stata verificata sui dati remoti live.

## Quando va live il nuovo design

Il nuovo design va live con **M5.7**, dopo il primo audit remoto riuscito.

La sequenza corrente è:

```text
chiusura PR #79
→ verifica route privata in produzione
→ audit remoto reale, anche con 0 candidate
→ PR M5.7 di cutover
→ deploy e verifica live
```

Un manifest vuoto non blocca M5.7. Il cutover Astro continuerà a servire esclusivamente righe `published`; tutte le pagine `review` resteranno invisibili.

La pubblicazione di nuove release candidate è una mutation separata e può avvenire dopo il cutover del design.

## Guardrail invariati

- nessuna migration nuova;
- nessuna transizione `review → published`;
- nessun endpoint o pulsante publish;
- active route matrix invariata in PR #79;
- nessun analytics o affiliazione;
- nessuna sitemap submission;
- API, `/go/*` e Control Room ancora backend-owned;
- nessuna rimozione legacy.

## Gap aperti

- CI finale code + canonici e merge PR #79;
- verifica live della route privata;
- primo audit remoto e report reale;
- eventuale aggiornamento del manifest con ID verificati;
- PR M5.7 e cutover apex;
- verifica live e rollback M5.7;
- publication capability separata;
- header HTTP live delle preview;
- topic-mismatch sul primo run autorizzato;
- mutation M4 residue;
- M6 measurement e Search Console.

## Prossimo checkpoint

```text
canonici aggiornati su PR #79
→ CI finale
→ merge
→ audit remoto reale
→ M5.7 cutover del nuovo design
```
