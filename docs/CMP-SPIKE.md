# CMP comparative spike

Data: **25 luglio 2026**.

## Obiettivo

Selezionare una Consent Management Platform per il sito Astro pubblico di Senza Roaming, evitando un banner custom e mantenendo Google Tag Manager e Google Analytics completamente bloccati prima del consenso analytics.

## Vincoli

- pubblico principalmente italiano ed europeo;
- Google Consent Mode v2;
- modalità iniziale Basic, senza cookieless pings;
- nessun Google Ads;
- nessuna affiliazione attiva;
- Astro SSR su Cloudflare;
- CMP caricata prima di ogni tag non essenziale;
- nessuna CMP nella Control Room o nella preview;
- accessibilità mobile e tastiera;
- revoca del consenso dal footer;
- configurazione e policy verificabili;
- nessun secret nel browser o nel repository.

## Fonti primarie consultate

- Google Analytics Help — Set up consent mode;
- Google Analytics Help — About consent mode;
- Google Analytics Help — Verify consent mode implementation;
- Google Analytics Help — Tag Manager consent mode support;
- documentazione ufficiale dei provider valutati.

Google elenca iubenda, CookieYes e consentmanager tra le CMP con documentazione di configurazione per Consent Mode.

## Candidati

### 1. iubenda

Punti forti:

- CMP certificata/partner Google;
- supporto Consent Mode v2;
- Basic Mode tramite blocco completo dei servizi Google fino al consenso;
- installazione diretta nel `<head>` o template GTM;
- lingua e documentazione italiana;
- gestione integrata di privacy/cookie policy;
- prova del consenso;
- configurazione adatta a un sito italiano senza CMS.

Rischi e verifiche necessarie:

- dipendenza SaaS;
- personalizzazione completa legata al piano scelto;
- impatto prestazionale da misurare;
- autoblocking da verificare con Astro, non soltanto con CMS/WordPress;
- configurazione del banner e delle policy richiede un account esterno.

### 2. CookieYes

Punti forti:

- supporto Consent Mode v2 e Google Tag Manager;
- autoblocking;
- onboarding semplice;
- piano iniziale con soglie di pageview;
- interfaccia orientata al cookie scanning.

Rischi e verifiche necessarie:

- limiti per pageview, scansioni, staging e funzionalità cambiano per piano;
- minore integrazione con il testo legale italiano rispetto al candidato principale;
- comportamento esatto Basic Mode da provare sull’implementazione Astro;
- gestione di più ambienti può richiedere un piano superiore.

### 3. consentmanager

Punti forti:

- supporto Google Consent Mode;
- template GTM e Consent Initialization;
- opzioni avanzate per regioni, TCF e configurazioni enterprise;
- forte capacità di test e personalizzazione.

Rischi e verifiche necessarie:

- complessità superiore alle necessità iniziali;
- maggiore rischio di configurazione eccessiva;
- flusso centrato su GTM meno adatto al requisito iniziale “nessun GTM prima del consenso”;
- costo e gestione da verificare per il volume reale.

## Valutazione

Scala:

```text
1 = debole
3 = adeguato
5 = forte
```

| Criterio | iubenda | CookieYes | consentmanager |
|---|---:|---:|---:|
| Supporto Google Consent Mode | 5 | 5 | 5 |
| Basic Mode / blocco completo | 5 | 4 | 4 |
| Localizzazione e policy italiane | 5 | 3 | 3 |
| Integrazione diretta Astro | 4 | 4 | 3 |
| Semplicità operativa | 4 | 5 | 2 |
| Revoca e prova consenso | 5 | 4 | 5 |
| Flessibilità futura | 5 | 4 | 5 |
| Rischio di overconfiguration | 4 | 4 | 2 |
| Totale indicativo | 37 | 33 | 29 |

Il punteggio non è una certificazione legale e non sostituisce il test reale.

## Decisione dello spike

**Candidato principale: iubenda.**

Motivazione:

- il progetto è italiano;
- la fase iniziale richiede Basic Consent Mode;
- iubenda documenta il blocco completo dei servizi Google fino al consenso come configurazione iniziale più restrittiva;
- consente integrazione diretta prima di GTM;
- può coprire banner, gestione consenso e aggiornamento della pagina Privacy nello stesso ecosistema;
- riduce la quantità di codice custom che il progetto dovrebbe mantenere.

CookieYes resta il fallback preferito se il test iubenda fallisce su performance, accessibilità, configurazione Astro o condizioni commerciali.

consentmanager resta fuori dalla prima implementazione perché offre una complessità non necessaria per un sito analytics-only senza Ads.

## Metodo di integrazione proposto

```text
PublicLayout canonical
→ script CMP iubenda come primo script eseguibile nel head
→ Basic Consent Mode / Google services bloccati
→ consenso analytics
→ caricamento GTM
→ GA4
```

Non usare inizialmente il template CMP dentro GTM: GTM stesso deve rimanere assente prima del consenso.

## Configurazione repository proposta

Variabili pubbliche non segrete:

```text
CMP_PROVIDER=iubenda
CMP_SITE_ID=
CMP_COOKIE_POLICY_ID=
GTM_ID=
GA4_MEASUREMENT_ID=
```

I valori identificativi pubblici possono essere configurati come variabili Cloudflare, ma non devono essere hardcoded nei componenti. Chiavi API, credenziali di service account e token non entrano nel browser o nel repository.

## Spike tecnico autorizzabile

Branch:

```text
spike/iubenda-consent-foundation
```

Scope:

- adapter server-only che valida la configurazione pubblica CMP;
- inclusione soltanto sulle route canonical 200;
- nessun GTM o GA4;
- banner italiano;
- accetta, rifiuta e personalizza;
- link footer per riaprire le preferenze;
- aggiornamento Privacy coerente;
- test assenza CMP in preview, Control Room, API, redirect, sitemap, robots e 404;
- test desktop, mobile e tastiera;
- misura del peso e delle richieste di rete;
- rollback rimuovendo soltanto adapter/configurazione CMP.

## Gate prima dell’implementazione definitiva

Lo spike passa soltanto se:

- nessuna richiesta Google avviene prima del consenso;
- la CMP viene caricata una sola volta;
- il rifiuto non carica GTM o GA4;
- la scelta viene persistita e può essere revocata;
- la UI è utilizzabile da tastiera e mobile;
- la pagina resta leggibile con script bloccati o CMP indisponibile;
- il sito pubblico non acquisisce React;
- preview e Control Room restano totalmente escluse;
- la privacy page riflette il comportamento reale;
- la performance resta accettabile rispetto al baseline M5.7.

## Stato

```text
vendor selezionato per spike: iubenda
vendor finale: pendente fino al test tecnico
tracking attivo: no
GTM attivo: no
GA4 attivo: no
Consent Mode attivo: no
```
