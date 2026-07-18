# `apps/web`

Frontend Astro di Senza Roaming e fondazione della nuova Control Room.

## Runtime

`apps/web/src/worker.ts` è il custom entrypoint del singolo Worker Cloudflare. Delega ad Astro soltanto `/astro-foundation` e `/control-room-foundation`; tutte le altre richieste continuano a usare il router backend in `src/index.ts`. Lo stesso modulo conserva gli export `RecentDemandWorkflow` e `Last30DaysContainer`.

La nuova Control Room è `noindex,nofollow` e `no-store`. La route `/control-room-foundation` è inoltre fail-closed: prima di delegare ad Astro, il Worker richiede e valida il JWT `Cf-Access-Jwt-Assertion` emesso dall'applicazione Cloudflare Access configurata per quel path.

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

## Access e sessione

Cloudflare Access è il perimetro esterno. Il Worker verifica firma RS256, issuer, audience e validità temporale del JWT usando le chiavi pubbliche del team domain. Se `CF_ACCESS_TEAM_DOMAIN` o `CF_ACCESS_AUD` mancano, la route risponde `503`; se il JWT manca o non è valido, risponde `403`.

Dopo Access, la fondazione riusa il meccanismo transitorio della Control Room legacy: il maintenance token resta in `sessionStorage` con chiave `srMaintenanceToken` e viene inviato soltanto nell'header `Authorization`. Astro non riceve il token come prop e non lo inserisce in HTML o URL. Senza token la island non chiama lo snapshot protetto.

I soli endpoint letti sono:

- `GET /api/health`;
- `GET /api/maintenance/control-room`.

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

Gli smoke generano una coppia RSA effimera e un JWT Access di test; nessuna chiave di test viene versionata. `smoke:runtime` verifica il bundle reale in `workerd`, il fail-closed anonimo, la firma JWT, gli export, health, snapshot autenticato e route di pubblicazione assenti. `smoke:ui` usa Chromium dietro lo stesso guard e copre hydration, loading, error, empty, tastiera, mobile e pannelli read-only.
