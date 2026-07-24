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
| Catalog pilot foundation | Completata | PR #77, merge `fa9ed9486e400e77ad915153284c7b277a51b4d0`, CI #379 |
| Remote catalog audit | Verificato live | 1 candidate, 0 eligible, 0 selected, 1 excluded |
| Cutover apex Astro | Implementato sulla PR #81 | CI applicativa #397 verde; merge/deploy/verifica live aperti |
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

Lo stato remoto verificato della pagina Cina è:

```text
slug: esim-cina-senza-vpn
page status: review
publication eligible: false
ready for publication: false
```

Non entra nel manifest e non deve essere raggiungibile pubblicamente dopo il cutover.

## Control Room

Completato:

- overview, health, radar, segnali e brief;
- claim, fonti, scadenze e task;
- readiness ed evidence bundle;
- inventario e dettaglio draft;
- queue e audit;
- linkage canonici;
- decisione brief `proposed → accepted | dismissed`;
- route privata read-only per il catalog pilot.

Mutation residue:

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

M4 non è completato e la legacy privata non può ancora essere rimossa.

## M5.5 — Parità pubblica

```text
PR #69  SEO contract
PR #71  route policy — CI #329
PR #73  canonical Astro parity — CI #350
PR #75  sitemap/robots parity — CI #365
```

Homepage, listing, trust pages, articoli, sitemap, robots e 404 possiedono già implementazioni Astro canoniche verificate in CI. Preview e canonical condividono componenti e dati, ma applicano policy differenti di URL, robots e cache.

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

## M5.6b — Remote catalog audit

```text
scope PR #78 — merge bc0050b891b93678631fa80d3d46ac36a1fbb2fd — CI #381
route PR #79 — merge df890103310cf1591eb2d8137a8385135c665d71 — CI #386
```

Route privata:

```text
GET /control-room-foundation/api/catalog-pilot-audit
```

Contratto verificato:

- Cloudflare Access e validazione JWT nell’origine;
- D1 letto esclusivamente server-side;
- GET-only;
- no-store, noindex e nosniff;
- nessun maintenance token nel browser;
- nessuna query SQL controllata dal client;
- payload sanitizzato e fail-closed;
- nessuna mutation.

### Risultato live

Verificato manualmente nella sessione autenticata il 24 luglio 2026:

```text
ok: true
schemaVersion: 1
generatedAt: 2026-07-24T14:10:56.556Z
candidateCount: 1
eligibleCount: 0
selectedCount: 0
excludedCount: 1
```

La candidate `esim-cina-senza-vpn` è esclusa per:

- publication gate negativo;
- bundle `approved_for_draft`, non `approved_for_publication`;
- `ready_for_publication` disattivo;
- un claim insufficiente;
- un conflitto di fonte;
- claim `4`, `5` e `9` scaduti o senza validità utilizzabile.

Il risultato sanitizzato è versionato in:

```text
docs/PUBLIC-CATALOG-REMOTE-AUDIT-RESULT-2026-07-24.md
```

## M5.7 — Apex design cutover

Branch e PR:

```text
feat/public-apex-cutover
PR #81 — Cut over canonical public routes to Astro
CI applicativa #397 completamente verde
```

### Implementato sulla branch

- `activePublicRouteDecision = targetPublicRouteDecision`;
- `run_worker_first = ["/*", "!/_astro/*"]`;
- home, listing, trust, articoli, sitemap, robots e 404 Astro-owned;
- `/api/*`, `/go/*`, Control Room, legacy privata e asset tecnici backend-owned;
- `/_astro/*` servito direttamente dagli asset;
- pagine `review` e `draft` sempre 404;
- righe `published` soltanto;
- canonical, Open Graph e JSON-LD indexabili;
- preview ancora noindex/no-store;
- provider redirect ancora no-store/noindex;
- nessun JavaScript applicativo pubblico;
- nessuna publication capability.

### Verificato dalla CI applicativa #397

- tipi Cloudflare, typecheck e build;
- migrazioni D1 invariate;
- quality gate e golden evaluation;
- Container build e smoke;
- Worker di produzione con matrice target realmente attiva;
- homepage, listing, trust pages e articolo canonico;
- sitemap, robots, 404 e file probe;
- hidden state `review` e `draft`;
- API health e maintenance;
- redirect provider;
- preview Astro;
- route privata catalog audit;
- asset `/_astro/*`;
- desktop, mobile, tastiera e assenza overflow;
- tutte le suite Control Room.

### Rollback

Il rollback di ownership è la modifica versionata:

```ts
export const activePublicRouteDecision = currentPublicRouteDecision;
```

Non esiste un flag runtime, header o query string capace di cambiare renderer.

## Stato di produzione

Il cutover **non è ancora dichiarato live**.

```text
codice M5.7 verificato in CI
≠ PR mergiata
≠ deploy completato
≠ verifica live completata
```

La produzione corrente non viene descritta come Astro-owned finché PR #81 non è mergiata, il deploy non è terminato e le route reali non sono state controllate.

## Guardrail invariati

- nessuna migration nuova;
- nessuna transizione `review → published`;
- nessun endpoint o pulsante publish;
- nessun analytics o affiliazione;
- nessuna sitemap submission;
- API, `/go/*` e Control Room restano backend-owned;
- nessuna rimozione legacy in PR #81.

## Gap aperti

- aggiornare tutti i canonici sullo stesso head PR #81;
- CI finale code + documentazione;
- ready e merge PR #81;
- attendere o verificare il deploy;
- controllo live desktop/mobile delle route canoniche;
- controllo live metadata, JSON-LD, sitemap, robots e 404;
- controllo live `/go/*`, API e Control Room;
- closeout M5.7 e decisione sulla legacy pubblica;
- publication capability separata;
- topic-mismatch sul primo run autorizzato;
- mutation M4 residue;
- M6 measurement e Search Console.

## Prossimo checkpoint

```text
canonici PR #81
→ CI finale
→ merge
→ deploy
→ verifica live del nuovo design
```
