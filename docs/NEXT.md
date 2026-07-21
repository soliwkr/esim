# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **21 luglio 2026**.

## Now

### 1. Chiudere la sessione server-side della Control Room

La PR #31 elimina il secondo login visibile senza cambiare il contratto dell'API esistente.

Verificare prima del merge:

- `/control-room-foundation/api/snapshot` richiede un JWT Cloudflare Access valido;
- il proxy accetta soltanto `GET`;
- `MAINTENANCE_TOKEN` viene usato soltanto nel Worker;
- il browser non usa `sessionStorage`, campo token o header `Authorization`;
- `GET /api/maintenance/control-room` resta protetto e invariato;
- nessuna mutation o route di pubblicazione viene introdotta;
- typecheck, build, smoke `workerd` e Chromium sono verdi.

### 2. Verificare il deploy reale

Dopo il merge, il workflow di produzione deve dimostrare:

```text
richiesta anonima a pagina o proxy
→ login Access oppure 401/403

service token CI
→ Access emette JWT
→ Worker valida firma + issuer + audience
→ shell Astro 200
→ proxy snapshot 200
→ publicationAutomation:false
```

Controlli manuali nel browser:

- un solo login Cloudflare Access;
- nessun campo per il maintenance token;
- snapshot caricato automaticamente;
- refresh funzionante;
- nessun token in URL o storage;
- layout desktop e mobile utilizzabili.

### 3. Aggiornare lo stato canonico dopo il live smoke

Solo dopo un deploy verde:

- marcare la sessione server-side come operativa in `docs/STATUS.md`;
- marcare Access e gestione sessione completati in `ROADMAP.md` e `docs/FRONTEND-PLAN.md`;
- mantenere ADR-017 come decisione canonica;
- non dichiarare completato ciò che non è stato verificato nel browser reale.

### 4. Proseguire la migrazione funzionale della Control Room

Ordine successivo:

```text
overview e health aggregato
→ radar e brief
→ claim e fonti
→ readiness ed evidence bundle
→ draft e preview
→ queue e audit
```

Ogni fase resta separata, con contratti tipizzati, test browser e nessuna pubblicazione automatica.

### 5. Valutare il confronto UI soltanto se ancora utile

shadcn/ui è operativo nella foundation. Un confronto Mantine resta opzionale e separato; non deve bloccare la migrazione se non esiste un vantaggio concreto da misurare.

### 6. Migrare il sito pubblico ad Astro dopo la Control Room

Ordine previsto:

- home e layout;
- navigazione e pagine statiche;
- listing;
- pagina articolo;
- schema, canonical, sitemap e 404;
- migrazione progressiva senza cambiare gli stati editoriali.

La pagina `esim-cina-senza-vpn` resta `review` e pubblicamente invisibile.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente nuovi componenti generici scritti a mano;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- backend editoriale, claim, evidence bundle e gate invariati;
- nessuna pubblicazione automatica;
- nessun bypass pubblico della policy Access;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository.

## Completato

- redirect canonico e vere 404;
- recent-demand Workflow e osservabilità;
- quality gate `eligible` / `filtered`;
- Vertex AI attraverso Cloudflare AI Gateway;
- primo ciclo brief → claim → readiness → draft approvato senza pubblicazione;
- deploy automatico per modifiche operative su `main`;
- `apps/web` con Astro, React e adapter Cloudflare;
- custom Worker entrypoint unico;
- shadcn/ui installato e versionato;
- overview, claim e draft preview read-only;
- Cloudflare Access attivo sul path della Control Room;
- validazione JWT nell'origine;
- policy utente e service token CI verificati;
- Worker e GitHub secrets configurati;
- live smoke della shell Access-protected verde;
- nessuna capacità di pubblicazione nella nuova UI.

## Definition of Done del prossimo checkpoint

- [ ] PR #31 con CI completa verde;
- [ ] proxy snapshot GET-only coperto da smoke;
- [ ] browser privo di maintenance token e `sessionStorage`;
- [ ] deploy automatico verde;
- [ ] live smoke pagina + proxy verde;
- [ ] accesso manuale con un solo login;
- [ ] snapshot reale caricato automaticamente;
- [ ] nessuna regressione dei gate editoriali e di pubblicazione;
- [ ] documentazione aggiornata allo stato verificato.

## Dopo il frontend

1. Search Console e sitemap operative;
2. CMP, GTM e GA4;
3. dizionario canonico degli eventi;
4. OpenSEO come servizio condiviso;
5. trend e stagionalità;
6. affiliazioni controllate;
7. funzioni multi-progetto dello studio.
