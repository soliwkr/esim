PRAGMA foreign_keys = ON;

-- A claim candidate is an assertion or verification requirement extracted from an
-- accepted editorial brief. It is not a verified fact and cannot be published as one.
CREATE TABLE IF NOT EXISTS editorial_claim_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brief_id INTEGER NOT NULL,
  candidate_key TEXT NOT NULL UNIQUE,
  field_name TEXT NOT NULL,
  claim_text TEXT NOT NULL,
  verification_question TEXT NOT NULL,
  required_source_kinds_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
    'pending','processing','verified','contradicted','insufficient','dismissed'
  )),
  source_id INTEGER,
  claim_verification_id INTEGER,
  evidence TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(brief_id) REFERENCES editorial_briefs(id) ON DELETE CASCADE,
  FOREIGN KEY(source_id) REFERENCES source_registry(id),
  FOREIGN KEY(claim_verification_id) REFERENCES claim_verifications(id)
);

CREATE INDEX IF NOT EXISTS idx_editorial_claim_candidates_brief
  ON editorial_claim_candidates(brief_id, status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_editorial_claim_candidates_status
  ON editorial_claim_candidates(status, updated_at DESC);

-- Small append-only audit trail for human and automated claim decisions.
CREATE TABLE IF NOT EXISTS editorial_claim_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN (
    'created','queued','processing','verified','contradicted','insufficient','dismissed','reopened'
  )),
  actor TEXT NOT NULL DEFAULT 'system',
  source_id INTEGER,
  claim_verification_id INTEGER,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(candidate_id) REFERENCES editorial_claim_candidates(id) ON DELETE CASCADE,
  FOREIGN KEY(source_id) REFERENCES source_registry(id),
  FOREIGN KEY(claim_verification_id) REFERENCES claim_verifications(id)
);

CREATE INDEX IF NOT EXISTS idx_editorial_claim_events_candidate
  ON editorial_claim_events(candidate_id, created_at DESC);

-- A positive or contradictory factual outcome must be backed by both a source and
-- a persisted claim verification. Application bugs cannot bypass this boundary.
CREATE TRIGGER IF NOT EXISTS trg_editorial_claim_require_verification
BEFORE UPDATE OF status ON editorial_claim_candidates
WHEN NEW.status IN ('verified','contradicted')
 AND (NEW.source_id IS NULL OR NEW.claim_verification_id IS NULL)
BEGIN
  SELECT RAISE(ABORT, 'claim_result_requires_source_and_verification');
END;

-- Keep candidate work state aligned with the generic maintenance queue. Terminal
-- factual outcomes are never inferred from queue completion alone.
CREATE TRIGGER IF NOT EXISTS trg_editorial_claim_queue_state
AFTER UPDATE OF status ON maintenance_queue
WHEN NEW.entity_key LIKE 'editorial-claim:%'
BEGIN
  UPDATE editorial_claim_candidates
  SET status = CASE
        WHEN NEW.status='processing' AND status='pending' THEN 'processing'
        WHEN NEW.status='pending' AND status='processing' THEN 'pending'
        WHEN NEW.status='cancelled' AND status IN ('pending','processing') THEN 'dismissed'
        ELSE status
      END,
      updated_at = CASE
        WHEN NEW.status IN ('processing','pending','cancelled') THEN CURRENT_TIMESTAMP
        ELSE updated_at
      END
  WHERE id = CAST(substr(NEW.entity_key, 18) AS INTEGER);

  INSERT INTO editorial_claim_events(candidate_id,action,actor,details_json)
  SELECT
    CAST(substr(NEW.entity_key, 18) AS INTEGER),
    CASE
      WHEN NEW.status='processing' THEN 'processing'
      WHEN NEW.status='pending' THEN 'reopened'
      WHEN NEW.status='cancelled' THEN 'dismissed'
    END,
    COALESCE(NEW.locked_by,'maintenance_queue'),
    json_object('taskId',NEW.id,'queueStatus',NEW.status)
  WHERE NEW.status IN ('processing','pending','cancelled')
    AND EXISTS(
      SELECT 1 FROM editorial_claim_candidates
      WHERE id=CAST(substr(NEW.entity_key, 18) AS INTEGER)
    );
END;
