# Astro frontend spike

Spike non pubblico per verificare Astro + React island + adapter Cloudflare accanto al Worker esistente di Senza Roaming.

## Scope e guardrail

- `src/`, `migrations/` e `containers/` non vengono spostati.
- Le API `/api/maintenance/*`, D1, Workflow, Container e AI Gateway restano responsabilità del Worker esistente.
- La route demo vive sotto `/_spike/control-room`, contiene `noindex,nofollow` e non va collegata al traffico pubblico.
- La sessione browser può leggere un token solo da `sessionStorage`; il token non viene scritto in repository, HTML, URL o log.
- Non sono presenti azioni di pubblicazione: i pulsanti demo coprono solo approvazione revisione e richiesta modifiche.

## Struttura

- `astro.config.mjs`: Astro server output, React integration, adapter Cloudflare e chunk naming per misurare i bundle.
- `src/pages/_spike/control-room/index.astro`: shell Astro non pubblica.
- `src/components/control-room/ControlRoomSpike.tsx`: singola React island con primitive shadcn/ui-style locali e variante Mantine isolata tramite `@mantine/core`.
- `src/entrypoints/worker.ts`: custom entrypoint dimostrativo che conserva `Last30DaysContainer` e `RecentDemandWorkflow` e delega le route backend.
- `wrangler.spike.jsonc`: configurazione locale non di deploy pubblico.

## Istruzioni locali

```bash
cd apps/web
npm install
npm run dev
```

Aprire `http://127.0.0.1:4321/_spike/control-room`.

Preview Worker/workerd dopo build:

```bash
cd apps/web
npm run build
npm run preview:worker
```

Worker legacy in parallelo dalla root:

```bash
npm run dev
```

Se si vuole provare una sessione applicativa locale, inserire il token manualmente nella console browser senza committarlo:

```js
sessionStorage.setItem('maintenance_session_token', '<token runtime>')
```

## Misure dello spike

| Criterio | shadcn/ui-style | Mantine |
|---|---|---|
| Dipendenze | React, TanStack, Lucide, CVA/clsx/tailwind-merge; componenti copiabili e ispezionabili | React, `@mantine/core`, `@mantine/hooks`; più componenti pronti runtime |
| Codice custom | Più markup applicativo, meno runtime di kit | Meno markup per componenti reali, più dipendenza da API Mantine |
| Asset client | Atteso più basso perché i componenti sono codice locale/tree-shakeable | Atteso più alto per runtime componenti e CSS Mantine |
| Accessibilità/tastiera | Buona se si usano primitive Radix/shadcn reali; richiede disciplina su composizione | Buona out-of-the-box per molti componenti; documentazione estesa |
| Mobile | Tailwind e dashboard block facilitano layout preciso content-first | Component props comode, ma più opinioni sul layout |
| Branding | Ottimo: token CSS e classi vicino al sito Astro pubblico | Buono via theme provider, ma richiede provider globale nella island |
| Astro integration | Naturale: CSS e componenti locali, React solo island | Funziona, ma Mantine richiede setup provider/CSS nella island |
| Loading/error/form | Da abbinare a TanStack Query + React Hook Form + shadcn blocks | Mantine fornisce molti stati/componenti form pronti |
| Manutenzione | Versioni e codice visibili nel repo; upgrade manuale ma controllato | Upgrade package più centralizzato, rischio lock-in API maggiore |

## Raccomandazione

Raccomando **shadcn/ui** per la Control Room definitiva, usando componenti e dashboard block esistenti, non un design system proprietario. La motivazione principale è la coerenza con Astro content-first: meno runtime UI permanente, branding più vicino al sito pubblico, componenti ispezionabili e confine più chiaro tra codice di dominio e primitive UI. Mantine resta valido se lo spike successivo richiede velocità massima su form complessi, ma non mostra un vantaggio netto sufficiente da compensare bundle/runtime e provider globale.

## Comandi di verifica

```bash
npm run web:smoke
npm run web:typecheck
npm run web:build
npm run typecheck
```

`npm install` può fallire in ambienti con registry npm bloccato; in quel caso restano eseguibili i controlli statici root e lo smoke senza installare nuove dipendenze.
