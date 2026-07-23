# Prossime azioni

Ultimo aggiornamento: **23 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; il piano frontend vive in `docs/FRONTEND-PLAN.md`.

## Now

### 1. Chiudere la PR #67 del renderer articolo Astro

Branch:

```text
feat/public-article-renderer
```

PR draft:

```text
#67 — Add published-only Astro article renderer
```

Route implementata:

```text
/astro-foundation/articoli/[slug]
```

Stato verificato:

- read model server-only condiviso con il renderer legacy;
- query fissa `WHERE slug=? AND status='published'`;
- validazione runtime di campi, JSON, blocchi, FAQ, fonti e date;
- blocchi strutturati Astro, senza `set:html`, `innerHTML` o HTML AI grezzo;
- fonti linkabili soltanto via HTTPS;
- provenance pubblica limitata a dati page-level già persistiti;
- nessun claim ID, evidence bundle, claim escluso, nota revisore o dato operativo esposto;
- related links published-only, exact-cluster e deterministici;
- vera 404 per slug assente, `review` o `draft`;
- fail-closed 500 generica per riga pubblicata strutturalmente invalida;
- preview home e listing collegate alle route articolo namespaced;
- route legacy home, listing e articolo ancora canoniche;
- noindex, no-store e sitemap exclusion;
- raw HTML senza island o JavaScript necessario;
- nessuna migration, mutation, API pubblica o capacità di pubblicazione.

Smoke dedicato:

```text
npm run smoke:public-article-renderer
```

La CI applicativa #302 è completamente verde:

- typecheck;
- build Astro e Worker entrypoint;
- migrazioni D1;
- quality gate e golden evaluation;
- Container build e smoke;
- runtime Astro/backend, inclusi tutti gli smoke pubblici;
- tutte le suite Control Room.

La CI #300 aveva rilevato un mismatch accessibile sul ruolo del `summary` FAQ. Il markup nativo è stato mantenuto, il ruolo è stato reso esplicito e l’asserzione è rimasta attiva; #302 ha verificato la correzione.

Restano, in ordine:

```text
CI finale sul commit documentale
→ mark ready
→ merge PR #67
→ deploy automatico
→ verifica route reale 200
→ checkpoint visuale desktop/mobile
```

Non autorizzare M5.5 prima del checkpoint live.

### 2. Verificare il renderer su un articolo pubblicato reale

Dopo merge e deploy:

1. aprire `/astro-foundation/guide`;
2. seguire una card pubblicata verso `/astro-foundation/articoli/{slug}`;
3. verificare risposta `200` e navigazione integralmente namespaced;
4. controllare hero, risposta diretta, blocchi, FAQ, fonti e related links realmente presenti;
5. verificare desktop largo e mobile;
6. confermare assenza di overflow orizzontale della pagina;
7. confermare che `/{slug}` continui a essere servito dal renderer legacy;
8. non usare righe `review` o `draft` per il checkpoint.

Gli screenshot richiesti saranno:

- mobile: hero, risposta diretta e almeno una sezione strutturata;
- mobile: FAQ/fonti o parte inferiore della pagina;
- desktop largo: hero, colonna articolo e pannello laterale;
- desktop largo: fonti e related links se presenti.

Le verifiche tecniche di noindex, no-store, 404, sitemap exclusion e published-only restano attestate dalla CI; gli screenshot certificano soltanto la resa visuale live.

### 3. Non attivare ancora Google measurement

Sono stati preparati esternamente:

- Google Tag Manager;
- Google Analytics 4;
- Search Console;
- service account con accesso alle proprietà.

Questo non equivale a tracking attivo.

M6 resta:

```text
CMP
→ Consent Mode
→ dizionario eventi
→ GTM
→ GA4
→ Search Console / sitemap
→ verifica dati reali
```

Regole:

- nessun JSON o private key in chat o GitHub;
- nessuna credenziale nel frontend;
- nessun tracking sulle preview noindex;
- nessuna configurazione service account fuori da una branch M6 esplicita.

### 4. Continuare M4 soltanto su branch separate

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni mutation richiede Access, conferma, state machine server-side, audit, idempotenza, reload e test end-to-end.

## Verifiche operative aperte

- checkpoint live del renderer articolo PR #67;
- header HTTP delle preview su controllo esterno dedicato;
- linkage claim → task nel browser reale;
- linkage audit → ID/versione draft nel browser reale;
- topic-mismatch sul primo run autorizzato;
- redirect `www → apex` definitivo;
- nessun Workflow avviato soltanto per creare dati di test.

## Separazioni obbligatorie

```text
homepage candidata ≠ apice migrato
listing preview ≠ listing canonico migrato
article preview ≠ articolo canonico migrato
published row ≠ review row
preview M5 ≠ cutover pubblico
progressi M5 ≠ M4 completato
GA4/GTM creati ≠ tracking attivo
service account creato ≠ credenziale configurata
brief accepted ≠ brief converted
approved draft ≠ published page
CI verde ≠ verifica visuale live
```

## Checkpoint completati recenti

- PR #54 — decisione brief in produzione;
- PR #57 — audit repository esterni;
- PR #58 — track M5 parallela;
- PR #59 — public shell preview;
- PR #60 — checkpoint mobile public shell;
- PR #61 — trust pages e checkpoint mobile 3/3;
- PR #62 — scope homepage candidata;
- PR #63 — homepage candidata, merge `7ba767d`, CI finale #284 e checkpoint live desktop/mobile completati;
- PR #65 — listing preview, merge `2483fbf`, CI finale #296 e checkpoint live completato;
- PR #66 — chiusura M5.3 e scope renderer, merge `76aab5a`;
- PR #67 — renderer articolo implementato; CI applicativa #302 verde; merge e checkpoint live aperti.

## Freeze immediato

- niente HTML applicativo nuovo nel Worker;
- niente accesso browser a D1;
- niente pubblicazione automatica;
- niente secret o PII nel client, URL, storage, log o repository;
- niente affiliazioni o tracking anticipati;
- niente sostituzione delle route listing o articolo canoniche nella slice preview;
- niente M5.5 prima del checkpoint articolo live;
- niente cutover dell’apice;
- nessuna rimozione legacy finché resta un fallback operativo.
