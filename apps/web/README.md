# `apps/web`

Frontend Astro di Senza Roaming e fondazione della nuova Control Room.

## Runtime

`apps/web/src/worker.ts` è il custom entrypoint del singolo Worker Cloudflare. Delega ad Astro soltanto `/astro-foundation` e `/control-room-foundation`; tutte le altre richieste continuano a usare il router backend in `src/index.ts`. Lo stesso modulo conserva gli export `RecentDemandWorkflow` e `Last30DaysContainer`.

La nuova Control Room è disponibile soltanto come route `noindex,nofollow` e `no-store`. Non viene distribuita pubblicamente dalle pull request.

## UI foundation

Astro fornisce la shell SSR e monta un solo root React con `client:load`. shadcn/ui è configurato da `components.json`; i componenti generati sono versionati sotto `src/components/ui` e lo stile Tailwind 4 vive in `src/styles/globals.css`.

La island implementa:

- sidebar desktop e Sheet mobile;
- stato sessione e UI bloccata;
- health di API, Workflow, Container e AI Gateway;
- metriche editoriali dello snapshot;
- tabella claim filtrabile e dettaglio laterale read-only;
- preview read-only dei metadati dell'ultimo draft;
- stati loading, error ed empty con Alert, Skeleton e Sonner.

Non implementa mutation, azioni editoriali, accesso diretto a D1 o capacità di pubblicazione.

## Sessione e dati

La fondazione riusa il meccanismo transitorio della Control Room legacy: il maintenance token resta in `sessionStorage` con chiave `srMaintenanceToken` e viene inviato soltanto nell'header `Authorization`. Astro non riceve il token come prop e non lo inserisce in HTML o URL. Senza token la island non chiama lo snapshot protetto.

I soli endpoint letti sono:

- `GET /api/health`;
- `GET /api/maintenance/control-room`.

Tutti i dati reali arrivano dalle API del Worker; il browser non accede a D1.

## Verifica locale

```bash
npm run types
npm run typecheck
npm run build
npm run db:migrate:local
npm run smoke:runtime
npm run smoke:ui
```

`smoke:runtime` verifica il bundle reale in `workerd`, gli export, le route Astro, health, snapshot autenticato e le route di pubblicazione assenti. `smoke:ui` usa Chromium sullo stesso runtime: controlla una lettura reale dello snapshot e usa fixture dichiarate in `tests/fixtures` soltanto per gli stati e le interazioni deterministiche.
