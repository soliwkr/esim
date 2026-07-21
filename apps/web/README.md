# `apps/web`

Frontend Astro di Senza Roaming e nuova Control Room privata.

## Runtime

`apps/web/src/worker.ts` è il custom entrypoint del singolo Worker Cloudflare. Delega ad Astro `/astro-foundation` e `/control-room-foundation`; tutte le altre richieste continuano a usare il router backend in `src/index.ts`. Lo stesso modulo conserva gli export `RecentDemandWorkflow` e `Last30DaysContainer`.

La Control Room è `noindex,nofollow` e `no-store`. Tutto il path `/control-room-foundation*` è fail-closed: prima di servire la shell o il proxy snapshot, il Worker richiede e valida l’identità emessa da Cloudflare Access.

## UI

Astro fornisce la shell SSR e monta un solo root React con `client:load`. shadcn/ui è configurato da `components.json`; i componenti generati sono versionati sotto `src/components/ui` e lo stile Tailwind 4 vive in `src/styles/globals.css`.

La island implementa:

- sidebar desktop e Sheet mobile;
- caricamento automatico dopo Cloudflare Access;
- overview completa sulle 19 metriche già esposte dallo snapshot;
- capability e binding di Worker, D1, maintenance API, Workflow, Container, AI Gateway e Vertex;
- timestamp dello snapshot e guardrail di pubblicazione;
- health e snapshot gestiti come risorse indipendenti;
- claim filtrabili con dettaglio laterale read-only;
- preview read-only dei metadati dell'ultimo draft;
- loading, errori parziali, contratti invalidi ed empty state.

Non implementa mutation, azioni editoriali, accesso diretto a D1 o capacità di pubblicazione.

## Dati e sessione server-side

Dopo Access, il browser legge:

- `GET /api/health`;
- `GET /control-room-foundation/api/snapshot`.

Il secondo endpoint è un proxy read-only interno al custom Worker entrypoint. Accetta soltanto `GET` e delega al contratto esistente `GET /api/maintenance/control-room` senza esporre credenziali al browser.

Il browser non conserva token applicativi e non invia un header di autorizzazione verso l’API di manutenzione. L’API originale resta invariata per agenti e consumer legacy.

`apps/web/src/lib/control-room-api.ts` valida a runtime i payload health e snapshot. I tipi TypeScript non vengono usati come sostituto della validazione del JSON ricevuto.

La vista overview distingue esplicitamente:

- capability dichiarate dallo snapshot;
- binding configurati restituiti da `/api/health`;
- probe end-to-end non ancora disponibili.

Tutti i dati reali arrivano dalle API del Worker; il browser non accede a D1.

La configurazione operativa completa vive in [`docs/CONTROL-ROOM-ACCESS.md`](../../docs/CONTROL-ROOM-ACCESS.md).

## Verifica locale

```bash
npm run types
npm run typecheck
npm run build
npm run db:migrate:local
npm run smoke:runtime
npm run smoke:ui
```

Gli smoke generano credenziali Access effimere di test; nessuna chiave viene versionata.

- `smoke:runtime` verifica bundle, Access, proxy GET-only, contratto delle metriche overview, API originale, export, health e route di pubblicazione assenti.
- `smoke:ui` verifica caricamento reale, contratti runtime, errori parziali, refresh, claim e draft read-only, tastiera, mobile e assenza di mutation o credenziali nel browser.
