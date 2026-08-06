PRAGMA foreign_keys = ON;

-- Immutable capture-run envelope for a bounded evidence pack. A new capture is a
-- new row; raw or semantic drift never rewrites an earlier run.
CREATE TABLE IF NOT EXISTS evidence_capture_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_key TEXT NOT NULL UNIQUE CHECK(length(trim(run_key)) > 0),
  pack_schema_version INTEGER NOT NULL CHECK(pack_schema_version >= 1),
  scenario_key TEXT NOT NULL CHECK(length(trim(scenario_key)) > 0),
  scenario_json TEXT NOT NULL CHECK(json_valid(scenario_json)),
  started_at TEXT NOT NULL CHECK(length(trim(started_at)) > 0),
  completed_at TEXT NOT NULL CHECK(length(trim(completed_at)) > 0),
  capture_window_ms INTEGER NOT NULL CHECK(capture_window_ms >= 0),
  source_count INTEGER NOT NULL CHECK(source_count > 0),
  pack_sha256 TEXT NOT NULL CHECK(length(trim(pack_sha256)) > 0),
  semantic_fingerprint TEXT NOT NULL CHECK(length(trim(semantic_fingerprint)) > 0),
  baseline_run_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_capture_runs_scenario
  ON evidence_capture_runs(scenario_key, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_capture_runs_semantic
  ON evidence_capture_runs(semantic_fingerprint, completed_at DESC);

-- One immutable observation of one already-registered source inside a capture run.
-- Source reconciliation/onboarding remains a separate gate; this table never
-- auto-registers source URLs.
CREATE TABLE IF NOT EXISTS evidence_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_key TEXT NOT NULL UNIQUE CHECK(length(trim(snapshot_key)) > 0),
  capture_run_id INTEGER NOT NULL,
  source_id INTEGER NOT NULL,
  source_audit_key TEXT NOT NULL CHECK(length(trim(source_audit_key)) > 0),
  requested_url TEXT NOT NULL CHECK(length(trim(requested_url)) > 0),
  final_url TEXT NOT NULL CHECK(length(trim(final_url)) > 0),
  redirect_chain_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(redirect_chain_json)),
  fetched_at TEXT NOT NULL CHECK(length(trim(fetched_at)) > 0),
  http_status INTEGER NOT NULL CHECK(http_status BETWEEN 100 AND 599),
  content_type TEXT NOT NULL CHECK(length(trim(content_type)) > 0),
  capture_method TEXT NOT NULL CHECK(capture_method IN (
    'http_html','http_json','pdf','browser_rendered','manual_first_party_test'
  )),
  locale TEXT,
  currency_context TEXT,
  country_context TEXT,
  capture_context_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(capture_context_json)),
  http_etag TEXT,
  http_last_modified TEXT,
  body_sha256 TEXT NOT NULL CHECK(length(trim(body_sha256)) > 0),
  visible_text_sha256 TEXT,
  byte_length INTEGER NOT NULL CHECK(byte_length >= 0),
  artifact_ref TEXT NOT NULL CHECK(length(trim(artifact_ref)) > 0),
  parser_input_version TEXT NOT NULL CHECK(length(trim(parser_input_version)) > 0),
  capture_warnings_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(capture_warnings_json)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(capture_run_id) REFERENCES evidence_capture_runs(id),
  FOREIGN KEY(source_id) REFERENCES source_registry(id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_run_source
  ON evidence_snapshots(capture_run_id, source_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_source
  ON evidence_snapshots(source_id, fetched_at DESC);

-- Deterministic field-level extraction result. unknown and not_applicable are
-- evidence states, not false assertions and not empty factual values.
CREATE TABLE IF NOT EXISTS evidence_field_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observation_key TEXT NOT NULL UNIQUE CHECK(length(trim(observation_key)) > 0),
  snapshot_id INTEGER NOT NULL,
  subject_type TEXT NOT NULL CHECK(subject_type IN (
    'provider','destination','plan','device','page','policy'
  )),
  subject_key TEXT NOT NULL CHECK(length(trim(subject_key)) > 0),
  provider_plan_key TEXT,
  field_name TEXT NOT NULL CHECK(length(trim(field_name)) > 0),
  scope_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(scope_json)),
  coverage_state TEXT NOT NULL CHECK(coverage_state IN (
    'observed','partial','unknown','not_applicable'
  )),
  raw_value_json TEXT NOT NULL DEFAULT 'null' CHECK(json_valid(raw_value_json)),
  normalized_value_json TEXT NOT NULL DEFAULT 'null' CHECK(json_valid(normalized_value_json)),
  evidence_locator_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(evidence_locator_json)),
  extractor_id TEXT NOT NULL CHECK(length(trim(extractor_id)) > 0),
  extractor_version TEXT NOT NULL CHECK(length(trim(extractor_version)) > 0),
  normalizer_version TEXT,
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK(schema_version >= 1),
  source_role TEXT NOT NULL CHECK(length(trim(source_role)) > 0),
  extraction_confidence REAL CHECK(
    extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1)
  ),
  warnings_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(warnings_json)),
  observed_at TEXT NOT NULL CHECK(length(trim(observed_at)) > 0),
  proposed_valid_until TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(snapshot_id) REFERENCES evidence_snapshots(id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_field_observations_subject
  ON evidence_field_observations(subject_type, subject_key, field_name, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_field_observations_snapshot
  ON evidence_field_observations(snapshot_id, field_name);

-- A candidate is still upstream of verification. verified/published/winner are
-- intentionally absent from the status domain.
CREATE TABLE IF NOT EXISTS evidence_claim_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_key TEXT NOT NULL UNIQUE CHECK(length(trim(candidate_key)) > 0),
  observation_id INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
    'pending','accepted_for_verification','rejected_extraction','superseded'
  )),
  decision_actor TEXT,
  decision_notes TEXT NOT NULL DEFAULT '',
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(observation_id) REFERENCES evidence_field_observations(id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_claim_candidates_status
  ON evidence_claim_candidates(status, created_at ASC);

-- Only observed evidence, or an explicitly bounded partial sub-fact, can become a
-- factual candidate. unknown/not_applicable remain observations only.
CREATE TRIGGER IF NOT EXISTS trg_evidence_claim_candidate_eligible_insert
BEFORE INSERT ON evidence_claim_candidates
WHEN EXISTS (
  SELECT 1
  FROM evidence_field_observations
  WHERE id=NEW.observation_id
    AND coverage_state NOT IN ('observed','partial')
)
BEGIN
  SELECT RAISE(ABORT, 'evidence_candidate_requires_observed_or_partial');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_claim_candidate_eligible_update
BEFORE UPDATE OF observation_id ON evidence_claim_candidates
WHEN EXISTS (
  SELECT 1
  FROM evidence_field_observations
  WHERE id=NEW.observation_id
    AND coverage_state NOT IN ('observed','partial')
)
BEGIN
  SELECT RAISE(ABORT, 'evidence_candidate_requires_observed_or_partial');
END;

-- Candidate provenance identity is fixed. A future audited decision may change
-- status/decision metadata, but it cannot silently point the candidate at another
-- extraction result.
CREATE TRIGGER IF NOT EXISTS trg_evidence_claim_candidate_identity_immutable
BEFORE UPDATE OF candidate_key, observation_id ON evidence_claim_candidates
WHEN NEW.candidate_key<>OLD.candidate_key OR NEW.observation_id<>OLD.observation_id
BEGIN
  SELECT RAISE(ABORT, 'evidence_claim_candidate_identity_immutable');
END;

-- Historical evidence is immutable at the database boundary. Any future repair
-- mechanism must be a separate, explicit design rather than an ordinary UPDATE or
-- DELETE path.
CREATE TRIGGER IF NOT EXISTS trg_evidence_capture_runs_immutable_update
BEFORE UPDATE ON evidence_capture_runs
BEGIN
  SELECT RAISE(ABORT, 'evidence_capture_runs_immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_capture_runs_immutable_delete
BEFORE DELETE ON evidence_capture_runs
BEGIN
  SELECT RAISE(ABORT, 'evidence_capture_runs_immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_snapshots_immutable_update
BEFORE UPDATE ON evidence_snapshots
BEGIN
  SELECT RAISE(ABORT, 'evidence_snapshots_immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_snapshots_immutable_delete
BEFORE DELETE ON evidence_snapshots
BEGIN
  SELECT RAISE(ABORT, 'evidence_snapshots_immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_field_observations_immutable_update
BEFORE UPDATE ON evidence_field_observations
BEGIN
  SELECT RAISE(ABORT, 'evidence_field_observations_immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_field_observations_immutable_delete
BEFORE DELETE ON evidence_field_observations
BEGIN
  SELECT RAISE(ABORT, 'evidence_field_observations_immutable');
END;
