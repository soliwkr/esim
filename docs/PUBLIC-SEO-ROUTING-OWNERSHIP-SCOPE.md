# Public SEO routing and ownership — scope M5.5b

Data di riferimento: **24 luglio 2026**.

## Stato

Questa fase è autorizzata come discovery e fondazione contrattuale.

Non esegue il cutover pubblico e non cambia l’owner live di alcuna route canonica.

```text
M5.5a contract parity
→ M5.5b route ownership contract
→ canonical Astro parity behind tests
→ SEO endpoint parity
→ catalog pilot
→ M5.7 cutover separato
```

## Evidenza corrente

Il custom Worker inoltra ad Astro soltanto:

```text
/astro-foundation
/astro-foundation/*
/control-room-foundation
/control-room-foundation/*
```

Tutto il resto viene delegato a `src/index.ts`.

Il backend legacy possiede oggi:

```text
/
/destinazioni
/guide
/confronti
/metodo
/trasparenza
/privacy
/{slug}
/sitemap.xml
/robots.txt
/favicon.svg
/go/{provider}
/control-room
/control-room.js
/api/*
```

La route articolo legacy è un fallback single-path dopo le route riservate e dopo il rifiuto dei file probe.

## Decisione di ownership target

### Astro pubblico canonico

Dopo un futuro cutover esplicito, Astro sarà l’owner di:

```text
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
404 pubblica editoriale
asset compilati del frontend pubblico
```

Astro continuerà a leggere D1 soltanto server-side tramite read model condivisi e published-only.

### Backend permanente

Il backend resta owner di:

```text
/api/*
/go/{provider}
/control-room
/control-room.js
D1 e migrazioni
Workflows
Container
AI Gateway / Vertex
claim, readiness, draft e publication gate
```

Il redirect provider resta backend-owned perché valida la destinazione HTTPS, applica la configurazione affiliate e registra il click in D1.

### Astro privato

La nuova Control Room resta sotto:

```text
/control-room-foundation*
```

con Cloudflare Access, validazione origine, route private dedicate e nessun accesso browser a D1.

### Preview di rollback

Il namespace:

```text
/astro-foundation*
```

resta noindex, no-store e fuori sitemap almeno fino al cutover verificato. La sua rimozione richiede una PR separata.

## Precedenza target del router

La classificazione deve essere esplicita e fail-closed:

1. redirect host `www → apex`;
2. Control Room foundation e Access guard;
3. endpoint privati della Control Room;
4. `/api/*`;
5. `/go/{provider}`;
6. asset e route tecniche note;
7. route pubbliche statiche canoniche;
8. articolo pubblico single-segment published-only;
9. vera 404.

Non è consentito usare un catch-all Astro generico che possa intercettare API, provider redirect, file probe, asset o route private.

## Route matrix target

| Pattern | Owner live oggi | Owner target | Indicizzazione | Cache |
|---|---|---|---|---|
| `/astro-foundation*` | Astro | Astro preview temporanea | noindex | no-store |
| `/control-room-foundation*` | Astro + Worker guard | invariato | noindex | no-store |
| `/` | legacy | Astro | index | pubblica |
| listing canonici | legacy | Astro | index | pubblica |
| trust canoniche | legacy | Astro | index | pubblica |
| `/{slug-published}` | legacy | Astro | index | pubblica |
| `/sitemap.xml` | legacy | Astro | n/a | pubblica breve |
| `/robots.txt` | legacy | Astro | n/a | pubblica breve |
| `/go/{provider}` | backend | backend | noindex | no-store |
| `/api/*` | backend | backend | n/a | per contratto |
| legacy Control Room | backend | backend finché necessaria | noindex | no-store |
| file probe | backend 404 | fail-closed 404 | noindex | no-store o breve |

## Canonical e schema

Il contratto `src/public-seo.ts` resta la fonte unica per:

- title;
- description;
- Open Graph;
- `WebSite`;
- `Article`;
- `FAQPage`.

La route owner determina:

- canonical URL;
- `mainEntityOfPage`;
- robots;
- cache;
- status HTTP.

Durante la preparazione, legacy e Astro possono produrre lo stesso documento SEO normalizzato, ma una sola route canonica può essere indicizzabile in produzione.

## Sitemap e robots

La futura implementazione Astro deve preservare il contratto corrente:

- route statiche canoniche;
- soltanto articoli `published`;
- `lastmod` da `updated_at`;
- nessuna route preview;
- nessuna riga `review` o `draft`;
- sitemap assoluta sull’apice;
- disallow di `/go/`, Control Room e API di manutenzione.

La migrazione di ownership non può cambiare simultaneamente il contenuto della sitemap o la policy robots senza uno scope separato.

## 404 e fallback articolo

Il fallback articolo canonico può accettare soltanto uno slug single-segment valido e non riservato.

Devono restare esclusi almeno:

```text
api
astro-foundation
control-room
control-room-foundation
destinazioni
guide
confronti
metodo
trasparenza
privacy
go
robots.txt
sitemap.xml
favicon.svg
file probe e path con estensioni tecniche
```

Slug assente, `review`, `draft` o non valido produce una vera 404. Una riga `published` strutturalmente invalida continua a fallire chiusa senza esporre contenuto fattuale.

## Sequenza di implementazione

### M5.5b.1 — Route policy foundation

Branch autorizzata dopo il merge di questo scope:

```text
feat/public-route-policy-foundation
```

Obiettivo esclusivo:

- introdurre una matrice tipizzata di route e owner;
- modellare stato corrente e target separatamente;
- centralizzare reserved paths e file-probe policy;
- far usare al custom Worker la matrice **corrente** senza cambiare comportamento;
- aggiungere smoke di precedenza, owner e regressione;
- mantenere tutte le route canoniche live sul backend.

### M5.5b.2 — Canonical Astro parity

PR successiva e separata:

- componenti pubblici parametrizzati per preview o canonical;
- route Astro canoniche compilate e testate senza attivazione live;
- internal link canonicali;
- 404 pubblica Astro;
- parità di contenuto, metadata, accessibilità e published-only.

### M5.5b.3 — SEO endpoint parity

PR successiva e separata:

- builder condiviso sitemap/robots;
- handler Astro testati;
- output byte/semantic parity dove applicabile;
- ownership live ancora invariata.

### M5.7 — Cutover

PR separata e autorizzazione esplicita:

- cambia l’owner attivo delle route pubbliche;
- non cambia API, provider redirect o gate editoriali;
- esegue smoke live;
- conserva rollback immediato.

## Rollback

Il cutover futuro deve ridursi a una modifica versionata della matrice attiva nel custom Worker.

Rollback richiesto:

```text
Astro canonical owner
→ revert della route matrix
→ backend legacy owner
```

Non usare un flag runtime non documentato o un parametro URL per scegliere il renderer.

## Acceptance M5.5b.1

- typecheck e build verdi;
- nessuna route live cambia owner;
- `/`, listing, trust, articoli, sitemap e robots restano backend-served;
- `/go/*` e `/api/*` non possono essere intercettati da Astro;
- preview e Control Room continuano a essere Astro-owned;
- reserved paths e file probe falliscono chiusi;
- smoke esistente SEO completamente verde;
- tutte le suite Control Room verdi;
- nessuna D1 migration o mutation;
- nessuna pubblicazione, analytics o affiliazione attivata.

## Esclusioni

- nessun cutover apex;
- nessuna migrazione live di listing o articoli;
- nessuna modifica ai contratti API;
- nessuna modifica a D1, Workflow, Container o AI Gateway;
- nessuna route di pubblicazione;
- nessun tracking;
- nessuna configurazione Google;
- nessuna rimozione legacy;
- nessuna attivazione affiliate.
