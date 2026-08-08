import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildSourceSnapshot,
  packSemanticFingerprint,
} from './italy-comparison-evidence-pack.mjs';
import { loadVerifiedEvidencePack } from './evidence-pack-importer.mjs';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashCanonical(value) {
  return sha256(canonicalJson(value));
}

function candidateKey(candidate) {
  return `sha256:${hashCanonical({
    subjectKey: candidate.subjectKey,
    fieldName: candidate.fieldName,
    scope: candidate.scope,
    rawValue: candidate.rawValue,
    normalizedValue: candidate.normalizedValue,
    evidence: candidate.evidence.map((entry) => ({
      sourceKey: entry.sourceKey,
      snapshotId: entry.snapshotId,
    })),
    extractorVersion: candidate.extractorVersion,
  })}`;
}

const artifactDirectory = path.join(
  'research',
  'evidence',
  `importer-integrity-smoke-${process.pid}-${Date.now()}`,
);
const sourcesDirectory = path.join(artifactDirectory, 'sources');
const packPath = path.join(artifactDirectory, 'pack.json');

try {
  await mkdir(sourcesDirectory, { recursive: true });

  const sourceUrl = 'https://www.airalo.com/it/italy-esim/mamma-mia-in-10days-unlimited';
  const sourceBody = Buffer.from(
    '<!doctype html><html lang="it"><body><h1>Airalo Italia</h1><p>10 giorni — 29.00 €</p></body></html>',
  );
  const sourceSnapshot = buildSourceSnapshot({
    sourceKey: 'airalo-italy-plan',
    requestedUrl: sourceUrl,
    finalUrl: sourceUrl,
    redirectChain: [],
    fetchedAt: '2026-08-08T09:00:00.000Z',
    httpStatus: 200,
    contentType: 'text/html; charset=utf-8',
    etag: null,
    lastModified: null,
    body: sourceBody,
  });
  const { html, visibleText, ...source } = sourceSnapshot;
  await writeFile(path.join(sourcesDirectory, 'airalo-italy-plan.html'), sourceBody);

  const scenario = {
    id: 'italy-10d-high-data-hotspot',
    destination: 'italy',
    tripDays: 10,
    dataUse: 'high',
    hotspotRequired: true,
  };
  const offerKey = 'airalo:italy:unlimited-10d';
  const evidence = [{
    sourceKey: source.sourceKey,
    snapshotId: source.snapshotId,
    locator: {
      type: 'document_text',
      sourceKey: source.sourceKey,
      snapshotId: source.snapshotId,
      visibleTextSha256: source.visibleTextSha256,
      start: 0,
      end: 9,
      textAnchor: '29.00 €',
    },
  }];
  const candidate = {
    candidateKey: '',
    subjectType: 'scenario_offer',
    subjectKey: offerKey,
    fieldName: 'price',
    scope: {
      provider: 'airalo',
      scenarioId: scenario.id,
      region: null,
      countries: ['italy'],
    },
    rawValue: '29.00 €',
    normalizedValue: { amount: 29, currency: 'EUR' },
    evidence,
    observedAt: source.fetchedAt,
    extractorId: 'integrity-smoke-airalo',
    extractorVersion: '1.0.0',
    warnings: ['source_currency_preserved'],
    status: 'pending',
  };
  candidate.candidateKey = candidateKey(candidate);

  const pack = {
    schemaVersion: 1,
    packId: `pack:sha256:${hashCanonical({
      scenario,
      sourceSnapshotIds: [source.snapshotId],
    })}`,
    scenario,
    startedAt: '2026-08-08T09:00:00.000Z',
    completedAt: '2026-08-08T09:00:01.000Z',
    captureWindowMs: 1000,
    sources: [source],
    offers: [{
      provider: 'airalo',
      offerKey,
      label: 'Airalo integrity fixture',
      candidates: [candidate],
      coverage: {
        price: { state: 'observed', reason: null },
      },
    }],
    ranking: {
      status: 'not_computed',
      reason: 'Integrity fixture does not rank providers.',
    },
    semanticFingerprint: '',
    artifactLocation: artifactDirectory.split(path.sep).join('/'),
  };
  pack.semanticFingerprint = packSemanticFingerprint(pack);
  await writeFile(packPath, `${JSON.stringify(pack, null, 2)}\n`, 'utf8');

  await loadVerifiedEvidencePack(packPath);

  const originalFingerprint = pack.semanticFingerprint;
  const tampered = structuredClone(pack);
  tampered.offers[0].candidates[0].rawValue = '999.00 €';
  tampered.semanticFingerprint = packSemanticFingerprint(tampered);
  assert.equal(
    tampered.semanticFingerprint,
    originalFingerprint,
    'Raw candidate value is deliberately outside the semantic projection; candidate identity must protect it.',
  );
  await writeFile(packPath, `${JSON.stringify(tampered, null, 2)}\n`, 'utf8');

  await assert.rejects(
    () => loadVerifiedEvidencePack(packPath),
    /evidence_import_candidate_identity_mismatch:airalo:italy:unlimited-10d:price/,
  );

  console.log('Evidence pack importer candidate-integrity smoke passed: raw-value tamper survives semantic projection but fails the content-addressed candidate identity.');
} finally {
  await rm(artifactDirectory, { recursive: true, force: true });
}
