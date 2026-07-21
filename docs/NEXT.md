# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **21 luglio 2026**.

## Now

### 1. Chiudere la migrazione overview e health

La PR #32 migra la prima vista funzionale della nuova Control Room senza cambiare endpoint o execution plane.

Scope autorizzato:

- mostrare tutte le metriche già esposte da `snapshot.overview`;
- distinguere capability dichiarate, binding configurati e probe end-to-end non ancora disponibili;
- mostrare timestamp dello snapshot e guardrail di pubblicazione;
- validare a runtime i contratti di `/api/health` e dello snapshot;
- caricare health e snapshot come risorse indipendenti;
- conservare claim e draft preview in sola lettura;
- mantenere refresh, loading, errori parziali, empty state, tastiera e mobile.

Fuori scope:

- nuovi endpoint o query D1;
- health probe esterni di Workflow, Container o AI Gateway;
- radar, brief, claim operations, readiness, draft decisions, queue o audit;
- mutation, pubblicazione o ampliamenti della Control Room legacy.

### 2. Verificare la PR #32

Prima del merge devono passare:

- TypeScript strict e build Astro;
- migrazioni locali senza modifiche allo schema;
- build e smoke del Container invariati;
- bundle reale dentro `workerd`;
- contratto completo delle 19 metriche overview;
- rifiuto di payload health o snapshot non validi;
- errore health con snapshot ancora visibile;
- errore snapshot con health ancora visibile;
- assenza di maintenance token, accesso diretto a D1, mutation e pubblicazione;
- smoke Chromium desktop e mobile.

### 3. Verificare il deploy reale

Dopo il merge:

```text
Cloudflare Access
→ shell Astro
→ snapshot proxy server-side
→ overview completa
```

Controlli manuali:

- accesso diretto dopo il solo login Access;
- overview caricata con timestamp reale;
- sezioni Fonti e coda, Ricerca recente, Brief e claim, Readiness e pagine;
- guardrail “pubblicazione automatica disabilitata” visibile;
- refresh funzionante;
- claim e draft preview ancora consultabili;
- layout desktop e mobile utilizzabili.

### 4. Proseguire la migrazione funzionale

Ordine successivo, una fase per branch:

```text
radar e brief
→ claim e fonti
→ readiness ed evidence bundle
→ draft e preview
→ queue e audit
```

Le prime mutation potranno essere introdotte soltanto con scope esplicito, contratti API stabili, conferme accessibili e guardrail editoriali invariati.

### 5. Valutare il confronto UI soltanto se ancora utile

shadcn/ui è operativo. Il confronto Mantine resta opzionale e separato; non blocca la migrazione in assenza di un vantaggio concreto da misurare.

### 6. Migrare il sito pubblico dopo la Control Room

Ordine previsto:

- home e layout;
- navigazione e pagine statiche;
- listing;
- pagina articolo;
- schema, canonical, sitemap e 404;
- migrazione progressiva senza cambiare gli stati editoriali.

La pagina `esim-cina-senza-vpn` resta `review` e pubblicamente invisibile.

## Checkpoint completato il 21 luglio 2026

La sessione server-side della Control Room è operativa:

- PR #31 mergiata con CI completa verde;
- Cloudflare Access e validazione JWT nell’origine attivi;
- proxy snapshot GET-only live;
- browser privo di maintenance token, `sessionStorage` e header `Authorization` applicativo;
- accesso manuale verificato con un solo login;
- snapshot reale caricato automaticamente;
- API originale invariata per agenti e consumer legacy;
- nessuna regressione dei gate editoriali o di pubblicazione.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente nuovi componenti generici scritti a mano;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- backend editoriale, claim, evidence bundle e gate invariati;
- nessuna pubblicazione automatica;
- nessun bypass pubblico della policy Access;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository.

## Definition of Done della PR #32

- [ ] contratti health e snapshot validati a runtime;
- [ ] tutte le metriche overview mostrate con significato coerente;
- [ ] capability e binding distinti da veri probe di salute;
- [ ] health e snapshot falliscono in modo indipendente;
- [ ] timestamp e guardrail visibili;
- [ ] CI completa verde;
- [ ] deploy automatico verde;
- [ ] verifica manuale desktop e mobile;
- [ ] nessuna mutation o pubblicazione;
- [ ] documentazione aggiornata allo stato verificato.

## Dopo il frontend

1. Search Console e sitemap operative;
2. CMP, GTM e GA4;
3. dizionario canonico degli eventi;
4. OpenSEO come servizio condiviso;
5. trend e stagionalità;
6. affiliazioni controllate;
7. funzioni multi-progetto dello studio.
