import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const wrangler = 'node_modules/wrangler/bin/wrangler.js';
const persistPath = '.wrangler/state';
const payloadHash = 'runtime-zero-relevance-quality-smoke';

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
      '--json'
    ],
    { encoding: 'utf8' }
  );
  return JSON.parse(output);
}

function lastResult(executions) {
  const result = executions.at(-1);
  assert.equal(result?.success, true);
  return result.results || [];
}

execute(`
  DELETE FROM research_signals
  WHERE run_id IN (SELECT id FROM research_runs WHERE payload_hash='${payloadHash}');
  DELETE FROM research_runs WHERE payload_hash='${payloadHash}';
`);

execute(`
  INSERT INTO research_runs(
    source_system,schema_version,run_kind,query,generated_at,window_days,
    source_status_json,result_count,warning_count,payload_hash
  ) VALUES(
    'last30days','1.0','research','Holafly recent experiences',
    '2026-07-20T05:03:00.000Z',30,'{}',2,0,'${payloadHash}'
  );
`);

const runRows = lastResult(execute(`
  SELECT id FROM research_runs WHERE payload_hash='${payloadHash}' LIMIT 1;
`));
assert.equal(runRows.length, 1);
const runId = Number(runRows[0].id);
assert.ok(Number.isInteger(runId) && runId > 0);

execute(`
  INSERT INTO research_signals(
    run_id,signal_key,signal_type,topic,title,summary,source,url,published_at,
    engagement_json,relevance_score,momentum,corroboration_count,cluster_title
  ) VALUES(
    ${runId},'runtime-zero-relevance','comparison','Holafly recent experiences',
    'Wanted to share a recent experience seeing Shane at the Aristocrat in Austin',
    'A comedy show report unrelated to eSIM providers or travel connectivity.',
    'reddit','https://example.test/shane-gillis-austin','2026-07-02T02:00:00.000Z',
    '{}',0,NULL,0,''
  );

  INSERT INTO research_signals(
    run_id,signal_key,signal_type,topic,title,summary,source,url,published_at,
    engagement_json,relevance_score,momentum,corroboration_count,cluster_title
  ) VALUES(
    ${runId},'runtime-low-positive-relevance','comparison','Holafly recent experiences',
    'Holafly recent experience discussion',
    'A weak but non-zero relevance result kept for human review.',
    'reddit','https://example.test/holafly-low-relevance','2026-07-02T02:00:00.000Z',
    '{}',0.2,NULL,1,''
  );
`);

const signalRows = lastResult(execute(`
  SELECT signal_key,relevance_score,eligible_for_editorial,quality_flags_json,freshness_days
  FROM research_signals
  WHERE run_id=${runId}
  ORDER BY signal_key;
`));
assert.equal(signalRows.length, 2);

const lowPositive = signalRows.find((row) => row.signal_key === 'runtime-low-positive-relevance');
const zero = signalRows.find((row) => row.signal_key === 'runtime-zero-relevance');
assert.ok(lowPositive);
assert.ok(zero);

assert.equal(Number(zero.relevance_score), 0);
assert.equal(Number(zero.eligible_for_editorial), 0);
assert.equal(Number(zero.freshness_days), 18);
assert.ok(JSON.parse(String(zero.quality_flags_json)).includes('zero_relevance'));

assert.equal(Number(lowPositive.relevance_score), 0.2);
assert.equal(Number(lowPositive.eligible_for_editorial), 1);
assert.equal(JSON.parse(String(lowPositive.quality_flags_json)).includes('zero_relevance'), false);

const runQuality = lastResult(execute(`
  SELECT eligible_count,filtered_count
  FROM research_runs
  WHERE id=${runId};
`));
assert.equal(runQuality.length, 1);
assert.equal(Number(runQuality[0].eligible_count), 1);
assert.equal(Number(runQuality[0].filtered_count), 1);

console.log('Research zero-relevance D1 quality gate smoke passed.');
