# M7.1 — Long-tail corpus summary

Data: **6 agosto 2026**

Sorgente primaria:

```text
Google Keyword Planner
mercato: Italia
lingua: italiano
periodo: 2025-07-01 → 2026-06-30
1.623 keyword uniche
```

Foglio sorgente:

```text
https://docs.google.com/spreadsheets/d/1fah6iZW5WNWD-MIA3EJnwK3hRHUMrkbC1PANy1hgEVQ/edit
```

La PR M7.1 ha letto direttamente il workbook originale, non soltanto il precedente `page-map.csv` da 38 blueprint.

## Regola sui numeri

I volumi Planner sono bucket arrotondati.

Gli aggregati sotto:

- includono query correlate e potenzialmente sovrapposte;
- servono per confronto relativo e priorità;
- **non** sono una previsione di traffico;
- **non** sono un mercato indirizzabile sommabile;
- non autorizzano una pagina per ogni query.

La classificazione tema/owner è euristica e viene usata per triage SEO, non come publication decision.

## Provider intent nel corpus

Aggregazione euristica sulle query che contengono il brand:

| Provider | Keyword distinte | Volume Planner aggregato |
| --- | ---: | ---: |
| Holafly | 24 | 25.500 |
| Airalo | 19 | 17.600 |
| Ubigi | 2 | 550 |
| Travel eSIM | 1 | 500 |
| GigSky | 1 | 50 |
| MobiMatter | 1 | 50 |

Interpretazione:

- Airalo e Holafly hanno domanda brand molto più forte nel corpus italiano corrente;
- Ubigi resta interessante per evidence readiness e differenziazione, non per volume Planner;
- provider breadth non va espansa solo perché un brand compare una volta.

## Destination intent

Aggregazione euristica delle query destination presenti nel corpus:

| Destinazione | Keyword distinte | Volume Planner aggregato |
| --- | ---: | ---: |
| USA | 24 | 13.350 |
| Egitto | 5 | 11.500 |
| Albania | 4 | 6.500 |
| Giappone | 2 | 5.500 |
| Turchia | 2 | 5.500 |
| Thailandia | 2 | 5.500 |
| Svizzera | 1 | 5.000 |
| Emirati Arabi Uniti / Dubai | 3 | 1.500 |
| Zanzibar | 3 | 600 |
| Oman | 2 | 550 |
| Repubblica Dominicana | 1 | 500 |
| Europa | 1 | 50 |

`Europa` è l'esempio più importante del limite del Planner export: il cluster appare quasi assente nel foglio, mentre la SERP live è chiaramente commerciale e il repository possiede già evidence regionale reale. Per questo M7.1 usa Planner + SERP + evidence readiness, non Planner da solo.

## Device / compatibility demand

La compatibilità non è il primo click affiliate, ma è un grande bacino top/mid-funnel.

Aggregazione euristica:

| Famiglia | Keyword distinte | Volume Planner aggregato |
| --- | ---: | ---: |
| iPhone | 332 | 31.022 |
| Xiaomi | 127 | 6.750 |
| Samsung | 99 | 5.736 |
| Apple Watch | 70 | 3.050 |
| Huawei | 52 | 2.500 |
| Motorola | 17 | 1.300 |
| Oppo | 10 | 950 |
| Honor | 12 | 600 |

Il `page-map.csv` canonico precedente assegnava già a `/esim-iphone` 25.850 di volume aggregato. La lettura diretta del corpus conferma che l'area device è grande e giustifica almeno un feeder ad alta qualità verso money page e destination page.

Non significa generare centinaia di URL modello-specifiche.

## Modificatori di intento

Conteggi euristici nel corpus originale:

| Modificatore | Keyword distinte | Volume aggregato |
| --- | ---: | ---: |
| estero / viaggio / internazionale | 12 | 23.100 |
| come funziona / funziona | 15 | 16.050 |
| codice sconto / coupon | 2 | 10.000 |
| recensioni / opinioni / Trustpilot | 14 | 7.900 |
| online / acquisto | 23 | 6.100 |
| compatibilità / supporto | 14 | 3.850 |
| 5G | 37 | 2.300 |
| prezzo / costo | 8 | 1.750 |
| gratis | 8 | 1.750 |
| WhatsApp | 12 | 600 |
| illimitati / fair use | 1 | 500 |

`hotspot/tethering` non emerge come head term nel Planner originale, ma appare ripetutamente nelle SERP, FAQ provider e community questions. È quindi un esempio di **decision criterion ad alto valore commerciale che non va eliminato perché il Planner non gli assegna volume**.

## Prioritized subset

La branch versiona:

```text
research/seo/m7-long-tail-priority-universe.csv
```

con le prime query travel/commercial individuate dal corpus e questi campi:

```text
Planner metrics
heuristic theme
heuristic entity
heuristic intent
travel relevance
monetization potential
owner suggestion
```

Il dataset completo di 1.623 righe resta nel foglio sorgente; non viene duplicato nel repository soltanto per aumentare il numero di file.

## Implicazioni operative

1. `/migliore-esim` resta il percorso più rapido al primo click commerciale perché è già live e possiede domanda generic/comparison forte.
2. `/esim-europa` resta la prima nuova money page perché evidence readiness compensa il basso segnale Planner del singolo export.
3. `/codice-sconto-holafly` è il query cluster più vicino alla transazione esplicita, ma dipende da freshness e affiliate approval.
4. `/airalo-recensioni` ha forte pre-purchase intent e richiede separazione fra facts, sentiment e aneddoti.
5. USA/Egitto/Giappone/Turchia/Albania/Svizzera/Thailandia costituiscono la prima coda destination da alimentare dopo la vertical slice iniziale.
6. `/esim-iphone` deve essere trattata come importante feeder SEO, non come money page primaria.
7. SERP question discovery rimane necessaria perché il Planner non cattura bene hotspot, FUP, multi-country e altri criteri di decisione.
