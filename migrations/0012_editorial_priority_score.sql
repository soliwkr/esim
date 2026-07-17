PRAGMA foreign_keys = ON;

-- Keep editorial potential separate from evidence strength and operational priority.
-- opportunity_score is proposed by the model; evidence_score is deterministic;
-- priority_score decides how high the brief should appear in the work queue.
ALTER TABLE editorial_briefs ADD COLUMN priority_score INTEGER NOT NULL DEFAULT 50
  CHECK(priority_score BETWEEN 0 AND 100);
ALTER TABLE editorial_briefs ADD COLUMN score_explanation_json TEXT NOT NULL DEFAULT '{}';

-- Backfill existing briefs with priority-v1:
-- 55% opportunity + 45% evidence, minus deterministic quality penalties.
UPDATE editorial_briefs
SET priority_score = MAX(0, MIN(100, CAST(ROUND(
      opportunity_score * 0.55
    + evidence_score * 0.45
    - CASE WHEN instr(quality_flags_json, '"uncorroborated"') > 0 THEN 8 ELSE 0 END
    - CASE WHEN instr(quality_flags_json, '"low_relevance"') > 0 THEN 8 ELSE 0 END
    - CASE WHEN instr(quality_flags_json, '"promotional_or_sponsored"') > 0 THEN 12 ELSE 0 END
    - CASE WHEN instr(quality_flags_json, '"weak_evidence"') > 0 THEN 6 ELSE 0 END
  ) AS INTEGER))),
    score_explanation_json = json_object(
      'formulaVersion', 'priority-v1',
      'opportunityWeight', 0.55,
      'evidenceWeight', 0.45,
      'uncorroboratedPenalty', CASE WHEN instr(quality_flags_json, '"uncorroborated"') > 0 THEN 8 ELSE 0 END,
      'lowRelevancePenalty', CASE WHEN instr(quality_flags_json, '"low_relevance"') > 0 THEN 8 ELSE 0 END,
      'promotionalPenalty', CASE WHEN instr(quality_flags_json, '"promotional_or_sponsored"') > 0 THEN 12 ELSE 0 END,
      'weakEvidencePenalty', CASE WHEN instr(quality_flags_json, '"weak_evidence"') > 0 THEN 6 ELSE 0 END
    );

CREATE INDEX IF NOT EXISTS idx_editorial_briefs_priority
  ON editorial_briefs(status, priority_score DESC, opportunity_score DESC, evidence_score DESC, created_at DESC);

-- Recalibrate already-created review tasks so a high model score cannot outrank
-- stronger evidence by itself.
UPDATE maintenance_queue
SET priority = COALESCE((
      SELECT b.priority_score
      FROM editorial_briefs b
      WHERE b.id = CAST(substr(maintenance_queue.entity_key, 17) AS INTEGER)
    ), priority),
    payload_json = CASE
      WHEN json_valid(payload_json) THEN json_set(
        payload_json,
        '$.priorityScore', COALESCE((
          SELECT b.priority_score
          FROM editorial_briefs b
          WHERE b.id = CAST(substr(maintenance_queue.entity_key, 17) AS INTEGER)
        ), priority),
        '$.priorityFormulaVersion', 'priority-v1'
      )
      ELSE payload_json
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE entity_key LIKE 'editorial-brief:%';

-- Future application versions may still omit priority_score. D1 remains the final
-- enforcement layer and recalculates it from stored scores and flags.
CREATE TRIGGER IF NOT EXISTS trg_editorial_brief_priority_after_insert
AFTER INSERT ON editorial_briefs
BEGIN
  UPDATE editorial_briefs
  SET priority_score = MAX(0, MIN(100, CAST(ROUND(
        NEW.opportunity_score * 0.55
      + NEW.evidence_score * 0.45
      - CASE WHEN instr(NEW.quality_flags_json, '"uncorroborated"') > 0 THEN 8 ELSE 0 END
      - CASE WHEN instr(NEW.quality_flags_json, '"low_relevance"') > 0 THEN 8 ELSE 0 END
      - CASE WHEN instr(NEW.quality_flags_json, '"promotional_or_sponsored"') > 0 THEN 12 ELSE 0 END
      - CASE WHEN instr(NEW.quality_flags_json, '"weak_evidence"') > 0 THEN 6 ELSE 0 END
    ) AS INTEGER))),
      score_explanation_json = json_object(
        'formulaVersion', 'priority-v1',
        'opportunityWeight', 0.55,
        'evidenceWeight', 0.45,
        'uncorroboratedPenalty', CASE WHEN instr(NEW.quality_flags_json, '"uncorroborated"') > 0 THEN 8 ELSE 0 END,
        'lowRelevancePenalty', CASE WHEN instr(NEW.quality_flags_json, '"low_relevance"') > 0 THEN 8 ELSE 0 END,
        'promotionalPenalty', CASE WHEN instr(NEW.quality_flags_json, '"promotional_or_sponsored"') > 0 THEN 12 ELSE 0 END,
        'weakEvidencePenalty', CASE WHEN instr(NEW.quality_flags_json, '"weak_evidence"') > 0 THEN 6 ELSE 0 END
      )
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_editorial_queue_priority_after_insert
AFTER INSERT ON maintenance_queue
WHEN NEW.entity_key LIKE 'editorial-brief:%'
BEGIN
  UPDATE maintenance_queue
  SET priority = COALESCE((
        SELECT b.priority_score
        FROM editorial_briefs b
        WHERE b.id = CAST(substr(NEW.entity_key, 17) AS INTEGER)
      ), NEW.priority),
      payload_json = CASE
        WHEN json_valid(NEW.payload_json) THEN json_set(
          NEW.payload_json,
          '$.priorityScore', COALESCE((
            SELECT b.priority_score
            FROM editorial_briefs b
            WHERE b.id = CAST(substr(NEW.entity_key, 17) AS INTEGER)
          ), NEW.priority),
          '$.priorityFormulaVersion', 'priority-v1'
        )
        ELSE NEW.payload_json
      END,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;
