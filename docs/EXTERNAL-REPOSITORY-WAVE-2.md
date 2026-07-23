# External repository audit — final wave

Date: 2026-07-23

Status: research checkpoint only. No external code imported. No runtime, backend, data, workflow, affiliate, deployment or publication change.

## Scope

This document covers the final repository wave supplied after the initial audit:

- `StudioPuraLuce/googleai-ppla-campaign-generator`
- `StudioPuraLuce/genai-ppl-kwplan-generator`
- `StudioPuraLuce/ppl-jack-ConversionCommandCenter`
- `StudioPuraLuce/pronto-clone-`
- `StudioPuraLuce/rank-rent-factory`
- `StudioPuraLuce/telegram-ranketogram`
- `StudioPuraLuce/astro-rank-rent`
- `slwklegacy/awesome-programmatic-seo`
- the user-uploaded `client-mgc-reparation-main.zip`
- related predecessor, successor and deployment repositories discovered during verification.

Ahmeego is treated separately in `docs/AHMEEGO-CASE-STUDY.md`.

The real MGC implementation receives a dedicated sanitized audit in `docs/MGC-REAL-CLIENT-AUDIT.md`.

## Access result

### Directly accessible through the authenticated GitHub connector

- `StudioPuraLuce/googleai-ppla-campaign-generator`
- `StudioPuraLuce/genai-ppl-kwplan-generator`
- `StudioPuraLuce/ppl-jack-ConversionCommandCenter`
- `StudioPuraLuce/pronto-clone-`
- `StudioPuraLuce/astro-rank-rent`
- `slwklegacy/awesome-programmatic-seo`

### Supplied as an uploaded archive

- `client-mgc-reparation-main.zip`

The archive was extracted and analyzed locally without reading, displaying, testing or copying credential values.

### Still not visible to the GitHub connector

The user reports that these repositories have been restored, but the authenticated connector still returns `404` and installed-repository search returns no match for the exact names:

- `StudioPuraLuce/rank-rent-factory`
- `StudioPuraLuce/telegram-ranketogram`

They are recorded as an access-perimeter mismatch, not as deleted or nonexistent. No content finding is attributed to them.

### Related repositories analyzed

- `slwklegacy/RankRentFactory`
- `StudioPuraLuce/rr-test-deploy-smoke`
- `StudioPuraLuce/rr-smoke-test-final`
- `StudioPuraLuce/rr-autospurghi-formia`
- `StudioPuraLuce/ppl-garageterrebonne-v1`
- `StudioPuraLuce/ppl-garageterrebonne-v2`
- `StudioPuraLuce/ppl-garageterrebonne-v3`

These are evidence of evolution and deployment. They are not silently substituted for inaccessible exact names.

## 1. `googleai-ppla-campaign-generator`

### What it is

A small React/Vite AI Studio prototype centered on one real local-service client. It generates separate campaign artifacts:

- keywords;
- website structure;
- homepage copy;
- social setup;
- lead forms;
- ManyChat flow;
- client-acquisition sequence;
- full campaign plan.

Generated artifacts are persisted in browser `localStorage`.

### Useful pattern

The decomposition of a broad campaign into explicit artifact types is valuable:

```text
verified business context
→ keyword/intention research
→ information architecture
→ copy draft
→ form/CTA design
→ measurement plan
→ channel adaptation
```

### Problems

- Client identity and business details are hardcoded.
- The prompt assumes Search and Maps capabilities without a repository evidence contract.
- LLM output is presented as an operational deliverable without claim validation.
- Browser persistence is not a system of record.
- No root license was found.

### Decision

`EXTRACT METHOD ONLY`

Do not import code.

## 2. `genai-ppl-kwplan-generator`

### What it is

A React/Vite multilingual planning application using Gemini with Google Search and Maps grounding. It accepts:

- location;
- niche or Google Business Profile URL;
- output language.

It returns a structured JSON plan containing:

- competitor summaries;
- keyword rows;
- domain suggestion;
- ad groups and copy;
- negative keywords;
- revenue and profit projection;
- grounding-source links.

Plans, history, saved items, language and a Maps key are stored in browser `localStorage`.

### Strongest pattern

The application makes three improvements over the earlier campaign generator:

1. explicit JSON structure;
2. captured grounding chunks;
3. separate history and saved-plan states.

Potentially useful research contract:

```text
input
→ grounded discovery
→ structured result
→ source inventory
→ deterministic validator
→ human review
```

### Critical methodological flaw

The prompt asks Search and Maps grounding to produce:

- average monthly search volumes;
- local competition labels;
- top-of-page bid ranges;
- CPC-derived lead pricing;
- revenue and profit projections.

Search and Maps grounding do not constitute Keyword Planner evidence for those values. A syntactically valid JSON result can therefore contain unsupported commercial numbers.

### Other problems

- Model JSON is recovered by taking the first and last braces rather than using a strict response schema.
- No field-level evidence mapping exists.
- Grounding links are attached to the whole plan, not to individual facts.
- Browser-stored API/configuration material is not appropriate for Senza Roaming operations.
- No test or validation script is defined in `package.json`.

### Decision

`ADAPT RESEARCH CONTRACT; REJECT NUMERIC OUTPUT`

Useful only as inspiration for source capture and typed output. Never use its volume, CPC or profit estimates without a primary data provider.

## 3. `ppl-jack-ConversionCommandCenter`

### What it is

A deterministic React/Vite planning tool. It transforms an intake into:

- one or three audience avatars;
- landing-page concepts;
- ad concepts;
- CRM/GHL workflow outlines;
- tracking events;
- launch tasks;
- a short launch calendar.

Most output is produced by local TypeScript functions rather than an LLM.

### Useful pattern

```text
intake
→ audience/intent split
→ message match
→ page plan
→ traffic plan
→ CRM plan
→ tracking plan
→ test checklist
```

### Problems

The deterministic rules create unsupported claims by construction, including guarantees, review volume, certifications, urgency, exclusivity, savings and performance language. It also:

- treats a thank-you page view as the canonical lead conversion;
- assumes one fixed psychology model;
- mixes strategy, copy and implementation truth;
- contains no evidence provenance;
- has no root license.

### Decision

`ADAPT WORK-BREAKDOWN ONLY`

## 4. `pronto-clone-`

### What it is

A single-commit React/Vite visual clone of a broad services marketplace homepage.

It contains:

- header and mobile navigation;
- service search autocomplete;
- category cards;
- “how it works” sections;
- testimonials;
- app-download mock;
- footer.

### What it does not contain

- provider marketplace data;
- request creation;
- matching;
- quotes;
- authentication;
- backend;
- commercial workflow;
- SEO route system;
- tests.

Many controls and links are visual placeholders.

### Decision

`REJECT`

It adds no capability needed by Senza Roaming and risks unnecessary marketplace/product imitation.

## 5. `slwklegacy/RankRentFactory`

### What it is

An early React/Vite mock of a multi-site rank-and-rent dashboard with mock projects, visual preview and Gemini-generated content.

### Problems

- in-memory mock state;
- no grounding contract;
- fallback copy invents authority and years of trust;
- React preview rather than production public rendering;
- no root license.

### Decision

`REJECT AS SUPERSEDED PREDECESSOR`

`rankempire-italia` and `astro-rank-rent` contain the more relevant later work.

## 6. `astro-rank-rent`

### What it is

A real Astro rank-and-rent template connected at build time to a factory API. It is the strongest implementation artifact in this final wave.

Verified capabilities include:

- Astro static generation;
- structured `site.config.json`;
- build-time page retrieval;
- fail-fast missing-content handling;
- Italian slug normalization;
- service × zone route matrix;
- homepage, service, zone, leaf and blog routes;
- canonical and sitemap references;
- schema graph;
- accessible breadcrumbs;
- build-time internal linking;
- route/schema/fetch tests reported green in the implementation commits;
- robots generation and build smoke work.

### Strong patterns

#### Fail-fast build

The route builder refuses to emit a service × zone path when the expected content record is missing. That is substantially better than publishing a fallback or thin page.

#### Pure slug functions

The Italian normalization helper is small, deterministic and suitable for direct unit testing.

#### Pure schema graph

The schema builder separates data construction from rendering and omits unavailable business fields.

#### Build-time interlinking

Sibling services and zones are calculated from configuration rather than injected by an LLM.

### Problems

- Raw HTML remains the content transport contract.
- Sanitization is delegated to an earlier factory phase rather than enforced by the renderer.
- The factory API is a build-time external dependency.
- Content completeness is checked, but evidence and editorial readiness are not.
- The package currently exposes a failing placeholder `test` script despite historical test commits, so repository-head commands and commit history are not fully aligned.
- The configuration and route model target local lead generation, not Senza Roaming's editorial domain.

### Decision

`EXTRACT SMALL PURE PRIMITIVES / TEST IDEAS`

Candidates for an isolated spike:

- slug normalization and fixtures;
- route-matrix fail-fast tests;
- pure schema-graph tests;
- accessible breadcrumb structure;
- deterministic sibling-link tests.

Do not copy the factory API contract or raw HTML pipeline.

## 7. `rr-autospurghi-formia`

### What it proves

The factory produced a real configured Astro output repository.

### Verified weaknesses

- placeholder/failing test command;
- incomplete business identity;
- generated remote HTML inserted with `set:html`;
- promises independent of evidence;
- form posts to a route not found in the output repository;
- honeypot branch can leave the submit state blocked;
- no production result should be inferred from repository size or a configured domain.

### Decision

`USE AS NEGATIVE SMOKE FIXTURE`

## 8. Real MGC Réparation implementation

The uploaded archive corrects the previous conclusion that only the three small landing prototypes were available.

It is a much broader implementation:

- React/Vite SPA;
- 252 sitemap URLs;
- 230 pSEO entries;
- dynamic FAQ and location pages;
- Google Places business data;
- schema and review rendering;
- lead forms and notification paths;
- GTM/dataLayer events;
- Vertex content generation;
- Google Business Profile scripts;
- CRM, GHL, ClickUp and Apps Script material.

The detailed sanitized audit is in `docs/MGC-REAL-CLIENT-AUDIT.md`.

### Strongest value

- real proof of intent/message/follow-up segmentation;
- a concrete generation-to-page pipeline;
- useful negative fixtures for secret handling, PII, consent, schema, claim evidence, 404s and sitemap readiness.

### Critical failures

- credential files and hardcoded browser credentials;
- lead PII sent directly to an embedded third-party webhook;
- PII in thank-you query parameters;
- personal drafts in persistent browser storage;
- GTM before consent;
- fabricated scarcity;
- hardcoded and generated unsupported claims;
- raw generated HTML;
- client-rendered public content;
- homepage fallback for unknown paths;
- sitemap without readiness/evidence gates;
- mock dashboard described as live;
- no canonical production execution path across the several CRM approaches.

### Decision

`ADOPT DISCIPLINE AND FAILURE FIXTURES; REJECT CODE IMPORT`

## 9. `awesome-programmatic-seo`

### What it is

A large curated README of pSEO concepts, tools and claimed case-study numbers.

### Problems

- no root license found;
- one initial commit;
- many headline metrics lack primary citations;
- tool/pricing statements are time-sensitive;
- scale is emphasized more strongly than validation.

### Decision

`PARK AS DISCOVERY INDEX ONLY`

## Final-wave matrix

| Source | Decision | Potential use | Launch priority |
|---|---|---|---|
| PPL Campaign Generator | Extract method only | artifact taxonomy | Low |
| PPL Keyword Plan Generator | Adapt contract | grounded-source capture; no commercial numbers | Low |
| PPL Jack | Adapt planning structure | work breakdown | Low |
| Pronto clone | Reject | none | None |
| RankRentFactory | Reject | superseded prototype | None |
| Astro Rank & Rent | Extract primitives | route/schema/slug test ideas | Medium |
| rr-autospurghi-formia | Negative fixture | build/form/content smoke cases | Medium |
| MGC real implementation | Negative + strategic fixture | security/privacy/SEO/claim regression corpus | High |
| Garage Terrebonne v1–v3 | Historical only | prototype evolution | None |
| awesome-programmatic-seo | Park | discovery names only | None |
| rank-rent-factory exact URL | Connector-unverified | none until visible | None |
| telegram-ranketogram exact URL | Connector-unverified | none until visible | None |

## Effect on Senza Roaming

This wave does not justify a new dependency or architecture change.

It strengthens these decisions:

1. Astro remains the public shell.
2. Public content must exist in raw HTML without client routing.
3. Structured blocks replace raw generated HTML.
4. Every factual claim requires evidence and expiry handling.
5. Sitemaps include only publication-ready and indexable pages.
6. Browser bundles contain no operational secret.
7. Personal data and tokens never appear in URLs.
8. Consent and measurement are designed together.
9. A real 404 is mandatory.
10. Small intent-matched pilots precede programmatic scale.

The final wave primarily reduces risk. It does not change the existing 12–18 working-day launch estimate or add further claimed time savings.

## Explicit exclusions

This checkpoint does not authorize:

- importing external or client code;
- using archived credentials;
- using client or prospect personal data;
- restoring the MGC service;
- generating artificial testimonials, scarcity or guarantees;
- starting paid campaigns;
- activating affiliate links;
- running editorial or Google Business Profile publication workflows;
- changing Senza Roaming backend contracts;
- public deployment or publication.
