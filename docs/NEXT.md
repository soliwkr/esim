# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **18 luglio 2026**.

## Now

### 1. Configurare Cloudflare Access prima del merge

La branch `feat/control-room-access-guard` rende `/control-room-foundation` fail-closed e valida nel Worker il JWT Access prima di delegare ad Astro.

Prima del merge completare la checklist in `docs/CONTROL-ROOM-ACCESS.md`:

- creare l'app self-hosted sul path `/control-room-foundation*`;
- aggiungere una policy utente Allow limitata all'identità operativa;
- creare un service token dedicato alla CI e la relativa policy Service Auth;
- impostare i Worker secrets `CF_ACCESS_TEAM_DOMAIN` e `CF_ACCESS_AUD`;
- impostare i GitHub secrets `CF_ACCESS_CLIENT_ID` e `CF_ACCESS_CLIENT_SECRET`;
- verificare che nessun valore sensibile compaia nel repository o nei log.

Non mergiare la PR finché questi prerequisiti non sono verificati.

### 2. Revisionare il guard e gli smoke

Verificare nella PR:

- richiesta anonima a `/control-room-foundation` → `403` nel runtime locale;
- JWT con firma, issuer o audience errati → `403`;
- configurazione Access mancante → `503` fail-closed;
- JWT valido → shell Astro `200` con una sola React island;
- `/api/health` resta pubblico e operativo;
- `GET /api/maintenance/control-room` resta protetto dal maintenance token;
- nessuna mutation o route di pubblicazione introdotta;
- smoke `workerd` e Chromium verdi.

### 3. Verificare Access e Control Room dopo il deploy

Il workflow di produzione deve dimostrare:

```text
richiesta anonima
→ redirect/login Access oppure 401/403

service token CI
→ Access emette JWT
→ Worker valida firma + issuer + audience
→ Astro serve la shell noindex/no-store
```

La Control Room legacy `/control-room` resta disponibile come fallback transitorio e deve continuare a superare il proprio smoke live.

### 4. Chiudere la verifica della Control Room v3

Verificare in produzione:

```text
/control-room
→ badge v3 visibile
→ client JavaScript caricato
→ apertura sessione funzionante
→ snapshot reale caricato
```

Non aggiungere nuove funzioni importanti alla dashboard artigianale.

### 5. Valutare separatamente l'eventuale confronto UI

La UI foundation shadcn è implementata. Un confronto Mantine, se ancora utile, deve essere una fase separata e non va retrodatato come svolto.

Le tre viste disponibili come base misurabile sono:

1. overview e health;
2. tabella claim con filtro e dettaglio read-only;
3. metadati draft con preview read-only.

Misurare codice custom, velocità, accessibilità, mobile, tema, bundle e manutenzione.

### 6. Migrare la Control Room

Ordine operativo successivo all'attivazione di Access:

```text
overview
→ radar e brief
→ claim e fonti
→ readiness
→ draft e preview
→ queue e audit
```

La UI legacy viene rimossa soltanto dopo parità funzionale, test browser e verifica end-to-end.

### 7. Migrare il sito pubblico ad Astro

Dopo la Control Room:

- home e layout;
- navigazione e pagine statiche;
- listing;
- pagina articolo;
- schema, canonical, sitemap e 404;
- migrazione progressiva senza cambiare gli stati editoriali.

La pagina `esim-cina-senza-vpn` resta `review` e pubblicamente invisibile.

## Freeze immediato

Fino alla conclusione della fase Access:

- niente nuove pagine tramite template string nel Worker;
- niente nuovi componenti generici scritti a mano;
- niente ampliamenti sostanziali della Control Room legacy;
- backend, claim, evidence bundle e gate restano invariati;
- nessuna pubblicazione automatica;
- nessun bypass pubblico della policy Access;
- nessun secret in URL, HTML, log o repository.

## Completato

- redirect canonico e vere 404;
- recent-demand Workflow e osservabilità;
- quality gate `eligible` / `filtered`;
- Vertex AI attraverso Cloudflare AI Gateway;
- primo brief AI reale;
- Opportunity, Evidence e Priority Score;
- claim generali e atomici;
- 5 verifiche ufficiali e 1 esito `insufficient`;
- Page Readiness Gate;
- evidence bundle versionato;
- renderer v2 con provenienza campo → claim;
- draft `2` approvato editorialmente;
- pagina ancora in `review` e pubblicamente `404 noindex`;
- deploy automatico per modifiche operative su `main`;
- `apps/web` con Astro, React e adapter Cloudflare;
- custom Worker entrypoint unico con fallback al backend esistente;
- shadcn/ui installato e versionato;
- overview, claim e draft preview read-only;
- smoke runtime e browser della UI foundation.

## Definition of Done del prossimo checkpoint

- [ ] applicazione Cloudflare Access attiva sul path corretto;
- [ ] policy utente e service token verificati;
- [ ] Worker secrets e GitHub secrets configurati;
- [ ] validazione JWT nell'origine coperta da CI;
- [ ] smoke live anonimo e autenticato verdi;
- [ ] Control Room v3 verificata realmente nel browser;
- [ ] nessuna regressione dei gate editoriali e di pubblicazione;
- [ ] piano di migrazione operativa della Control Room pronto per l'esecuzione.

## Dopo il frontend

1. Search Console e sitemap operative;
2. CMP, GTM e GA4;
3. dizionario canonico degli eventi;
4. OpenSEO come servizio condiviso;
5. trend e stagionalità;
6. affiliazioni controllate;
7. funzioni multi-progetto dello studio.
