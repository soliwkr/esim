PRAGMA foreign_keys = ON;

ALTER TABLE editorial_briefs ADD COLUMN decision_actor TEXT;
ALTER TABLE editorial_briefs ADD COLUMN decided_at TEXT;

-- One append-only human decision per brief. Conversion is a later, distinct gate.
CREATE TABLE IF NOT EXISTS editorial_brief_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brief_id INTEGER NOT NULL UNIQUE,
  action TEXT NOT NULL CHECK(action IN ('accepted','dismissed')),
  actor TEXT NOT NULL CHECK(length(trim(actor)) BETWEEN 1 AND 320),
  notes TEXT NOT NULL DEFAULT '' CHECK(length(notes) <= 4000),
  details_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(details_json)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(brief_id) REFERENCES editorial_briefs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editorial_brief_events_created
  ON editorial_brief_events(created_at DESC, id DESC);

-- Preserve already-observed states without inventing the original actor or timestamp.
UPDATE editorial_briefs
SET decision_actor='migration-0020-backfill',
    decided_at=CURRENT_TIMESTAMP
WHERE status IN ('accepted','dismissed','converted')
  AND decision_actor IS NULL;

INSERT OR IGNORE INTO editorial_brief_events(
  brief_id, action, actor, notes, details_json, created_at
)
SELECT
  id,
  CASE WHEN status='dismissed' THEN 'dismissed' ELSE 'accepted' END,
  COALESCE(NULLIF(trim(decision_actor),''),'migration-0020-backfill'),
  COALESCE(notes,''),
  json_object('backfilled',1,'sourceStatus',status),
  COALESCE(decided_at,CURRENT_TIMESTAMP)
FROM editorial_briefs
WHERE status IN ('accepted','dismissed','converted');

-- Legal state machine:
-- proposed -> accepted | dismissed
-- accepted -> converted
-- retries that keep the same state remain harmless.
CREATE TRIGGER IF NOT EXISTS trg_editorial_brief_status_transition
BEFORE UPDATE OF status ON editorial_briefs
WHEN NEW.status<>OLD.status
  AND NOT (
    (OLD.status='proposed' AND NEW.status IN ('accepted','dismissed'))
    OR (OLD.status='accepted' AND NEW.status='converted')
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid_editorial_brief_transition');
END;

CREATE TRIGGER IF NOT EXISTS trg_editorial_brief_decision_audit
AFTER UPDATE OF status ON editorial_briefs
WHEN OLD.status='proposed' AND NEW.status IN ('accepted','dismissed')
BEGIN
  INSERT INTO editorial_brief_events(
    brief_id, action, actor, notes, details_json, created_at
  ) VALUES (
    NEW.id,
    NEW.status,
    COALESCE(NULLIF(trim(NEW.decision_actor),''),'maintenance-api'),
    COALESCE(NEW.notes,''),
    json_object('backfilled',0,'sourceStatus',OLD.status),
    COALESCE(NEW.decided_at,CURRENT_TIMESTAMP)
  );

  UPDATE editorial_briefs
  SET decision_actor=COALESCE(NULLIF(trim(NEW.decision_actor),''),'maintenance-api'),
      decided_at=COALESCE(NEW.decided_at,CURRENT_TIMESTAMP)
  WHERE id=NEW.id;

  UPDATE maintenance_queue
  SET status='cancelled',
      completed_at=CURRENT_TIMESTAMP,
      updated_at=CURRENT_TIMESTAMP
  WHERE NEW.status='dismissed'
    AND entity_key=('editorial-brief:' || NEW.id)
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
