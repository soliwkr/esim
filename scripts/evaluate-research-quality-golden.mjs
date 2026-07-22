import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const wrangler = 'node_modules/wrangler/bin/wrangler.js';
const persistPath = '.wrangler/state';
const fixturePath = 'tests/fixtures/research-quality-golden.json';
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
const payloadHash = `research-quality-golden-${fixture.schemaVersion}`;

function execute(sql) {
  const output = execFileSync(
    process.execPath,
    [
      wrangler,
      'd1',
      'execute',
      'DB',
      '--local',
      '--persist-to',
      persistPath,
      '--command',
      sql,
      '--json',
    ],
    { encoding: 'utf8' },
  );
  return JSON.parse(output);
}

function lastResult(executions) {
  const result = executions.at(-1);
  assert.equal(result?.success, true);
  return result.results || [];
}

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function cleanup() {
  execute(`
    DELETE FROM research_signals
    WHERE run_id IN (SELECT id FROM research_runs WHERE payload_hash=${sqlString(payloadHash)});
    DELETE FROM research_runs WHERE payload_hash=${sqlString(payloadHash)};
  `);
}

function validateFixture() {
  assert.equal(fixture.schemaVersion, '1.0');
  assert.ok(Array.isArray(fixture.cases) && fixture.cases.length > 0);
  assert.equal(typeof fixture.run.query, 'string');
  assert.ok(Array.isArray(fixture.run.anchors) && fixture.run.anchors.length > 0);
  for (const anchor of fixture.run.anchors) {
    assert.equal(typeof anchor, 'string');
    assert.ok(anchor.length >= 3);
  }
  assert.equal(typeof fixture.run.generatedAt, 'string');
  assert.ok(Number.isInteger(fixture.run.windowDays) && fixture.run.windowDays > 0);

  const ids = new Set();
  for (const entry of fixture.cases) {
    assert.equal(typeof entry.id, 'string');
    assert.equal(ids.has(entry.id), false, `Duplicate golden case id: ${entry.id}`);
    ids.add(entry.id);
    assert.equal(typeof entry.title, 'string');
    assert.equal(typeof entry.summary, 'string');
    assert.equal(typeof entry.source, 'string');
    assert.ok(entry.publishedAt === null || typeof entry.publishedAt === 'string');
    assert.equal(typeof entry.relevanceScore, 'number');
    assert.ok(entry.relevanceScore >= 0 && entry.relevanceScore <= 1);
    assert.equal(typeof entry.expectedCurrentGateEligible, 'boolean');
    assert.equal(typeof entry.expectedEditorialEligible, 'boolean');
    assert.ok(Array.isArray(entry.expectedFlags));
  }
}

validateFixture();
cleanup();

let runId;
try {
  execute(`
    INSERT INTO research_runs(
      source_system,schema_version,run_kind,query,generated_at,window_days,
      topic_anchors_json,source_status_json,result_count,warning_count,payload_hash
    ) VALUES(
      'golden_fixture','1.0','research',${sqlString(fixture.run.query)},
      ${sqlString(fixture.run.generatedAt)},${fixture.run.windowDays},
      ${sqlString(JSON.stringify(fixture.run.anchors))},'{}',
      ${fixture.cases.length},0,${sqlString(payloadHash)}
    );
  `);

  const runRows = lastResult(execute(`
    SELECT id,topic_anchors_json
    FROM research_runs
    WHERE payload_hash=${sqlString(payloadHash)}
    LIMIT 1;
  `));
  assert.equal(runRows.length, 1);
  runId = Number(runRows[0].id);
  assert.ok(Number.isInteger(runId) && runId > 0);
  assert.deepEqual(JSON.parse(String(runRows[0].topic_anchors_json)), fixture.run.anchors);

  for (const entry of fixture.cases) {
    execute(`
      INSERT INTO research_signals(
        run_id,signal_key,signal_type,topic,title,summary,source,url,published_at,
        engagement_json,relevance_score,momentum,corroboration_count,cluster_title
      ) VALUES(
        ${runId},${sqlString(`golden:${entry.id}`)},'comparison',${sqlString(fixture.run.query)},
        ${sqlString(entry.title)},${sqlString(entry.summary)},${sqlString(entry.source)},
        ${sqlString(`https://example.test/golden/${entry.id}`)},${sqlString(entry.publishedAt)},
        '{}',${entry.relevanceScore},NULL,0,''
      );
    `);
  }

  const rows = lastResult(execute(`
    SELECT signal_key,relevance_score,eligible_for_editorial,quality_flags_json,freshness_days
    FROM research_signals
    WHERE run_id=${runId}
    ORDER BY signal_key;
  `));
  assert.equal(rows.length, fixture.cases.length);

  const rowById = new Map(rows.map((row) => [String(row.signal_key).replace(/^golden:/, ''), row]));
  const confusion = {
    truePositive: 0,
    falsePositive: 0,
    trueNegative: 0,
    falseNegative: 0,
  };
  const falsePositiveIds = [];
  const falseNegativeIds = [];

  for (const entry of fixture.cases) {
    const row = rowById.get(entry.id);
    assert.ok(row, `Missing D1 result for golden case ${entry.id}`);

    const actualEligible = Number(row.eligible_for_editorial) === 1;
    assert.equal(
      actualEligible,
      entry.expectedCurrentGateEligible,
      `Current gate characterization changed for ${entry.id}`,
    );

    const actualFlags = JSON.parse(String(row.quality_flags_json));
    assert.ok(Array.isArray(actualFlags));
    for (const expectedFlag of entry.expectedFlags) {
      assert.ok(actualFlags.includes(expectedFlag), `${entry.id} is missing ${expectedFlag}`);
    }

    if (actualEligible && entry.expectedEditorialEligible) confusion.truePositive += 1;
    else if (actualEligible && !entry.expectedEditorialEligible) {
      confusion.falsePositive += 1;
      falsePositiveIds.push(entry.id);
    } else if (!actualEligible && !entry.expectedEditorialEligible) confusion.trueNegative += 1;
    else {
      confusion.falseNegative += 1;
      falseNegativeIds.push(entry.id);
    }
  }

  assert.deepEqual(confusion, fixture.baseline);

  const runQuality = lastResult(execute(`
    SELECT eligible_count,filtered_count
    FROM research_runs
    WHERE id=${runId};
  `));
  assert.equal(runQuality.length, 1);
  assert.equal(
    Number(runQuality[0].eligible_count),
    fixture.cases.filter((entry) => entry.expectedCurrentGateEligible).length,
  );
  assert.equal(
    Number(runQuality[0].filtered_count),
    fixture.cases.filter((entry) => !entry.expectedCurrentGateEligible).length,
  );

  const precisionDenominator = confusion.truePositive + confusion.falsePositive;
  const recallDenominator = confusion.truePositive + confusion.falseNegative;
  const precision = precisionDenominator ? confusion.truePositive / precisionDenominator : 1;
  const recall = recallDenominator ? confusion.truePositive / recallDenominator : 1;

  assert.equal(precision, 1);
  assert.equal(recall, 1);

  console.log(JSON.stringify({
    fixture: fixturePath,
    cases: fixture.cases.length,
    anchors: fixture.run.anchors,
    confusion,
    precision,
    recall,
    knownFalsePositives: falsePositiveIds,
    knownFalseNegatives: falseNegativeIds,
  }, null, 2));
  console.log('Research topic-anchor gate passed the human-labelled golden set.');
} finally {
  cleanup();
}
