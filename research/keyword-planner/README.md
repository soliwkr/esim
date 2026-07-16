# Ricerca Keyword Planner — eSIM Italia

Sorgente: Google Keyword Planner  
Mercato: Italia / lingua italiana  
Periodo: **1 luglio 2025 – 30 giugno 2026**  
Importazione: **16 luglio 2026**

Foglio originale:

https://docs.google.com/spreadsheets/d/1fah6iZW5WNWD-MIA3EJnwK3hRHUMrkbC1PANy1hgEVQ/edit

## Numeri principali

- 1.623 keyword esportate e uniche
- 1.531 keyword con volume maggiore di zero
- 38 blueprint editoriali iniziali
- 28 pagine Tier 1
- 8 pagine Tier 2
- 2 pagine Tier 3

I volumi del Planner sono fasce arrotondate e non previsioni certe di traffico. Le somme di varianti correlate contengono sovrapposizioni e servono soltanto a dare priorità agli intenti.

## Evidenze

Le query più interessanti per un sito affiliate da viaggio sono:

- `esim`, `e sim`: 50.000 ricerche medie mensili ciascuna;
- `esim giappone`, `esim usa`, `esim turchia`, `esim egitto`, `esim thailandia`, `esim albania`, `e sim svizzera`: fascia 5.000;
- `migliore esim` / `migliori esim`: fascia 5.000;
- `airalo recensioni`, `airalo come funziona`, `esim airalo`: fascia 5.000;
- `holafly come funziona`, `esim holafly`, `codice sconto holafly`: fascia 5.000.

La competizione pubblicitaria delle query di viaggio è quasi sempre alta, spesso con indice vicino a 100. Questo non garantisce conversioni, ma conferma che gli inserzionisti attribuiscono valore economico al traffico.

## Scelta strategica

Il dataset contiene anche moltissime ricerche su TIM, Vodafone, Iliad, WindTre, Fastweb, Very Mobile e altri operatori italiani. Quel traffico è consistente, ma l'intento è spesso assistenza o sostituzione della SIM nazionale, non acquisto di connettività da viaggio.

Perciò:

- **Tier 1:** destinazioni, provider affiliabili, scelta del piano e compatibilità;
- **Tier 2:** destinazioni minori, 5G, business e provider secondari;
- **Tier 3:** operatori italiani e test editoriali non centrali.

## Regola anti-thin-content

Una keyword non equivale a una pagina. Varianti come `e sim usa`, `esim usa`, `esim per usa` e `esim stati uniti` devono convergere nello stesso URL quando l'intento è identico.

Una nuova pagina viene pubblicata solo quando possiede:

1. intento distinto;
2. risposta diretta originale;
3. dati o criteri specifici;
4. fonti ufficiali;
5. data di verifica;
6. collegamenti interni utili;
7. revisione editoriale.

## File

- `page-map.csv`: mappa consolidata degli intenti e priorità.
- `../../migrations/0002_blueprints_tier1.sql`: seed D1 Tier 1.
- `../../migrations/0003_blueprints_tier2_3.sql`: seed D1 Tier 2 e Tier 3.
- `../../scripts/build-keyword-research.mjs`: parser per futuri export CSV/TSV.
