# Stato del progetto

Data di riferimento: **24 luglio 2026**.

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
| Public shell Astro | In produzione come preview | `/` resta legacy |
| Trust pages Astro | Verificate in produzione | checkpoint mobile 3/3 |
| Homepage candidata Astro | Verificata in produzione | desktop e mobile; `/` resta legacy |
| Listing Astro | Verificati in produzione | Destinazioni, Guide e Confronti |
| Renderer articolo Astro | Verificato in produzione | PR #67, CI finale #307, desktop e mobile |
| Fondazione SEO condivisa | Implementata e verificata dalla CI completa | PR #69; merge, deploy e checkpoint live ancora aperti |
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

ADR-026 autorizza M5 in parallelo alle mutation M4 residue.

```text
preview M5 ≠ cutover pubblico
progressi M5 ≠ completamento M4
draft approvato ≠ pagina pubblicata
```

### Public shell e trust pages

La preview `/astro-foundation` e le route:

```text
/astro-foundation/metodo
/astro-foundation/trasparenza
/astro-foundation/privacy
```

sono in produzione, noindex/no-store, fuori sitemap e verificate su mobile. Le route canoniche restano legacy.

### Homepage candidata — PR #63

La candidata usa il catalogo D1 soltanto server-side tramite `src/public-page-cards.ts`.

Contratti principali:

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

Produzione verificata desktop/mobile. L’apice `/` resta sul renderer legacy.

### Listing previews — PR #65

Route:

```text
/astro-foundation/destinazioni
/astro-foundation/guide
/astro-foundation/confronti
```

Implementato e verificato:

- stesso read model published-only del renderer legacy;
- ordine deterministico;
- righe `review` e `draft` escluse;
- empty state specifici;
- route matrix esplicita e vere 404;
- raw HTML senza JavaScript necessario;
- desktop, mobile, tastiera e assenza di overflow;
- CI #291 applicativa e CI #296 finale verdi;
- PR #65 mergiata nel commit `2483fbfd1327754a1a526e8c3e6b201a412e610d`;
- checkpoint visuale live completato.

Le route canoniche `/destinazioni`, `/guide` e `/confronti` restano legacy.

### Renderer articolo — PR #67

Route:

```text
/astro-foundation/articoli/[slug]
```

Flusso:

```text
D1 published page
→ src/public-article.ts
→ renderer legacy o componenti Astro strutturati
→ HTML
```

Implementato:

- query fissa `WHERE slug=? AND status='published'`;
- validazione runtime di scalari, `page_type`, date, blocchi, FAQ e fonti;
- blocchi ammessi: `paragraph`, `heading`, `bullets`, `steps`, `table`, `callout`;
- nessun `set:html`, `innerHTML`, HTML AI grezzo o tag scelto dal database;
- FAQ native con `details` e `summary`;
- fonti linkabili soltanto via HTTPS;
- provenance pubblica limitata a `source_checked_at`, `updated_at` e fonti persistite;
- nessun claim ID, bundle, claim escluso, dato revisore, queue o metadato di generazione esposto;
- related links soltanto `published`, stesso cluster, slug corrente escluso e ordine deterministico;
- slug assente, `review` o `draft` → vera 404;
- riga `published` strutturalmente invalida → risposta generica 500 senza corpo fattuale;
- preview home, listing e related links nel namespace `/astro-foundation/articoli/`;
- home, listing e articolo legacy ancora canonici;
- noindex, no-store e sitemap exclusion;
- raw HTML senza Astro island o JavaScript richiesto;
- tabelle con overflow locale.

Validazione:

- CI #300 ha trovato un mismatch sul ruolo accessibile del `summary` FAQ;
- il markup nativo è stato mantenuto e il ruolo reso esplicito;
- CI applicativa #302 completamente verde;
- CI finale #307 completamente verde;
- PR #67 mergiata nel commit `4810c0c32d54dca6f85de19d507a6da13f3dc574`.

Produzione verificata con gli screenshot del 24 luglio 2026:

- navigazione da listing preview a un articolo `published` namespaced;
- desktop largo: breadcrumb, metadati, hero, risposta diretta, disclosure, tabella e pannello laterale;
- desktop inferiore: FAQ, provenance, tre fonti HTTPS e footer;
- mobile superiore: header, banner, breadcrumb, pill, hero, contratto preview, risposta diretta e disclosure;
- mobile inferiore: FAQ espansa, provenance, fonti impilate e footer;
- testi e CTA leggibili;
- nessun overflow orizzontale visibile;
- la sezione related è omessa quando il risultato exact-cluster è vuoto.

Le verifiche tecniche di published-only, noindex/no-store, sitemap exclusion, 404, fonti HTTPS, fail-closed e parità dei link legacy restano attestate dalla CI. Gli screenshot certificano la resa visuale live.

M5.4 è chiusa. Nessun cutover è autorizzato.

## M5.5a — Fondazione del contratto SEO

Branch:

```text
feat/public-seo-contract-foundation
```

PR:

```text
#69 — Add shared public SEO contract foundation
```

Architettura implementata:

```text
validated public page
→ src/public-seo.ts
→ typed SEO document
→ legacy canonical renderer OR Astro noindex preview
```

Il modello condiviso produce:

- title e meta description;
- Open Graph `website` o `article`;
- `WebSite` JSON-LD per la homepage;
- `Article` JSON-LD per gli articoli;
- `FAQPage` soltanto quando la FAQ validata è presente;
- `dateModified` normalizzata;
- `Organization` come autore già supportato;
- `mainEntityOfPage` determinato dalla route chiamante.

La policy della route resta separata:

```text
legacy:
  / e /{slug}
  index,follow,max-image-preview:large
  canonical produzione

Astro preview:
  /astro-foundation
  noindex,nofollow
  no-store
  self-canonical preview
```

Sicurezza JSON-LD:

- valori ricorsivi limitati a JSON compatibile;
- numeri non finiti e oggetti non plain rifiutati;
- profondità limitata;
- `<`, U+2028 e U+2029 escapati prima dell’inserimento;
- fixture con `</script>`, `<example>`, virgolette, apostrofi e accenti;
- nessuno script con `src` e nessun JavaScript eseguibile;
- `set:html` usato soltanto per il JSON-LD già serializzato dal modulo condiviso, mai per contenuto editoriale.

Smoke dedicato:

```text
npm run smoke:public-seo-contracts
```

Verifica in D1 temporanea, `workerd` e Chromium:

- parità di title, description e Open Graph;
- parità normalizzata di Article e FAQ;
- differenze attese soltanto per canonical, `mainEntityOfPage` e robots;
- JSON-LD valido e non interrompibile;
- nessun elemento arbitrario creato dalla fixture;
- sitemap canonica senza preview, review o draft;
- robots con sitemap e disallow correnti;
- redirect provider HTTPS, `no-store` e `noindex`;
- vere 404 canonical e preview;
- file probe esclusi dal fallback articolo;
- desktop/mobile senza overflow;
- tutte le suite Control Room.

Validazione:

- typecheck e build verdi;
- migrazioni, quality gate, golden evaluation e Container verdi;
- la prima CI runtime ha rilevato un’asserzione troppo ampia che trattava `<` dentro attributi quotati come un elemento DOM;
- il test è stato corretto senza modificare la protezione: ora verifica DOM reale, zero elementi `<example>`, zero script eseguibili e impossibilità di chiudere il JSON-LD;
- CI applicativa completamente verde;
- CI completa sul head con codice e documentazione completamente verde.

Ownership invariata:

```text
/
/destinazioni
/guide
/confronti
/{slug}
/sitemap.xml
/robots.txt
/go/{provider}
```

La PR #69 non è ancora mergiata o distribuita. Nessun cutover, indicizzazione, analytics, affiliazione, D1 mutation o pubblicazione è stato introdotto.

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

- merge, deploy e checkpoint live della fondazione SEO condivisa;
- futura ownership di canonical, sitemap, robots e routing Astro, da scoprire dopo il checkpoint M5.5a;
- piccolo catalogo pilot;
- PR separata di cutover apex;
- linkage recenti Control Room nel browser reale;
- topic-mismatch sul primo run autorizzato;
- conversione brief e mutation M4 residue;
- CMP, GTM, GA4 e Search Console in M6;
- rimozione legacy soltanto dopo i rispettivi criteri di uscita.

## Prossimo checkpoint

```text
CI completa verde
→ PR #69 ready e merge
→ deploy automatico
→ verificare metadata e JSON-LD della preview live
→ poi scoprire la slice M5.5b di routing/ownership
```
