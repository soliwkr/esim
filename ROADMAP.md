# Senza Roaming — Roadmap

Ultimo aggiornamento: **23 luglio 2026**.

Questa è la roadmap canonica di `soliwkr/esim`.

## Documenti operativi

- `ROADMAP.md` — milestone e criteri di uscita;
- `docs/STATUS.md` — stato verificato;
- `docs/NEXT.md` — lavoro immediato;
- `docs/ARCHITECTURE.md` — confini tecnici;
- `docs/DECISIONS.md` — decisioni accettate;
- `docs/FRONTEND-PLAN.md` — migrazione Astro e Control Room;
- `docs/PUBLIC-FRONTEND-PARALLEL-TRACK.md` — separazione M4/M5;
- `docs/PUBLIC-HOMEPAGE-CANDIDATE-SCOPE.md` — implementazione homepage candidata.

## Principi non negoziabili

1. L’AI non pubblica direttamente.
2. Brief, claim, readiness, draft, materializzazione e pubblicazione sono gate distinti.
3. I fatti commerciali richiedono fonti identificabili e data di verifica.
4. Claim insufficienti o scaduti non alimentano testo fattuale.
5. Il browser non accede direttamente a D1.
6. Ogni mutation richiede identità verificata, conferma, state machine, audit e test.
7. Astro è il frontend pubblico; React resta un’isola realmente interattiva.
8. Una preview Astro non equivale a un cutover.
9. Una riga `review` non equivale a contenuto pubblico.
10. Il repository è la memoria canonica.

## M0 — Fondazioni tecniche

**Stato: completato salvo verifica definitiva `www → apex`.**

- [x] Worker e D1;
- [x] migrazioni versionate;
- [x] deploy automatico;
- [x] dominio principale;
- [x] Container e Workflow;
- [x] API manutenzione protette;
- [x] vere 404 e noindex;
- [ ] ricontrollare redirect `www`.

## M1 — Qualità e osservabilità

**Stato: quality gate operativo; osservabilità avanzata aperta.**

- [x] documentazione canonica;
- [x] storico run e audit;
- [x] freshness;
- [x] score zero deterministico;
- [x] golden evaluation;
- [x] topic-mismatch gate;
- [x] snapshot Control Room;
- [x] audit repository esterni;
- [ ] verifica live topic-mismatch;
- [ ] health aggregato;
- [ ] log errori unificati.

## M2 — Motore AI editoriale

**Stato: nucleo v1 operativo.**

- [x] AI Gateway e Vertex;
- [x] segnali idonei soltanto;
- [x] brief strutturati e persistiti;
- [x] claim atomici e fonti;
- [x] esiti verificati;
- [x] nessuna pubblicazione automatica;
- [ ] deduplicazione semantica storica;
- [ ] Trust Score evoluto.

## M3 — Readiness e draft grounded

**Stato: completato e verificato.**

- [x] aggregazione claim e conflitti;
- [x] review-draft eligibility separata dalla publication eligibility;
- [x] evidence bundle versionato;
- [x] provenance field-level;
- [x] esclusione claim insufficienti;
- [x] materializzazione solo in `review`;
- [x] primo draft grounded approvato senza pubblicazione.

## M4 — Control Room definitiva

**Stato: letture complete; prima mutation in produzione; mutation residue aperte.**

### Foundation

- [x] Astro shell e React island;
- [x] shadcn/ui;
- [x] custom Worker;
- [x] Cloudflare Access;
- [x] sessione server-side;
- [x] browser senza credenziali applicative.

### Letture

- [x] overview e health;
- [x] radar, segnali e brief;
- [x] claim, fonti, scadenze e task;
- [x] readiness e bundle;
- [x] draft e dettaglio;
- [x] queue e audit;
- [x] linkage canonici;
- [x] parità legacy read-only.

### Mutation

- [x] decisione brief `proposed → accepted | dismissed`;
- [ ] conversione brief;
- [ ] operazioni claim;
- [ ] decisione draft;
- [ ] eventuale retry queue;
- [ ] rimozione legacy privata dopo parità mutabile.

**Criterio di uscita M4:** la legacy privata non è più un fallback operativo.

## M5 — Frontend pubblico Astro e catalogo

**Stato: track parallela attiva; shell e trust pages live; homepage candidata verde in CI.**

### M5.0 — Public shell

- [x] `/astro-foundation` noindex;
- [x] layout, metadata, header, menu e footer;
- [x] raw HTML senza JavaScript necessario;
- [x] mobile e tastiera;
- [x] `/` invariato;
- [x] fuori sitemap;
- [x] checkpoint mobile live.

### M5.1 — Trust pages

- [x] Metodo preview;
- [x] Trasparenza preview;
- [x] Privacy preview;
- [x] componente condiviso;
- [x] route canoniche legacy preservate;
- [x] CI completa;
- [x] checkpoint mobile live 3/3.

### M5.2 — Homepage candidata

Branch: `feat/public-homepage-candidate`.

- [x] read model server-only condiviso tra legacy e Astro;
- [x] soltanto righe `published`;
- [x] guide featured, limite 9;
- [x] destinazioni, limite 6;
- [x] ordine deterministico;
- [x] raw HTML, noindex, no-store e sitemap exclusion;
- [x] `/` ancora legacy;
- [x] fixture published/review/draft;
- [x] empty state;
- [x] desktop, mobile, tastiera, 404 e regressioni Control Room;
- [x] CI #279 verde;
- [ ] merge e checkpoint visuale live sul catalogo remoto.

### M5.3 — Listing preview

**Bloccato fino al checkpoint live M5.2.**

- [ ] Destinazioni preview;
- [ ] Guide preview;
- [ ] Confronti preview;
- [ ] stesso read model published-only;
- [ ] internal linking deterministico;
- [ ] route matrix e fail-fast.

### M5.4 — Renderer editoriale Astro

- [ ] pagina articolo grounded;
- [ ] blocchi strutturati, non HTML AI grezzo;
- [ ] provenance e fonti;
- [ ] claim esclusi non presentati come fatti;
- [ ] related links deterministici.

### M5.5 — Parità SEO

- [ ] canonical;
- [ ] sitemap;
- [ ] robots;
- [ ] schema;
- [ ] disclosure condizionale;
- [ ] redirect provider;
- [ ] vere 404;
- [ ] drift/regression test.

### M5.6 — Catalogo pilot

- [ ] piccolo set di pagine con intento distinto;
- [ ] evidence e publication eligibility;
- [ ] nessuna generazione massiva;
- [ ] indicizzazione e click prima della scala.

### M5.7 — Cutover apex

- [ ] PR separata e autorizzazione esplicita;
- [ ] confronto route e metadata;
- [ ] schema, sitemap e 404 validi;
- [ ] redirect provider preservati;
- [ ] rollback documentato;
- [ ] nessuna pagina review esposta;
- [ ] rimozione legacy solo dopo verifica.

## M6 — Misurazione e indicizzazione

**Stato: infrastruttura esterna preparata; integrazione non avviata.**

GTM, GA4, Search Console e service account sono stati preparati dall’operatore. Nessuna credenziale è configurata nel repository.

- [ ] CMP;
- [ ] Consent Mode;
- [ ] dizionario eventi;
- [ ] GTM;
- [ ] GA4;
- [ ] Search Console e sitemap;
- [ ] verifica dati reali;
- [ ] report query, landing, CTR e indicizzazione;
- [ ] registro esperimenti.

M6 parte dopo route pubbliche stabili. Nessun tracking sulle preview noindex.

## M7 — Intelligence SEO

- [ ] GSC operativa;
- [ ] rank tracking;
- [ ] competitor set;
- [ ] Trends;
- [ ] opportunity score v2;
- [ ] audit tecnico/editoriale/GEO.

## M8 — Monetizzazione controllata

- [ ] programmi affiliate ufficiali;
- [ ] disclosure;
- [ ] configurazione riservata dei link;
- [ ] affiliate mode esplicita;
- [ ] tracking privacy-first;
- [ ] revenue score dopo dati sufficienti.

## M9 — Crescita e manutenzione

- [ ] ciclo domanda settimanale;
- [ ] refresh fonti scadute;
- [ ] discovery cluster;
- [ ] aggiornamento pagine in perdita;
- [ ] espansione internazionale dopo stabilità italiana.

## Ordine operativo

### Track A — M4

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
→ rimozione legacy privata
```

### Track B — M5

```text
checkpoint live homepage candidata
→ listing preview
→ renderer articolo
→ parità SEO
→ catalogo pilot
→ cutover apex separato
```

### Dopo M5 stabile

```text
CMP e Consent Mode
→ GTM / GA4
→ Search Console
→ misurazione
→ monetizzazione controllata
```
