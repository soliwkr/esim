PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL CHECK(page_type IN ('destination','guide','comparison','provider')),
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  eyebrow TEXT NOT NULL,
  h1 TEXT NOT NULL,
  direct_answer TEXT NOT NULL,
  intro TEXT NOT NULL,
  content_json TEXT NOT NULL DEFAULT '[]',
  faq_json TEXT NOT NULL DEFAULT '[]',
  source_links_json TEXT NOT NULL DEFAULT '[]',
  primary_keyword TEXT NOT NULL,
  cluster TEXT NOT NULL,
  search_intent TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','published','archived')),
  featured INTEGER NOT NULL DEFAULT 0 CHECK(featured IN (0,1)),
  source_checked_at TEXT,
  published_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pages_cluster ON pages(cluster);

CREATE TABLE IF NOT EXISTS providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  official_url TEXT NOT NULL,
  affiliate_disclosure TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  checked_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS destinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_code TEXT,
  region TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL,
  destination_id INTEGER NOT NULL,
  provider_plan_key TEXT,
  plan_name TEXT NOT NULL,
  data_gb REAL,
  unlimited INTEGER NOT NULL DEFAULT 0 CHECK(unlimited IN (0,1)),
  validity_days INTEGER NOT NULL,
  price_eur REAL NOT NULL,
  hotspot_policy TEXT,
  speed_policy TEXT,
  activation_policy TEXT,
  network_notes TEXT,
  source_url TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(provider_id) REFERENCES providers(id),
  FOREIGN KEY(destination_id) REFERENCES destinations(id),
  UNIQUE(provider_id, destination_id, provider_plan_key)
);

CREATE INDEX IF NOT EXISTS idx_plans_destination ON plans(destination_id, active);
CREATE INDEX IF NOT EXISTS idx_plans_provider ON plans(provider_id, active);

CREATE TABLE IF NOT EXISTS outbound_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_slug TEXT,
  provider_slug TEXT NOT NULL,
  placement TEXT NOT NULL,
  monetized INTEGER NOT NULL DEFAULT 0 CHECK(monetized IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON outbound_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_provider ON outbound_clicks(provider_slug, created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_page ON outbound_clicks(page_slug, created_at);

CREATE TABLE IF NOT EXISTS page_blueprints (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  page_type TEXT NOT NULL,
  cluster TEXT NOT NULL,
  search_intent TEXT NOT NULL,
  launch_tier INTEGER NOT NULL CHECK(launch_tier BETWEEN 1 AND 3),
  primary_keyword TEXT NOT NULL,
  primary_volume INTEGER NOT NULL DEFAULT 0,
  aggregate_keyword_volume INTEGER NOT NULL DEFAULT 0,
  keyword_count INTEGER NOT NULL DEFAULT 0,
  competition_index_avg REAL,
  max_bid_high_eur REAL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','writing','review','published','deferred')),
  top_keywords TEXT NOT NULL DEFAULT '',
  source_period TEXT NOT NULL DEFAULT '2025-07-01/2026-06-30',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blueprints_tier ON page_blueprints(launch_tier, primary_volume DESC);
