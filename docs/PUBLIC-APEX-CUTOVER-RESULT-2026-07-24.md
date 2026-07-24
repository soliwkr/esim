# Public apex cutover — risultato live

Data di verifica: **24 luglio 2026**.

## Riferimenti

```text
PR #81 — Cut over canonical public routes to Astro
merge e62b570248bf97afaa3f283cfbb847ceea01f529
CI finale #404 completamente verde
```

## Checkpoint live confermato

La produzione su `https://senzaroaming.it` serve il nuovo frontend Astro sull’apice.

Verifiche manuali confermate dall’operatore autenticato:

- homepage canonica con il nuovo design;
- articolo canonico `/migliore-esim` con il nuovo renderer;
- `/sitemap.xml` raggiungibile;
- `/robots.txt` raggiungibile;
- `/go/airalo` conserva il comportamento di redirect backend;
- navigazione e rendering risultano operativi nel browser reale.

## Ownership live certificata

```text
Astro:
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
  404 pubblica
  /astro-foundation*
  /control-room-foundation*

Backend / execution plane:
  /api/*
  /go/*
  legacy Control Room
  D1
  Workflows
  Container
  AI Gateway / Vertex AI
  gate editoriali e publication capability
```

## Guardrail invariati

- nessuna migration D1;
- nessuna transizione `review → published`;
- nessuna pubblicazione autonoma;
- nessun analytics, sitemap submission o affiliazione;
- la pagina `esim-cina-senza-vpn` resta `review` e non pubblicabile;
- il manifest del catalog pilot resta vuoto;
- la legacy pubblica non viene rimossa in questo checkpoint;
- la legacy privata resta disponibile finché serve come fallback operativo.

## Esito

```text
M5.7 apex design cutover: completato e verificato live
nuovo design Astro: in produzione
publication capability: separata e non autorizzata
prossima milestone: M6 measurement foundation
```

Il checkpoint certifica disponibilità e comportamento delle route controllate. Non sostituisce una misura automatizzata esterna degli header HTTP di ogni singola risposta; tali contratti restano coperti dalla CI #404 e potranno essere ricontrollati durante M6.
