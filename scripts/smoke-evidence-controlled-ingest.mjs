import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildEvidenceImportBatchSql,
  buildEvidenceImportSql,
} from './evidence-pack-importer.mjs';
import {
  EXPECTED_AUTHORIZATION,
  validateControlledIngestAuthorization,
  validateControlledIngestPostWrite,
  validateControlledIngestPreWrite,
  validateControlledIngestSql,
} from './evidence-controlled-ingest.mjs';

const authorization = structuredClone(EXPECTED_AUTHORIZATION);
assert.equal(validateControlledIngestAuthorization(authorization), true);
assert.throws(
  () => validateControlledIngestAuthorization({ ...authorization, deployAuthorized: true }),
  /controlled_ingest_authorization_deployAuthorized_mismatch/,
);

function context({ postWrite = false } = {}) {
  const rows = postWrite ? authorization.expectedInsertTotals : authorization.expectedExistingRows;
  return {
    stagingPolicy: {
      captureRunId: authorization.captureRunId,
      artifactId: authorization.artifactId,
      zipSha256: authorization.zipSha256,
      approvedPacks: authorization.approvedPackIds.map((packId) => ({ packId })),
    },
    r2: { uniqueObjectCount: 13 },
    registryRows: Array.from({ length: 15 }, () => ({})),
    reconciliation: { sources: Array.from({ length: 9 }, () => ({})) },
    migration: { count: 21, latestName: '0021_evidence_upstream_storage.sql' },
    remoteState: {
      runs: Array.from({ length: rows.runs }, () => ({})),
      snapshots: Array.from({ length: rows.snapshots }, () => ({})),
      observations: Array.from({ length: rows.observations }, () => ({})),
      candidates: Array.from({ length: rows.candidates }, () => ({})),
    },
    plan: {
      plans: authorization.approvedPackIds.map((packId, index) => ({
        packId,
        runKey: `run:${index}`,
        action: postWrite ? 'existing_exact' : 'insert',
        inserted: postWrite
          ? { runs: 0, snapshots: 0, observations: 0, candidates: 0 }
          : index === 0
            ? { runs: 1, snapshots: 6, observations: 33, candidates: 25 }
            : { runs: 1, snapshots: 6, observations: 39, candidates: 27 },
      })),
      plannedInsertTotals: postWrite
        ? { runs: 0, snapshots: 0, observations: 0, candidates: 0 }
        : authorization.expectedInsertTotals,
    },
  };
}

assert.equal(validateControlledIngestPreWrite(context(), authorization), true);
assert.equal(validateControlledIngestPostWrite(context({ postWrite: true }), authorization), true);
const drifted = context();
drifted.remoteState.runs.push({});
assert.throws(
  () => validateControlledIngestPreWrite(drifted, authorization),
  /controlled_ingest_existing_rows_runs_mismatch/,
);

function model(packIndex, observationCount, candidateCount) {
  const snapshots = Array.from({ length: 6 }, (_, index) => ({
    snapshot_key: `snapshot:${packIndex}:${index}`,
    source_id: index + 1,
    source_audit_key: `source:${index}`,
    requested_url: `https://example.com/${packIndex}/${index}`,
    final_url: `https://example.com/${packIndex}/${index}`,
    redirect_chain_json: '[]',
    fetched_at: '2026-08-20T00:00:00.000Z',
    http_status: 200,
    content_type: 'text/html',
    capture_method: 'http_html',
    capture_context_json: '{}',
    body_sha256: `sha256:${String(packIndex).repeat(64)}`,
    byte_length: 1,
    artifact_ref: `r2://evidence-artifacts/raw/${packIndex}/${index}`,
    parser_input_version: 'fixture-v1',
    capture_warnings_json: '[]',
  }));
  const observations = Array.from({ length: observationCount }, (_, index) => ({
    observation_key: `observation:${packIndex}:${index}`,
    anchor_snapshot_key: snapshots[index % snapshots.length].snapshot_key,
    subject_type: 'plan',
    subject_key: `subject:${packIndex}:${index}`,
    field_name: 'price',
    scope_json: '{}',
    coverage_state: 'observed',
    raw_value_json: '1',
    normalized_value_json: '1',
    evidence_locator_json: '{}',
    extractor_id: 'fixture',
    extractor_version: '1',
    schema_version: 1,
    source_role: 'product_page',
    warnings_json: '[]',
    observed_at: '2026-08-20T00:00:00.000Z',
  }));
  const candidates = Array.from({ length: candidateCount }, (_, index) => ({
    candidate_key: `candidate:${packIndex}:${index}`,
    observation_key: observations[index].observation_key,
    status: 'pending',
    decision_notes: '',
  }));
  return {
    run: {
      run_key: `run:${packIndex}`,
      pack_schema_version: 1,
      scenario_key: `scenario:${packIndex}`,
      scenario_json: '{}',
      started_at: '2026-08-20T00:00:00.000Z',
      completed_at: '2026-08-20T00:00:01.000Z',
      capture_window_ms: 1000,
      source_count: 6,
      pack_sha256: `sha256:${String(packIndex).repeat(64)}`,
      semantic_fingerprint: `sha256:${String(packIndex + 2).repeat(64)}`,
    },
    snapshots,
    observations,
    candidates,
  };
}

const models = [model(1, 33, 25), model(2, 39, 27)];
const plans = context().plan.plans;
const sql = buildEvidenceImportBatchSql(models.map((entry, index) => ({ model: entry, plan: plans[index] })));
const sqlContract = validateControlledIngestSql(sql, authorization);
assert.deepEqual(sqlContract.counts, authorization.expectedInsertTotals);
assert.equal(sqlContract.insertTargets.length, 138);
assert.doesNotMatch(sql, /(?:^|\n)\s*(?:BEGIN|COMMIT)\b/i);
assert.match(buildEvidenceImportSql(models[0], plans[0]), /^BEGIN TRANSACTION;/);
assert.match(buildEvidenceImportSql(models[0], plans[0]), /COMMIT;$/);
assert.throws(
  () => validateControlledIngestSql(`${sql}\nDELETE FROM evidence_snapshots;`, authorization),
  /controlled_ingest_sql_forbidden_statement/,
);

const versionedAuthorization = JSON.parse(
  await readFile('research/evidence/controlled-ingest-authorization-2026-08-20.json', 'utf8'),
);
assert.equal(validateControlledIngestAuthorization(versionedAuthorization), true);

const workflow = await readFile('.github/workflows/evidence-controlled-ingest.yml', 'utf8');
assert.match(workflow, /workflow_dispatch:/);
assert.doesNotMatch(workflow, /^\s*push:/m);
assert.doesNotMatch(workflow, /^\s*pull_request:/m);
assert.match(workflow, /APPLY_APPROVED_EVIDENCE_CONTROLLED_INGEST/);
assert.match(workflow, /expected_main_sha/);
assert.match(workflow, /evidence-controlled-ingest\.mjs execute/);
assert.doesNotMatch(workflow, /wrangler\s+deploy|claim_verifications|published_pages|AFFILIATE_MODE=enabled/i);

const implementation = await readFile('scripts/evidence-controlled-ingest.mjs', 'utf8');
assert.match(implementation, /'--remote'/);
assert.match(implementation, /'--file'/);
assert.doesNotMatch(implementation, /'--command'/);
assert.match(implementation, /sourceRegistryWriteAuthorized:\s*false/);
assert.match(implementation, /claimVerificationAuthorized:\s*false/);
assert.match(implementation, /publicationAuthorized:\s*false/);
assert.match(implementation, /deployAuthorized:\s*false/);

console.log('Evidence controlled ingest smoke: exact authorization, empty-state drift gate, bounded insert-only SQL, transactional file execution contract and exact post-state verified.');
