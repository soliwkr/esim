PRAGMA foreign_keys = ON;

-- Research runs are machine-readable snapshots produced by an external recent-demand
-- engine such as last30days. Social and community evidence is kept separate from
-- official commercial claims: it can create editorial opportunities, never verified
-- prices, coverage, hotspot or fair-use facts.
CREATE TABLE IF NOT EXISTS research_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_system TEXT NOT NULL DEFAULT 'last30days',
  schema_version TEXT NOT NULL,
  run_kind TEXT NOT NULL CHECK(run_kind IN ('research','discovery','comparison')),
  query TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  window_days INTEGER NOT NULL CHECK(window_days BETWEEN 1 AND 365),
  source_status_json TEXT NOT NULL DEFAULT '{}',
  result_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  payload_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_research_runs_query ON research_runs(query, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_runs_kind ON research_runs(run_kind, generated_at DESC);

CREATE TABLE IF NOT EXISTS research_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL,
  signal_key TEXT NOT NULL UNIQUE,
  signal_type TEXT NOT NULL CHECK(signal_type IN ('question','complaint','comparison','recommendation','trend','content_gap')),
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  published_at TEXT,
  engagement_json TEXT NOT NULL DEFAULT '{}',
  relevance_score REAL CHECK(relevance_score IS NULL OR (relevance_score >= 0 AND relevance_score <= 1)),
  momentum TEXT,
  corroboration_count INTEGER NOT NULL DEFAULT 0,
  cluster_title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewed','accepted','dismissed','converted')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(run_id) REFERENCES research_runs(id)
);

CREATE INDEX IF NOT EXISTS idx_research_signals_status ON research_signals(status, relevance_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_signals_topic ON research_signals(topic, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_signals_type ON research_signals(signal_type, status, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_research_signals_run ON research_signals(run_id);
