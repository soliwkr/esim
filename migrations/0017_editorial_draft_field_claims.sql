PRAGMA foreign_keys = ON;

-- Field-level provenance for evidence-bound editorial drafts.
-- This closes the gap where sections and FAQs were traceable but title, metadata,
-- direct answer and introduction could still contain ungrounded generalizations.
CREATE TABLE IF NOT EXISTS editorial_review_draft_field_claims (
  draft_id INTEGER NOT NULL,
  field_name TEXT NOT NULL CHECK(field_name IN (
    'title','meta_description','h1','direct_answer','intro','section','faq'
  )),
  field_key TEXT NOT NULL DEFAULT '',
  claim_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(draft_id, field_name, field_key, claim_id),
  FOREIGN KEY(draft_id) REFERENCES editorial_review_drafts(id) ON DELETE CASCADE,
  FOREIGN KEY(claim_id) REFERENCES editorial_claim_candidates(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_draft_field_claims_claim
  ON editorial_review_draft_field_claims(claim_id, draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_field_claims_field
  ON editorial_review_draft_field_claims(draft_id, field_name, field_key);

-- A mapping is valid only when the claim is atomic, verified and belongs to the
-- same brief as the evidence bundle used by the draft.
CREATE TRIGGER IF NOT EXISTS trg_draft_field_claim_requires_verified_bundle_claim
BEFORE INSERT ON editorial_review_draft_field_claims
WHEN NOT EXISTS (
  SELECT 1
  FROM editorial_review_drafts d
  JOIN page_evidence_bundles b ON b.id=d.evidence_bundle_id
  JOIN editorial_claim_candidates c ON c.id=NEW.claim_id
  WHERE d.id=NEW.draft_id
    AND c.brief_id=b.brief_id
    AND c.atomic=1
    AND c.status='verified'
    AND c.source_id IS NOT NULL
    AND c.claim_verification_id IS NOT NULL
)
BEGIN
  SELECT RAISE(ABORT, 'verified_bundle_claim_required');
END;

-- The first renderer version did not persist provenance for top-level fields.
-- Legacy drafts remain auditable and previewable, but cannot be approved.
CREATE TRIGGER IF NOT EXISTS trg_legacy_editorial_draft_not_approvable
BEFORE UPDATE OF status ON editorial_review_drafts
WHEN NEW.status='approved' AND NEW.prompt_version<>'editorial-page-draft-v2'
BEGIN
  SELECT RAISE(ABORT, 'legacy_draft_requires_grounded_regeneration');
END;

-- A v2 draft can be approved only when every factual top-level field has at
-- least one persisted claim mapping.
CREATE TRIGGER IF NOT EXISTS trg_grounded_editorial_draft_requires_field_provenance
BEFORE UPDATE OF status ON editorial_review_drafts
WHEN NEW.status='approved' AND NEW.prompt_version='editorial-page-draft-v2'
  AND EXISTS (
    SELECT 1
    FROM (
      SELECT 'title' AS field_name
      UNION ALL SELECT 'meta_description'
      UNION ALL SELECT 'h1'
      UNION ALL SELECT 'direct_answer'
      UNION ALL SELECT 'intro'
    ) required
    WHERE NOT EXISTS (
      SELECT 1
      FROM editorial_review_draft_field_claims m
      WHERE m.draft_id=NEW.id AND m.field_name=required.field_name
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'draft_field_provenance_incomplete');
END;
