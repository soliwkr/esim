PRAGMA foreign_keys = ON;

-- Append-only audit trail for human candidate intake decisions. The current
-- candidate status remains queryable on evidence_claim_candidates, while every
-- accepted/rejected/superseded transition is preserved here.
CREATE TABLE IF NOT EXISTS evidence_claim_candidate_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_key TEXT NOT NULL UNIQUE CHECK(length(trim(event_key)) > 0),
  candidate_id INTEGER NOT NULL,
  from_status TEXT NOT NULL CHECK(from_status IN (
    'pending','accepted_for_verification','rejected_extraction','superseded'
  )),
  to_status TEXT NOT NULL CHECK(to_status IN (
    'pending','accepted_for_verification','rejected_extraction','superseded'
  )),
  actor TEXT NOT NULL CHECK(length(trim(actor)) > 0),
  notes TEXT NOT NULL CHECK(length(trim(notes)) > 0),
  decided_at TEXT NOT NULL CHECK(length(trim(decided_at)) > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(candidate_id) REFERENCES evidence_claim_candidates(id),
  CHECK(from_status<>to_status)
);

CREATE INDEX IF NOT EXISTS idx_evidence_claim_candidate_events_candidate
  ON evidence_claim_candidate_events(candidate_id, id ASC);

CREATE TRIGGER IF NOT EXISTS trg_evidence_candidate_initial_state_valid
BEFORE INSERT ON evidence_claim_candidates
WHEN NEW.status IN ('accepted_for_verification','rejected_extraction','superseded')
  OR NEW.decision_actor IS NOT NULL
  OR length(trim(NEW.decision_notes))>0
  OR NEW.decided_at IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'evidence_candidate_initial_state_invalid');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_candidate_status_transition_valid
BEFORE UPDATE OF status ON evidence_claim_candidates
WHEN NEW.status<>OLD.status AND NOT (
  (OLD.status='pending' AND NEW.status IN ('accepted_for_verification','rejected_extraction'))
  OR (OLD.status='accepted_for_verification' AND NEW.status IN ('rejected_extraction','superseded'))
  OR (OLD.status='rejected_extraction' AND NEW.status='accepted_for_verification')
)
BEGIN
  SELECT RAISE(ABORT, 'evidence_candidate_status_transition_invalid');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_candidate_status_requires_human_audit
BEFORE UPDATE OF status ON evidence_claim_candidates
WHEN NEW.status<>OLD.status AND (
  NEW.decision_actor IS NULL OR length(trim(NEW.decision_actor))=0
  OR length(trim(NEW.decision_notes))=0
  OR NEW.decided_at IS NULL OR length(trim(NEW.decided_at))=0
)
BEGIN
  SELECT RAISE(ABORT, 'evidence_candidate_status_requires_human_audit');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_candidate_decision_metadata_requires_transition
BEFORE UPDATE OF decision_actor, decision_notes, decided_at ON evidence_claim_candidates
WHEN NEW.status=OLD.status AND (
  COALESCE(NEW.decision_actor,'')<>COALESCE(OLD.decision_actor,'')
  OR NEW.decision_notes<>OLD.decision_notes
  OR COALESCE(NEW.decided_at,'')<>COALESCE(OLD.decided_at,'')
)
BEGIN
  SELECT RAISE(ABORT, 'evidence_candidate_decision_metadata_requires_transition');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_candidate_status_event
AFTER UPDATE OF status ON evidence_claim_candidates
WHEN NEW.status<>OLD.status
BEGIN
  INSERT INTO evidence_claim_candidate_events(
    event_key, candidate_id, from_status, to_status, actor, notes, decided_at
  ) VALUES(
    'candidate-event:' || NEW.id || ':' || NEW.status || ':' || NEW.decided_at,
    NEW.id, OLD.status, NEW.status, NEW.decision_actor, NEW.decision_notes, NEW.decided_at
  );
END;

-- A candidate must start pending, so an event may only be emitted by the status
-- transition above. A direct insert cannot forge a second history entry because
-- it must equal the candidate's current audited metadata and the deterministic
-- event key already exists.
CREATE TRIGGER IF NOT EXISTS trg_evidence_claim_candidate_events_insert_valid
BEFORE INSERT ON evidence_claim_candidate_events
WHEN NOT EXISTS (
  SELECT 1
  FROM evidence_claim_candidates c
  WHERE c.id=NEW.candidate_id
    AND c.status=NEW.to_status
    AND c.decision_actor=NEW.actor
    AND c.decision_notes=NEW.notes
    AND c.decided_at=NEW.decided_at
    AND NEW.event_key=(
      'candidate-event:' || NEW.candidate_id || ':' || NEW.to_status || ':' || NEW.decided_at
    )
)
BEGIN
  SELECT RAISE(ABORT, 'evidence_claim_candidate_event_invalid');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_claim_candidate_events_immutable_update
BEFORE UPDATE ON evidence_claim_candidate_events
BEGIN
  SELECT RAISE(ABORT, 'evidence_claim_candidate_events_immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_claim_candidate_events_immutable_delete
BEFORE DELETE ON evidence_claim_candidate_events
BEGIN
  SELECT RAISE(ABORT, 'evidence_claim_candidate_events_immutable');
END;

-- Candidate identity already cannot be rewritten under 0021. Once the bridge is
-- installed, deletion is also forbidden so decision provenance cannot be orphaned.
CREATE TRIGGER IF NOT EXISTS trg_evidence_claim_candidates_immutable_delete
BEFORE DELETE ON evidence_claim_candidates
BEGIN
  SELECT RAISE(ABORT, 'evidence_claim_candidates_immutable');
END;

-- A verification decision is an immutable revision. claim_verifications remains
-- a separate downstream current-state projection and is not written by this schema.
CREATE TABLE IF NOT EXISTS evidence_verification_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_key TEXT NOT NULL UNIQUE CHECK(length(trim(decision_key)) > 0),
  primary_candidate_id INTEGER NOT NULL,
  revision INTEGER NOT NULL CHECK(revision >= 1),
  outcome TEXT NOT NULL CHECK(outcome IN (
    'verified','contradicted','insufficient','expired'
  )),
  subject_type TEXT NOT NULL CHECK(subject_type IN (
    'provider','destination','plan','device','page','policy'
  )),
  subject_key TEXT NOT NULL CHECK(length(trim(subject_key)) > 0),
  field_name TEXT NOT NULL CHECK(length(trim(field_name)) > 0),
  scope_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(scope_json)),
  value_json TEXT NOT NULL DEFAULT 'null' CHECK(json_valid(value_json)),
  actor_type TEXT NOT NULL DEFAULT 'human' CHECK(actor_type='human'),
  decision_actor TEXT NOT NULL CHECK(length(trim(decision_actor)) > 0),
  decided_at TEXT NOT NULL CHECK(length(trim(decided_at)) > 0),
  valid_until TEXT,
  rationale TEXT NOT NULL CHECK(length(trim(rationale)) > 0),
  supersedes_decision_id INTEGER UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(primary_candidate_id) REFERENCES evidence_claim_candidates(id),
  FOREIGN KEY(supersedes_decision_id) REFERENCES evidence_verification_decisions(id),
  CHECK(
    outcome<>'verified'
    OR (valid_until IS NOT NULL AND length(trim(valid_until))>0 AND valid_until>decided_at)
  ),
  CHECK(outcome<>'expired' OR supersedes_decision_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_evidence_verification_decisions_subject
  ON evidence_verification_decisions(subject_type, subject_key, field_name, revision DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_verification_decisions_outcome
  ON evidence_verification_decisions(outcome, decided_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_evidence_verification_primary_candidate_match
BEFORE INSERT ON evidence_verification_decisions
WHEN NOT EXISTS (
  SELECT 1
  FROM evidence_claim_candidates c
  JOIN evidence_field_observations o ON o.id=c.observation_id
  WHERE c.id=NEW.primary_candidate_id
    AND c.status='accepted_for_verification'
    AND o.subject_type=NEW.subject_type
    AND o.subject_key=NEW.subject_key
    AND o.field_name=NEW.field_name
    AND o.scope_json=NEW.scope_json
    AND o.normalized_value_json=NEW.value_json
    AND (NEW.outcome<>'verified' OR o.coverage_state='observed')
)
BEGIN
  SELECT RAISE(ABORT, 'evidence_verification_primary_candidate_invalid');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_verification_root_unique
BEFORE INSERT ON evidence_verification_decisions
WHEN NEW.supersedes_decision_id IS NULL AND EXISTS (
  SELECT 1
  FROM evidence_verification_decisions d
  WHERE d.subject_type=NEW.subject_type
    AND d.subject_key=NEW.subject_key
    AND d.field_name=NEW.field_name
    AND d.scope_json=NEW.scope_json
)
BEGIN
  SELECT RAISE(ABORT, 'evidence_verification_root_already_exists');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_verification_revision_valid
BEFORE INSERT ON evidence_verification_decisions
WHEN (
  NEW.supersedes_decision_id IS NULL AND NEW.revision<>1
) OR (
  NEW.supersedes_decision_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM evidence_verification_decisions d
    WHERE d.id=NEW.supersedes_decision_id
      AND d.subject_type=NEW.subject_type
      AND d.subject_key=NEW.subject_key
      AND d.field_name=NEW.field_name
      AND d.scope_json=NEW.scope_json
      AND NEW.revision=d.revision+1
  )
)
BEGIN
  SELECT RAISE(ABORT, 'evidence_verification_revision_invalid');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_verification_expiry_requires_verified
BEFORE INSERT ON evidence_verification_decisions
WHEN NEW.outcome='expired' AND NOT EXISTS (
  SELECT 1
  FROM evidence_verification_decisions d
  WHERE d.id=NEW.supersedes_decision_id AND d.outcome='verified'
)
BEGIN
  SELECT RAISE(ABORT, 'evidence_verification_expiry_requires_verified');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_verification_decisions_immutable_update
BEFORE UPDATE ON evidence_verification_decisions
BEGIN
  SELECT RAISE(ABORT, 'evidence_verification_decisions_immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_verification_decisions_immutable_delete
BEFORE DELETE ON evidence_verification_decisions
BEGIN
  SELECT RAISE(ABORT, 'evidence_verification_decisions_immutable');
END;

-- A decision may cite multiple accepted candidates while preserving the role of
-- each item in the human rationale.
CREATE TABLE IF NOT EXISTS evidence_verification_decision_candidates (
  decision_id INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  relation TEXT NOT NULL CHECK(relation IN ('supports','contradicts','context')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(decision_id, candidate_id),
  FOREIGN KEY(decision_id) REFERENCES evidence_verification_decisions(id),
  FOREIGN KEY(candidate_id) REFERENCES evidence_claim_candidates(id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_verification_evidence_candidate
  ON evidence_verification_decision_candidates(candidate_id, decision_id);

CREATE TRIGGER IF NOT EXISTS trg_evidence_verification_evidence_candidate_valid
BEFORE INSERT ON evidence_verification_decision_candidates
WHEN NOT EXISTS (
  SELECT 1
  FROM evidence_verification_decisions d
  JOIN evidence_claim_candidates c ON c.id=NEW.candidate_id
  JOIN evidence_field_observations o ON o.id=c.observation_id
  WHERE d.id=NEW.decision_id
    AND c.status='accepted_for_verification'
    AND o.subject_type=d.subject_type
    AND o.subject_key=d.subject_key
    AND o.field_name=d.field_name
    AND o.scope_json=d.scope_json
)
BEGIN
  SELECT RAISE(ABORT, 'evidence_verification_evidence_candidate_invalid');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_verification_primary_evidence
AFTER INSERT ON evidence_verification_decisions
BEGIN
  INSERT INTO evidence_verification_decision_candidates(
    decision_id, candidate_id, relation, notes
  ) VALUES(
    NEW.id,
    NEW.primary_candidate_id,
    CASE NEW.outcome
      WHEN 'verified' THEN 'supports'
      WHEN 'contradicted' THEN 'contradicts'
      ELSE 'context'
    END,
    'primary candidate'
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_verification_decision_candidates_immutable_update
BEFORE UPDATE ON evidence_verification_decision_candidates
BEGIN
  SELECT RAISE(ABORT, 'evidence_verification_decision_candidates_immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidence_verification_decision_candidates_immutable_delete
BEFORE DELETE ON evidence_verification_decision_candidates
BEGIN
  SELECT RAISE(ABORT, 'evidence_verification_decision_candidates_immutable');
END;

-- This view exposes only unsuperseded heads. It is a read model, not a write into
-- claim_verifications or any publication-facing table.
CREATE VIEW IF NOT EXISTS evidence_verification_current AS
SELECT d.*
FROM evidence_verification_decisions d
WHERE NOT EXISTS (
  SELECT 1
  FROM evidence_verification_decisions successor
  WHERE successor.supersedes_decision_id=d.id
);
