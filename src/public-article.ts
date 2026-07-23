import type { ContentBlock, FaqItem, PageCard } from './types';
import { parsePublicPageCard } from './public-page-cards';

export type PublicArticleSource = {
  label: string;
  url: string;
};

export type PublicArticle = {
  slug: string;
  page_type: 'destination' | 'guide' | 'comparison' | 'provider';
  title: string;
  meta_description: string;
  eyebrow: string;
  h1: string;
  direct_answer: string;
  intro: string;
  primary_keyword: string;
  cluster: string;
  search_intent: string;
  source_checked_at: string | null;
  updated_at: string;
  content: ContentBlock[];
  faq: FaqItem[];
  sources: PublicArticleSource[];
};

export type PublicArticleLoadResult =
  | { kind: 'found'; article: PublicArticle }
  | { kind: 'missing' }
  | { kind: 'invalid'; reason: string };

const PUBLIC_PAGE_TYPES = new Set(['destination', 'guide', 'comparison', 'provider']);
const ARTICLE_FIELDS = `
  slug,page_type,title,meta_description,eyebrow,h1,direct_answer,intro,
  content_json,faq_json,source_links_json,primary_keyword,cluster,search_intent,
  source_checked_at,updated_at
`;

function objectValue(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${context} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function textValue(value: unknown, context: string, maxLength = 10_000): string {
  if (typeof value !== 'string') throw new TypeError(`${context} must be a string.`);
  const text = value.trim();
  if (!text || text.length > maxLength) throw new TypeError(`${context} is invalid.`);
  return text;
}

function stringArray(value: unknown, context: string, maxItems = 100): string[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new TypeError(`${context} must be a bounded array.`);
  }
  return value.map((item, index) => textValue(item, `${context}[${index}]`, 4_000));
}

function jsonArray(value: unknown, context: string): unknown[] {
  if (typeof value !== 'string') throw new TypeError(`${context} must be JSON text.`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new TypeError(`${context} is not valid JSON.`);
  }
  if (!Array.isArray(parsed)) throw new TypeError(`${context} must contain an array.`);
  return parsed;
}

function parseContentBlock(value: unknown, index: number): ContentBlock {
  const block = objectValue(value, `content[${index}]`);
  const type = textValue(block.type, `content[${index}].type`, 40);

  if (type === 'paragraph' || type === 'heading') {
    return { type, text: textValue(block.text, `content[${index}].text`, 12_000) };
  }
  if (type === 'bullets' || type === 'steps') {
    return { type, items: stringArray(block.items, `content[${index}].items`, 100) };
  }
  if (type === 'table') {
    const headers = stringArray(block.headers, `content[${index}].headers`, 20);
    if (!headers.length) throw new TypeError(`content[${index}].headers cannot be empty.`);
    if (!Array.isArray(block.rows) || block.rows.length > 100) {
      throw new TypeError(`content[${index}].rows must be a bounded array.`);
    }
    const rows = block.rows.map((row, rowIndex) => {
      const cells = stringArray(row, `content[${index}].rows[${rowIndex}]`, 20);
      if (cells.length !== headers.length) {
        throw new TypeError(`content[${index}].rows[${rowIndex}] has the wrong width.`);
      }
      return cells;
    });
    return { type, headers, rows };
  }
  if (type === 'callout') {
    return {
      type,
      title: textValue(block.title, `content[${index}].title`, 300),
      text: textValue(block.text, `content[${index}].text`, 8_000),
    };
  }

  throw new TypeError(`content[${index}] has unsupported type ${type}.`);
}

function parseFaqItem(value: unknown, index: number): FaqItem {
  const item = objectValue(value, `faq[${index}]`);
  return {
    question: textValue(item.question, `faq[${index}].question`, 500),
    answer: textValue(item.answer, `faq[${index}].answer`, 8_000),
  };
}

function parseSource(value: unknown, index: number): PublicArticleSource | null {
  const source = objectValue(value, `sources[${index}]`);
  const label = textValue(source.label, `sources[${index}].label`, 500);
  const rawUrl = textValue(source.url, `sources[${index}].url`, 2_000);
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  return { label, url: url.toString() };
}

function normalizedDate(value: unknown, context: string, required: boolean): string | null {
  if (value === null || value === undefined || value === '') {
    if (required) throw new TypeError(`${context} is required.`);
    return null;
  }
  const text = textValue(value, context, 80);
  const isoLike = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)
    ? `${text.replace(' ', 'T')}Z`
    : text;
  if (!Number.isFinite(Date.parse(isoLike))) throw new TypeError(`${context} is not a date.`);
  return text;
}

function parseArticleRow(value: unknown): PublicArticle {
  const row = objectValue(value, 'Public article row');
  const pageType = textValue(row.page_type, 'page_type', 40);
  if (!PUBLIC_PAGE_TYPES.has(pageType)) {
    throw new TypeError(`Unsupported public article page_type: ${pageType}`);
  }

  const content = jsonArray(row.content_json, 'content_json').map(parseContentBlock);
  const faq = jsonArray(row.faq_json, 'faq_json').map(parseFaqItem);
  const sources = jsonArray(row.source_links_json, 'source_links_json')
    .map(parseSource)
    .filter((source): source is PublicArticleSource => source !== null);

  return {
    slug: textValue(row.slug, 'slug', 180),
    page_type: pageType as PublicArticle['page_type'],
    title: textValue(row.title, 'title', 300),
    meta_description: textValue(row.meta_description, 'meta_description', 500),
    eyebrow: textValue(row.eyebrow, 'eyebrow', 180),
    h1: textValue(row.h1, 'h1', 300),
    direct_answer: textValue(row.direct_answer, 'direct_answer', 12_000),
    intro: textValue(row.intro, 'intro', 12_000),
    primary_keyword: textValue(row.primary_keyword, 'primary_keyword', 300),
    cluster: textValue(row.cluster, 'cluster', 300),
    search_intent: textValue(row.search_intent, 'search_intent', 120),
    source_checked_at: normalizedDate(row.source_checked_at, 'source_checked_at', false),
    updated_at: normalizedDate(row.updated_at, 'updated_at', true) as string,
    content,
    faq,
    sources,
  };
}

function positiveRelatedLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit <= 0 || limit > 12) {
    throw new RangeError(`Invalid related article limit: ${limit}`);
  }
  return limit;
}

export function publicArticlePreviewPath(slug: string): string {
  const safeSlug = textValue(slug, 'article preview slug', 180);
  return `/astro-foundation/articoli/${encodeURIComponent(safeSlug)}`;
}

export async function loadPublishedArticle(
  db: D1Database,
  slug: string,
): Promise<PublicArticleLoadResult> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug || normalizedSlug.length > 180) return { kind: 'missing' };

  const row = await db.prepare(`
    SELECT ${ARTICLE_FIELDS}
    FROM pages
    WHERE slug=? AND status='published'
  `).bind(normalizedSlug).first<unknown>();

  if (!row) return { kind: 'missing' };
  try {
    return { kind: 'found', article: parseArticleRow(row) };
  } catch (error) {
    return {
      kind: 'invalid',
      reason: error instanceof Error ? error.message : 'Invalid published article row.',
    };
  }
}

export async function loadRelatedPublishedArticles(
  db: D1Database,
  cluster: string,
  slug: string,
  limit = 5,
): Promise<PageCard[]> {
  const safeCluster = textValue(cluster, 'related cluster', 300);
  const safeSlug = textValue(slug, 'related slug', 180);
  const result = await db.prepare(`
    SELECT slug,page_type,title,meta_description,cluster
    FROM pages
    WHERE status='published' AND cluster=? AND slug<>?
    ORDER BY featured DESC,updated_at DESC,slug ASC
    LIMIT ?
  `).bind(safeCluster, safeSlug, positiveRelatedLimit(limit)).all<unknown>();
  return result.results.map(parsePublicPageCard);
}
