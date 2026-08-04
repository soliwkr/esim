import assert from 'node:assert/strict';
import {
  AIRALO_EXACT_PACKAGE_URL,
  LIVE_SOURCE_CONFIG,
  captureLiveSource,
} from './run-italy-comparison-evidence-pack.mjs';

const airalo = LIVE_SOURCE_CONFIG.find((source) => source.key === 'airalo-italy-plan');
assert.ok(airalo, 'Airalo live source must exist.');
assert.equal(airalo.role, 'product_page');
assert.equal(airalo.url, AIRALO_EXACT_PACKAGE_URL);
assert.equal(airalo.url.includes('mamma-mia-in-10days-unlimited'), true);

const fixture = `<!doctype html><html lang="it"><body>
  <h1>Italia</h1>
  <p>Wind Tre</p>
  <p>10 giorni Illimitato GB $33.00 USD</p>
</body></html>`;

let requestedUrl = null;
const captured = await captureLiveSource(airalo, {
  fetchImpl: async (url) => {
    requestedUrl = url.toString();
    return new Response(fixture, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=UTF-8' },
    });
  },
  now: () => new Date('2026-08-04T15:45:00.000Z'),
});

assert.equal(requestedUrl, AIRALO_EXACT_PACKAGE_URL);
assert.equal(captured.snapshot.requestedUrl, AIRALO_EXACT_PACKAGE_URL);
assert.equal(captured.snapshot.finalUrl, AIRALO_EXACT_PACKAGE_URL);
assert.equal(captured.snapshot.canonicalFinalUrl, AIRALO_EXACT_PACKAGE_URL);
assert.equal(captured.snapshot.provider, 'airalo');
assert.equal(captured.snapshot.role, 'product_page');
assert.equal(captured.snapshot.sourceAuditKey, 'candidate-airalo-italy-unlimited-10d');
assert.match(captured.snapshot.snapshotId, /^snapshot:sha256:[0-9a-f]{64}$/);

const second = await captureLiveSource(airalo, {
  fetchImpl: async () => new Response(fixture, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=UTF-8' },
  }),
  now: () => new Date('2026-08-04T15:46:00.000Z'),
});
assert.equal(
  second.snapshot.snapshotId,
  captured.snapshot.snapshotId,
  'Identical exact-source bytes must keep the same provenance-aware snapshot identity.',
);

console.log('Italy comparison evidence pack live-source smoke passed.');
