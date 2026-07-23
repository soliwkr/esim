# Stato del progetto

Data di riferimento: **23 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | stack remoto allineato fino a `0020`; verifica funzionale del topic-mismatch sul prossimo run ancora aperta |
| API manutenzione | Operativa | accesso riservato; contratti legacy preservati |
| Deploy | Automatico per modifiche operative su `main` | modifiche documentali escluse |
| Container e Workflow recent-demand | Operativi | prima istanza completata end-to-end |
| Quality gate score zero | Operativo e verificato | PR #36, flag `zero_relevance` |
| Golden quality evaluation | Operativa in CI | PR #45 |
| Topic-mismatch gate | Mergiato, verifica funzionale aperta | PR #46, CI #188; primo nuovo run ancora da osservare |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato verificato |
| Motore brief | Operativo | primo brief creato, prioritizzato, accettato e convertito |
| Verifica claim | Operativa | claim atomici, fonti, esiti, scadenze e task persistiti |
| Page Readiness backend | Operativa | primo bundle: score 77, draft sì, pubblicazione no |
| Renderer editoriale v2 | Operativo | campi e sezioni legati a claim verificati |
| Primo draft | Approvato editorialmente | draft `2` approved; pagina materializzata ancora `review` |
| Control Room legacy | Transitoria e necessaria | fallback delle mutation residue; rimozione non autorizzata |
| Frontend foundation | Operativa | Astro, React island e custom entrypoint nello stesso Worker |
| Track parallela M5 | Autorizzata | PR #58, merge `431bf7b`, CI #262 |
| Public shell Astro | Mergiato e visibile in produzione su mobile | PR #59, merge `1b7bfa7`, CI finale #266; verifica live desktop e header HTTP ancora aperta |
| Trust pages Astro | Implementate e verificate in CI, produzione non ancora attestata | PR #61, CI #271; tre route preview noindex, route legacy invariate |
| Cloudflare Access | Operativo e verificato | perimetro privato e validazione nell'origine |
| Sessione server-side | Operativa | un solo login e nessuna credenziale applicativa nel browser |
| Overview, radar e brief | Operativi e verificati | PR #32 e #34 |
| Claim → task ID | Verificato in CI | PR #50, CI #213; browser reale aperto |
| Readiness, draft, queue e audit | Operativi e verificati | PR #39, #40, #42 e #44 |
| Audit → versione draft | Verificato in CI | PR #52, CI #220; browser reale aperto |
| Dettaglio draft completo | Verificato in produzione | PR #47, CI #198 |
| Parità read-only legacy | Completa in CI | PR #49 + #50 + #52 |
| Decisione brief mutation | Operativa e verificata in produzione | PR #54, CI #237, checkpoint #244; nessuna decisione reale eseguita |
| Audit repository esterni | Completato e mergiato | PR #57, merge `5dc7587`, CI #260; zero codice importato |
| Pubblicazione automatica | Assente | nessun endpoint pubblica automaticamente |
| Affiliazioni | Disabilitate | modalità affiliate non attiva |
| Analytics | Non configurata | CMP, GA4, GTM e GSC ancora da collegare |

## Primo ciclo editoriale controllato

```text
recent demand
→ brief AI
→ accettazione umana
→ claim atomici
→ fonti ufficiali
→ esiti verificati
→ Page Readiness
→ evidence bundle
→ draft v2 grounded
→ approvazione editoriale
```

Nessuno di questi passaggi ha pubblicato la pagina.

Evidence set Cina:

```text
claim atomici: 6
verified:       5
insufficient:   1
pending:        0
```

Evidence bundle `1`:

```text
readiness score:        77
review draft eligible:  true
publication eligible:   false
verified:               5
insufficient:           1
conflicts:              1
first-party tests:      0
```

Draft corrente:

```text
id:                     2
version:                2
renderer:               editorial-page-draft-v2
status:                 approved
materialized page:      review
```

La pagina pubblica continua a restituire `404` con `noindex, nofollow` nell’ultima verifica documentata.

## Control Room in produzione

Architettura verificata:

```text
Cloudflare Access
→ validazione nell'origine
→ shell Astro
→ una React island
→ snapshot read-only
→ dettaglio draft GET-only on demand
→ decisione brief POST controllata
→ API esistenti
→ D1 soltanto server-side
```

Sono verificati in produzione sessione, overview, radar, brief, claim, readiness, inventario draft, queue/audit, dettaglio draft completo, desktop/mobile, route e UI della decisione brief e separazione fra stato draft, pagina materializzata e publication eligibility.

Sono verificati in CI ma non ancora attestati nel browser reale di produzione:

- rendering `task_id` nel dettaglio claim — CI #213;
- `event_key` audit e linkage `draft_id` + `draft_version` — CI #220.

Non restano gap read-only noti rispetto alle letture necessarie della legacy.

## Decisione brief — PR #54 in produzione

Scope esclusivo:

```text
proposed → accepted | dismissed
```

Implementazione verificata dalla CI finale #237 e dal checkpoint produttivo #244:

- route privata `POST /control-room-foundation/api/brief-decision`;
- attore derivato dal JWT Cloudflare Access;
- body browser limitato a `briefId`, azione e note;
- conferma tramite AlertDialog accessibile;
- motivo obbligatorio per il rifiuto;
- migrazione remota `0020` con state machine D1;
- evento `editorial_brief_events` append-only;
- retry della stessa decisione idempotente;
- conflitto sulla decisione opposta;
- cancellazione del task editoriale aperto soltanto su `dismissed`;
- reload dello snapshot dopo esito;
- `publicationTriggered: false` nel contratto;
- conteggio delle pagine pubblicate invariato;
- test endpoint reale e browser desktop/mobile;
- regressioni delle altre viste e legacy parity verdi.

Il checkpoint produttivo #244 ha attestato:

- migrazione `0020` registrata nella D1 remota, senza migrazioni residue;
- tabella, colonne e trigger attesi presenti;
- pagine `published` invariate: `4 → 4`;
- stati brief invariati: un solo brief `converted`;
- Access anonimo `302`, pagina e snapshot autenticati `200`;
- `publicationAutomation: false`;
- nessuna richiesta browser non-GET;
- nessuna decisione su brief reali.

Conversione brief, claim, readiness, bundle, draft, queue retry, materializzazione e pubblicazione restano escluse.

## Audit repository esterni — PR #57

La PR #57 è stata mergiata con squash commit `5dc7587` dopo CI #260 completamente verde.

Risultato operativo:

- 71 repository iniziali e una wave finale classificati;
- Ahmeego analizzato come architettura di prodotto, trust e tool-led distribution;
- MGC reale analizzato da archivio sanitizzato come caso strategico e corpus negativo;
- primitive candidate ristrette a slug, route, schema, fail-fast e quality gate;
- nessun motore pSEO, agente, CRM, marketplace o publisher adottato;
- zero codice esterno copiato;
- zero dati cliente o credenziali versionati;
- nessuna modifica backend, runtime, deploy o publication state.

La conclusione consente di sviluppare il frontend pubblico senza riaprire l’architettura backend.

## Track parallela M5 — PR #58

La PR #58 è mergiata nel commit `431bf7b` dopo CI #262 verde e registra ADR-026.

```text
Track A — mutation M4 residue
Track B — frontend pubblico Astro M5
```

Questa autorizzazione non cambia lo stato delle route pubbliche e non chiude M4:

- l’apice resta sul renderer legacy;
- nessuna pagina review viene pubblicata;
- nessuna affiliazione viene attivata;
- la legacy Control Room resta necessaria;
- il cutover pubblico richiede una PR separata.

## Public shell Astro — PR #59

La prima slice M5 sostituisce la pagina-spike `/astro-foundation` con una preview reale del futuro shell pubblico.

Implementazione:

```text
PublicLayout.astro
├── metadata e canonical
├── skip link
├── PublicHeader.astro
├── slot di contenuto
└── PublicFooter.astro

astro-foundation.astro
└── homepage preview statica non commerciale
```

Caratteristiche verificate dalla CI finale #266:

- contenuto primario nel raw HTML;
- nessuna island React e nessuno script richiesto;
- header e navigazione desktop;
- menu mobile progressivo basato su `details`/`summary`;
- footer con Metodo, Trasparenza e Privacy;
- stili pubblici isolati da quelli della Control Room;
- canonical `https://senzaroaming.it/astro-foundation`;
- meta e header `noindex,nofollow`;
- `Cache-Control: no-store`;
- preview esclusa da `/sitemap.xml`;
- primo Tab sullo skip link;
- nessun overflow orizzontale a 390 px;
- apice `/` ancora servito dal renderer legacy;
- route di pubblicazione ancora assenti;
- typecheck, build, D1, quality gate, Container, `workerd` e tutte le regressioni Control Room verdi.

Esclusioni mantenute:

- nessuna modifica a `apps/web/src/worker.ts`;
- nessun accesso pubblico a D1;
- nessun claim dinamico, provider o prezzo;
- nessuna affiliazione;
- nessuna CMP o analytics;
- nessuna pubblicazione o mutation.

### Checkpoint visuale mobile in produzione

Uno screenshot reale del 23 luglio 2026 attesta che `/astro-foundation` è servita dal dominio pubblico e renderizza correttamente su mobile:

- banner preview non indicizzata;
- brand e controllo `Apri menu`;
- hero e CTA;
- card delle quattro domande;
- percorsi Destinazioni, Guide pratiche e Confronti;
- inizio della sezione Metodo;
- nessun taglio laterale o overflow visibile;
- spaziatura e gerarchia coerenti nella porzione osservata.

Lo screenshot non certifica header HTTP, canonical, sitemap o la parte inferiore non visibile della pagina. Tali contratti restano coperti dalla CI #266; una verifica esterna live di header e desktop rimane aperta. Nessun cutover dell’apice è autorizzato.

## Trust pages Astro preview — PR #61

La seconda slice M5 aggiunge tre route statiche e namespaced:

```text
/astro-foundation/metodo
/astro-foundation/trasparenza
/astro-foundation/privacy
```

Architettura:

```text
PublicLayout
→ PublicHeader / PublicFooter preview-aware
→ TrustPage.astro condiviso
→ contenuto specifico Metodo | Trasparenza | Privacy
```

Caratteristiche verificate dalla CI #271:

- tre route `200` in `workerd`;
- contenuto essenziale presente nel raw HTML;
- nessuna island React e nessuno script richiesto;
- canonical self-reference per ogni route preview;
- meta e header `noindex,nofollow`;
- `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`;
- brand, Metodo e footer mantengono la navigazione dentro `/astro-foundation`;
- Destinazioni, Guide e Confronti continuano a puntare alle route pubbliche legacy;
- `/metodo`, `/trasparenza` e `/privacy` restano servite dal backend legacy;
- tutte le preview restano escluse dalla sitemap;
- desktop, mobile, skip link, `aria-current`, navigazione tra pagine e assenza di overflow verificati;
- typecheck, build, migrazioni D1, quality gate, Container, runtime e tutte le regressioni Control Room verdi.

Il primo run CI #270 ha bloccato una verifica sorgente rimasta legata alla vecchia ownership degli header. Il contratto è stato riallineato a `PublicLayout`; la prova HTTP reale è rimasta invariata e la CI successiva #271 è completamente verde.

Esclusioni mantenute:

- nessuna modifica a `apps/web/src/worker.ts` o al routing dell’apice;
- nessuna sostituzione delle route trust canoniche;
- nessun backend, D1, Workflow, Container o publication state modificato;
- nessuna CMP, GA4, GTM o Search Console;
- affiliazioni ancora disabilitate;
- nessuna mutation Control Room.

La produzione delle tre route preview non è ancora attestata. Il merge e un checkpoint visuale/live restano necessari prima della slice successiva.

## Parità legacy

- PR #49: audit sistematico, merge `e0a39fa9`, CI #209;
- PR #50: claim → task, merge `41a9beee`, CI #213;
- PR #52: audit → versione draft, merge `35f56e82`, CI #220.

La prima mutation migrata è la decisione brief. La legacy resta il fallback per avvio Workflow, conversione brief, operazioni claim, readiness/bundle, generazione e decisione draft e altre azioni non ancora migrate.

## Topic-mismatch gate

La PR #46, merge `215470ae`, è verde in CI #188. La migrazione remota è allineata nello stack; il primo nuovo run autorizzato non è ancora stato osservato funzionalmente.

## Gap aperti

- merge e checkpoint produttivo delle tre trust pages preview;
- verifica live desktop e header/canonical/sitemap del public shell preview;
- verifica browser reale dei due linkage read-only recenti;
- prima decisione reale soltanto quando esisterà un brief `proposed` e sarà autorizzata;
- primo nuovo run per la verifica topic-mismatch;
- health aggregato e log errori unificati;
- refresh automatico delle fonti scadute;
- conversione brief e mutation residue M4;
- candidato homepage Astro e successive slice M5;
- Search Console, CMP e analytics;
- successiva rimozione della legacy soltanto dopo i rispettivi criteri di uscita.

## Prossimo checkpoint

```text
PR #61 trust pages — CI #271 verde
→ merge
→ verifica live /astro-foundation/{metodo,trasparenza,privacy}
→ definizione della slice candidato homepage Astro
```

In parallelo e su branch distinta può procedere la conversione brief. Nessuna capacità successiva viene attivata implicitamente.
