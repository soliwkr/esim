import assert from 'node:assert/strict';
import { extractAiralo } from './italy-comparison-evidence-pack.mjs';
import {
  AIRALO_EXACT_PACKAGE_URL,
  LIVE_SOURCE_CONFIG,
  captureLiveSource,
} from './run-italy-comparison-evidence-pack.mjs';

const airalo = LIVE_SOURCE_CONFIG.find((source) => source.key === 'airalo-italy-plan');
const airaloFup = LIVE_SOURCE_CONFIG.find((source) => source.key === 'airalo-unlimited-fup');
assert.ok(airalo, 'Airalo live source must exist.');
assert.ok(airaloFup, 'Airalo FUP source must exist.');
assert.equal(airalo.role, 'product_page');
assert.equal(airalo.url, AIRALO_EXACT_PACKAGE_URL);
assert.equal(airalo.url.includes('mamma-mia-in-10days-unlimited'), true);

const fixture = `<!doctype html><html lang="it"><head>
  <title>eSIM Italia, da 4.00 € | Il primo negozio di eSIM al mondo · Airalo</title>
</head><body>
  <h1>eSIM per Italia</h1>
  <p>Italia Wind Tre</p>
  <p>+altri 2</p>
  <div>Scegli il tuo pacchetto</div>
  <div>7 giorni Illimitato GB 21.00 €</div>
  <div data-testid="package-grouped-packages_duration-title">10 giorni</div>
  <button aria-label="Seleziona Illimitato - 10 Giorni a 29.00 €.">
    <span data-testid="card-package_spec-value">Illimitato</span>
    <span data-testid="card-package_spec-unit">GB</span>
    <span data-testid="price_amount">29.00 €</span>
  </button>
  <p>Velocità ridotta a 1 Mbps dopo il consumo giornaliero di 3 GB.</p>
  <div>15 giorni Illimitato GB 40.00 €</div>
  <script id="__NUXT_DATA__" type="application/json">["Mamma Mia","mamma-mia-in-10days-unlimited","29.00 €","Illimitato - 10 Giorni"]</script>
</body></html>`;

const fupFixture = `<!doctype html><html lang="en"><body>
  <h1>Unlimited Data Plans - Fair Use Policy</h1>
  <p>You can also use your device as a personal hotspot to share your connection with other devices. There is no limit on tethering or the number of devices you connect.</p>
  <p>When you use more than 3GB in a day, we'll slow down your internet speed to 1 Mbps for the rest of that day. Your daily allowance resets every 24 hours from activation.</p>
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
  now: () => new Date('2026-08-05T13:20:00.000Z'),
});

assert.equal(requestedUrl, AIRALO_EXACT_PACKAGE_URL);
assert.equal(captured.snapshot.requestedUrl, AIRALO_EXACT_PACKAGE_URL);
assert.equal(captured.snapshot.finalUrl, AIRALO_EXACT_PACKAGE_URL);
assert.equal(captured.snapshot.canonicalFinalUrl, AIRALO_EXACT_PACKAGE_URL);
assert.equal(captured.snapshot.provider, 'airalo');
assert.equal(captured.snapshot.role, 'product_page');
assert.equal(captured.snapshot.sourceAuditKey, 'candidate-airalo-italy-unlimited-10d');
assert.equal(captured.snapshot.locale, 'it');
assert.match(captured.snapshot.snapshotId, /^snapshot:sha256:[0-9a-f]{64}$/);

const capturedFup = await captureLiveSource(airaloFup, {
  fetchImpl: async () => new Response(fupFixture, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=UTF-8' },
  }),
  now: () => new Date('2026-08-05T13:20:01.000Z'),
});

const offer = extractAiralo(new Map([
  ['airalo-italy-plan', captured.snapshot],
  ['airalo-unlimited-fup', capturedFup.snapshot],
]));
const price = offer.candidates.find((candidate) => candidate.fieldName === 'price');
const validity = offer.candidates.find((candidate) => candidate.fieldName === 'validity_days');
const unlimited = offer.candidates.find((candidate) => candidate.fieldName === 'unlimited_policy');
assert.deepEqual(price.normalizedValue, { amount: 29, currency: 'EUR' });
assert.equal(price.rawValue, '29.00 €');
assert.deepEqual(validity.normalizedValue, { duration: 10, unit: 'day' });
assert.deepEqual(unlimited.normalizedValue, { unlimitedLabel: true });
assert.equal(offer.candidates.every((candidate) => candidate.status === 'pending'), true);
assert.equal(offer.coverage.network.state, 'partial');
assert.equal(offer.coverage.activation_policy.state, 'unknown');
assert.equal(offer.coverage.radio_technology.state, 'unknown');

const second = await captureLiveSource(airalo, {
  fetchImpl: async () => new Response(fixture, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=UTF-8' },
  }),
  now: () => new Date('2026-08-05T13:21:00.000Z'),
});
assert.equal(
  second.snapshot.snapshotId,
  captured.snapshot.snapshotId,
  'Identical exact-source bytes must keep the same provenance-aware snapshot identity.',
);

console.log('Italy comparison evidence pack live-source smoke passed.');
