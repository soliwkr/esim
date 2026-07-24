import type { PublicArticle } from './public-article';

export type PublicOpenGraphType = 'website' | 'article';
export type PublicJsonLdPrimitive = string | number | boolean | null;
export type PublicJsonLdValue =
  | PublicJsonLdPrimitive
  | PublicJsonLdValue[]
  | { [key: string]: PublicJsonLdValue };
export type PublicJsonLdDocument = { [key: string]: PublicJsonLdValue };

export type PublicSeoDocument = {
  title: string;
  description: string;
  ogType: PublicOpenGraphType;
  schema: PublicJsonLdDocument[];
};

function requiredText(value: string, context: string, maxLength = 500): string {
  const text = value.trim();
  if (!text || text.length > maxLength) throw new TypeError(`${context} is invalid.`);
  return text;
}

function absolutePageUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError('Public SEO page URL must be absolute.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new TypeError('Public SEO page URL must use HTTP or HTTPS.');
  }
  return url.toString();
}

function isoDate(value: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(' ', 'T')}Z`
    : value;
  const timestamp = Date.parse(normalized);
  if (!Number.isFinite(timestamp)) throw new TypeError('Public SEO date is invalid.');
  return new Date(timestamp).toISOString();
}

function assertJsonValue(value: unknown, context: string, depth = 0): asserts value is PublicJsonLdValue {
  if (depth > 40) throw new TypeError(`${context} exceeds the JSON-LD depth limit.`);
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`${context} contains a non-finite number.`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonValue(item, `${context}[${index}]`, depth + 1));
    return;
  }
  if (typeof value !== 'object') throw new TypeError(`${context} contains a non-JSON value.`);

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${context} must contain plain JSON objects.`);
  }
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (!key) throw new TypeError(`${context} contains an empty property name.`);
    assertJsonValue(item, `${context}.${key}`, depth + 1);
  }
}

export function serializeJsonLd(
  documents: PublicJsonLdDocument | PublicJsonLdDocument[],
): string {
  assertJsonValue(documents, 'JSON-LD');
  const json = JSON.stringify(documents);
  return json
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function publicHomepageSeo(siteName: string, pageUrl: string): PublicSeoDocument {
  const name = requiredText(siteName, 'siteName', 180);
  const url = absolutePageUrl(pageUrl);
  const title = `eSIM da viaggio: guide e confronti | ${name}`;
  const description = 'Confronta eSIM da viaggio, destinazioni, provider e telefoni compatibili con guide italiane aggiornate e trasparenti.';

  return {
    title,
    description,
    ogType: 'website',
    schema: [{
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name,
      url,
    }],
  };
}

export function publicArticleSeo(
  article: PublicArticle,
  pageUrl: string,
  siteName: string,
): PublicSeoDocument {
  const url = absolutePageUrl(pageUrl);
  const name = requiredText(siteName, 'siteName', 180);
  const articleSchema: PublicJsonLdDocument = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.h1,
    description: article.meta_description,
    dateModified: isoDate(article.updated_at),
    mainEntityOfPage: url,
    author: {
      '@type': 'Organization',
      name,
    },
  };
  const schema = [articleSchema];

  if (article.faq.length > 0) {
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: article.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  return {
    title: article.title,
    description: article.meta_description,
    ogType: 'article',
    schema,
  };
}
