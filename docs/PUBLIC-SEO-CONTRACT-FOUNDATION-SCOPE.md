# Public SEO contract foundation — authorized scope

Date: 2026-07-24

Status: authorized after the production checkpoint of PR #67. This document defines the exclusive scope of the first M5.5 slice. It does not authorize canonical route migration, sitemap ownership migration, indexing, analytics, affiliates or apex cutover.

## Branch

```text
feat/public-seo-contract-foundation
```

The implementation pull request starts as draft because it changes the metadata and structured-data contract shared by the legacy renderer and the Astro preview.

## Objective

Create one typed, server-only SEO document model that can be consumed by both public renderers while their routing policies remain different.

```text
validated published page
→ shared SEO document model
→ legacy canonical renderer OR Astro noindex preview
→ deterministic metadata and structured data
```

The slice proves content parity without transferring canonical route ownership.

## Current gap

The legacy renderer already emits:

- canonical title and meta description;
- canonical URL;
- Open Graph metadata;
- `Article` structured data;
- `FAQPage` structured data when FAQ exists;
- indexable robots policy.

The Astro preview currently emits preview-modified title and description, `og:type=website`, no structured data and a noindex self-canonical URL.

The noindex and self-canonical preview policy is intentional. The content metadata and schema drift is not.

## Shared model

Introduce a typed module, expected at:

```text
src/public-seo.ts
```

The exact name may change, but it must own explicit functions rather than accept arbitrary tags or JSON.

Candidate contracts:

```text
publicHomepageSeo(...)
publicArticleSeo(article, pageUrl)
serializeJsonLd(documents)
```

The article SEO model contains at least:

```text
title
description
ogType = article
Article schema
optional FAQPage schema
```

Route policy remains a renderer concern:

```text
legacy article:
  canonical = /{slug}
  robots = index,follow,max-image-preview:large

Astro preview article:
  canonical = /astro-foundation/articoli/{slug}
  robots = noindex,nofollow
  X-Robots-Tag = noindex,nofollow
  Cache-Control = no-store
```

The Astro banner and namespaced URL continue to identify the preview. Title and description should represent the actual page rather than add preview copy.

## Structured data

The shared article model emits:

```text
Article
FAQPage  # only when FAQ is non-empty
```

`Article` includes only fields already available from the validated public read model, such as:

- headline;
- description;
- dateModified;
- mainEntityOfPage;
- organization author.

No fabricated author, image, review, rating, price or availability field is allowed.

FAQ schema is generated from the same validated FAQ array rendered in the document. The schema must not read draft provenance, excluded claims, reviewer data or evidence bundles.

## Safe JSON-LD serialization

Raw `JSON.stringify()` output must not be inserted into a script element without escaping characters that can terminate or alter the element.

The serializer must:

- produce valid JSON;
- escape `<` at minimum;
- safely handle `</script>` sequences in persisted text;
- preserve Unicode text;
- reject unsupported values rather than stringify functions or arbitrary objects;
- emit only `<script type="application/ld+json">` elements.

No executable inline script is authorized. Existing assertions for zero executable JavaScript remain active; smoke tests may distinguish JSON-LD scripts from executable scripts.

## Astro layout changes

`PublicLayout.astro` may gain typed props such as:

```text
ogType
schema
robots policy
```

Defaults remain conservative:

- `ogType=website` for non-article pages;
- no schema when none is supplied;
- preview response headers applied directly by route/frontmatter as already required.

The layout must not accept raw HTML schema strings from D1 or from callers.

## Homepage parity

The slice may also move the existing canonical `WebSite` schema into the shared model and render the corresponding preview-safe version on `/astro-foundation`.

This is allowed only if it uses the same safe serializer and does not broaden the route scope.

Listing and trust pages do not receive invented schema merely to make every page emit JSON-LD.

## Sitemap, robots and redirect ownership

This first M5.5 slice does not move ownership of:

```text
/sitemap.xml
/robots.txt
/go/{provider}
```

They remain served by the legacy backend router.

The implementation must add regression coverage proving:

- sitemap contains canonical static paths and published canonical articles;
- sitemap excludes every `/astro-foundation` path and every unpublished row;
- robots references the canonical sitemap and preserves existing private/redirect disallows;
- provider redirect still validates an active provider and an HTTPS destination;
- redirect responses remain `no-store` and `noindex`;
- no preview path intercepts provider redirects.

A later M5.5 slice may centralize or migrate ownership only after the shared contract is stable.

## 404 parity

The smoke must verify:

- missing canonical article returns a true 404 from the legacy renderer;
- absent, `review` and `draft` preview slugs return true 404;
- invalid published preview data fails closed without factual article content;
- 404 responses remain noindex;
- file-probe paths do not fall through to article rendering.

No fallback from preview to legacy content is allowed.

## Drift verification

Add a dedicated smoke command, expected as:

```text
npm run smoke:public-seo-contracts
```

It uses isolated D1 state and the real `workerd` path.

For the same published article, compare normalized values rather than whole HTML:

- title;
- meta description;
- Open Graph title, description and type;
- Article headline and description;
- FAQ questions and answers;
- dateModified;
- organization author;
- route-policy-specific canonical and mainEntity URL.

Expected differences are limited to:

```text
canonical URL
mainEntityOfPage URL
robots/indexing policy
preview-only visual banner and navigation
```

Unexpected content drift fails CI.

## Security fixture

The dedicated fixture must include persisted text containing values such as:

```text
</script>
<example>
quotes and apostrophes
Italian accented characters
```

Acceptance requires:

- valid parseable JSON-LD;
- no executable injected element;
- escaped visible HTML text;
- no arbitrary tag or attribute created from database content.

## Required validation

The implementation PR must pass:

- Cloudflare type generation;
- TypeScript and Astro typecheck;
- Astro/Worker build;
- D1 migrations;
- research quality smoke and golden evaluation;
- Container build and health smoke;
- all public runtime smokes;
- the new SEO contract smoke;
- all Control Room suites.

Browser checks cover desktop and mobile metadata-independent rendering, focus and absence of horizontal page overflow.

## Explicit exclusions

This branch does not:

- replace `/`, canonical listings, trust routes or `/{slug}`;
- move `/sitemap.xml` or `/robots.txt` into Astro;
- change provider redirect behavior beyond regression coverage;
- index `/astro-foundation`;
- publish, approve or materialize a page;
- expose `review` or `draft` content;
- add a public JSON API;
- add React to the public site;
- add analytics, CMP, Consent Mode, GTM, GA4 or Search Console configuration;
- activate affiliates, prices, rankings or remunerated links;
- add schema fields unsupported by persisted data;
- remove the legacy renderer;
- authorize catalog pilot or apex cutover.

## Exit gate

```text
shared SEO model implemented
→ safe JSON-LD verified
→ legacy/Astro metadata drift smoke green
→ sitemap/robots/redirect/404 regressions green
→ merge and production preview checkpoint
→ then scope the next M5.5 routing-parity slice
```

A green SEO contract foundation does not make Astro canonical and does not authorize indexing.