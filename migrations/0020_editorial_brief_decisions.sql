PRAGMA foreign_keys = ON;

-- A brief decision is a single, human-controlled transition from proposed to
-- accepted or dismissed. The append-only event is the command and the audit.
CREATE TABLE IF NOT EXISTS editorial_brief_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brief_id INTEGER NOT NULL UNIQUE,
  action TEXT NOT NULL CHECK(action IN ('accepted','dismissed')),
  actor TEXT NOT NULL CHECK(length(trim(actor)) BETWEEN 1 AND 320),
  notes TEXT NOT NULL DEFAULT '' CHECK(length(notes) <= 2000),
  details_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(details_json)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(brief_id) REFERENCES editorial_briefs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editorial_brief_events_created
  ON editorial_brief_events(created_at DESC, id DESC);

-- Preserve the already-observed human state without pretending that the original
-- actor or decision timestamp is known. New decisions use the strict triggers below.
INSERT OR IGNORE INTO editorial_brief_events(
  brief_id, action, actor, notes, details_json
)
SELECT
  id,
  CASE WHEN status='dismissed' THEN 'dismissed' ELSE 'accepted' END,
  'migration-0020-backfill',
  COALESCE(notes,''),
  json_object('backfilled',1,'sourceStatus',status)
FROM editorial_briefs
WHERE status IN ('accepted','dismissed','converted');

CREATE TRIGGER IF NOT EXISTS trg_editorial_brief_decision_requires_proposed
BEFORE INSERT ON editorial_brief_events
WHEN NOT EXISTS (
  SELECT 1 FROM editorial_briefs
  WHERE id=NEW.brief_id AND status='proposed'
)
BEGIN
  SELECT RAISE(ABORT, 'brief_decision_requires_proposed');
END;

CREATE TRIGGER IF NOT EXISTS trg_editorial_brief_decision_apply
AFTER INSERT ON editorial_brief_events
BEGIN
  UPDATE editorial_briefs
  SET status=NEW.action,
      notes=CASE WHEN NEW.notes<>'' THEN NEW.notes ELSE notes END,
      updated_at=CURRENT_TIMESTAMP
  WHERE id=NEW.brief_id AND status='proposed';

  UPDATE maintenance_queue
  SET status='cancelled',
      completed_at=CURRENT_TIMESTAMP,
      updated_at=CURRENT_TIMESTAMP
  WHERE NEW.action='dismissed'
    AND entity_key=('editorial-brief:' || NEW.brief_id)
    AND status IN ('pending','processing','failed');
END;

CREATE TRIGGER IF NOT EXISTS trg_editorial_brief_events_append_only_update
BEFORE UPDATE ON editorial_brief_events
BEGIN
  SELECT RAISE(ABORT, 'editorial_brief_events_append_only');
END;

CREATE TRIGGER IF NOT EXISTS trg_editorial_brief_events_append_only_delete
BEFORE DELETE ON editorial_brief_events
BEGIN
  SELECT RAISE(ABORT, 'editorial_brief_events_append_only');
END;
