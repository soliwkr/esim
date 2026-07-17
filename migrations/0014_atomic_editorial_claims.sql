PRAGMA foreign_keys = ON;

-- Broad research requirements are useful for planning, but they must not be stored as
-- verified facts. Atomic candidates identify one subject, one field and one assertion.
ALTER TABLE editorial_claim_candidates ADD COLUMN parent_candidate_id INTEGER;
ALTER TABLE editorial_claim_candidates ADD COLUMN subject_type TEXT NOT NULL DEFAULT 'page'
  CHECK(subject_type IN ('provider','destination','plan','device','page','policy'));
ALTER TABLE editorial_claim_candidates ADD COLUMN subject_key TEXT NOT NULL DEFAULT '';
ALTER TABLE editorial_claim_candidates ADD COLUMN atomic INTEGER NOT NULL DEFAULT 0 CHECK(atomic IN (0,1));
ALTER TABLE editorial_claim_candidates ADD COLUMN scope_json TEXT NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_editorial_claim_atomic_scope
  ON editorial_claim_candidates(atomic,subject_type,subject_key,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_editorial_claim_parent
  ON editorial_claim_candidates(parent_candidate_id,status,id);

-- A factual terminal outcome is illegal for broad research requirements. They must be
-- decomposed first into provider/destination/plan/page scoped assertions.
CREATE TRIGGER IF NOT EXISTS trg_editorial_claim_require_atomic
BEFORE UPDATE OF status ON editorial_claim_candidates
WHEN NEW.status IN ('verified','contradicted') AND NEW.atomic<>1
BEGIN
  SELECT RAISE(ABORT, 'claim_must_be_atomic_before_factual_outcome');
END;

-- Atomic children must carry an explicit subject key.
CREATE TRIGGER IF NOT EXISTS trg_editorial_claim_atomic_subject_insert
BEFORE INSERT ON editorial_claim_candidates
WHEN NEW.atomic=1 AND trim(NEW.subject_key)=''
BEGIN
  SELECT RAISE(ABORT, 'atomic_claim_requires_subject_key');
END;
