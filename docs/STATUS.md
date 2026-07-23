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
| Homepage candidata Astro | Verificata in produzione desktop e mobile | PR #63 mergiata; CI finale #284 verde |
| Listing Astro | Verificati in CI, live da osservare | PR #65 draft; CI #291 verde |
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

CI #279 ha validato il runtime dedicato; la CI finale #284 è completamente verde dopo il commit documentale. Durante lo sviluppo sono state corrette due assunzioni dello smoke:

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

Produzione verificata:

- PR #63 mergiata su `main` nel commit `7ba767d` e distribuita;
- desktop live con quattro guide pubblicate in griglia a tre colonne;
- mobile live con le stesse card in colonna singola, testi e CTA leggibili e nessun overflow orizzontale visibile;
- sezione “Destinazioni principali” con empty state remoto leggibile;
- transizione verso la sezione “Il metodo” stabile;
- link delle card verso route canoniche legacy;
- apice `/` ancora sul renderer legacy.

Gli screenshot attestano la resa visuale; `noindex`, header HTTP, query published-only, sitemap e assenza di righe `review` restano attestati dalla CI e dalle verifiche tecniche precedenti.

Nessun cutover dell’apice è autorizzato.

### Listing previews — PR #65

Route:

```text
/astro-foundation/destinazioni
/astro-foundation/guide
/astro-foundation/confronti
```

La matrice `src/public-listing-routes.ts` centralizza tipo, path canonico,
path preview, copy, CTA ed empty state. Il renderer legacy e Astro continuano a
usare lo stesso `loadPublishedListingCards`:

```text
status='published' AND page_type=?
ORDER BY featured DESC, updated_at DESC
LIMIT 100
```

Implementato e verificato dalla CI #291:

- tre route statiche noindex/no-store e fuori sitemap;
- navigazione del namespace preview tra home, listing e trust pages;
- card verso articoli canonici legacy;
- righe `review` e `draft` escluse;
- ordine deterministico e parità con i listing legacy;
- empty state specifici per Destinazioni, Guide e Confronti;
- matrice route esplicita e vera 404 per route preview non dichiarate;
- raw HTML senza island o JavaScript necessario;
- desktop tre colonne, mobile una colonna, tastiera e nessun overflow;
- contratto header condiviso tra layout e route statiche;
- tutte le regressioni D1, Container e Control Room verdi.

La prima CI runtime ha rilevato che gli header impostati dal layout non venivano
propagati attraverso il nuovo componente annidato. Il contratto è stato estratto
in `public-preview-response.ts` e applicato anche dal frontmatter delle tre route;
la stessa asserzione header è poi passata senza essere indebolita.

Non ancora verificato:

- deploy del commit finale su `main`;
- resa visuale desktop e mobile con il catalogo D1 remoto.

Le route canoniche `/destinazioni`, `/guide` e `/confronti` restano legacy.
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

- checkpoint visuale live delle tre listing preview;
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
PR #65 e CI #291 verdi
→ merge e deploy da main
→ verificare le tre listing preview sul catalogo remoto
→ soltanto dopo autorizzare il renderer articolo Astro
```
