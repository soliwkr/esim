PRAGMA foreign_keys = ON;

-- Keep every normalized signal for auditability, but separate recent editorial evidence
-- from stale or malformed results returned by upstream search engines.
ALTER TABLE research_runs ADD COLUMN eligible_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE research_runs ADD COLUMN filtered_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE research_signals ADD COLUMN freshness_days INTEGER;
ALTER TABLE research_signals ADD COLUMN quality_flags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE research_signals ADD COLUMN eligible_for_editorial INTEGER NOT NULL DEFAULT 1
  CHECK(eligible_for_editorial IN (0,1));

CREATE INDEX IF NOT EXISTS idx_research_signals_eligibility
  ON research_signals(eligible_for_editorial, status, relevance_score DESC, created_at DESC);

-- Backfill existing rows. A seven-day grace period absorbs indexing and timezone drift.
UPDATE research_signals
SET freshness_days = CAST(
  julianday((SELECT r.generated_at FROM research_runs r WHERE r.id = research_signals.run_id))
  - julianday(published_at)
  AS INTEGER
)
WHERE published_at IS NOT NULL
  AND julianday(published_at) IS NOT NULL;

UPDATE research_signals
SET eligible_for_editorial = CASE
      WHEN freshness_days IS NOT NULL
       AND freshness_days > COALESCE((SELECT r.window_days FROM research_runs r WHERE r.id = research_signals.run_id), 30) + 7
      THEN 0
      WHEN freshness_days IS NOT NULL AND freshness_days < -2
      THEN 0
      ELSE 1
    END,
    quality_flags_json = CASE
      WHEN freshness_days IS NOT NULL
       AND freshness_days > COALESCE((SELECT r.window_days FROM research_runs r WHERE r.id = research_signals.run_id), 30) + 7
      THEN '["outside_recent_window"]'
      WHEN freshness_days IS NOT NULL AND freshness_days < -2
      THEN '["future_dated"]'
      WHEN published_at IS NULL
      THEN '["missing_published_at"]'
      ELSE '[]'
    END;

UPDATE research_runs
SET eligible_count = (
      SELECT COUNT(*) FROM research_signals s
      WHERE s.run_id = research_runs.id AND s.eligible_for_editorial = 1
    ),
    filtered_count = (
      SELECT COUNT(*) FROM research_signals s
      WHERE s.run_id = research_runs.id AND s.eligible_for_editorial = 0
    );

-- Future inserts continue to use the existing normalizer. The database applies the
-- hard freshness gate even when an older application version writes the row.
CREATE TRIGGER IF NOT EXISTS trg_research_signal_quality_after_insert
AFTER INSERT ON research_signals
BEGIN
  UPDATE research_signals
  SET freshness_days = CASE
        WHEN NEW.published_at IS NOT NULL AND julianday(NEW.published_at) IS NOT NULL
        THEN CAST(
          julianday((SELECT r.generated_at FROM research_runs r WHERE r.id = NEW.run_id))
          - julianday(NEW.published_at)
          AS INTEGER
        )
        ELSE NULL
      END,
      eligible_for_editorial = CASE
        WHEN NEW.published_at IS NOT NULL
         AND julianday(NEW.published_at) IS NOT NULL
         AND CAST(
           julianday((SELECT r.generated_at FROM research_runs r WHERE r.id = NEW.run_id))
           - julianday(NEW.published_at)
           AS INTEGER
         ) > COALESCE((SELECT r.window_days FROM research_runs r WHERE r.id = NEW.run_id), 30) + 7
        THEN 0
        WHEN NEW.published_at IS NOT NULL
         AND julianday(NEW.published_at) IS NOT NULL
         AND CAST(
           julianday((SELECT r.generated_at FROM research_runs r WHERE r.id = NEW.run_id))
           - julianday(NEW.published_at)
           AS INTEGER
         ) < -2
        THEN 0
        ELSE 1
      END,
      quality_flags_json = CASE
        WHEN NEW.published_at IS NOT NULL
         AND julianday(NEW.published_at) IS NOT NULL
         AND CAST(
           julianday((SELECT r.generated_at FROM research_runs r WHERE r.id = NEW.run_id))
           - julianday(NEW.published_at)
           AS INTEGER
         ) > COALESCE((SELECT r.window_days FROM research_runs r WHERE r.id = NEW.run_id), 30) + 7
        THEN '["outside_recent_window"]'
        WHEN NEW.published_at IS NOT NULL
         AND julianday(NEW.published_at) IS NOT NULL
         AND CAST(
           julianday((SELECT r.generated_at FROM research_runs r WHERE r.id = NEW.run_id))
           - julianday(NEW.published_at)
           AS INTEGER
         ) < -2
        THEN '["future_dated"]'
        WHEN NEW.published_at IS NULL
        THEN '["missing_published_at"]'
        ELSE '[]'
      END
  WHERE id = NEW.id;

  UPDATE research_runs
  SET eligible_count = (
        SELECT COUNT(*) FROM research_signals s
        WHERE s.run_id = NEW.run_id AND s.eligible_for_editorial = 1
      ),
      filtered_count = (
        SELECT COUNT(*) FROM research_signals s
        WHERE s.run_id = NEW.run_id AND s.eligible_for_editorial = 0
      )
  WHERE id = NEW.run_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_research_signal_counts_after_eligibility_update
AFTER UPDATE OF eligible_for_editorial ON research_signals
BEGIN
  UPDATE research_runs
  SET eligible_count = (
        SELECT COUNT(*) FROM research_signals s
        WHERE s.run_id = NEW.run_id AND s.eligible_for_editorial = 1
      ),
      filtered_count = (
        SELECT COUNT(*) FROM research_signals s
        WHERE s.run_id = NEW.run_id AND s.eligible_for_editorial = 0
      )
  WHERE id = NEW.run_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_research_signal_counts_after_delete
AFTER DELETE ON research_signals
BEGIN
  UPDATE research_runs
  SET eligible_count = (
        SELECT COUNT(*) FROM research_signals s
        WHERE s.run_id = OLD.run_id AND s.eligible_for_editorial = 1
      ),
      filtered_count = (
        SELECT COUNT(*) FROM research_signals s
        WHERE s.run_id = OLD.run_id AND s.eligible_for_editorial = 0
      )
  WHERE id = OLD.run_id;
END;

-- Filtered evidence can be reviewed or dismissed, but it cannot silently become an
-- accepted editorial source. A deliberate override must first restore eligibility.
CREATE TRIGGER IF NOT EXISTS trg_research_signal_block_ineligible_accept
BEFORE UPDATE OF status ON research_signals
WHEN NEW.eligible_for_editorial = 0
 AND NEW.status IN ('accepted','converted')
BEGIN
  SELECT RAISE(ABORT, 'ineligible_signal_quality_gate');
END;
