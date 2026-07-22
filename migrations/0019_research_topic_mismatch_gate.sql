PRAGMA foreign_keys = ON;

-- New normalized runs persist a small, deterministic set of informative query
-- anchors. Existing runs keep an empty array and are not reclassified by this
-- migration.
ALTER TABLE research_runs ADD COLUMN topic_anchors_json TEXT NOT NULL DEFAULT '[]'
  CHECK(json_valid(topic_anchors_json) AND json_type(topic_anchors_json) = 'array');

-- Replace the current insert trigger. Freshness and explicit zero relevance remain
-- hard failures. When a run has informative anchors, at least one anchor must occur
-- in the signal title or summary. Discovery runs intentionally persist no anchors.
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
        WHEN EXISTS (
          SELECT 1
          FROM json_each(COALESCE(
            (SELECT r.topic_anchors_json FROM research_runs r WHERE r.id = NEW.run_id),
            '[]'
          ))
        )
        AND NOT EXISTS (
          SELECT 1
          FROM json_each(COALESCE(
            (SELECT r.topic_anchors_json FROM research_runs r WHERE r.id = NEW.run_id),
            '[]'
          )) AS anchor
          WHERE instr(
            lower(COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.summary, '')),
            lower(CAST(anchor.value AS TEXT))
          ) > 0
        )
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
      quality_flags_json = (
        SELECT COALESCE(json_group_array(flag), '[]')
        FROM (
          SELECT 'outside_recent_window' AS flag
          WHERE NEW.published_at IS NOT NULL
            AND julianday(NEW.published_at) IS NOT NULL
            AND CAST(
              julianday((SELECT r.generated_at FROM research_runs r WHERE r.id = NEW.run_id))
              - julianday(NEW.published_at)
              AS INTEGER
            ) > COALESCE((SELECT r.window_days FROM research_runs r WHERE r.id = NEW.run_id), 30) + 7

          UNION ALL

          SELECT 'future_dated'
          WHERE NEW.published_at IS NOT NULL
            AND julianday(NEW.published_at) IS NOT NULL
            AND CAST(
              julianday((SELECT r.generated_at FROM research_runs r WHERE r.id = NEW.run_id))
              - julianday(NEW.published_at)
              AS INTEGER
            ) < -2

          UNION ALL

          SELECT 'missing_published_at'
          WHERE NEW.published_at IS NULL

          UNION ALL

          SELECT 'zero_relevance'
          WHERE NEW.relevance_score IS NOT NULL AND NEW.relevance_score <= 0

          UNION ALL

          SELECT 'topic_mismatch'
          WHERE EXISTS (
            SELECT 1
            FROM json_each(COALESCE(
              (SELECT r.topic_anchors_json FROM research_runs r WHERE r.id = NEW.run_id),
              '[]'
            ))
          )
          AND NOT EXISTS (
            SELECT 1
            FROM json_each(COALESCE(
              (SELECT r.topic_anchors_json FROM research_runs r WHERE r.id = NEW.run_id),
              '[]'
            )) AS anchor
            WHERE instr(
              lower(COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.summary, '')),
              lower(CAST(anchor.value AS TEXT))
            ) > 0
          )
        )
      )
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
