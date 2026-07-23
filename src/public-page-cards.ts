import type { PageCard } from './types';

export type PublicListingType = 'destination' | 'guide' | 'comparison';

export type PublicHomepageCards = {
  featured: PageCard[];
  destinations: PageCard[];
};

const PAGE_CARD_FIELDS = 'slug,page_type,title,meta_description,cluster';
const PUBLIC_PAGE_TYPES = new Set(['destination', 'guide', 'comparison', 'provider']);

function positiveLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
    throw new RangeError(`Invalid public page-card limit: ${limit}`);
  }
  return limit;
}

export function parsePublicPageCard(value: unknown): PageCard {
  if (!value || typeof value !== 'object') {
    throw new TypeError('Public page-card row must be an object.');
  }

  const row = value as Record<string, unknown>;
  for (const key of ['slug', 'page_type', 'title', 'meta_description', 'cluster'] as const) {
    if (typeof row[key] !== 'string' || row[key].trim() === '') {
      throw new TypeError(`Public page-card row has an invalid ${key}.`);
    }
  }

  if (!PUBLIC_PAGE_TYPES.has(row.page_type as string)) {
    throw new TypeError(`Public page-card row has an unsupported page_type: ${String(row.page_type)}`);
  }

  return {
    slug: row.slug as string,
    page_type: row.page_type as string,
    title: row.title as string,
    meta_description: row.meta_description as string,
    cluster: row.cluster as string,
  };
}

async function queryPageCards(
  db: D1Database,
  sql: string,
  bindings: Array<string | number>,
): Promise<PageCard[]> {
  const result = await db.prepare(sql).bind(...bindings).all<unknown>();
  return result.results.map(parsePublicPageCard);
}

export async function loadPublishedFeaturedCards(
  db: D1Database,
  limit = 9,
): Promise<PageCard[]> {
  return queryPageCards(
    db,
    `SELECT ${PAGE_CARD_FIELDS}
       FROM pages
      WHERE status='published' AND featured=1
      ORDER BY featured DESC, updated_at DESC
      LIMIT ?`,
    [positiveLimit(limit)],
  );
}

export async function loadPublishedListingCards(
  db: D1Database,
  type: PublicListingType,
  limit = 100,
): Promise<PageCard[]> {
  return queryPageCards(
    db,
    `SELECT ${PAGE_CARD_FIELDS}
       FROM pages
      WHERE status='published' AND page_type=?
      ORDER BY featured DESC, updated_at DESC
      LIMIT ?`,
    [type, positiveLimit(limit)],
  );
}

export async function loadPublicHomepageCards(db: D1Database): Promise<PublicHomepageCards> {
  const [featured, destinations] = await Promise.all([
    loadPublishedFeaturedCards(db, 9),
    loadPublishedListingCards(db, 'destination', 6),
  ]);
  return { featured, destinations };
}
