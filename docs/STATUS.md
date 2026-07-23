# Stato del progetto

Data di riferimento: **23 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | stack remoto allineato fino a `0020`; topic-mismatch live ancora aperto |
| Workflow e Container | Operativi | primo ciclo recent-demand completato end-to-end |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato verificato |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione automatica |
| Primo draft | Approvato editorialmente | draft `2`; pagina materializzata ancora `review` |
| Control Room nuova | Operativa | parità read-only completa; prima mutation verificata in produzione |
| Control Room legacy | Transitoria e necessaria | fallback delle mutation residue |
| Public shell Astro | In produzione come preview | PR #59; `/` resta legacy |
| Trust pages Astro | In produzione e verificate su mobile | PR #61; checkpoint 3/3 |
| Homepage candidata Astro | Verificata in CI, live da osservare | PR #63 draft; CI #279 verde |
| Affiliazioni | Disabilitate | nessun ranking o link remunerato attivo |
| Analytics | Proprietà preparate, integrazione assente | GTM, GA4 e GSC creati; nessun codice collegato |
| Service account Google | Preparato esternamente, non configurato | nessuna credenziale nel repository |

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

La pagina Cina non è autorizzata alla pubblicazione.

## Control Room

Architettura:

```text
Cloudflare Access
→ validazione origine
→ shell Astro
→ una React island
→ contratti server-side
→ D1
```

Completato:

- overview e health;
- radar, segnali e brief;
- claim, fonti, scadenze e task;
- readiness ed evidence bundle;
- inventario e dettaglio draft;
- queue e audit;
- linkage claim → task;
- linkage audit → ID/versione draft;
- decisione brief `proposed → accepted | dismissed`.

La prima mutation è verificata in produzione con identità Access, conferma esplicita, state machine D1, audit append-only, idempotenza e `publicationTriggered: false`.

Mutation residue:

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

M4 non è completato e la legacy privata non può ancora essere rimossa.

## Frontend pubblico Astro

### Track parallela

ADR-026 autorizza M5 in parallelo alle mutation M4 residue.

```text
preview M5 ≠ cutover pubblico
progressi M5 ≠ completamento M4
draft approvato ≠ pagina pubblicata
```

### Public shell — PR #59

`/astro-foundation` fornisce:

- raw HTML senza JavaScript necessario;
- layout, header, menu e footer condivisi;
- canonical preview;
- `noindex,nofollow` e `no-store`;
- esclusione dalla sitemap;
- apice `/` invariato;
- nessun provider, prezzo o affiliazione.

Il checkpoint mobile reale è completato. Desktop live e header HTTP esterni restano verifiche residue; i contratti sono coperti dalla CI.

### Trust pages — PR #61

```text
/astro-foundation/metodo
/astro-foundation/trasparenza
/astro-foundation/privacy
```

CI e screenshot mobile reali verificano tutte e tre le route, navigazione namespaced, pagina corrente, raw HTML, noindex/no-store, responsive layout e assenza di overflow visibile.

Le route canoniche `/metodo`, `/trasparenza` e `/privacy` restano legacy.

### Homepage candidata — PR #63

La candidata usa il catalogo D1 soltanto server-side:

```text
D1
→ src/public-page-cards.ts
→ Astro / legacy renderer
→ HTML
```

Read model condiviso:

```text
slug
page_type
title
meta_description
cluster
```

Contratti:

```text
featured:
status='published' AND featured=1
ORDER BY featured DESC, updated_at DESC
LIMIT 9

destinations:
status='published' AND page_type='destination'
ORDER BY featured DESC, updated_at DESC
LIMIT 6
```

Implementato:

- funzioni tipizzate a query fisse, senza clausole SQL arbitrarie;
- validazione runtime delle righe D1;
- legacy home/listing e Astro sullo stesso read model;
- card in raw HTML verso route canoniche legacy;
- empty state senza contenuti inventati;
- nessuna API pubblica e nessun binding D1 nel browser;
- nessuna island, analytics, affiliazione o mutation.

CI #279 completamente verde dopo due correzioni allo smoke:

1. il database “vuoto” conteneva una pagina seminata dalle migrazioni; la fixture ora archivia le righe soltanto nello stato D1 temporaneo;
2. l’asserzione empty intercettava il nome CSS `catalog-card`; ora verifica elementi `<article>` reali.

Verificato dalla CI:

- 10 fixture featured pubblicate → 9 renderizzate in ordine;
- 7 destinazioni pubblicate → 6 renderizzate in ordine;
- righe `review` e `draft` escluse;
- parità del read model con la home legacy;
- sitemap senza preview e senza review;
- vere 404;
- desktop tre colonne;
- mobile una colonna;
- tastiera, focus e overflow;
- catalogo realmente vuoto con due empty state;
- tutte le regressioni Control Room.

Non ancora verificato:

- deploy del commit finale su `main`;
- resa visuale della candidata con il catalogo remoto reale.

Nessun cutover dell’apice è autorizzato.

## Google measurement stack

L’operatore ha preparato GTM, GA4, Search Console e un service account con accesso alle proprietà.

Non sono configurati nel sito:

- CMP e Consent Mode;
- snippet GTM;
- eventi GA4;
- invio sitemap tramite API;
- credenziali service account.

Regole:

- nessuna chiave o JSON in chat o GitHub;
- configurazione soltanto in una futura branch M6;
- nessun tracking sulle preview noindex;
- consenso, eventi e privacy progettati insieme.

## Gap aperti

- checkpoint visuale live della homepage candidata;
- listing preview Destinazioni, Guide e Confronti;
- renderer articolo grounded Astro;
- parità canonical, sitemap, schema, 404 e redirect provider;
- piccolo catalogo pilot;
- PR separata di cutover apex;
- linkage recenti Control Room nel browser reale;
- topic-mismatch sul primo run autorizzato;
- conversione brief e mutation M4 residue;
- CMP, GTM, GA4 e Search Console in M6;
- rimozione legacy soltanto dopo i rispettivi criteri di uscita.

## Prossimo checkpoint

```text
PR #63 CI verde
→ merge su main
→ aprire /astro-foundation in produzione
→ verificare catalogo reale mobile e desktop
→ soltanto dopo autorizzare listing preview
```
