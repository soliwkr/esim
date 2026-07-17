PRAGMA foreign_keys = ON;

-- Immutable AI-assisted drafts bound to one approved evidence-bundle version.
-- A draft may materialize a row in pages with status=review, but never published.
CREATE TABLE IF NOT EXISTS editorial_review_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evidence_bundle_id INTEGER NOT NULL,
  draft_key TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL CHECK(version >= 1),
  page_slug TEXT NOT NULL,
  page_type TEXT NOT NULL CHECK(page_type IN ('destination','guide','comparison','provider')),
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generating' CHECK(status IN (
    'generating','review','changes_requested','approved','failed','superseded'
  )),
  title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  eyebrow TEXT NOT NULL DEFAULT '',
  h1 TEXT NOT NULL DEFAULT '',
  direct_answer TEXT NOT NULL DEFAULT '',
  intro TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL DEFAULT '[]',
  faq_json TEXT NOT NULL DEFAULT '[]',
  source_links_json TEXT NOT NULL DEFAULT '[]',
  used_claim_ids_json TEXT NOT NULL DEFAULT '[]',
  excluded_claim_ids_json TEXT NOT NULL DEFAULT '[]',
  generation_rules_json TEXT NOT NULL DEFAULT '[]',
  response_id TEXT,
  usage_json TEXT NOT NULL DEFAULT '{}',
  error_message TEXT,
  generated_by TEXT NOT NULL DEFAULT 'system',
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(evidence_bundle_id) REFERENCES page_evidence_bundles(id) ON DELETE RESTRICT,
  UNIQUE(evidence_bundle_id, version)
);

CREATE INDEX IF NOT EXISTS idx_editorial_review_drafts_bundle
  ON editorial_review_drafts(evidence_bundle_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_editorial_review_drafts_slug
  ON editorial_review_drafts(page_slug, version DESC);
CREATE INDEX IF NOT EXISTS idx_editorial_review_drafts_status
  ON editorial_review_drafts(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS editorial_review_draft_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN (
    'generation_started','generated','duplicate','generation_failed',
    'changes_requested','approved','superseded'
  )),
  actor TEXT NOT NULL DEFAULT 'system',
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(draft_id) REFERENCES editorial_review_drafts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editorial_review_draft_events
  ON editorial_review_draft_events(draft_id, created_at DESC);

-- The database itself rejects a generated draft that is not bound to a human-approved bundle.
CREATE TRIGGER IF NOT EXISTS trg_editorial_draft_requires_approved_bundle
BEFORE INSERT ON editorial_review_drafts
WHEN NOT EXISTS (
  SELECT 1 FROM page_evidence_bundles b
  WHERE b.id=NEW.evidence_bundle_id
    AND b.review_status IN ('approved_for_draft','approved_for_publication')
    AND b.ready_for_review_draft=1
)
BEGIN
  SELECT RAISE(ABORT, 'approved_evidence_bundle_required');
END;

-- A draft-backed page can become published only after both the draft and bundle gates pass.
CREATE TRIGGER IF NOT EXISTS trg_editorial_draft_page_never_published_update
BEFORE UPDATE OF status ON pages
WHEN NEW.slug IN (SELECT page_slug FROM editorial_review_drafts)
  AND NEW.status='published'
  AND NOT EXISTS (
    SELECT 1 FROM page_evidence_bundles b
    JOIN editorial_review_drafts d ON d.evidence_bundle_id=b.id
    WHERE d.page_slug=NEW.slug
      AND d.status='approved'
      AND b.review_status='approved_for_publication'
      AND b.ready_for_publication=1
  )
BEGIN
  SELECT RAISE(ABORT, 'publication_gate_not_satisfied');
END;
