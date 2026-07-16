export interface Env {
  DB: D1Database;
  SITE_NAME: string;
  SITE_URL: string;
  GTM_ID: string;
  AFFILIATE_MODE?: string;
  AFFILIATE_LINKS_JSON?: string;
}

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'callout'; title: string; text: string };

export type FaqItem = { question: string; answer: string };

export type PageRow = {
  slug: string;
  page_type: string;
  title: string;
  meta_description: string;
  eyebrow: string;
  h1: string;
  direct_answer: string;
  intro: string;
  content_json: string;
  faq_json: string;
  source_links_json: string;
  primary_keyword: string;
  cluster: string;
  search_intent: string;
  source_checked_at: string | null;
  updated_at: string;
};

export type PageCard = Pick<PageRow, 'slug' | 'page_type' | 'title' | 'meta_description' | 'cluster'>;

export type ProviderRow = {
  slug: string;
  name: string;
  official_url: string;
  affiliate_disclosure: string;
  active: number;
};
