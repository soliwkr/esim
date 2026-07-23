# Stato del progetto

Data di riferimento: **23 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | stack remoto allineato fino a `0020`; verifica topic-mismatch sul prossimo run ancora aperta |
| API manutenzione | Operativa | accesso riservato; contratti legacy preservati |
| Deploy | Automatico per modifiche operative su `main` | modifiche documentali escluse |
| Workflow e Container | Operativi | primo ciclo recent-demand completato end-to-end |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato verificato |
| Quality gate | Operativo | score zero, golden evaluation e topic-mismatch implementati |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione automatica |
| Primo draft | Approvato editorialmente | draft `2`; pagina materializzata ancora `review` |
| Control Room nuova | Operativa | parità read-only completa; prima mutation verificata in produzione |
| Control Room legacy | Transitoria e necessaria | fallback delle mutation residue |
| Track M5 | Autorizzata in parallelo | ADR-026, PR #58 |
| Public shell Astro | In produzione come preview mobile | PR #59; `/` resta legacy |
| Trust pages Astro | In produzione e verificate su mobile | PR #61; 3 route preview su 3 osservate |
| Affiliazioni | Disabilitate | nessun ranking o link remunerato attivo |
| Analytics | Proprietà preparate, integrazione assente | GTM, GA4 e GSC creati dall’operatore; nessun codice collegato al sito |
| Service account Google | Preparato esternamente, non configurato | accesso dichiarato dall’operatore; nessuna credenziale nel repository |

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

Stato del primo ciclo:

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

Architettura corrente:

```text
Cloudflare Access
→ validazione origine
→ shell Astro
→ una React island
→ snapshot server-side
→ dettaglio draft GET-only
→ mutation dedicate
→ D1 soltanto server-side
```

Completato:

- overview e health;
- radar, segnali e brief;
- claim, fonti, scadenze e task collegati;
- Page Readiness ed evidence bundle;
- inventario e dettaglio draft;
- queue e audit;
- linkage claim → task;
- linkage audit → ID/versione draft;
- decisione brief `proposed → accepted | dismissed`.

La decisione brief è verificata in produzione con:

- identità derivata da Cloudflare Access;
- conferma esplicita;
- motivo obbligatorio per il rifiuto;
- state machine D1;
- audit append-only;
- retry idempotente;
- conflitto sulla decisione opposta;
- `publicationTriggered: false`;
- conteggio delle pagine pubblicate invariato.

Mutation ancora nella legacy:

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

M4 non è completato e la legacy privata non può ancora essere rimossa.

## Audit repository esterni

PR #57 è mergiata con CI verde.

Risultato:

- repository esterni classificati;
- Ahmeego studiato come modello trust/tool/content;
- MGC reale usato come corpus negativo di sicurezza, privacy, SEO e claim;
- candidate ristrette a slug, route, schema, fail-fast e quality gate;
- zero codice esterno copiato;
- zero dati cliente o credenziali versionati;
- nessun nuovo runtime adottato.

## Frontend pubblico Astro

### Track parallela

PR #58 autorizza M5 in parallelo alle mutation M4 residue.

Restano separati:

```text
preview M5 ≠ cutover pubblico
progressi M5 ≠ completamento M4
draft approvato ≠ pagina pubblicata
```

### Public shell — PR #59

`/astro-foundation` è una preview Astro:

- raw HTML utile senza JavaScript;
- nessuna island React;
- layout, header, menu mobile e footer condivisi;
- canonical preview;
- `noindex,nofollow`;
- `no-store`;
- esclusione dalla sitemap;
- apice `/` ancora legacy;
- nessun provider, prezzo o affiliazione.

Uno screenshot reale mobile ha verificato hero, CTA, percorsi, card, sezione metodo e assenza di overflow visibile.

Restano da attestare esternamente desktop live e header HTTP; i relativi contratti sono coperti dalla CI.

### Trust pages — PR #61

Route preview:

```text
/astro-foundation/metodo
/astro-foundation/trasparenza
/astro-foundation/privacy
```

Verificato in CI:

- `200` in `workerd`;
- contenuto essenziale in raw HTML;
- canonical self-reference;
- meta e header `noindex,nofollow`;
- `Cache-Control: no-store`;
- nessuna island o script richiesto;
- navigazione confinata nel namespace preview;
- route canoniche legacy ancora operative;
- esclusione dalla sitemap;
- desktop, mobile, tastiera, `aria-current` e overflow;
- tutte le regressioni Control Room.

Verificato visualmente in produzione mobile il 23 luglio 2026:

- Metodo editoriale;
- Trasparenza;
- Privacy;
- pagina corrente evidenziata;
- header, banner preview e navigazione interna;
- card responsive e gerarchia tipografica;
- nessun overflow orizzontale visibile nelle porzioni osservate.

Il checkpoint produttivo mobile delle trust pages è quindi **completo 3/3**.

Le route canoniche `/metodo`, `/trasparenza` e `/privacy` non sono state sostituite.

## Google measurement stack

L’operatore ha dichiarato di avere già creato:

- container Google Tag Manager;
- proprietà Google Analytics 4;
- proprietà Search Console;
- service account aggiunto alle proprietà.

Questo stato è preparatorio e non ancora verificato dal repository.

Non sono configurati nel sito:

- CMP;
- Consent Mode;
- snippet GTM;
- eventi GA4;
- invio sitemap tramite API;
- credenziali service account.

Regole:

- nessuna chiave o JSON del service account in chat o GitHub;
- configurazione solo in uno scope M6 esplicito;
- tracking non attivato sulle preview noindex;
- consenso, dizionario eventi e privacy devono essere progettati insieme.

## Gap aperti

- candidato homepage Astro con catalogo `published` server-side;
- listing preview Destinazioni, Guide e Confronti;
- renderer articolo grounded Astro;
- parità canonical, sitemap, schema, 404 e redirect provider;
- piccolo catalogo pilot;
- PR separata di cutover apex;
- desktop live e header HTTP della preview;
- linkage recenti della Control Room nel browser reale;
- topic-mismatch sul primo nuovo run autorizzato;
- conversione brief e mutation M4 residue;
- CMP, GTM, GA4 e Search Console in M6;
- rimozione legacy soltanto dopo i rispettivi criteri di uscita.

## Prossimo checkpoint

```text
trust pages mobile 3/3 verificate
→ branch feat/public-homepage-candidate
→ catalogo published-only server-side
→ verifica CI e preview live
```

Lo scope vincolante è in `docs/PUBLIC-HOMEPAGE-CANDIDATE-SCOPE.md`.
