PRAGMA foreign_keys = ON;

-- Audit trail for each controlled Vertex AI editorial analysis.
CREATE TABLE IF NOT EXISTS ai_editorial_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_key TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  signal_ids_json TEXT NOT NULL DEFAULT '[]',
  signal_count INTEGER NOT NULL DEFAULT 0 CHECK(signal_count BETWEEN 0 AND 20),
  status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','complete','failed')),
  response_id TEXT,
  usage_json TEXT NOT NULL DEFAULT '{}',
  brief_count INTEGER NOT NULL DEFAULT 0 CHECK(brief_count BETWEEN 0 AND 20),
  error_message TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_editorial_runs_status
  ON ai_editorial_runs(status, created_at DESC);

-- AI output is always a proposal. It cannot publish a page or verify a commercial claim.
CREATE TABLE IF NOT EXISTS editorial_briefs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ai_run_id INTEGER NOT NULL,
  brief_key TEXT NOT NULL UNIQUE,
  cluster_title TEXT NOT NULL,
  proposed_title TEXT NOT NULL,
  slug_suggestion TEXT NOT NULL DEFAULT '',
  direct_answer TEXT NOT NULL DEFAULT '',
  rationale TEXT NOT NULL DEFAULT '',
  asset_type TEXT NOT NULL CHECK(asset_type IN (
    'faq','guide','comparison','destination','provider_review','troubleshooting','update','explainer'
  )),
  search_intent TEXT NOT NULL CHECK(search_intent IN (
    'informational','commercial','transactional','navigational','mixed'
  )),
  opportunity_score INTEGER NOT NULL CHECK(opportunity_score BETWEEN 0 AND 100),
  evidence_score INTEGER NOT NULL CHECK(evidence_score BETWEEN 0 AND 100),
  quality_flags_json TEXT NOT NULL DEFAULT '[]',
  required_verifications_json TEXT NOT NULL DEFAULT '[]',
  outline_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'proposed' CHECK(status IN ('proposed','accepted','dismissed','converted')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(ai_run_id) REFERENCES ai_editorial_runs(id)
);

CREATE INDEX IF NOT EXISTS idx_editorial_briefs_status
  ON editorial_briefs(status, opportunity_score DESC, evidence_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_editorial_briefs_run
  ON editorial_briefs(ai_run_id, created_at DESC);

CREATE TABLE IF NOT EXISTS editorial_brief_signals (
  brief_id INTEGER NOT NULL,
  signal_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(brief_id, signal_id),
  FOREIGN KEY(brief_id) REFERENCES editorial_briefs(id) ON DELETE CASCADE,
  FOREIGN KEY(signal_id) REFERENCES research_signals(id)
);

CREATE INDEX IF NOT EXISTS idx_editorial_brief_signals_signal
  ON editorial_brief_signals(signal_id, brief_id);
