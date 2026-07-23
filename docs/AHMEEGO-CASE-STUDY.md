# Ahmeego case study for Senza Roaming

Date: 2026-07-23

Status: external architecture reference only. Ahmeego is not a Senza Roaming dependency.

## Why this case deserves separate treatment

Ahmeego is not a single repository or single AI agent. It is a composed product and distribution system containing:

- an open-source Google Ads agent;
- standalone free tools;
- product documentation;
- a mobile application;
- trust and legal pages;
- educational content;
- service landing pages;
- programmatic local and ecommerce page families;
- a commercial services layer.

The relevant lesson for Senza Roaming is therefore the composition of the ecosystem, not Google Ads functionality itself.

## Source verification

The current Ahmeego site declares the following repositories as public source:

- `itallstartedwithaidea/googleadsagent-site` — web platform;
- `itallstartedwithaidea/googleadsagent-mobile` — mobile application;
- `itallstartedwithaidea/google-ads-api-agent` — Buddy agent;
- `itallstartedwithaidea/google-ai-agent-audit-engine` — audit-engine entry repository;
- `itallstartedwithaidea/analytics-auditor` — marketing analytics auditor;
- `itallstartedwithaidea/writing-agent` — Ghost Writer;
- `itallstartedwithaidea/business-discovery-engine` — business intelligence/prospecting;
- `itallstartedwithaidea/argus` — authenticity analysis;
- related advertising tools and scripts.

The GitHub connector used for this audit could read most component repositories. It returned `404` for `googleadsagent-site` and `googleadsagent-mobile`, despite the live Ahmeego site linking them as public repositories. This is recorded as a connector/indexing limitation. No claim is made that their complete source was inspected through the connector.

The live site, `llms.txt`, component repositories and accessible architecture documents provide enough evidence for a product-architecture case study. Any future code extraction still requires direct file access and a per-repository license check.

## Licensing reality

Public source and open-source licensing are not equivalent.

### Verified permissive components

- `google-ads-api-agent` — MIT source, with separate patent language published by Ahmeego for specific orchestration mechanisms;
- `analytics-auditor` — MIT;
- `writing-agent` — MIT;
- `business-discovery-engine` — MIT;
- `argus` — MIT;
- `ad-creative-mcp` — MIT;
- `open-design` — Apache 2.0, covered in the main external audit.

### Public but proprietary components

- `creative-asset-validator` — repository declares proprietary/all rights reserved;
- `creative-asset-generator` — repository declares proprietary/all rights reserved.

### Requires file-level verification before use

- `googleadsagent-site`;
- `googleadsagent-mobile`;
- any tool whose live app is embedded in the website repository rather than the named component repository.

No Ahmeego branding, visual identity, trademark, generated content library or patent-reserved mechanism is approved for reuse.

## 1. Product architecture: tools as independent entry points

Ahmeego exposes distinct tools for distinct jobs rather than placing every capability behind one dashboard:

- Buddy agent;
- Analytics Auditor;
- 250-Point Audit Engine;
- Google Ads Builder;
- Keyword and Landing Page Analyzer;
- Business Discovery;
- ARGUS;
- Ghost Writer;
- Creative Validator;
- Personalizer.

Each tool can act as:

- an organic landing page;
- a practical demonstration;
- a lead or activation surface;
- documentation for the underlying method;
- a link to source code where licensed.

### Senza Roaming implication

Senza Roaming should not become a generic tool suite before launch. However, one genuinely useful utility can later become a strong product-led SEO surface.

Potential future utilities, ordered by fit:

1. device/eSIM compatibility checker;
2. destination data-need calculator;
3. trip-duration and hotspot requirement selector;
4. provider plan comparison filtered by verified constraints.

These must consume verified Senza Roaming data and must not bypass editorial or evidence gates.

Decision: `ADAPT AFTER CORE PUBLIC LAUNCH`, not during the initial Astro foundation.

## 2. Trust architecture

Ahmeego surrounds products and claims with a visible trust layer:

- about and author identity;
- documentation;
- changelog;
- status;
- pricing and FAQ;
- brand kit;
- copyright and trademark notices;
- AI transparency;
- source-code links;
- `llms.txt` and machine-readable discovery documents.

### Senza Roaming implication

Senza Roaming already has the beginnings of this layer:

- `/metodo`;
- `/trasparenza`;
- `/privacy`;
- source verification dates;
- conditional affiliate disclosure.

The useful adaptation is a small, launch-sized trust spine:

```text
Metodo
Trasparenza e affiliazione
Privacy / CMP
Chi siamo / responsabilità editoriale
Aggiornamenti o changelog essenziale
llms.txt after public information architecture stabilizes
```

A public status page, brand kit or large documentation portal is not launch-critical.

Decision: `ADOPT SMALL TRUST SPINE`.

## 3. Machine-readable identity and content discovery

Ahmeego uses:

- `llms.txt`;
- expanded technical references;
- entity relationships;
- author identifiers;
- schema graphs;
- tool and repository indexes;
- consistent canonical entity naming.

### Senza Roaming implication

A minimal `llms.txt` may be useful after the public routes, canonical URLs and editorial descriptions are stable. It should describe:

- what Senza Roaming is;
- page families;
- editorial methodology;
- affiliate relationship;
- important public routes;
- data freshness rules;
- contact/editorial identity.

It must not expose private Control Room routes, tokens, operational endpoints or internal schemas.

Decision: `PARK FOR LATE M5 OR M6`.

## 4. Human-approved mutation safety

Buddy documents a generic mutation flow:

```text
propose
→ confirm
→ snapshot pre-state
→ execute
→ log
→ monitor outcome
```

This resembles the safety direction already implemented in Senza Roaming:

- explicit transition;
- confirmation dialog;
- server-derived actor;
- state-machine enforcement;
- immutable event log;
- idempotent retry;
- no publication side effect.

### Senza Roaming implication

The generic safety principles reinforce the current architecture. They do not justify importing Buddy or changing backend contracts.

A useful future UI refinement is a deterministic current-vs-proposed preview for each mutation before confirmation, followed by an explicit outcome record.

Patent/trademark notes published by Ahmeego mean Senza Roaming must not reproduce any claimed proprietary orchestration protocol. The project already has an independently developed domain-specific state machine and should continue evolving it from its own requirements.

Decision: `REFERENCE ONLY; CONTINUE INDEPENDENT IMPLEMENTATION`.

## 5. Audit tools as quality gates

Ahmeego's strongest reusable family is not content generation but validation:

- analytics and tag detection;
- GA4/GTM configuration checks;
- consent-mode checks;
- tracking parameter persistence checks;
- page and creative validation;
- exportable machine-readable reports.

### Analytics Auditor

Useful checks for M6 include:

- GTM and GA4 presence;
- Consent Mode v2 defaults and updates;
- key event naming;
- duplicate tag detection;
- pixel/CAPI indicators;
- dataLayer initialization;
- noscript fallback;
- PageSpeed and network evidence;
- JSON/CSV export.

The implementation is a large client-side HTML application with direct browser API access. Senza Roaming should extract test cases and expected evidence, not embed the app or store operational keys in the browser.

Decision: `ADAPT AS CI/SMOKE CHECKLIST`.

### Ad Tracking Diagnostic

Useful patterns:

- simulated attribution parameters;
- hidden-field inspection;
- cross-page persistence verification;
- platform-specific test fixtures.

For Senza Roaming, replace GCLID/CRM assumptions with:

- provider sub-ID;
- page type;
- destination/cluster;
- CTA position;
- outbound `event_id`;
- consent state;
- affiliate network result where available.

Do not copy its default localStorage behavior before the CMP and attribution policy are finalized.

Decision: `ADAPT TEST-HARNESS IDEA IN M6/M8`.

## 6. Creative pre-flight

Ahmeego contains a broad creative platform and a narrower MIT MCP module.

Potential Senza Roaming use:

- image dimension validation;
- social/Open Graph crop checks;
- file-size thresholds;
- format compatibility;
- derivative manifest generation.

This is not needed for the first public Astro pages. The site can begin with a small, manually curated image system and deterministic build checks.

Decision: `PARK UNTIL CONTENT DISTRIBUTION OR PAID MEDIA`.

## 7. Programmatic SEO architecture

Ahmeego declares a very large programmatic surface with:

- local service pages;
- ecommerce pages;
- companion local-guide pages;
- community-insight pages;
- segmented sitemaps;
- IndexNow;
- schema graphs;
- stale-while-revalidate caching;
- cross-linked three-page clusters.

This offers useful technical patterns, but the scale itself is not evidence of successful indexation or conversion.

The most important observed signal is corrective: Ahmeego's changelog reports reducing submitted URLs from roughly two million to roughly thirty-one thousand to improve crawl-budget handling.

### Senza Roaming implication

Senza Roaming should use the inverse launch strategy:

```text
small verified cluster
→ indexation evidence
→ impressions and clicks
→ outbound click quality
→ affiliate outcome
→ expand only after signal
```

The initial target remains a manually reviewed set of high-value pages, not a mass URL deployment.

Decision: `ADOPT SEGMENTATION AND CLUSTERING; REJECT MASS SCALE`.

## 8. Content and service composition

Ahmeego connects three commercial layers:

1. free tools;
2. educational content and documentation;
3. managed services.

Senza Roaming has a different business model, but the composition maps cleanly:

```text
free decision utility
→ destination/guide/comparison content
→ transparent outbound provider choice
→ affiliate conversion
```

The page should solve a decision before asking for a click. The affiliate link is the next action, not the content itself.

Decision: `ADOPT PRODUCT-CONTENT-COMMERCE SEQUENCE`.

## 9. Components that should not enter Senza Roaming

Reject or defer:

- Google Ads account mutation code;
- paid-media sub-agents;
- multi-provider agent orchestration;
- billing/credit system;
- business and email scraping;
- anti-detection browser automation;
- mobile application;
- broad CRM;
- proprietary creative platform;
- Ahmeego branding and design identity;
- millions of location/service pages;
- direct browser storage of operational secrets;
- automatic generation-to-publication pipelines.

## Recommended Senza Roaming adoption plan

### Before public launch

- preserve the current safe Control Room architecture;
- implement public Astro routes;
- migrate canonical/schema/sitemap/robots semantics from the legacy renderer;
- ship the small trust spine;
- define analytics and affiliate event contracts;
- publish only the initial evidence-backed page cluster after explicit authorization.

### Immediately after launch

- run analytics/tag/consent smoke checks based on the auditor matrix;
- add Search Console and indexing observation;
- monitor page and click performance by cluster;
- add `llms.txt` when public routes and descriptions are stable.

### After early signal

- evaluate one eSIM utility;
- add a drift/regression auditor;
- expand clusters only where indexation and user behavior justify it;
- add creative pre-flight only when distribution channels require derivatives.

## Overall decision

Ahmeego is a valuable **reference architecture** for:

- tool-led distribution;
- trust surfaces;
- machine-readable identity;
- validation-first engineering;
- human-approved mutations;
- content-to-commercial sequencing.

It is not a dependency and not a model for launch-scale URL volume.

The strongest lesson is:

> Build several small, inspectable surfaces around one coherent source of truth; do not confuse a large generated footprint with validated demand or revenue.
