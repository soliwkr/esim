# Public article renderer — authorized scope

Date: 2026-07-23

Status: authorized after the production checkpoint of PR #65. This document
defines the exclusive scope of the next M5 slice. It does not authorize canonical
article migration, SEO parity, publication, analytics, affiliates or apex cutover.

## Branch

```text
feat/public-article-renderer
```

The pull request starts as draft because it introduces the first editorial article
renderer in the Astro public frontend and broadens the shared public read model.

## Objective

Render existing `published` article rows through Astro inside the isolated preview
namespace while preserving the canonical legacy article renderer.

```text
D1 published page
→ shared server-only typed read model
→ structured Astro components
→ raw HTML preview
```

The slice proves that a grounded page can be rendered without AI-generated HTML,
without browser access to D1 and without exposing any `review` or `draft` row.

## Preview route

```text
/astro-foundation/articoli/[slug]
```

The explicit `articoli/` segment is required for this slice. It avoids collisions
with:

```text
/astro-foundation
/astro-foundation/destinazioni
/astro-foundation/guide
/astro-foundation/confronti
/astro-foundation/metodo
/astro-foundation/trasparenza
/astro-foundation/privacy
```

The canonical article route remains:

```text
/[slug]
```

and continues to be served by the legacy renderer.

## Route ownership

The custom Worker may delegate the new namespaced route to Astro. It must not:

- intercept canonical `/{slug}` routes;
- change the apex;
- change canonical listing or trust routes;
- add a public JSON API;
- fall back from a missing preview article to a review page or legacy HTML.

A missing, `review`, `draft` or otherwise unpublished slug returns a true 404 from
the preview route.

## Shared server-only read model

Extract the current legacy article query into a typed module shared by the legacy
renderer and Astro. Candidate module:

```text
src/public-article.ts
```

The module owns fixed functions such as:

```text
loadPublishedArticle(DB, slug)
loadRelatedPublishedArticles(DB, cluster, slug, limit)
```

The article query is fixed:

```sql
SELECT
  slug,
  page_type,
  title,
  meta_description,
  eyebrow,
  h1,
  direct_answer,
  intro,
  content_json,
  faq_json,
  source_links_json,
  primary_keyword,
  cluster,
  search_intent,
  source_checked_at,
  updated_at
FROM pages
WHERE slug=? AND status='published'
```

No caller may supply arbitrary SQL clauses, status filters or sort expressions.

Related links use a separate fixed query:

```sql
SELECT slug,page_type,title,meta_description,cluster
FROM pages
WHERE status='published' AND cluster=? AND slug<>?
ORDER BY featured DESC,updated_at DESC,slug ASC
LIMIT ?
```

The limit is bounded by the module. The renderer does not infer relationships from
page titles, keywords or arbitrary JSON.

## Runtime validation

Typescript types alone are not sufficient. The shared module validates:

- non-empty slug and page type;
- title, meta description, eyebrow, h1, direct answer and intro;
- cluster and search intent;
- parseable `content_json`, `faq_json` and `source_links_json`;
- every content block against the allowed union;
- every FAQ against `{ question, answer }`;
- every source against `{ label, url }`;
- dates as strings safe for display;
- related rows against the existing public card contract.

Invalid required article data fails closed. It must not be rendered through
`set:html`, passed to the legacy renderer or silently converted into invented copy.
The preview response for a structurally invalid published row should be an explicit
server error with `no-store` and no factual article body.

## Allowed structured blocks

The renderer accepts only the existing `ContentBlock` union:

```text
paragraph
heading
bullets
steps
table
callout
```

Each type is rendered by an Astro component or an explicit component branch.
Editorial content must never use:

- `set:html`;
- `innerHTML`;
- raw HTML stored in D1;
- markdown converted without a strict schema;
- arbitrary tag names or attributes from the database.

Expected component boundary:

```text
PublicArticlePage.astro
PublicArticleBlocks.astro
PublicArticleFaq.astro
PublicArticleSources.astro
PublicRelatedArticles.astro
```

Names may change if the final structure remains equally explicit and testable.

## Article composition

The raw HTML preview includes, in order:

1. preview breadcrumb inside `/astro-foundation`;
2. article type/cluster and verification metadata;
3. eyebrow and h1;
4. intro;
5. direct answer;
6. transparency/disclosure copy appropriate to disabled affiliate mode;
7. structured content blocks;
8. FAQ when present;
9. public provenance and sources;
10. deterministic related articles.

The page must remain useful with JavaScript disabled. No React island is allowed.

## Public provenance boundary

The public `pages` row currently exposes page-level provenance through:

```text
source_links_json
source_checked_at
updated_at
```

This slice may render a public provenance panel containing:

- the date sources were checked when present;
- the page update date when present;
- only the valid HTTPS sources persisted with the published page;
- clear wording that provider documents are official declarations, not independent
  field tests;
- structured limitation callouts already present in `content_json`.

This slice must not expose:

- internal claim IDs;
- `editorial_review_draft_field_claims` rows;
- evidence bundle payloads;
- excluded-claim IDs;
- reviewer identities or notes;
- maintenance queue data;
- internal generation rules, response IDs or usage payloads.

Field-level public provenance is not invented. If a future publication-lineage
contract makes it safely available, it requires a separate explicit scope.

## Sources

Only `https:` URLs are rendered as links. Invalid, empty or non-HTTPS sources are
omitted from the link list and never copied into an `href`.

Source labels are escaped as text. Links use at least:

```text
rel="noopener noreferrer"
```

The absence of a valid source list does not authorize invented citations.

## Claim and limitation guardrails

The renderer consumes the materialized `published` page. It does not recalculate
claim validity, readiness or publication eligibility.

It must preserve these distinctions:

```text
provider declaration ≠ independent test
review-draft eligibility ≠ publication eligibility
approved draft ≠ published page
excluded claim ≠ factual page copy
```

Callout blocks such as “Cosa non è dimostrato”, source conflicts and evidence
limitations are rendered as limitations, not promoted into affirmative claims.

The renderer must not read an excluded claim and must not synthesize facts from
briefs, draft metadata or related pages.

## Related links

Related articles are:

- `published` only;
- from the exact same persisted cluster;
- never the current slug;
- ordered by `featured DESC`, `updated_at DESC`, then `slug ASC`;
- bounded to a small fixed limit;
- linked to namespaced article preview routes inside this preview slice.

No recommendation score, provider ranking or semantic inference is introduced.

## Preview navigation changes allowed

Inside this branch only, public preview cards may move from canonical legacy
article URLs to:

```text
/astro-foundation/articoli/{slug}
```

This applies to:

- homepage candidate cards;
- Destinazioni preview cards;
- Guide preview cards;
- Confronti preview cards;
- related article links in the article preview.

The shared legacy card renderer must continue to emit canonical `/{slug}` links.
The implementation should use an explicit link-builder option rather than string
replacement after rendering.

## Metadata and response isolation

Every article preview is:

- `noindex,nofollow` in document metadata;
- `X-Robots-Tag: noindex, nofollow`;
- `Cache-Control: no-store`;
- outside `/sitemap.xml`;
- canonical to its own namespaced preview URL for the preview phase;
- raw HTML without Astro islands or required client scripts.

The route frontmatter applies the shared preview response helper directly. Layout
side effects alone are not considered sufficient after the CI #288 finding.

Schema parity, canonical cutover and sitemap migration belong to M5.5 and are not
part of this branch.

## Styling and accessibility

Add isolated public article styles, for example:

```text
apps/web/src/styles/public-article.css
```

Requirements:

- readable measure and hierarchy on wide screens;
- no horizontal page overflow;
- table wrapper with horizontal scrolling limited to the table region;
- visible keyboard focus;
- semantic headings with one h1;
- lists rendered as lists;
- FAQ rendered with native `details` and `summary`;
- source links distinguishable from body text;
- related cards usable by keyboard;
- layout remains coherent at narrow, mobile and desktop widths;
- reduced-motion preferences preserved where motion exists.

## Dedicated smoke

Add:

```text
npm run smoke:public-article-renderer
```

The smoke uses isolated temporary D1 state and a real `workerd`/Chromium path.

Minimum fixtures:

1. one complete `published` article containing every allowed block type;
2. one `review` row with a known slug;
3. one `draft` row with a known slug;
4. one related `published` row in the same cluster;
5. one published row in another cluster;
6. one non-HTTPS source mixed with valid HTTPS sources;
7. one structurally invalid published row;
8. one absent slug.

## Acceptance checks

The dedicated smoke verifies:

- published article route returns 200;
- review, draft and absent slugs return true 404;
- structurally invalid published data fails closed without article facts;
- metadata, preview canonical and response headers;
- sitemap excludes all preview article URLs;
- canonical legacy article still resolves through the legacy renderer;
- all required article fields render as escaped text;
- every allowed block type renders semantically;
- no raw HTML injection path exists;
- FAQ uses native details/summary;
- only HTTPS sources become links;
- page-level provenance dates render when present;
- related links are exact-cluster, published-only, deterministic and namespaced;
- preview homepage/listing cards use preview article links;
- legacy homepage/listing cards keep canonical links;
- zero Astro islands and zero required scripts;
- desktop and mobile layouts;
- table-region overflow without page overflow;
- keyboard navigation and visible focus;
- all D1 migrations, quality gates, Container, runtime and Control Room suites remain
  green;
- no publication route or mutation is introduced.

## Explicit exclusions

This branch does not:

- replace `/{slug}`;
- change `/`, `/destinazioni`, `/guide` or `/confronti`;
- render `review` or `draft` pages;
- expose a draft preview publicly;
- read evidence bundles in the browser;
- expose claim IDs or reviewer data;
- change D1 schema or application data;
- approve, materialize or publish a page;
- add a publication endpoint or button;
- add React to the public site;
- activate provider ranking, prices or affiliate links;
- add CMP, GTM, GA4, Search Console or service-account configuration;
- add production Article/FAQ schema parity;
- migrate sitemap or robots ownership;
- remove the legacy renderer;
- authorize apex cutover.

## Exit gate

```text
implementation PR green
→ merge and automatic deploy
→ verify one real published article preview on desktop and mobile
→ verify listing/home preview navigation reaches the namespaced article
→ only then authorize M5.5 SEO parity
```

A successful article preview does not make the Astro frontend canonical.
