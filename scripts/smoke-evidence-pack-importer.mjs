import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  buildSourceSnapshot as buildItalySourceSnapshot,
  packSemanticFingerprint,
} from './italy-comparison-evidence-pack.mjs';
import { buildSourceSnapshot as buildEuropeSourceSnapshot } from './europe-regional-evidence-pack.mjs';
import { applyLocalSourceOnboarding } from './evidence-source-registry-onboarding.mjs';
import { applyLocalEvidencePackImport } from './evidence-pack-importer.mjs';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashCanonical(value) {
  return sha256(canonicalJson(value));
}

function run(command, args, { expectSuccess = true } = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    maxBuffer: 25 * 1024 * 1024,
  });
  if (expectSuccess && result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  }
  return result;
}

function parseRows(stdout) {
  const payload = JSON.parse(stdout);
  const arrays = [];
  const walk = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (Array.isArray(value.results)) {
      arrays.push(value.results);
      return;
    }
    if (value.result !== undefined) walk(value.result);
  };
  walk(payload);
  return arrays.flat();
}

function query(persistTo, sql) {
  return parseRows(run(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js',
    'd1', 'execute', 'DB', '--local', '--persist-to', persistTo,
    '--command', sql, '--json',
  ]).stdout);
}

const ITALY_EXACT_AIRALO = 'https://www.airalo.com/it/italy-esim/mamma-mia-in-10days-unlimited';

const SOURCE_SETS = Object.freeze({
  italy: Object.freeze([
    Object.freeze({ key: 'airalo-italy-plan', provider: 'airalo', url: ITALY_EXACT_AIRALO }),
    Object.freeze({ key: 'airalo-unlimited-fup', provider: 'airalo', url: 'https://www.airalo.com/m/resources/unlimited-data-plans-fair-use-policy' }),
    Object.freeze({ key: 'holafly-italy-plan', provider: 'holafly', url: 'https://esim.holafly.com/it/esim-italia/' }),
    Object.freeze({ key: 'holafly-unlimited-faq', provider: 'holafly', url: 'https://esim.holafly.com/it/faq/informazioni-sulle-esim/esim-con-traffico-dati-illimitato/' }),
    Object.freeze({ key: 'ubigi-italy-plan', provider: 'ubigi', url: 'https://cellulardata.ubigi.com/rates-and-coverage/italy-data-plans/italy-50gb-30-days/' }),
    Object.freeze({ key: 'ubigi-activation', provider: 'ubigi', url: 'https://cellulardata.ubigi.com/help-center/faq/esim-data-plan/when-does-my-ubigi-data-plan-activate/' }),
  ]),
  europe: Object.freeze([
    Object.freeze({ key: 'airalo-europe-plan', provider: 'airalo', url: 'https://www.airalo.com/europe-esim' }),
    Object.freeze({ key: 'airalo-unlimited-fup', provider: 'airalo', url: 'https://www.airalo.com/m/resources/unlimited-data-plans-fair-use-policy' }),
    Object.freeze({ key: 'holafly-europe-plan', provider: 'holafly', url: 'https://esim.holafly.com/it/esim-europa/' }),
    Object.freeze({ key: 'holafly-unlimited-faq', provider: 'holafly', url: 'https://esim.holafly.com/it/faq/informazioni-sulle-esim/esim-con-traffico-dati-illimitato/' }),
    Object.freeze({ key: 'ubigi-europe-plan', provider: 'ubigi', url: 'https://cellulardata.ubigi.com/rates-and-coverage/europe-data-plans/europe-25gb-30-days/' }),
    Object.freeze({ key: 'ubigi-activation', provider: 'ubigi', url: 'https://cellulardata.ubigi.com/help-center/faq/esim-data-plan/when-does-my-ubigi-data-plan-activate/' }),
  ]),
});

function sourceBody(name, source) {
  return Buffer.from(`<!doctype html><html lang="${name === 'italy' ? 'it' : 'en'}"><body><h1>${source.provider} ${source.key}</h1><p>${source.url}</p></body></html>`);
}

function buildSources(name, startedAt) {
  const builder = name === 'italy' ? buildItalySourceSnapshot : buildEuropeSourceSnapshot;
  return SOURCE_SETS[name].map((source, index) => {
    const body = sourceBody(name, source);
    const snapshot = builder({
      sourceKey: source.key,
      requestedUrl: source.url,
      finalUrl: source.url,
      redirectChain: [],
      fetchedAt: new Date(new Date(startedAt).getTime() + index * 1000).toISOString(),
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      etag: null,
      lastModified: null,
      body,
    });
    const { html, visibleText, ...publicSnapshot } = snapshot;
    return { ...publicSnapshot, _body: body };
  });
}

function candidateKey(candidate) {
  return `sha256:${hashCanonical({
    subjectKey: candidate.subjectKey,
    fieldName: candidate.fieldName,
    scope: candidate.scope,
    rawValue: candidate.rawValue,
    normalizedValue: candidate.normalizedValue,
    evidence: candidate.evidence.map((entry) => ({ sourceKey: entry.sourceKey, snapshotId: entry.snapshotId })),
    extractorVersion: candidate.extractorVersion,
  })}`;
}

function makeCandidate({ offerKey, provider, scenario, fieldName, rawValue, normalizedValue, evidence, observedAt, warnings = [] }) {
  const candidate = {
    candidateKey: '',
    subjectType: 'scenario_offer',
    subjectKey: offerKey,
    fieldName,
    scope: {
      provider,
      scenarioId: scenario.id,
      region: scenario.region ?? null,
      countries: scenario.countries ?? (scenario.destination ? [scenario.destination] : []),
    },
    rawValue,
    normalizedValue,
    evidence,
    observedAt,
    extractorId: `fixture-${scenario.id}`,
    extractorVersion: '1.0.0',
    warnings,
    status: 'pending',
  };
  candidate.candidateKey = candidateKey(candidate);
  return candidate;
}

function evidenceRef(source, text = 'fixture evidence') {
  return {
    sourceKey: source.sourceKey,
    snapshotId: source.snapshotId,
    locator: {
      type: 'document_text',
      sourceKey: source.sourceKey,
      snapshotId: source.snapshotId,
      visibleTextSha256: source.visibleTextSha256,
      start: 0,
      end: text.length,
      textAnchor: text,
    },
  };
}

function buildFixturePack(name) {
  const isItaly = name === 'italy';
  const startedAt = isItaly ? '2026-08-08T08:00:00.000Z' : '2026-08-08T08:10:00.000Z';
  const completedAt = isItaly ? '2026-08-08T08:00:06.000Z' : '2026-08-08T08:10:06.000Z';
  const sourcesWithBodies = buildSources(name, startedAt);
  const sources = sourcesWithBodies.map(({ _body, ...source }) => source);
  const byKey = new Map(sources.map((source) => [source.sourceKey, source]));
  const scenario = isItaly
    ? { id: 'italy-10d-high-data-hotspot', destination: 'italy', tripDays: 10, dataUse: 'high', hotspotRequired: true }
    : { id: 'europe-14d-multicountry-high-data-hotspot', region: 'europe', countries: ['IT', 'FR', 'ES'], tripDays: 14, dataUse: 'high', hotspotRequired: true };

  const airaloPlan = byKey.get(isItaly ? 'airalo-italy-plan' : 'airalo-europe-plan');
  const holaflyFup = byKey.get('holafly-unlimited-faq');
  const ubigiPlan = byKey.get(isItaly ? 'ubigi-italy-plan' : 'ubigi-europe-plan');
  const ubigiHelp = byKey.get('ubigi-activation');

  const airaloOfferKey = isItaly ? 'airalo:italy:unlimited-10d' : 'airalo:europe:unlimited-15d';
  const airaloPrice = makeCandidate({
    offerKey: airaloOfferKey,
    provider: 'airalo',
    scenario,
    fieldName: 'price',
    rawValue: isItaly ? '29.00 €' : '44.50 €',
    normalizedValue: { amount: isItaly ? 29 : 44.5, currency: 'EUR' },
    evidence: [evidenceRef(airaloPlan, 'Airalo price')],
    observedAt: airaloPlan.fetchedAt,
    warnings: ['source_currency_preserved'],
  });

  const holaflyOfferKey = isItaly ? 'holafly:italy:unlimited-10d' : 'holafly:europe:unlimited-15d';
  const holaflyFupCandidate = makeCandidate({
    offerKey: holaflyOfferKey,
    provider: 'holafly',
    scenario,
    fieldName: 'fair_use_policy',
    rawValue: 'FUP may reduce speed until next day',
    normalizedValue: { operatorFupMayReduceSpeed: true, exactHighSpeedThreshold: null, recovery: 'next_day' },
    evidence: [evidenceRef(holaflyFup, 'Holafly FUP')],
    observedAt: holaflyFup.fetchedAt,
    warnings: ['exact_threshold_unknown'],
  });

  const ubigiOfferKey = isItaly ? 'ubigi:italy:50gb-30d' : 'ubigi:europe:25gb-30d';
  const ubigiPrice = makeCandidate({
    offerKey: ubigiOfferKey,
    provider: 'ubigi',
    scenario,
    fieldName: 'price',
    rawValue: 'US$29',
    normalizedValue: { amount: 29, currency: 'USD' },
    evidence: [evidenceRef(ubigiPlan, 'Ubigi price')],
    observedAt: ubigiPlan.fetchedAt,
    warnings: ['source_currency_preserved'],
  });
  const ubigiActivation = makeCandidate({
    offerKey: ubigiOfferKey,
    provider: 'ubigi',
    scenario,
    fieldName: 'activation_policy',
    rawValue: 'SmartStart + covered-area activation',
    normalizedValue: { trigger: 'covered_area_connection', purchaseWhileCovered: 'immediate' },
    evidence: [evidenceRef(ubigiPlan, 'SmartStart'), evidenceRef(ubigiHelp, 'covered area')],
    observedAt: ubigiHelp.fetchedAt,
  });

  const offers = [
    {
      provider: 'airalo',
      offerKey: airaloOfferKey,
      label: 'Airalo fixture',
      candidates: [airaloPrice],
      coverage: {
        price: { state: 'observed', reason: null },
        activation_policy: { state: 'unknown', reason: 'Exact package activation policy is not captured.' },
        data_gb: { state: 'not_applicable', reason: 'Unlimited package; no numeric total cap is synthesized.' },
      },
    },
    {
      provider: 'holafly',
      offerKey: holaflyOfferKey,
      label: 'Holafly fixture',
      candidates: [holaflyFupCandidate],
      coverage: {
        fair_use_policy: { state: 'partial', reason: 'FUP behavior is proven but exact threshold is unknown.' },
        network: { state: 'unknown', reason: 'Network details are not proven in this bounded fixture.' },
      },
    },
    {
      provider: 'ubigi',
      offerKey: ubigiOfferKey,
      label: 'Ubigi fixture',
      candidates: [ubigiPrice, ubigiActivation],
      coverage: {
        price: { state: 'observed', reason: null },
        activation_policy: { state: 'observed', reason: null },
        hotspot_share_limit: { state: 'unknown', reason: 'Sharing is not translated into a numeric cap.' },
        fair_use_policy: { state: 'not_applicable', reason: 'Finite allowance fixture.' },
      },
    },
  ];

  const packId = `pack:sha256:${hashCanonical({
    scenario,
    sourceSnapshotIds: sources.map((source) => source.snapshotId),
  })}`;
  const pack = {
    schemaVersion: 1,
    packId,
    scenario,
    startedAt,
    completedAt,
    captureWindowMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
    sources,
    offers,
    ranking: { status: 'not_computed', reason: 'Fixture evidence is not a provider ranking.' },
    semanticFingerprint: '',
  };
  pack.semanticFingerprint = packSemanticFingerprint(pack);
  return { pack, sourcesWithBodies };
}

async function persistFixturePack(root, name) {
  const { pack, sourcesWithBodies } = buildFixturePack(name);
  const artifactDirectory = path.join(root, name);
  const sourceDirectory = path.join(artifactDirectory, 'sources');
  await mkdir(sourceDirectory, { recursive: true });
  for (const source of sourcesWithBodies) {
    await writeFile(path.join(sourceDirectory, `${source.sourceKey}.html`), source._body);
  }
  const persisted = {
    ...pack,
    artifactLocation: path.relative(process.cwd(), artifactDirectory).split(path.sep).join('/'),
  };
  const packPath = path.join(artifactDirectory, 'pack.json');
  await writeFile(packPath, `${JSON.stringify(persisted, null, 2)}\n`, 'utf8');
  return { packPath, pack: persisted };
}

function countPackObservations(pack) {
  return pack.offers.reduce((total, offer) => total + Object.keys(offer.coverage).length, 0);
}

function countPackCandidates(pack) {
  return pack.offers.reduce(
    (total, offer) => total + Object.values(offer.coverage)
      .filter((entry) => entry.state === 'observed' || entry.state === 'partial').length,
    0,
  );
}

const artifactRoot = path.join('research', 'evidence', `importer-smoke-${process.pid}-${Date.now()}`);
const persistTo = await mkdtemp(path.join(os.tmpdir(), 'senza-roaming-evidence-importer-'));
const missingSourcePersistTo = await mkdtemp(path.join(os.tmpdir(), 'senza-roaming-evidence-importer-missing-source-'));

try {
  const italy = await persistFixturePack(artifactRoot, 'italy');
  const europe = await persistFixturePack(artifactRoot, 'europe');

  for (const statePath of [persistTo, missingSourcePersistTo]) {
    run(process.execPath, [
      'node_modules/wrangler/bin/wrangler.js',
      'd1', 'migrations', 'apply', 'DB', '--local', '--persist-to', statePath,
    ]);
  }

  const onboarding = await applyLocalSourceOnboarding({ persistTo });
  assert.equal(onboarding.readyForImporter, true);
  assert.equal(onboarding.resolvedManifestIdentities, 9);

  const sourceCountBefore = Number(query(persistTo, 'SELECT COUNT(*) AS count FROM source_registry;')[0].count);
  const verificationCountBefore = Number(query(persistTo, 'SELECT COUNT(*) AS count FROM claim_verifications;')[0].count);
  const plansCountBefore = Number(query(persistTo, 'SELECT COUNT(*) AS count FROM plans;')[0].count);

  const italyFirst = await applyLocalEvidencePackImport({
    persistTo,
    packFilename: path.relative(process.cwd(), italy.packPath),
  });
  const europeFirst = await applyLocalEvidencePackImport({
    persistTo,
    packFilename: path.relative(process.cwd(), europe.packPath),
  });
  assert.equal(italyFirst.action, 'insert');
  assert.equal(europeFirst.action, 'insert');
  assert.deepEqual(italyFirst.inserted, {
    runs: 1,
    snapshots: italy.pack.sources.length,
    observations: countPackObservations(italy.pack),
    candidates: countPackCandidates(italy.pack),
  });
  assert.deepEqual(europeFirst.inserted, {
    runs: 1,
    snapshots: europe.pack.sources.length,
    observations: countPackObservations(europe.pack),
    candidates: countPackCandidates(europe.pack),
  });

  const italySecond = await applyLocalEvidencePackImport({
    persistTo,
    packFilename: path.relative(process.cwd(), italy.packPath),
  });
  const europeSecond = await applyLocalEvidencePackImport({
    persistTo,
    packFilename: path.relative(process.cwd(), europe.packPath),
  });
  for (const result of [italySecond, europeSecond]) {
    assert.equal(result.action, 'existing_exact');
    assert.deepEqual(result.inserted, { runs: 0, snapshots: 0, observations: 0, candidates: 0 });
  }

  assert.equal(Number(query(persistTo, 'SELECT COUNT(*) AS count FROM evidence_capture_runs;')[0].count), 2);
  assert.equal(
    Number(query(persistTo, 'SELECT COUNT(*) AS count FROM evidence_snapshots;')[0].count),
    italy.pack.sources.length + europe.pack.sources.length,
  );
  assert.equal(
    Number(query(persistTo, 'SELECT COUNT(*) AS count FROM evidence_field_observations;')[0].count),
    countPackObservations(italy.pack) + countPackObservations(europe.pack),
  );
  assert.equal(
    Number(query(persistTo, 'SELECT COUNT(*) AS count FROM evidence_claim_candidates;')[0].count),
    countPackCandidates(italy.pack) + countPackCandidates(europe.pack),
  );

  const coverageRows = query(
    persistTo,
    'SELECT coverage_state, COUNT(*) AS count FROM evidence_field_observations GROUP BY coverage_state ORDER BY coverage_state;',
  );
  assert.equal(coverageRows.some((row) => row.coverage_state === 'partial' && Number(row.count) > 0), true);
  assert.equal(coverageRows.some((row) => row.coverage_state === 'unknown' && Number(row.count) > 0), true);
  assert.equal(coverageRows.some((row) => row.coverage_state === 'not_applicable' && Number(row.count) > 0), true);

  const invalidCandidateRows = query(persistTo, `
    SELECT o.coverage_state, COUNT(*) AS count
    FROM evidence_claim_candidates c
    JOIN evidence_field_observations o ON o.id=c.observation_id
    WHERE o.coverage_state NOT IN ('observed','partial')
    GROUP BY o.coverage_state;
  `);
  assert.deepEqual(invalidCandidateRows, []);

  const currencies = query(persistTo, `
    SELECT DISTINCT json_extract(normalized_value_json, '$.currency') AS currency
    FROM evidence_field_observations
    WHERE field_name='price'
    ORDER BY currency;
  `).map((row) => row.currency);
  assert.deepEqual(currencies, ['EUR', 'USD']);

  const subjectRows = query(
    persistTo,
    'SELECT DISTINCT subject_type FROM evidence_field_observations ORDER BY subject_type;',
  );
  assert.deepEqual(subjectRows.map((row) => row.subject_type), ['plan']);
  const scopeRows = query(
    persistTo,
    `SELECT COUNT(*) AS count FROM evidence_field_observations WHERE json_extract(scope_json, '$.packSubjectType')='scenario_offer';`,
  );
  assert.equal(
    Number(scopeRows[0].count),
    countPackObservations(italy.pack) + countPackObservations(europe.pack),
  );

  const multiSourceRows = query(persistTo, `
    SELECT evidence_locator_json
    FROM evidence_field_observations
    WHERE subject_key='ubigi:italy:50gb-30d' AND field_name='activation_policy';
  `);
  assert.equal(multiSourceRows.length, 1);
  const multiSourceLocator = JSON.parse(multiSourceRows[0].evidence_locator_json);
  assert.equal(multiSourceLocator.kind, 'pack_candidate');
  assert.equal(multiSourceLocator.refs.length, 2);
  assert.equal(
    multiSourceLocator.refs.every(
      (entry) => typeof entry.snapshotKey === 'string' && entry.snapshotKey.startsWith('snapshot-import:sha256:'),
    ),
    true,
  );

  assert.equal(Number(query(persistTo, 'SELECT COUNT(*) AS count FROM source_registry;')[0].count), sourceCountBefore);
  assert.equal(Number(query(persistTo, 'SELECT COUNT(*) AS count FROM claim_verifications;')[0].count), verificationCountBefore);
  assert.equal(Number(query(persistTo, 'SELECT COUNT(*) AS count FROM plans;')[0].count), plansCountBefore);

  const tamperedSource = path.join(path.dirname(italy.packPath), 'sources', 'airalo-italy-plan.html');
  await writeFile(tamperedSource, Buffer.from('tampered'));
  await assert.rejects(
    () => applyLocalEvidencePackImport({
      persistTo,
      packFilename: path.relative(process.cwd(), italy.packPath),
    }),
    /evidence_import_artifact_hash_mismatch:airalo-italy-plan/,
  );
  assert.equal(Number(query(persistTo, 'SELECT COUNT(*) AS count FROM evidence_capture_runs;')[0].count), 2);

  await assert.rejects(
    () => applyLocalEvidencePackImport({
      persistTo: missingSourcePersistTo,
      packFilename: path.relative(process.cwd(), europe.packPath),
    }),
    /evidence_import_source_resolution_failed:/,
  );
  assert.equal(
    Number(query(missingSourcePersistTo, 'SELECT COUNT(*) AS count FROM evidence_capture_runs;')[0].count),
    0,
  );

  const remoteAttempt = run(
    process.execPath,
    ['scripts/evidence-pack-importer.mjs', '--remote', europe.packPath],
    { expectSuccess: false },
  );
  assert.notEqual(remoteAttempt.status, 0);
  assert.match(remoteAttempt.stderr, /remote_evidence_import_forbidden/);

  console.log('Evidence pack importer smoke passed: canonical fixture snapshots + two-pack idempotent isolated-D1 import; source resolution, hashes, coverage states, native currencies and multi-source provenance are preserved/fail-closed.');
} finally {
  await Promise.all([
    rm(artifactRoot, { recursive: true, force: true }),
    rm(persistTo, { recursive: true, force: true }),
    rm(missingSourcePersistTo, { recursive: true, force: true }),
  ]);
}
