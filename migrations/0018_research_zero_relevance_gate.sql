PRAGMA foreign_keys = ON;

-- A score of exactly zero is an explicit upstream statement that the result is not
-- relevant to the query. Keep the record for auditability, but remove it from the
-- editorial-eligible set unless a deliberate manual override already exists.
UPDATE research_signals
SET quality_flags_json = CASE
      WHEN instr(quality_flags_json, '"zero_relevance"') > 0 THEN quality_flags_json
      WHEN quality_flags_json = '[]' THEN '["zero_relevance"]'
      ELSE substr(quality_flags_json, 1, length(quality_flags_json) - 1) || ',"zero_relevance"]'
    END,
    eligible_for_editorial = CASE
      WHEN instr(quality_flags_json, '"manual_quality_override"') > 0
      THEN eligible_for_editorial
      ELSE 0
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE relevance_score IS NOT NULL
  AND relevance_score <= 0;

UPDATE research_runs
SET eligible_count = (
      SELECT COUNT(*) FROM research_signals s
      WHERE s.run_id = research_runs.id AND s.eligible_for_editorial = 1
    ),
    filtered_count = (
      SELECT COUNT(*) FROM research_signals s
      WHERE s.run_id = research_runs.id AND s.eligible_for_editorial = 0
    );

-- Replace the original insert trigger so future writers receive the same hard gate
-- at the database boundary. Low-but-positive relevance remains advisory.
DROP TRIGGER IF EXISTS trg_research_signal_quality_after_insert;

CREATE TRIGGER trg_research_signal_quality_after_insert
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
        WHEN NEW.relevance_score IS NOT NULL AND NEW.relevance_score <= 0
        THEN 0
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
        THEN CASE
          WHEN NEW.relevance_score IS NOT NULL AND NEW.relevance_score <= 0
          THEN '["outside_recent_window","zero_relevance"]'
          ELSE '["outside_recent_window"]'
        END
        WHEN NEW.published_at IS NOT NULL
         AND julianday(NEW.published_at) IS NOT NULL
         AND CAST(
           julianday((SELECT r.generated_at FROM research_runs r WHERE r.id = NEW.run_id))
           - julianday(NEW.published_at)
           AS INTEGER
         ) < -2
        THEN CASE
          WHEN NEW.relevance_score IS NOT NULL AND NEW.relevance_score <= 0
          THEN '["future_dated","zero_relevance"]'
          ELSE '["future_dated"]'
        END
        WHEN NEW.published_at IS NULL
        THEN CASE
          WHEN NEW.relevance_score IS NOT NULL AND NEW.relevance_score <= 0
          THEN '["missing_published_at","zero_relevance"]'
          ELSE '["missing_published_at"]'
        END
        WHEN NEW.relevance_score IS NOT NULL AND NEW.relevance_score <= 0
        THEN '["zero_relevance"]'
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
