PRAGMA foreign_keys = ON;

-- Durable, project-owned observability for Cloudflare Workflow instances.
-- The Cloudflare binding remains the source of truth for live status; this table
-- stores a compact history that can be queried by the private dashboard.
CREATE TABLE IF NOT EXISTS recent_demand_workflow_runs (
  instance_id TEXT PRIMARY KEY,
  workflow_name TEXT NOT NULL DEFAULT 'senza-roaming-recent-demand',
  trigger_type TEXT NOT NULL DEFAULT 'unknown',
  reason TEXT NOT NULL DEFAULT '',
  queries_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TEXT,
  completed_at TEXT,
  result_count INTEGER NOT NULL DEFAULT 0,
  signal_count INTEGER NOT NULL DEFAULT 0,
  error_name TEXT,
  error_message TEXT,
  output_summary_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recent_demand_workflow_runs_status
  ON recent_demand_workflow_runs(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_recent_demand_workflow_runs_created
  ON recent_demand_workflow_runs(created_at DESC);
