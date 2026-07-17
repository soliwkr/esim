PRAGMA foreign_keys = ON;

-- A versioned, immutable snapshot of the evidence available for one editorial brief.
-- The bundle can authorize creation of a draft in review, but it never publishes a page.
CREATE TABLE IF NOT EXISTS page_evidence_bundles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brief_id INTEGER NOT NULL,
  page_slug TEXT NOT NULL,
  version INTEGER NOT NULL CHECK(version >= 1),
  bundle_key TEXT NOT NULL UNIQUE,
  formula_version TEXT NOT NULL DEFAULT 'page-readiness-v1',
  readiness_score INTEGER NOT NULL CHECK(readiness_score BETWEEN 0 AND 100),
  review_draft_eligible INTEGER NOT NULL DEFAULT 0 CHECK(review_draft_eligible IN (0,1)),
  publication_eligible INTEGER NOT NULL DEFAULT 0 CHECK(publication_eligible IN (0,1)),
  ready_for_review_draft INTEGER NOT NULL DEFAULT 0 CHECK(ready_for_review_draft IN (0,1)),
  ready_for_publication INTEGER NOT NULL DEFAULT 0 CHECK(ready_for_publication IN (0,1)),
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK(review_status IN (
    'pending','approved_for_draft','changes_requested','approved_for_publication','superseded'
  )),
  verified_count INTEGER NOT NULL DEFAULT 0,
  insufficient_count INTEGER NOT NULL DEFAULT 0,
  contradicted_count INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER NOT NULL DEFAULT 0,
  dismissed_count INTEGER NOT NULL DEFAULT 0,
  expired_count INTEGER NOT NULL DEFAULT 0,
  conflict_count INTEGER NOT NULL DEFAULT 0,
  source_count INTEGER NOT NULL DEFAULT 0,
  subject_count INTEGER NOT NULL DEFAULT 0,
  first_party_test_count INTEGER NOT NULL DEFAULT 0,
  blockers_json TEXT NOT NULL DEFAULT '[]',
  warnings_json TEXT NOT NULL DEFAULT '[]',
  bundle_json TEXT NOT NULL DEFAULT '{}',
  generated_by TEXT NOT NULL DEFAULT 'system',
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(brief_id) REFERENCES editorial_briefs(id) ON DELETE CASCADE,
  UNIQUE(brief_id, version)
);

CREATE INDEX IF NOT EXISTS idx_page_evidence_bundles_brief
  ON page_evidence_bundles(brief_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_page_evidence_bundles_slug
  ON page_evidence_bundles(page_slug, version DESC);
CREATE INDEX IF NOT EXISTS idx_page_evidence_bundles_review
  ON page_evidence_bundles(review_status, readiness_score DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS page_readiness_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bundle_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN (
    'evaluated','duplicate','approved_for_draft','changes_requested',
    'approved_for_publication','superseded'
  )),
  actor TEXT NOT NULL DEFAULT 'system',
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(bundle_id) REFERENCES page_evidence_bundles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_page_readiness_events_bundle
  ON page_readiness_events(bundle_id, created_at DESC);

-- A human cannot approve a draft when the deterministic gate rejected it.
CREATE TRIGGER IF NOT EXISTS trg_page_readiness_draft_approval
BEFORE UPDATE OF review_status ON page_evidence_bundles
WHEN NEW.review_status='approved_for_draft' AND NEW.review_draft_eligible=0
BEGIN
  SELECT RAISE(ABORT, 'evidence_bundle_not_eligible_for_draft');
END;

-- Publication requires both a clean deterministic gate and a separate human action.
CREATE TRIGGER IF NOT EXISTS trg_page_readiness_publication_approval
BEFORE UPDATE OF review_status ON page_evidence_bundles
WHEN NEW.review_status='approved_for_publication' AND NEW.publication_eligible=0
BEGIN
  SELECT RAISE(ABORT, 'evidence_bundle_not_eligible_for_publication');
END;

CREATE TRIGGER IF NOT EXISTS trg_page_readiness_flags
AFTER UPDATE OF review_status ON page_evidence_bundles
BEGIN
  UPDATE page_evidence_bundles
  SET ready_for_review_draft = CASE
        WHEN NEW.review_status IN ('approved_for_draft','approved_for_publication') THEN 1
        ELSE review_draft_eligible
      END,
      ready_for_publication = CASE
        WHEN NEW.review_status='approved_for_publication' THEN 1
        ELSE 0
      END,
      reviewed_at = CASE
        WHEN NEW.review_status IN ('approved_for_draft','changes_requested','approved_for_publication')
          THEN CURRENT_TIMESTAMP
        ELSE reviewed_at
      END,
      updated_at=CURRENT_TIMESTAMP
  WHERE id=NEW.id;
END;
