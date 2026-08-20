import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const prototypePath = 'research/evidence/verification-provenance-bridge-v1.sql';
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'senza-roaming-verification-provenance-'));
const persistTo = path.join(temporaryRoot, 'd1');

function runWrangler(args, { expectSuccess = true } = {}) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      ASTRO_TELEMETRY_DISABLED: '1',
      CI: '1',
      WRANGLER_SEND_METRICS: 'false',
      WRANGLER_LOG_PATH: path.join(temporaryRoot, 'wrangler.log'),
    },
    maxBuffer: 25 * 1024 * 1024,
  });
  if (expectSuccess && result.status !== 0) {
    throw new Error(`Wrangler command failed:\n${result.stdout || ''}\n${result.stderr || ''}\n${result.error || ''}`);
  }
  return result;
}

function collectResultArrays(value, output) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectResultArrays(item, output);
    return;
  }
  if (Array.isArray(value.results)) {
    output.push(value.results);
    return;
  }
  if (value.result !== undefined) collectResultArrays(value.result, output);
}

function parseRows(stdout) {
  const payload = JSON.parse(stdout);
  const arrays = [];
  collectResultArrays(payload, arrays);
  return arrays.flat();
}

function execute(sql, options = {}) {
  return runWrangler([
    'd1', 'execute', 'DB', '--local', '--persist-to', persistTo,
    '--command', sql, '--json',
  ], options);
}

function query(sql) {
  return parseRows(execute(sql).stdout);
}

function expectFailure(label, sql, expectedFragment) {
  const result = execute(sql, { expectSuccess: false });
  assert.notEqual(result.status, 0, `${label}: command unexpectedly succeeded`);
  const diagnostic = `${result.stderr || ''}\n${result.stdout || ''}\n${result.error || ''}`;
  assert.match(diagnostic, new RegExp(expectedFragment), `${label}: unexpected error: ${diagnostic}`);
}

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function decisionSql({
  decisionKey,
  candidateKey,
  revision,
  outcome,
  fieldName,
  valueJson,
  decidedAt,
  validUntil = null,
  actorType = 'human',
  supersedesDecisionKey = null,
}) {
  const supersedes = supersedesDecisionKey
    ? `(SELECT id FROM evidence_verification_decisions WHERE decision_key=${sqlString(supersedesDecisionKey)})`
    : 'NULL';
  return `
    INSERT INTO evidence_verification_decisions(
      decision_key,primary_candidate_id,revision,outcome,subject_type,subject_key,
      field_name,scope_json,value_json,actor_type,decision_actor,decided_at,
      valid_until,rationale,supersedes_decision_id
    ) VALUES(
      ${sqlString(decisionKey)},
      (SELECT id FROM evidence_claim_candidates WHERE candidate_key=${sqlString(candidateKey)}),
      ${revision},${sqlString(outcome)},'plan','fixture:airalo:italy',
      ${sqlString(fieldName)},'{"region":"italy"}',${sqlString(valueJson)},
      ${sqlString(actorType)},'fixture-human-reviewer',${sqlString(decidedAt)},
      ${sqlString(validUntil)},'Fixture decision with explicit provenance.',${supersedes}
    );
  `;
}

function acceptCandidate(candidateKey, decidedAt) {
  execute(`
    UPDATE evidence_claim_candidates
    SET status='accepted_for_verification',
        decision_actor='fixture-human-reviewer',
        decision_notes='Accepted explicitly for local provenance verification.',
        decided_at=${sqlString(decidedAt)},
        updated_at=${sqlString(decidedAt)}
    WHERE candidate_key=${sqlString(candidateKey)};
  `);
}

try {
  const prototypeSql = await readFile(prototypePath, 'utf8');
  assert.match(prototypeSql, /Local-only schema prototype/);
  assert.doesNotMatch(prototypePath, /^migrations\//);

  runWrangler([
    'd1', 'migrations', 'apply', 'DB', '--local', '--persist-to', persistTo,
  ]);
  runWrangler([
    'd1', 'execute', 'DB', '--local', '--persist-to', persistTo,
    '--file', prototypePath, '--json',
  ]);

  const migrationState = query('SELECT COUNT(*) AS count, MAX(name) AS latest FROM d1_migrations;')[0];
  assert.deepEqual(migrationState, { count: 21, latest: '0021_evidence_upstream_storage.sql' });

  const claimVerificationsBefore = Number(query('SELECT COUNT(*) AS count FROM claim_verifications;')[0].count);
  const plansBefore = Number(query('SELECT COUNT(*) AS count FROM plans;')[0].count);
  const editorialCandidatesBefore = Number(query('SELECT COUNT(*) AS count FROM editorial_claim_candidates;')[0].count);

  execute(`
    INSERT INTO source_registry(
      entity_type,entity_key,source_kind,label,url,trust_level,freshness_days,status
    ) VALUES(
      'plan','fixture:airalo:italy','official_provider','Fixture source',
      'https://example.com/fixture-airalo-italy',5,7,'active'
    );

    INSERT INTO evidence_capture_runs(
      run_key,pack_schema_version,scenario_key,scenario_json,started_at,completed_at,
      capture_window_ms,source_count,pack_sha256,semantic_fingerprint
    ) VALUES(
      'fixture:verification:run',1,'fixture:italy','{}',
      '2026-08-20T10:00:00.000Z','2026-08-20T10:00:01.000Z',1000,1,
      'sha256:fixture-pack','sha256:fixture-semantic'
    );

    INSERT INTO evidence_snapshots(
      snapshot_key,capture_run_id,source_id,source_audit_key,requested_url,final_url,
      redirect_chain_json,fetched_at,http_status,content_type,capture_method,
      capture_context_json,body_sha256,byte_length,artifact_ref,parser_input_version,
      capture_warnings_json
    ) VALUES(
      'fixture:verification:snapshot',
      (SELECT id FROM evidence_capture_runs WHERE run_key='fixture:verification:run'),
      (SELECT id FROM source_registry WHERE url='https://example.com/fixture-airalo-italy'),
      'fixture-source','https://example.com/fixture-airalo-italy',
      'https://example.com/fixture-airalo-italy','[]','2026-08-20T10:00:00.000Z',
      200,'text/html','http_html','{}','sha256:fixture-body',100,
      'fixture://verification.html','fixture-v1','[]'
    );

    INSERT INTO evidence_field_observations(
      observation_key,snapshot_id,subject_type,subject_key,field_name,scope_json,
      coverage_state,raw_value_json,normalized_value_json,evidence_locator_json,
      extractor_id,extractor_version,schema_version,source_role,warnings_json,observed_at
    ) VALUES
    (
      'fixture:observation:price:32',
      (SELECT id FROM evidence_snapshots WHERE snapshot_key='fixture:verification:snapshot'),
      'plan','fixture:airalo:italy','price','{"region":"italy"}','observed',
      '"US$32"','{"amount":32,"currency":"USD"}','{}','fixture','1',1,
      'product_page','[]','2026-08-20T10:00:00.000Z'
    ),
    (
      'fixture:observation:price:35',
      (SELECT id FROM evidence_snapshots WHERE snapshot_key='fixture:verification:snapshot'),
      'plan','fixture:airalo:italy','price','{"region":"italy"}','observed',
      '"US$35"','{"amount":35,"currency":"USD"}','{}','fixture','1',1,
      'product_page','[]','2026-08-21T10:00:00.000Z'
    ),
    (
      'fixture:observation:data:partial',
      (SELECT id FROM evidence_snapshots WHERE snapshot_key='fixture:verification:snapshot'),
      'plan','fixture:airalo:italy','data_allowance','{"region":"italy"}','partial',
      '"unlimited"','{"kind":"unlimited"}','{}','fixture','1',1,
      'product_page','["fair_use_detail_missing"]','2026-08-20T10:00:00.000Z'
    );

    INSERT INTO evidence_claim_candidates(candidate_key,observation_id)
    VALUES
      ('fixture:candidate:price:32',(SELECT id FROM evidence_field_observations WHERE observation_key='fixture:observation:price:32')),
      ('fixture:candidate:price:35',(SELECT id FROM evidence_field_observations WHERE observation_key='fixture:observation:price:35')),
      ('fixture:candidate:data:partial',(SELECT id FROM evidence_field_observations WHERE observation_key='fixture:observation:data:partial'));
  `);

  expectFailure(
    'pending candidate cannot be verified',
    decisionSql({
      decisionKey: 'fixture:decision:pending',
      candidateKey: 'fixture:candidate:price:32',
      revision: 1,
      outcome: 'verified',
      fieldName: 'price',
      valueJson: '{"amount":32,"currency":"USD"}',
      decidedAt: '2026-08-20T11:00:00.000Z',
      validUntil: '2026-08-27T11:00:00.000Z',
    }),
    'evidence_verification_primary_candidate_invalid',
  );
  expectFailure(
    'status transition requires human audit',
    "UPDATE evidence_claim_candidates SET status='accepted_for_verification' WHERE candidate_key='fixture:candidate:price:32';",
    'evidence_candidate_status_requires_human_audit',
  );
  expectFailure(
    'invalid direct supersede transition',
    `
      UPDATE evidence_claim_candidates
      SET status='superseded',decision_actor='fixture-human-reviewer',
          decision_notes='Invalid shortcut.',decided_at='2026-08-20T10:30:00.000Z'
      WHERE candidate_key='fixture:candidate:price:32';
    `,
    'evidence_candidate_status_transition_invalid',
  );

  acceptCandidate('fixture:candidate:price:32', '2026-08-20T10:40:00.000Z');
  expectFailure(
    'decision metadata cannot be rewritten without a transition',
    `
      UPDATE evidence_claim_candidates
      SET decision_notes='Silent rewrite.'
      WHERE candidate_key='fixture:candidate:price:32';
    `,
    'evidence_candidate_decision_metadata_requires_transition',
  );

  execute(decisionSql({
    decisionKey: 'fixture:decision:price:v1',
    candidateKey: 'fixture:candidate:price:32',
    revision: 1,
    outcome: 'verified',
    fieldName: 'price',
    valueJson: '{"amount":32,"currency":"USD"}',
    decidedAt: '2026-08-20T11:00:00.000Z',
    validUntil: '2026-08-27T11:00:00.000Z',
  }));

  expectFailure(
    'decision is immutable on update',
    "UPDATE evidence_verification_decisions SET rationale='rewrite' WHERE decision_key='fixture:decision:price:v1';",
    'evidence_verification_decisions_immutable',
  );
  expectFailure(
    'decision is immutable on delete',
    "DELETE FROM evidence_verification_decisions WHERE decision_key='fixture:decision:price:v1';",
    'evidence_verification_decisions_immutable',
  );

  acceptCandidate('fixture:candidate:data:partial', '2026-08-20T10:41:00.000Z');
  expectFailure(
    'partial observation cannot become verified',
    decisionSql({
      decisionKey: 'fixture:decision:data:invalid-verified',
      candidateKey: 'fixture:candidate:data:partial',
      revision: 1,
      outcome: 'verified',
      fieldName: 'data_allowance',
      valueJson: '{"kind":"unlimited"}',
      decidedAt: '2026-08-20T11:01:00.000Z',
      validUntil: '2026-08-27T11:01:00.000Z',
    }),
    'evidence_verification_primary_candidate_invalid',
  );
  expectFailure(
    'non-human decision is rejected',
    decisionSql({
      decisionKey: 'fixture:decision:data:non-human',
      candidateKey: 'fixture:candidate:data:partial',
      revision: 1,
      outcome: 'insufficient',
      fieldName: 'data_allowance',
      valueJson: '{"kind":"unlimited"}',
      actorType: 'automation',
      decidedAt: '2026-08-20T11:02:00.000Z',
    }),
    'CHECK constraint failed',
  );
  execute(decisionSql({
    decisionKey: 'fixture:decision:data:insufficient',
    candidateKey: 'fixture:candidate:data:partial',
    revision: 1,
    outcome: 'insufficient',
    fieldName: 'data_allowance',
    valueJson: '{"kind":"unlimited"}',
    decidedAt: '2026-08-20T11:03:00.000Z',
  }));

  acceptCandidate('fixture:candidate:price:35', '2026-08-21T10:40:00.000Z');
  expectFailure(
    'second root for same fact identity is rejected',
    decisionSql({
      decisionKey: 'fixture:decision:price:second-root',
      candidateKey: 'fixture:candidate:price:35',
      revision: 1,
      outcome: 'verified',
      fieldName: 'price',
      valueJson: '{"amount":35,"currency":"USD"}',
      decidedAt: '2026-08-21T11:00:00.000Z',
      validUntil: '2026-08-28T11:00:00.000Z',
    }),
    'evidence_verification_root_already_exists',
  );
  execute(decisionSql({
    decisionKey: 'fixture:decision:price:v2',
    candidateKey: 'fixture:candidate:price:35',
    revision: 2,
    outcome: 'verified',
    fieldName: 'price',
    valueJson: '{"amount":35,"currency":"USD"}',
    decidedAt: '2026-08-21T11:00:00.000Z',
    validUntil: '2026-08-28T11:00:00.000Z',
    supersedesDecisionKey: 'fixture:decision:price:v1',
  }));
  execute(`
    INSERT INTO evidence_verification_decision_candidates(decision_id,candidate_id,relation,notes)
    VALUES(
      (SELECT id FROM evidence_verification_decisions WHERE decision_key='fixture:decision:price:v2'),
      (SELECT id FROM evidence_claim_candidates WHERE candidate_key='fixture:candidate:price:32'),
      'contradicts','Earlier accepted price differs from the new observation.'
    );
  `);

  expectFailure(
    'revision fork is rejected',
    decisionSql({
      decisionKey: 'fixture:decision:price:fork',
      candidateKey: 'fixture:candidate:price:35',
      revision: 2,
      outcome: 'contradicted',
      fieldName: 'price',
      valueJson: '{"amount":35,"currency":"USD"}',
      decidedAt: '2026-08-21T11:10:00.000Z',
      supersedesDecisionKey: 'fixture:decision:price:v1',
    }),
    'UNIQUE constraint failed',
  );
  execute(decisionSql({
    decisionKey: 'fixture:decision:price:v3-expired',
    candidateKey: 'fixture:candidate:price:35',
    revision: 3,
    outcome: 'expired',
    fieldName: 'price',
    valueJson: '{"amount":35,"currency":"USD"}',
    decidedAt: '2026-08-29T11:00:00.000Z',
    supersedesDecisionKey: 'fixture:decision:price:v2',
  }));
  expectFailure(
    'expiry may supersede only a verified decision',
    decisionSql({
      decisionKey: 'fixture:decision:data:invalid-expiry',
      candidateKey: 'fixture:candidate:data:partial',
      revision: 2,
      outcome: 'expired',
      fieldName: 'data_allowance',
      valueJson: '{"kind":"unlimited"}',
      decidedAt: '2026-08-29T11:01:00.000Z',
      supersedesDecisionKey: 'fixture:decision:data:insufficient',
    }),
    'evidence_verification_expiry_requires_verified',
  );
  expectFailure(
    'cross-field evidence link is rejected',
    `
      INSERT INTO evidence_verification_decision_candidates(decision_id,candidate_id,relation,notes)
      VALUES(
        (SELECT id FROM evidence_verification_decisions WHERE decision_key='fixture:decision:price:v2'),
        (SELECT id FROM evidence_claim_candidates WHERE candidate_key='fixture:candidate:data:partial'),
        'context','Invalid cross-field evidence.'
      );
    `,
    'evidence_verification_evidence_candidate_invalid',
  );

  const eventId = Number(query('SELECT id FROM evidence_claim_candidate_events ORDER BY id LIMIT 1;')[0].id);
  expectFailure(
    'candidate event is immutable on update',
    `UPDATE evidence_claim_candidate_events SET notes='rewrite' WHERE id=${eventId};`,
    'evidence_claim_candidate_events_immutable',
  );
  const edge = query(`
    SELECT decision_id,candidate_id
    FROM evidence_verification_decision_candidates
    ORDER BY decision_id,candidate_id LIMIT 1;
  `)[0];
  expectFailure(
    'decision evidence edge is immutable on delete',
    `
      DELETE FROM evidence_verification_decision_candidates
      WHERE decision_id=${Number(edge.decision_id)} AND candidate_id=${Number(edge.candidate_id)};
    `,
    'evidence_verification_decision_candidates_immutable',
  );

  assert.deepEqual(query(`
    SELECT field_name,revision,outcome,value_json
    FROM evidence_verification_current
    ORDER BY field_name;
  `), [
    {
      field_name: 'data_allowance',
      revision: 1,
      outcome: 'insufficient',
      value_json: '{"kind":"unlimited"}',
    },
    {
      field_name: 'price',
      revision: 3,
      outcome: 'expired',
      value_json: '{"amount":35,"currency":"USD"}',
    },
  ]);
  assert.deepEqual(query(`
    SELECT status,COUNT(*) AS count
    FROM evidence_claim_candidates
    GROUP BY status ORDER BY status;
  `), [{ status: 'accepted_for_verification', count: 3 }]);
  assert.equal(Number(query('SELECT COUNT(*) AS count FROM evidence_claim_candidate_events;')[0].count), 3);
  assert.equal(Number(query('SELECT COUNT(*) AS count FROM evidence_verification_decisions;')[0].count), 4);
  assert.equal(Number(query('SELECT COUNT(*) AS count FROM evidence_verification_decision_candidates;')[0].count), 5);
  assert.equal(Number(query('SELECT COUNT(*) AS count FROM claim_verifications;')[0].count), claimVerificationsBefore);
  assert.equal(Number(query('SELECT COUNT(*) AS count FROM plans;')[0].count), plansBefore);
  assert.equal(
    Number(query('SELECT COUNT(*) AS count FROM editorial_claim_candidates;')[0].count),
    editorialCandidatesBefore,
  );

  console.log('Evidence verification provenance smoke passed: human intake is audited, decisions/evidence are append-only and revisioned, partial cannot become verified, current heads are deterministic, and claim_verifications/plans remain unchanged.');
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
