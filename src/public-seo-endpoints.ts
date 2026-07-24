import {
  PUBLIC_CANONICAL_STATIC_PATHS,
  publicArticleSlugCandidate,
} from './public-route-policy';

export type PublicSitemapEntry = Readonly<{
  loc: string;
  lastmod?: string;
}>;

const PUBLIC_SITEMAP_MAX_URLS = 50_000;
const PUBLIC_SITEMAP_DYNAMIC_LIMIT = PUBLIC_SITEMAP_MAX_URLS - PUBLIC_CANONICAL_STATIC_PATHS.length;
const XML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

function recordValue(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${context} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function nonEmptyText(value: unknown, context: string, maxLength: number): string {
  if (typeof value !== 'string') throw new TypeError(`${context} must be a string.`);
  const text = value.trim();
  if (!text || text.length > maxLength) throw new TypeError(`${context} is invalid.`);
  return text;
}

export function canonicalPublicSiteBase(value: string): string {
  const text = nonEmptyText(value, 'Canonical site base', 2_000);
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new TypeError('Canonical site base must be an absolute URL.');
  }
  if (url.protocol !== 'https:') throw new TypeError('Canonical site base must use HTTPS.');
  if (url.username || url.password || url.search || url.hash) {
    throw new TypeError('Canonical site base cannot contain credentials, query or fragment.');
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new TypeError('Canonical site base must point to the origin root.');
  }
  return url.origin;
}

function validCalendarDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function publicSitemapLastmod(value: unknown): string {
  const text = nonEmptyText(value, 'Sitemap updated_at', 80);
  const date = text.slice(0, 10);
  if (!validCalendarDate(date)) throw new TypeError('Sitemap updated_at has an invalid date.');

  const sqliteTimestamp = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
  const isoTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateOnly.test(text) && !sqliteTimestamp.test(text) && !isoTimestamp.test(text)) {
    throw new TypeError('Sitemap updated_at has an unsupported format.');
  }

  const normalized = sqliteTimestamp.test(text)
    ? `${text.replace(' ', 'T')}Z`
    : isoTimestamp.test(text) && !/(?:Z|[+-]\d{2}:\d{2})$/.test(text)
      ? `${text}Z`
      : text;
  if (!Number.isFinite(Date.parse(normalized))) {
    throw new TypeError('Sitemap updated_at is not parseable.');
  }
  return date;
}

export function escapePublicXml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => XML_ESCAPE_MAP[character] ?? character);
}

function absolutePublicUrl(base: string, pathname: string): string {
  if (!pathname.startsWith('/') || pathname.includes('?') || pathname.includes('#')) {
    throw new TypeError(`Invalid sitemap pathname: ${pathname}`);
  }
  const url = new URL(pathname, `${base}/`);
  if (url.origin !== base || url.protocol !== 'https:') {
    throw new TypeError(`Sitemap URL escaped the canonical origin: ${pathname}`);
  }
  return url.toString();
}

function parsePublishedSitemapRow(value: unknown, base: string, index: number): PublicSitemapEntry {
  const row = recordValue(value, `Published sitemap row ${index}`);
  const slug = nonEmptyText(row.slug, `Published sitemap row ${index}.slug`, 180);
  if (publicArticleSlugCandidate(`/${slug}`) !== slug) {
    throw new TypeError(`Published sitemap row ${index} has an invalid or reserved slug.`);
  }
  return Object.freeze({
    loc: absolutePublicUrl(base, `/${slug}`),
    lastmod: publicSitemapLastmod(row.updated_at),
  });
}

export async function loadPublicSitemapEntries(
  db: D1Database,
  canonicalSiteUrl: string,
): Promise<readonly PublicSitemapEntry[]> {
  const base = canonicalPublicSiteBase(canonicalSiteUrl);
  const staticEntries = PUBLIC_CANONICAL_STATIC_PATHS.map((pathname) => Object.freeze({
    loc: absolutePublicUrl(base, pathname),
  }));
  const result = await db.prepare(`
    SELECT slug, updated_at
    FROM pages
    WHERE status='published'
    ORDER BY slug ASC
    LIMIT ?
  `).bind(PUBLIC_SITEMAP_DYNAMIC_LIMIT + 1).all<unknown>();

  if (result.results.length > PUBLIC_SITEMAP_DYNAMIC_LIMIT) {
    throw new RangeError('Published sitemap exceeds the single-document URL limit.');
  }

  const dynamicEntries = result.results.map((row, index) => parsePublishedSitemapRow(row, base, index));
  const locations = new Set<string>();
  for (const entry of [...staticEntries, ...dynamicEntries]) {
    if (locations.has(entry.loc)) throw new TypeError(`Duplicate sitemap URL: ${entry.loc}`);
    locations.add(entry.loc);
  }
  return Object.freeze([...staticEntries, ...dynamicEntries]);
}

export function serializePublicSitemap(entries: readonly PublicSitemapEntry[]): string {
  if (entries.length > PUBLIC_SITEMAP_MAX_URLS) {
    throw new RangeError('Sitemap exceeds the single-document URL limit.');
  }
  const urls = entries.map((entry, index) => {
    const loc = nonEmptyText(entry.loc, `Sitemap entry ${index}.loc`, 2_000);
    let url: URL;
    try {
      url = new URL(loc);
    } catch {
      throw new TypeError(`Sitemap entry ${index}.loc must be absolute.`);
    }
    if (url.protocol !== 'https:' || url.search || url.hash) {
      throw new TypeError(`Sitemap entry ${index}.loc must be a canonical HTTPS URL.`);
    }
    const lastmod = entry.lastmod === undefined
      ? ''
      : `<lastmod>${escapePublicXml(publicSitemapLastmod(entry.lastmod))}</lastmod>`;
    return `<url><loc>${escapePublicXml(url.toString())}</loc>${lastmod}</url>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

function publicSeoEndpointError(error: unknown): Response {
  console.error('Public SEO endpoint generation failed.', error);
  return new Response('Errore interno', {
    status: 500,
    headers: {
      'content-type': 'text/plain;charset=UTF-8',
      'cache-control': 'no-store',
    },
  });
}

export async function publicSitemapResponse(
  db: D1Database,
  canonicalSiteUrl: string,
): Promise<Response> {
  try {
    const entries = await loadPublicSitemapEntries(db, canonicalSiteUrl);
    return new Response(serializePublicSitemap(entries), {
      headers: {
        'content-type': 'application/xml;charset=UTF-8',
        'cache-control': 'public,max-age=3600',
      },
    });
  } catch (error) {
    return publicSeoEndpointError(error);
  }
}

export function publicRobotsDocument(canonicalSiteUrl: string): string {
  const base = canonicalPublicSiteBase(canonicalSiteUrl);
  return `User-agent: *\nAllow: /\nDisallow: /go/\nDisallow: /control-room\nDisallow: /api/maintenance/\nSitemap: ${base}/sitemap.xml\n`;
}

export function publicRobotsResponse(canonicalSiteUrl: string): Response {
  try {
    return new Response(publicRobotsDocument(canonicalSiteUrl), {
      headers: {
        'content-type': 'text/plain;charset=UTF-8',
        'cache-control': 'public,max-age=3600',
      },
    });
  } catch (error) {
    return publicSeoEndpointError(error);
  }
}
