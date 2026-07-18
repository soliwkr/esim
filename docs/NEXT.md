# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **18 luglio 2026**.

## Now

### 1. Chiudere la verifica della Control Room v3

La Control Room legacy resta una soluzione transitoria.

Verificare in produzione:

```text
/control-room
→ badge v3 visibile
→ client JavaScript caricato
→ apertura sessione funzionante
→ snapshot reale caricato
```

Il deploy automatico deve fallire quando il client live non è sintatticamente valido.

Non aggiungere nuove funzioni importanti alla dashboard artigianale.

### 2. Revisionare la fondazione Astro

La PR `feat/astro-frontend-foundation` contiene la fondazione Astro senza spostare il backend esistente.

Prima del merge verificare:

- CI runtime verde dentro `workerd`;
- pagina Astro e `/api/health` nello stesso Worker;
- export di Workflow e Container nel bundle generato;
- assenza di route di pubblicazione;
- nessun deploy pubblico dalla PR.

### 3. Confrontare due approcci UI

Candidato principale:

```text
shadcn/ui
+ componenti e dashboard block esistenti
+ Tailwind
```

Confronto:

```text
Mantine
+ React island completa
```

Implementare tre viste campione:

1. overview e health;
2. tabella claim con filtri e azione;
3. revisione draft con preview.

Misurare codice custom, velocità, accessibilità, mobile, tema, bundle e manutenzione.

### 4. Registrare la decisione UI

Dopo lo spike:

- aggiornare `docs/DECISIONS.md`;
- scegliere il kit e lo starter/dashboard block;
- fissare versioni e dipendenze;
- definire token visivi minimi;
- evitare un design system proprietario costruito da zero.

### 5. Migrare la Control Room

Ordine operativo:

```text
overview
→ radar e brief
→ claim e fonti
→ readiness
→ draft e preview
→ queue e audit
```

La UI legacy viene rimossa soltanto dopo parità funzionale, test browser e verifica end-to-end.

### 6. Proteggere la nuova Control Room

Aggiungere Cloudflare Access prima di considerare completata la dashboard operativa.

La sessione applicativa resta un secondo livello. Nessun token deve comparire in URL, HTML generato o repository.

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

Fino alla conclusione dello spike:

- niente nuove pagine tramite template string nel Worker;
- niente nuovi componenti generici scritti a mano;
- niente ampliamenti sostanziali della Control Room legacy;
- backend, claim, evidence bundle e gate restano invariati;
- nessuna pubblicazione automatica.

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
- decisione di migrare il frontend verso Astro + React island;
- piano frontend documentato.
- `apps/web` con Astro, React e adapter Cloudflare;
- custom Worker entrypoint unico con fallback al backend esistente;
- smoke runtime per pagina Astro, health, Workflow, Container e assenza di route di pubblicazione.

## Definition of Done del prossimo checkpoint

- [ ] Control Room v3 verificata realmente nel browser;
- [x] `apps/web` Astro creato;
- [x] integrazione con Worker, binding, Workflow e Container dimostrata in CI;
- [ ] tre viste campione implementate;
- [ ] shadcn/ui e Mantine confrontati con criteri misurabili;
- [ ] UI kit scelto e ADR registrata;
- [ ] nessun nuovo HTML/JS artigianale aggiunto;
- [ ] nessuna regressione dei gate editoriali e di pubblicazione;
- [ ] piano di migrazione della Control Room pronto per l'esecuzione.

## Dopo il frontend

1. Search Console e sitemap operative;
2. CMP, GTM e GA4;
3. dizionario canonico degli eventi;
4. OpenSEO come servizio condiviso;
5. trend e stagionalità;
6. affiliazioni controllate;
7. funzioni multi-progetto dello studio.
