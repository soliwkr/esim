import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { readFile, rm, writeFile } from 'node:fs/promises';

const port = Number(process.env.EVIDENCE_D1_SCHEMA_PORT || 8844);
const origin = `http://127.0.0.1:${port}`;
const serverDirectory = 'apps/web/dist/server';
const builtConfigPath = `${serverDirectory}/wrangler.json`;
const entryPath = `${serverDirectory}/evidence-d1-schema-entry.mjs`;
const configPath = `${serverDirectory}/evidence-d1-schema-wrangler.json`;
const stateRoot = '.wrangler/evidence-d1-schema-smoke';

function wrangler(args) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], {
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`Wrangler command failed:\n${result.stdout}\n${result.stderr}`);
  }
}

async function prepareRuntimeFiles() {
  const builtConfig = JSON.parse(await readFile(builtConfigPath, 'utf8'));
  builtConfig.main = 'evidence-d1-schema-entry.mjs';

  await writeFile(entryPath, `
export { Last30DaysContainer, RecentDemandWorkflow } from './entry.mjs';

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectFailure(label, action, expectedFragment) {
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (expectedFragment && !message.includes(expectedFragment)) {
      throw new Error(\`${'${label}'}: expected error containing "${'${expectedFragment}'}", got "${'${message}'}"\`);
    }
    return message;
  }
  throw new Error(\`${'${label}'}: expected D1 operation to fail\`);
}

async function firstId(database, table, keyColumn, keyValue) {
  const row = await database
    .prepare(\`SELECT id FROM ${'${table}'} WHERE ${'${keyColumn}'}=? LIMIT 1\`)
    .bind(keyValue)
    .first();
  ensure(row && Number(row.id) > 0, \`Missing id for ${'${table}'}.${'${keyColumn}'}=${'${keyValue}'}\`);
  return Number(row.id);
}

async function count(database, table) {
  const row = await database.prepare(\`SELECT COUNT(*) AS count FROM ${'${table}'}\`).first();
  return Number(row?.count || 0);
}

async function insertObservation(database, value) {
  await database.prepare(\`
    INSERT INTO evidence_field_observations(
      observation_key, snapshot_id, subject_type, subject_key, provider_plan_key,
      field_name, scope_json, coverage_state, raw_value_json,
      normalized_value_json, evidence_locator_json, extractor_id,
      extractor_version, normalizer_version, schema_version, source_role,
      extraction_confidence, warnings_json, observed_at, proposed_valid_until
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  \`).bind(
    value.observationKey,
    value.snapshotId,
    'plan',
    value.subjectKey,
    value.providerPlanKey ?? null,
    value.fieldName,
    JSON.stringify(value.scope ?? {}),
    value.coverageState,
    JSON.stringify(value.rawValue ?? null),
    JSON.stringify(value.normalizedValue ?? null),
    JSON.stringify(value.locator ?? { type: 'fixture' }),
    'evidence-schema-fixture',
    '1.0.0',
    '1.0.0',
    1,
    value.sourceRole,
    1,
    '[]',
    value.observedAt,
    value.proposedValidUntil ?? null,
  ).run();
}

async function exerciseSchema(database) {
  const sourceCountBefore = await count(database, 'source_registry');
  const verificationCountBefore = await count(database, 'claim_verifications');

  const airaloSourceId = await firstId(database, 'source_registry', 'entity_key', 'airalo');
  const ubigiSourceId = await firstId(database, 'source_registry', 'entity_key', 'ubigi');

  await database.prepare(\`
    INSERT INTO evidence_capture_runs(
      run_key, pack_schema_version, scenario_key, scenario_json, started_at,
      completed_at, capture_window_ms, source_count, pack_sha256,
      semantic_fingerprint
    ) VALUES(?,?,?,?,?,?,?,?,?,?)
  \`).bind(
    'fixture:italy-local:1',
    1,
    'italy-local',
    JSON.stringify({ destination: 'IT', durationDays: 10, hotspotRequired: true }),
    '2026-08-06T10:00:00.000Z',
    '2026-08-06T10:00:03.000Z',
    3000,
    1,
    'sha256:fixture-italy-pack',
    'sha256:fixture-italy-semantic',
  ).run();

  await database.prepare(\`
    INSERT INTO evidence_capture_runs(
      run_key, pack_schema_version, scenario_key, scenario_json, started_at,
      completed_at, capture_window_ms, source_count, pack_sha256,
      semantic_fingerprint
    ) VALUES(?,?,?,?,?,?,?,?,?,?)
  \`).bind(
    'fixture:europe-regional:1',
    1,
    'europe-regional',
    JSON.stringify({ region: 'EUROPE', countries: ['IT', 'FR', 'ES'], durationDays: 14 }),
    '2026-08-06T10:10:00.000Z',
    '2026-08-06T10:10:04.000Z',
    4000,
    1,
    'sha256:fixture-europe-pack',
    'sha256:fixture-europe-semantic',
  ).run();

  const italyRunId = await firstId(database, 'evidence_capture_runs', 'run_key', 'fixture:italy-local:1');
  const europeRunId = await firstId(database, 'evidence_capture_runs', 'run_key', 'fixture:europe-regional:1');

  await database.prepare(\`
    INSERT INTO evidence_snapshots(
      snapshot_key, capture_run_id, source_id, source_audit_key, requested_url,
      final_url, redirect_chain_json, fetched_at, http_status, content_type,
      capture_method, locale, currency_context, country_context,
      capture_context_json, body_sha256, visible_text_sha256, byte_length,
      artifact_ref, parser_input_version, capture_warnings_json
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  \`).bind(
    'fixture:snapshot:airalo-it',
    italyRunId,
    airaloSourceId,
    'fixture-airalo-provider-source',
    'https://www.airalo.com/italy-esim',
    'https://www.airalo.com/italy-esim',
    '[]',
    '2026-08-06T10:00:01.000Z',
    200,
    'text/html; charset=utf-8',
    'http_html',
    'it-IT',
    'EUR',
    'IT',
    JSON.stringify({ scenarioKey: 'italy-local' }),
    'sha256:fixture-airalo-it-body',
    'sha256:fixture-airalo-it-visible',
    1234,
    'fixture://airalo-it.html',
    'visible-text-v1',
    '[]',
  ).run();

  await database.prepare(\`
    INSERT INTO evidence_snapshots(
      snapshot_key, capture_run_id, source_id, source_audit_key, requested_url,
      final_url, redirect_chain_json, fetched_at, http_status, content_type,
      capture_method, locale, currency_context, country_context,
      capture_context_json, body_sha256, visible_text_sha256, byte_length,
      artifact_ref, parser_input_version, capture_warnings_json
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  \`).bind(
    'fixture:snapshot:ubigi-europe',
    europeRunId,
    ubigiSourceId,
    'fixture-ubigi-provider-source',
    'https://cellulardata.ubigi.com/rates-and-coverage/europe-data-plans/',
    'https://cellulardata.ubigi.com/rates-and-coverage/europe-data-plans/',
    '[]',
    '2026-08-06T10:10:01.000Z',
    200,
    'text/html; charset=utf-8',
    'http_html',
    'en-US',
    'USD',
    null,
    JSON.stringify({ scenarioKey: 'europe-regional', countries: ['IT', 'FR', 'ES'] }),
    'sha256:fixture-ubigi-europe-body',
    'sha256:fixture-ubigi-europe-visible',
    2345,
    'fixture://ubigi-europe.html',
    'visible-text-v1',
    '[]',
  ).run();

  const italySnapshotId = await firstId(database, 'evidence_snapshots', 'snapshot_key', 'fixture:snapshot:airalo-it');
  const europeSnapshotId = await firstId(database, 'evidence_snapshots', 'snapshot_key', 'fixture:snapshot:ubigi-europe');

  const italyObservedAt = '2026-08-06T10:00:01.000Z';
  const europeObservedAt = '2026-08-06T10:10:01.000Z';

  await insertObservation(database, {
    observationKey: 'fixture:obs:italy-price-eur',
    snapshotId: italySnapshotId,
    subjectKey: 'airalo:italy:unlimited-10d',
    fieldName: 'price',
    coverageState: 'observed',
    rawValue: { amount: 29, currency: 'EUR' },
    normalizedValue: { amount: 29, currency: 'EUR' },
    sourceRole: 'product_catalog',
    observedAt: italyObservedAt,
  });
  await insertObservation(database, {
    observationKey: 'fixture:obs:italy-destination',
    snapshotId: italySnapshotId,
    subjectKey: 'airalo:italy:unlimited-10d',
    fieldName: 'destination_coverage',
    coverageState: 'observed',
    normalizedValue: { scope: 'local', countries: ['IT'] },
    sourceRole: 'product_catalog',
    observedAt: italyObservedAt,
  });
  await insertObservation(database, {
    observationKey: 'fixture:obs:italy-data-not-applicable',
    snapshotId: italySnapshotId,
    subjectKey: 'airalo:italy:unlimited-10d',
    fieldName: 'data_gb',
    coverageState: 'not_applicable',
    normalizedValue: null,
    sourceRole: 'product_catalog',
    observedAt: italyObservedAt,
  });
  await insertObservation(database, {
    observationKey: 'fixture:obs:italy-activation-unknown',
    snapshotId: italySnapshotId,
    subjectKey: 'airalo:italy:unlimited-10d',
    fieldName: 'activation_policy',
    coverageState: 'unknown',
    normalizedValue: null,
    sourceRole: 'product_catalog',
    observedAt: italyObservedAt,
  });
  await insertObservation(database, {
    observationKey: 'fixture:obs:europe-plan-type',
    snapshotId: europeSnapshotId,
    subjectKey: 'ubigi:europe:25gb-30d',
    fieldName: 'plan_type',
    coverageState: 'observed',
    normalizedValue: { type: 'regional', region: 'EUROPE' },
    sourceRole: 'regional_product_page',
    observedAt: europeObservedAt,
  });
  await insertObservation(database, {
    observationKey: 'fixture:obs:europe-price-usd',
    snapshotId: europeSnapshotId,
    subjectKey: 'ubigi:europe:25gb-30d',
    fieldName: 'price',
    coverageState: 'observed',
    rawValue: { amount: 29, currency: 'USD' },
    normalizedValue: { amount: 29, currency: 'USD' },
    sourceRole: 'regional_product_page',
    observedAt: europeObservedAt,
  });
  await insertObservation(database, {
    observationKey: 'fixture:obs:europe-destination-partial',
    snapshotId: europeSnapshotId,
    subjectKey: 'ubigi:europe:25gb-30d',
    fieldName: 'destination_coverage',
    coverageState: 'partial',
    normalizedValue: { scope: 'regional', region: 'EUROPE', declaredCountryCount: 40 },
    sourceRole: 'regional_product_page',
    observedAt: europeObservedAt,
  });
  await insertObservation(database, {
    observationKey: 'fixture:obs:europe-network-unknown',
    snapshotId: europeSnapshotId,
    subjectKey: 'ubigi:europe:25gb-30d',
    fieldName: 'network',
    coverageState: 'unknown',
    normalizedValue: null,
    sourceRole: 'regional_product_page',
    observedAt: europeObservedAt,
  });
  await insertObservation(database, {
    observationKey: 'fixture:obs:europe-fup-not-applicable',
    snapshotId: europeSnapshotId,
    subjectKey: 'ubigi:europe:25gb-30d',
    fieldName: 'fair_use_policy',
    coverageState: 'not_applicable',
    normalizedValue: null,
    sourceRole: 'regional_product_page',
    observedAt: europeObservedAt,
  });

  const italyPriceObservationId = await firstId(database, 'evidence_field_observations', 'observation_key', 'fixture:obs:italy-price-eur');
  const italyDestinationObservationId = await firstId(database, 'evidence_field_observations', 'observation_key', 'fixture:obs:italy-destination');
  const italyUnknownObservationId = await firstId(database, 'evidence_field_observations', 'observation_key', 'fixture:obs:italy-activation-unknown');
  const italyNotApplicableObservationId = await firstId(database, 'evidence_field_observations', 'observation_key', 'fixture:obs:italy-data-not-applicable');
  const europePriceObservationId = await firstId(database, 'evidence_field_observations', 'observation_key', 'fixture:obs:europe-price-usd');
  const europePartialObservationId = await firstId(database, 'evidence_field_observations', 'observation_key', 'fixture:obs:europe-destination-partial');
  const europeUnknownObservationId = await firstId(database, 'evidence_field_observations', 'observation_key', 'fixture:obs:europe-network-unknown');

  await database.prepare(\`
    INSERT INTO evidence_claim_candidates(candidate_key, observation_id)
    VALUES(?,?)
  \`).bind('fixture:candidate:italy-price', italyPriceObservationId).run();
  await database.prepare(\`
    INSERT INTO evidence_claim_candidates(candidate_key, observation_id)
    VALUES(?,?)
  \`).bind('fixture:candidate:europe-price', europePriceObservationId).run();
  await database.prepare(\`
    INSERT INTO evidence_claim_candidates(candidate_key, observation_id)
    VALUES(?,?)
  \`).bind('fixture:candidate:europe-destination-count', europePartialObservationId).run();

  await expectFailure(
    'unknown observation candidate',
    () => database.prepare(\`
      INSERT INTO evidence_claim_candidates(candidate_key, observation_id)
      VALUES(?,?)
    \`).bind('fixture:candidate:unknown', italyUnknownObservationId).run(),
    'evidence_candidate_requires_observed_or_partial',
  );
  await expectFailure(
    'not-applicable observation candidate',
    () => database.prepare(\`
      INSERT INTO evidence_claim_candidates(candidate_key, observation_id)
      VALUES(?,?)
    \`).bind('fixture:candidate:not-applicable', italyNotApplicableObservationId).run(),
    'evidence_candidate_requires_observed_or_partial',
  );

  await expectFailure(
    'invalid candidate status',
    () => database.prepare(\`
      INSERT INTO evidence_claim_candidates(candidate_key, observation_id, status)
      VALUES(?,?,?)
    \`).bind('fixture:candidate:invalid-status', italyDestinationObservationId, 'verified').run(),
    'CHECK constraint failed',
  );

  await expectFailure(
    'invalid capture JSON',
    () => database.prepare(\`
      INSERT INTO evidence_capture_runs(
        run_key, pack_schema_version, scenario_key, scenario_json, started_at,
        completed_at, capture_window_ms, source_count, pack_sha256,
        semantic_fingerprint
      ) VALUES(?,?,?,?,?,?,?,?,?,?)
    \`).bind(
      'fixture:invalid-json', 1, 'invalid-json', '{',
      '2026-08-06T11:00:00.000Z', '2026-08-06T11:00:01.000Z',
      1000, 1, 'sha256:invalid-json', 'sha256:invalid-json-semantic',
    ).run(),
    'CHECK constraint failed',
  );

  await expectFailure(
    'invalid observation JSON',
    () => database.prepare(\`
      INSERT INTO evidence_field_observations(
        observation_key, snapshot_id, subject_type, subject_key, field_name,
        coverage_state, normalized_value_json, extractor_id, extractor_version,
        source_role, observed_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?)
    \`).bind(
      'fixture:obs:invalid-json', italySnapshotId, 'plan', 'airalo:italy:unlimited-10d',
      'price', 'observed', '{', 'fixture', '1.0.0', 'product_catalog', italyObservedAt,
    ).run(),
    'CHECK constraint failed',
  );

  await expectFailure(
    'invalid coverage state',
    () => database.prepare(\`
      INSERT INTO evidence_field_observations(
        observation_key, snapshot_id, subject_type, subject_key, field_name,
        coverage_state, extractor_id, extractor_version, source_role, observed_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?)
    \`).bind(
      'fixture:obs:invalid-coverage', italySnapshotId, 'plan', 'airalo:italy:unlimited-10d',
      'network', 'missing', 'fixture', '1.0.0', 'product_catalog', italyObservedAt,
    ).run(),
    'CHECK constraint failed',
  );

  await expectFailure(
    'snapshot foreign key',
    () => database.prepare(\`
      INSERT INTO evidence_snapshots(
        snapshot_key, capture_run_id, source_id, source_audit_key, requested_url,
        final_url, fetched_at, http_status, content_type, capture_method,
        body_sha256, byte_length, artifact_ref, parser_input_version
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    \`).bind(
      'fixture:snapshot:invalid-source', italyRunId, 999999999, 'fixture-invalid-source',
      'https://example.invalid/', 'https://example.invalid/', italyObservedAt,
      200, 'text/html', 'http_html', 'sha256:invalid-source', 1,
      'fixture://invalid-source', 'fixture-v1',
    ).run(),
    'FOREIGN KEY constraint failed',
  );

  await expectFailure(
    'duplicate run identity',
    () => database.prepare(\`
      INSERT INTO evidence_capture_runs(
        run_key, pack_schema_version, scenario_key, scenario_json, started_at,
        completed_at, capture_window_ms, source_count, pack_sha256,
        semantic_fingerprint
      ) VALUES(?,?,?,?,?,?,?,?,?,?)
    \`).bind(
      'fixture:italy-local:1', 1, 'duplicate', '{}', italyObservedAt,
      italyObservedAt, 0, 1, 'sha256:duplicate', 'sha256:duplicate',
    ).run(),
    'UNIQUE constraint failed',
  );

  await expectFailure(
    'capture run update immutability',
    () => database.prepare(\`
      UPDATE evidence_capture_runs SET semantic_fingerprint='sha256:rewritten' WHERE id=?
    \`).bind(italyRunId).run(),
    'evidence_capture_runs_immutable',
  );
  await expectFailure(
    'capture run delete immutability',
    () => database.prepare('DELETE FROM evidence_capture_runs WHERE id=?').bind(europeRunId).run(),
    'evidence_capture_runs_immutable',
  );
  await expectFailure(
    'snapshot update immutability',
    () => database.prepare(\`
      UPDATE evidence_snapshots SET final_url='https://example.invalid/rewritten' WHERE id=?
    \`).bind(italySnapshotId).run(),
    'evidence_snapshots_immutable',
  );
  await expectFailure(
    'snapshot delete immutability',
    () => database.prepare('DELETE FROM evidence_snapshots WHERE id=?').bind(europeSnapshotId).run(),
    'evidence_snapshots_immutable',
  );
  await expectFailure(
    'observation update immutability',
    () => database.prepare(\`
      UPDATE evidence_field_observations SET normalized_value_json='null' WHERE id=?
    \`).bind(italyPriceObservationId).run(),
    'evidence_field_observations_immutable',
  );
  await expectFailure(
    'observation delete immutability',
    () => database.prepare('DELETE FROM evidence_field_observations WHERE id=?').bind(europeUnknownObservationId).run(),
    'evidence_field_observations_immutable',
  );

  const candidateId = await firstId(database, 'evidence_claim_candidates', 'candidate_key', 'fixture:candidate:italy-price');
  await expectFailure(
    'candidate provenance identity immutability',
    () => database.prepare(\`
      UPDATE evidence_claim_candidates SET candidate_key='fixture:candidate:rewritten' WHERE id=?
    \`).bind(candidateId).run(),
    'evidence_claim_candidate_identity_immutable',
  );

  const tableRows = await database.prepare(\`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name IN (
      'evidence_capture_runs','evidence_snapshots',
      'evidence_field_observations','evidence_claim_candidates'
    ) ORDER BY name
  \`).all();
  const triggerRows = await database.prepare(\`
    SELECT name FROM sqlite_master
    WHERE type='trigger' AND name LIKE 'trg_evidence_%'
    ORDER BY name
  \`).all();
  const indexRows = await database.prepare(\`
    SELECT name FROM sqlite_master
    WHERE type='index' AND name LIKE 'idx_evidence_%'
    ORDER BY name
  \`).all();
  const coverageRows = await database.prepare(\`
    SELECT coverage_state, COUNT(*) AS count
    FROM evidence_field_observations
    GROUP BY coverage_state
    ORDER BY coverage_state
  \`).all();
  const currencyRows = await database.prepare(\`
    SELECT DISTINCT json_extract(normalized_value_json, '$.currency') AS currency
    FROM evidence_field_observations
    WHERE field_name='price'
    ORDER BY currency
  \`).all();
  const candidateRows = await database.prepare(\`
    SELECT status, COUNT(*) AS count
    FROM evidence_claim_candidates
    GROUP BY status
    ORDER BY status
  \`).all();
  const plansBoundary = await database.prepare(\`
    SELECT
      (SELECT "notnull" FROM pragma_table_info('plans') WHERE name='destination_id') AS destination_not_null,
      (SELECT "notnull" FROM pragma_table_info('plans') WHERE name='price_eur') AS price_eur_not_null,
      (SELECT COUNT(*) FROM pragma_table_info('plans') WHERE name LIKE 'evidence_%') AS evidence_columns
  \`).first();

  const sourceCountAfter = await count(database, 'source_registry');
  const verificationCountAfter = await count(database, 'claim_verifications');

  ensure(tableRows.results.length === 4, 'All four upstream evidence tables must exist.');
  ensure(triggerRows.results.length >= 9, 'Evidence immutability/eligibility triggers must exist.');
  ensure(indexRows.results.length >= 7, 'Evidence lookup indexes must exist.');
  ensure(await count(database, 'evidence_capture_runs') === 2, 'Fixture must contain local and regional capture runs.');
  ensure(await count(database, 'evidence_snapshots') === 2, 'Fixture must contain two snapshots.');
  ensure(await count(database, 'evidence_field_observations') === 9, 'Fixture must contain nine field observations.');
  ensure(await count(database, 'evidence_claim_candidates') === 3, 'Only observed/partial fixture facts may become candidates.');
  ensure(JSON.stringify(coverageRows.results) === JSON.stringify([
    { coverage_state: 'not_applicable', count: 2 },
    { coverage_state: 'observed', count: 4 },
    { coverage_state: 'partial', count: 1 },
    { coverage_state: 'unknown', count: 2 },
  ]), 'Coverage states must preserve observed/partial/unknown/not_applicable.');
  ensure(JSON.stringify(currencyRows.results) === JSON.stringify([
    { currency: 'EUR' },
    { currency: 'USD' },
  ]), 'Fixture must preserve source-native EUR and USD.');
  ensure(JSON.stringify(candidateRows.results) === JSON.stringify([
    { status: 'pending', count: 3 },
  ]), 'Evidence candidates must start pending.');
  ensure(Number(plansBoundary?.destination_not_null) === 1, 'plans.destination_id must remain NOT NULL.');
  ensure(Number(plansBoundary?.price_eur_not_null) === 1, 'plans.price_eur must remain NOT NULL.');
  ensure(Number(plansBoundary?.evidence_columns) === 0, 'plans v1 must not be modified for evidence ingest.');
  ensure(sourceCountAfter === sourceCountBefore, 'Schema fixture must not onboard or mutate source_registry rows.');
  ensure(verificationCountAfter === verificationCountBefore, 'Schema fixture must not write claim_verifications.');

  return {
    tables: tableRows.results.map((row) => row.name),
    triggerCount: triggerRows.results.length,
    indexCount: indexRows.results.length,
    coverage: coverageRows.results,
    currencies: currencyRows.results.map((row) => row.currency),
    captureRuns: 2,
    snapshots: 2,
    observations: 9,
    candidates: 3,
    sourceRegistryUnchanged: sourceCountAfter === sourceCountBefore,
    claimVerificationsUnchanged: verificationCountAfter === verificationCountBefore,
    plansV1Unchanged: true,
  };
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/schema') {
      return new Response('Not found', { status: 404 });
    }
    const result = await exerciseSchema(env.DB);
    return Response.json(result, { headers: { 'cache-control': 'no-store' } });
  },
};
`, 'utf8');

  await writeFile(configPath, `${JSON.stringify(builtConfig, null, 2)}\n`, 'utf8');
}

function startRuntime() {
  const logs = [];
  const child = spawn(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js',
    'dev',
    '--config', configPath,
    '--persist-to', stateRoot,
    '--port', String(port),
    '--ip', '127.0.0.1',
  ], {
    env: {
      ...process.env,
      MAINTENANCE_TOKEN: 'evidence-d1-schema-smoke-token',
      AI_GATEWAY_TOKEN: 'evidence-d1-schema-smoke-ai-token',
      ASTRO_TELEMETRY_DISABLED: '1',
    },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const record = (chunk) => {
    const value = chunk.toString();
    logs.push(value);
    process.stdout.write(value);
  };
  child.stdout.on('data', record);
  child.stderr.on('data', record);
  return { child, logs };
}

async function waitForRuntime(runtime, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (runtime.child.exitCode !== null) {
      throw new Error(`wrangler dev exited with ${runtime.child.exitCode}\n${runtime.logs.join('')}`);
    }
    try {
      const response = await fetch(`${origin}/schema`);
      if (response.ok) return response;
      const body = await response.text();
      if (response.status >= 500) {
        throw new Error(`Evidence D1 schema endpoint failed: ${response.status} ${body}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Evidence D1 schema endpoint failed:')) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for evidence D1 schema runtime.\n${runtime.logs.join('')}`);
}

function signalRuntime(runtime, signal) {
  if (runtime.child.exitCode !== null || !runtime.child.pid) return;
  if (process.platform === 'win32') runtime.child.kill(signal);
  else process.kill(-runtime.child.pid, signal);
}

async function stopRuntime(runtime) {
  if (runtime.child.exitCode !== null) return;
  const exited = once(runtime.child, 'exit');
  signalRuntime(runtime, 'SIGTERM');
  const graceful = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (graceful) return;
  signalRuntime(runtime, 'SIGKILL');
  await Promise.race([
    once(runtime.child, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
}

let runtime;
try {
  await rm(stateRoot, { recursive: true, force: true });
  await prepareRuntimeFiles();
  wrangler([
    'd1', 'migrations', 'apply', 'DB', '--local',
    '--config', configPath,
    '--persist-to', stateRoot,
  ]);
  runtime = startRuntime();
  const response = await waitForRuntime(runtime);
  const result = await response.json();

  assert.deepEqual(result.tables, [
    'evidence_capture_runs',
    'evidence_claim_candidates',
    'evidence_field_observations',
    'evidence_snapshots',
  ]);
  assert.deepEqual(result.coverage, [
    { coverage_state: 'not_applicable', count: 2 },
    { coverage_state: 'observed', count: 4 },
    { coverage_state: 'partial', count: 1 },
    { coverage_state: 'unknown', count: 2 },
  ]);
  assert.deepEqual(result.currencies, ['EUR', 'USD']);
  assert.equal(result.captureRuns, 2);
  assert.equal(result.snapshots, 2);
  assert.equal(result.observations, 9);
  assert.equal(result.candidates, 3);
  assert.equal(result.sourceRegistryUnchanged, true);
  assert.equal(result.claimVerificationsUnchanged, true);
  assert.equal(result.plansV1Unchanged, true);
  assert.equal(response.headers.get('cache-control'), 'no-store');

  console.log('Evidence D1 schema smoke passed: 0022 migrates locally, preserves evidence states/currencies, enforces pending candidate intake and immutability, and leaves source_registry, claim_verifications and plans v1 untouched.');
} finally {
  if (runtime) await stopRuntime(runtime);
  await Promise.all([
    rm(entryPath, { force: true }),
    rm(configPath, { force: true }),
    rm(stateRoot, { recursive: true, force: true }),
  ]);
}
