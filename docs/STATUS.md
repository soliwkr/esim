# Stato del progetto

Data di riferimento: **24 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il nuovo frontend Astro |
| Dominio `www` | Da ricontrollare | redirect implementato, checkpoint definitivo aperto |
| Worker e D1 | Operativi | un solo custom Worker; D1 remoto allineato fino a `0020` |
| Workflow e Container | Operativi | primo ciclo recent-demand completato end-to-end |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato verificato |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione automatica |
| Control Room nuova | Operativa | read-only completo; prima mutation verificata live |
| Control Room legacy | Transitoria e necessaria | fallback delle mutation residue |
| Frontend pubblico Astro | Live | cutover M5.7 verificato sull’apice |
| Sitemap e robots | Live | endpoint Astro raggiungibili |
| Catalog pilot | Audit live completato | 1 candidate, 0 eligible, 0 selected |
| Affiliazioni | Disabilitate | nessun ranking o link remunerato attivo |
| Analytics | Non integrati | GTM, GA4 e GSC preparati esternamente ma non collegati |

## Architettura live

```text
Cloudflare Assets
  ├── /_astro/* → asset statici
  └── /*         → custom Worker
                       ├── Astro pubblico
                       ├── Astro shell + React island Control Room
                       ├── backend/API/redirect provider
                       ├── D1
                       ├── Workflows e Container
                       └── AI Gateway → Vertex AI
```

Ownership verificata:

```text
Astro:
  /
  /destinazioni
  /guide
  /confronti
  /metodo
  /trasparenza
  /privacy
  /{slug-published}
  /sitemap.xml
  /robots.txt
  404 pubblica
  /astro-foundation*
  /control-room-foundation*

Backend / execution plane:
  /api/*
  /go/*
  legacy Control Room
  D1
  Workflows
  Container
  AI Gateway / Vertex AI
  gate editoriali e publication capability
```

## M5.7 — Cutover apex chiuso

```text
PR #81 — Cut over canonical public routes to Astro
merge e62b570248bf97afaa3f283cfbb847ceea01f529
CI finale #404 completamente verde
```

Verificato live dall’operatore:

- homepage canonica con il nuovo design;
- articolo `/migliore-esim` con il renderer Astro;
- `/sitemap.xml` raggiungibile;
- `/robots.txt` raggiungibile;
- `/go/airalo` conserva il redirect backend;
- navigazione e rendering operativi nel browser reale.

Documento di risultato:

```text
docs/PUBLIC-APEX-CUTOVER-RESULT-2026-07-24.md
```

Il renderer pubblico legacy non è stato rimosso nello stesso cutover. Il rollback di ownership resta la modifica versionata:

```ts
export const activePublicRouteDecision = currentPublicRouteDecision;
```

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

### Stato remoto del catalog pilot

```text
candidateCount: 1
eligibleCount: 0
selectedCount: 0
excludedCount: 1
```

La candidate `esim-cina-senza-vpn` resta:

```text
page status: review
publication eligible: false
ready for publication: false
```

È esclusa per gate di pubblicazione negativo, bundle non approvato per pubblicazione, `ready_for_publication` disattivo, claim insufficiente, conflitto di fonte e claim scaduti o senza validità utilizzabile.

Manifest corrente:

```json
{
  "schemaVersion": 1,
  "generatedAt": null,
  "entries": []
}
```

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

La legacy privata non può ancora essere rimossa.

## Guardrail invariati

- nessuna migration nuova nel cutover;
- nessuna transizione `review → published`;
- nessun endpoint o pulsante publish;
- nessun analytics o affiliazione;
- nessuna sitemap submission;
- browser senza accesso diretto a D1;
- API, `/go/*` e Control Room restano backend-owned;
- preview `/astro-foundation*` resta noindex/no-store;
- pagina Cina sempre non pubblica.

## Prossima milestone — M6

Le proprietà esterne Google esistono, ma l’integrazione applicativa è assente.

Ordine previsto:

```text
scope privacy e data-flow
→ CMP
→ Consent Mode
→ dizionario eventi
→ GTM
→ GA4
→ Search Console
→ sitemap submission
→ verifica dati reali
```

## Gap aperti

- scope formale M6;
- scelta e configurazione CMP;
- Consent Mode;
- dizionario eventi;
- collegamento GTM e GA4;
- verifica Search Console e submission sitemap;
- controllo tracking pre-consenso;
- redirect `www → apex` definitivo;
- topic-mismatch sul prossimo run autorizzato;
- mutation M4 residue;
- decisione separata sulla publication capability;
- eventuale rimozione del renderer pubblico legacy dopo stabilizzazione.
