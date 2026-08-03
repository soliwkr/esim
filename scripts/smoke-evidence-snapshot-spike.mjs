import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import {
  EVIDENCE_SCHEMA_VERSION,
  UBIGI_ITALY_50GB_URL,
  buildEvidenceSnapshot,
  canonicalizeEvidenceUrl,
  captureUbigiEvidence,
  extractUbigiPlanCandidates,
  parseArgs,
  semanticDiff,
  writeEvidenceArtifact,
} from './evidence-snapshot-spike.mjs';

const FIXTURE = `<!doctype html>
<html lang="en-US">
<head><title>Fixture only</title></head>
<body>
  <main>
    <h1>eSIM • ITALY • <strong>50GB</strong> • 30 days • US$29</h1>
    <p>This fixture contains no copied third-party body content.</p>
  </main>
</body>
</html>`;

const FETCHED_AT = '2026-08-03T12:00:00.000Z';

function snapshotFrom(html, fetchedAt = FETCHED_AT) {
  return buildEvidenceSnapshot({
    fetchedAt,
    body: Buffer.from(html),
    etag: '"fixture-v1"',
    lastModified: 'Sun, 03 Aug 2026 12:00:00 GMT',
  });
}

const first = snapshotFrom(FIXTURE);
assert.equal(first.schemaVersion, EVIDENCE_SCHEMA_VERSION);
assert.equal(first.sourceAuditKey, 'provider-ubigi-commerce');
assert.equal(first.requestedUrl, UBIGI_ITALY_50GB_URL);
assert.equal(first.finalUrl, UBIGI_ITALY_50GB_URL);
assert.equal(first.locale, 'en-US');
assert.equal(first.currencyContext, 'USD');
assert.equal(first.countryContext, 'IT');
assert.match(first.snapshotId, /^snapshot:sha256:[0-9a-f]{64}$/);
assert.match(first.bodySha256, /^sha256:[0-9a-f]{64}$/);
assert.match(first.semanticFingerprint, /^sha256:[0-9a-f]{64}$/);
assert.equal(first.candidates.length, 3);

const byField = new Map(first.candidates.map((candidate) => [candidate.fieldName, candidate]));
assert.deepEqual(byField.get('data_gb').normalizedValue, { quantity: 50, unit: 'GB' });
assert.deepEqual(byField.get('validity_days').normalizedValue, { duration: 30, unit: 'day' });
assert.deepEqual(byField.get('price').normalizedValue, { amount: 29, currency: 'USD' });
assert.equal(byField.has('price_eur'), false, 'USD evidence must not be written into price_eur.');
assert.deepEqual(byField.get('price').warnings, ['downstream_price_eur_mapping_required']);
assert.deepEqual(byField.get('validity_days').warnings, ['activation_trigger_out_of_scope']);

for (const candidate of first.candidates) {
  assert.equal(candidate.status, 'pending');
  assert.equal(candidate.sourceRole, 'product_page');
  assert.equal(candidate.subjectType, 'plan');
  assert.equal(candidate.subjectKey, 'ubigi:italy-50gb-30-days');
  assert.deepEqual(candidate.scope, {
    provider: 'ubigi',
    plan: 'italy-50gb-30-days',
    destination: 'italy',
    deviceModel: null,
    deviceRegion: null,
  });
  assert.match(candidate.candidateKey, /^sha256:[0-9a-f]{64}$/);
  assert.equal(candidate.evidenceLocator.type, 'html');
  assert.equal(candidate.evidenceLocator.selector, 'h1');
  assert.equal(first.evidenceHeading.slice(candidate.evidenceLocator.start, candidate.evidenceLocator.end), candidate.rawValue);
}

const sameBodyLater = snapshotFrom(FIXTURE, '2026-08-03T13:00:00.000Z');
assert.equal(sameBodyLater.snapshotId, first.snapshotId, 'Snapshot content identity must be stable for identical source bytes.');
assert.equal(sameBodyLater.semanticFingerprint, first.semanticFingerprint);
assert.deepEqual(semanticDiff(first.candidates, sameBodyLater.candidates), []);

const htmlNoiseChanged = snapshotFrom(FIXTURE.replace('Fixture only', 'Fixture title changed'));
assert.notEqual(htmlNoiseChanged.snapshotId, first.snapshotId, 'Raw artifact change must change snapshot identity.');
assert.equal(htmlNoiseChanged.semanticFingerprint, first.semanticFingerprint, 'Non-claim HTML noise must not create a semantic claim delta.');
assert.deepEqual(semanticDiff(first.candidates, htmlNoiseChanged.candidates), []);

const priceChanged = snapshotFrom(FIXTURE.replace('US$29', 'US$31'));
const priceChanges = semanticDiff(first.candidates, priceChanged.candidates);
assert.equal(priceChanges.length, 1);
assert.equal(priceChanges[0].fieldName, 'price');
assert.deepEqual(priceChanges[0].before.normalizedValue, { amount: 29, currency: 'USD' });
assert.deepEqual(priceChanges[0].after.normalizedValue, { amount: 31, currency: 'USD' });

assert.throws(
  () => extractUbigiPlanCandidates({
    html: FIXTURE.replace('US$29', 'US$29 • US$31'),
    snapshotId: first.snapshotId,
    observedAt: FETCHED_AT,
  }),
  /exactly one price/,
);
assert.throws(
  () => snapshotFrom(FIXTURE.replace('</main>', '<h1>duplicate</h1></main>')),
  /exactly one h1/,
);
assert.throws(
  () => snapshotFrom(FIXTURE.replace('ITALY', 'FRANCE')),
  /Unexpected product heading scope/,
);
assert.throws(
  () => snapshotFrom(FIXTURE.replace('US$29', '$29')),
  /exactly one price/,
);
assert.throws(
  () => buildEvidenceSnapshot({ fetchedAt: FETCHED_AT, contentType: 'application/json', body: Buffer.from(FIXTURE) }),
  /Unsupported content type/,
);
assert.throws(
  () => buildEvidenceSnapshot({
    fetchedAt: FETCHED_AT,
    finalUrl: 'https://example.com/plan',
    body: Buffer.from(FIXTURE),
  }),
  /must stay on cellulardata\.ubigi\.com/,
);

assert.equal(
  canonicalizeEvidenceUrl(`${UBIGI_ITALY_50GB_URL}?utm_source=smoke&currency=USD#g`),
  `${UBIGI_ITALY_50GB_URL}?currency=USD`,
);
assert.deepEqual(parseArgs([]), {
  out: 'research/evidence/snapshots',
  compare: null,
  help: false,
});
assert.throws(() => parseArgs(['--out', '../outside']), /repository/);
assert.throws(() => parseArgs(['--out', '/tmp/outside']), /repository/);
assert.throws(() => parseArgs(['--compare', '../../secret.json']), /repository/);

const redirectedResponses = [
  new Response('', {
    status: 302,
    headers: { location: `${UBIGI_ITALY_50GB_URL}?utm_source=redirect` },
  }),
  new Response(FIXTURE, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', etag: '"redirected"' },
  }),
];
const redirected = await captureUbigiEvidence({
  fetchImpl: async () => redirectedResponses.shift(),
  now: () => new Date(FETCHED_AT),
});
assert.equal(redirected.snapshot.redirectChain.length, 1);
assert.equal(redirected.snapshot.canonicalFinalUrl, UBIGI_ITALY_50GB_URL);
assert.equal(redirected.snapshot.etag, '"redirected"');
assert.equal(redirected.body.toString('utf8'), FIXTURE);

await assert.rejects(
  () => captureUbigiEvidence({
    fetchImpl: async () => new Response('', { status: 302, headers: { location: 'https://example.com/escape' } }),
    now: () => new Date(FETCHED_AT),
  }),
  /must stay on cellulardata\.ubigi\.com/,
);

const artifactRoot = path.join('research', 'evidence', `smoke-${process.pid}-${Date.now()}`);
try {
  const artifact = await writeEvidenceArtifact({
    snapshot: first,
    rawBody: Buffer.from(FIXTURE),
    outputDirectory: artifactRoot,
  });
  const raw = await readFile(artifact.rawPath, 'utf8');
  const metadata = JSON.parse(await readFile(artifact.metadataPath, 'utf8'));
  assert.equal(raw, FIXTURE);
  assert.equal(metadata.snapshotId, first.snapshotId);
  assert.equal(metadata.artifactLocation.startsWith('research/evidence/'), true);
  assert.equal(metadata.candidates.every((candidate) => candidate.status === 'pending'), true);

  await assert.rejects(
    () => writeEvidenceArtifact({
      snapshot: first,
      rawBody: Buffer.from(FIXTURE),
      outputDirectory: artifactRoot,
    }),
    /EEXIST/,
    'An identical artifact path must not be overwritten.',
  );
  await assert.rejects(
    () => writeEvidenceArtifact({
      snapshot: first,
      rawBody: Buffer.from(FIXTURE.replace('US$29', 'US$30')),
      outputDirectory: artifactRoot,
    }),
    /hash does not match/,
  );
} finally {
  await rm(artifactRoot, { recursive: true, force: true });
}

console.log('Evidence snapshot spike smoke passed.');
