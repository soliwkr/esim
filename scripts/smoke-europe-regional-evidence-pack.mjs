import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import {
  PACK_EXTRACTOR_VERSION,
  SCENARIO,
  SOURCE_CONFIG,
  buildComparisonPack,
  buildSourceSnapshot,
  captureSource,
  writeComparisonArtifact,
} from './europe-regional-evidence-pack.mjs';
import { MAX_CAPTURE_WINDOW_MS, packSemanticDiff } from './italy-comparison-evidence-pack.mjs';

const STARTED_AT = '2026-08-05T16:00:00.000Z';
const COMPLETED_AT = '2026-08-05T16:00:30.000Z';

const FIXTURES = Object.freeze({
  'airalo-europe-plan': `<!doctype html><html lang="en"><body>
    <h1>Europe</h1><p>41 Countries and Networks</p>
    <p>3 days Unlimited GB 10.50 €</p><p>15 days Unlimited GB 44.50 €</p><p>30 days Unlimited GB 64.00 €</p>
  </body></html>`,
  'airalo-unlimited-fup': `<!doctype html><html lang="en"><body>
    <p>You can also use your device as a personal hotspot to share your connection with other devices. There is no limit on tethering or the number of devices you connect.</p>
    <p>When you use more than 3GB in a day, we'll slow down your internet speed to 1 Mbps for the rest of that day. Your daily allowance resets every 24 hours from activation.</p>
  </body></html>`,
  'holafly-europe-plan': `<!doctype html><html lang="it-IT"><body>
    <h1>eSIM per l'Europa</h1><p>Dati illimitati</p><p>33 paesi inclusi</p>
    <p>La nostra eSIM internazionale per Europa include una copertura veloce 4G LTE e 5G (ove disponibile).</p>
    <p>Il tuo piano si attiverà una volta arrivato a destinazione e acceso la tua eSIM.</p>
    <p>Condividi 1 GB di dati al giorno con familiari, amici o compagni di viaggio.</p>
    <p>15 giorni 46,90 €EUR</p><p>Le carte eSIM Holafly per le l’Europa includono solo dati mobili nel paese di destinazione.</p>
  </body></html>`,
  'holafly-unlimited-faq': `<!doctype html><html lang="it-IT"><body>
    <p>Alcuni operatori potrebbero limitare la velocità dopo aver raggiunto una soglia di alta velocità, a causa della loro Politica di Uso Corretto (FUP). Questo rallentamento dura un giorno e la velocità torna alla normalità il giorno successivo.</p>
  </body></html>`,
  'ubigi-europe-plan': `<!doctype html><html lang="en-GB"><body>
    <h1>eSIM • EUROPE • 25GB • 30 days • US$29</h1>
    <p>Smartstart – your data plan activation starts upon arrival at destination.</p><p>Data sharing allowed.</p>
    <section>France Network(s): Free Mobile Network(s): Orange Network(s): SFR Germany Network(s): O2 Italy Network(s): Iliad Network(s): WindTre Jersey Network(s): Sure Telecom Spain Network(s): Orange Spain Sweden Network(s): Tele2</section>
    <img alt="Icon ecommerce 3G"><img alt="Icon ecommerce 4G"><img alt="Icon ecommerce 5G">
    <p>Ubigi is a data-only service, allowing you to use messaging apps.</p>
  </body></html>`,
  'ubigi-activation': `<!doctype html><html lang="en-US"><body>
    <p>Your data plan activates automatically upon arrival in a covered area, starting its validity period.</p>
    <p>If you are already in a covered area when you purchase the data plan, activation starts immediately.</p>
  </body></html>`,
});

function buildSnapshots({ holaflyPrice = '46,90 €EUR', noise = '', sparseUbigiNetworks = false } = {}) {
  const snapshots = new Map();
  for (const [index, source] of SOURCE_CONFIG.entries()) {
    let html = FIXTURES[source.key];
    if (source.key === 'holafly-europe-plan') html = html.replace('46,90 €EUR', holaflyPrice);
    if (source.key === 'airalo-europe-plan' && noise) html = html.replace('</body>', `<footer>${noise}</footer></body>`);
    if (source.key === 'ubigi-europe-plan' && sparseUbigiNetworks) {
      html = html.replace(/<section>[\s\S]*?<\/section>/, '<section>Europe coverage table unavailable in this static fixture.</section>');
    }
    snapshots.set(source.key, buildSourceSnapshot({
      sourceKey: source.key,
      requestedUrl: source.url,
      finalUrl: source.url,
      fetchedAt: `2026-08-05T16:00:0${index}.000Z`,
      httpStatus: 200,
      contentType: 'text/html; charset=UTF-8',
      body: Buffer.from(html),
    }));
  }
  return snapshots;
}

const firstSnapshots = buildSnapshots();
const first = buildComparisonPack({ snapshots: firstSnapshots, startedAt: STARTED_AT, completedAt: COMPLETED_AT });
assert.equal(PACK_EXTRACTOR_VERSION, '1.0.1');
assert.equal(first.scenario.id, SCENARIO.id);
assert.equal(first.scenario.tripDays, 14);
assert.deepEqual(first.scenario.countries, ['IT', 'FR', 'ES']);
assert.equal(first.offers.length, 3);
assert.equal(first.sources.length, 6);
assert.equal(first.ranking.status, 'not_computed');

const byProvider = new Map(first.offers.map((offer) => [offer.provider, offer]));
const candidate = (provider, fieldName) => byProvider.get(provider).candidates.find((entry) => entry.fieldName === fieldName);

for (const provider of ['airalo', 'holafly', 'ubigi']) {
  assert.deepEqual(candidate(provider, 'plan_type').normalizedValue, { type: 'regional', region: 'EUROPE' });
}

assert.equal(SOURCE_CONFIG.find((source) => source.key === 'airalo-europe-plan').url, 'https://www.airalo.com/europe-esim');
assert.deepEqual(candidate('airalo', 'destination_coverage').normalizedValue, { scope: 'regional', region: 'EUROPE', declaredCountryCount: 41 });
assert.deepEqual(candidate('airalo', 'price').normalizedValue, { amount: 44.5, currency: 'EUR' });
assert.deepEqual(candidate('airalo', 'validity_days').normalizedValue, { duration: 15, unit: 'day' });
assert.deepEqual(candidate('airalo', 'unlimited_policy').normalizedValue, { unlimitedLabel: true });
assert.equal(byProvider.get('airalo').coverage.destination_coverage.state, 'partial');
assert.equal(byProvider.get('airalo').coverage.activation_policy.state, 'unknown');
assert.equal(candidate('airalo', 'activation_policy'), undefined);
assert.equal(candidate('airalo', 'price').extractorVersion, '1.0.1');

assert.deepEqual(candidate('holafly', 'price').normalizedValue, { amount: 46.9, currency: 'EUR' });
assert.deepEqual(candidate('holafly', 'validity_days').normalizedValue, { duration: 15, unit: 'day' });
assert.deepEqual(candidate('holafly', 'hotspot_share_limit').normalizedValue, { quantity: 1, unit: 'GB', period: 'day' });
assert.deepEqual(candidate('holafly', 'voice_sms_included').normalizedValue, { dataOnly: true, nativeVoice: false, nativeSms: false });
assert.equal(byProvider.get('holafly').coverage.destination_coverage.state, 'partial');
assert.equal(byProvider.get('holafly').coverage.network.state, 'unknown');

assert.deepEqual(candidate('ubigi', 'price').normalizedValue, { amount: 29, currency: 'USD' });
assert.deepEqual(candidate('ubigi', 'data_gb').normalizedValue, { quantity: 25, unit: 'GB' });
assert.deepEqual(candidate('ubigi', 'validity_days').normalizedValue, { duration: 30, unit: 'day' });
assert.deepEqual(candidate('ubigi', 'destination_coverage').normalizedValue, { scope: 'regional', region: 'EUROPE', scenarioCountriesConfirmed: ['IT', 'FR', 'ES'] });
assert.deepEqual(candidate('ubigi', 'network').normalizedValue, {
  byCountry: { FR: ['Free Mobile', 'Orange', 'SFR'], IT: ['Iliad', 'WindTre'], ES: ['Orange Spain'] },
  completeness: 'scenario_countries_only',
});
assert.equal(byProvider.get('ubigi').coverage.network.state, 'partial');
assert.equal(byProvider.get('ubigi').coverage.hotspot_share_limit.state, 'unknown');
assert.deepEqual(candidate('ubigi', 'voice_sms_included').normalizedValue, { dataOnly: true, nativeVoice: false, nativeSms: false });

for (const offer of first.offers) {
  assert.equal(offer.candidates.every((entry) => entry.status === 'pending'), true);
  assert.equal(offer.candidates.every((entry) => entry.evidence.length > 0), true);
  assert.equal(offer.candidates.every((entry) => typeof entry.rawValue === 'string' && entry.rawValue.length > 0), true);
}
assert.equal(first.offers.some((offer) => offer.candidates.some((entry) => entry.fieldName === 'price_eur')), false);
assert.equal(JSON.stringify(first).includes('winner'), false);

const noisy = buildComparisonPack({ snapshots: buildSnapshots({ noise: 'irrelevant footer drift' }), startedAt: STARTED_AT, completedAt: COMPLETED_AT });
assert.notEqual(noisy.sources.find((entry) => entry.sourceKey === 'airalo-europe-plan').snapshotId, first.sources.find((entry) => entry.sourceKey === 'airalo-europe-plan').snapshotId);
assert.equal(noisy.semanticFingerprint, first.semanticFingerprint);
assert.deepEqual(packSemanticDiff(first, noisy), []);

const changed = buildComparisonPack({ snapshots: buildSnapshots({ holaflyPrice: '47,90 €EUR' }), startedAt: STARTED_AT, completedAt: COMPLETED_AT });
const changes = packSemanticDiff(first, changed);
assert.equal(changes.length, 1);
assert.equal(changes[0].provider, 'holafly');

const sparse = buildComparisonPack({ snapshots: buildSnapshots({ sparseUbigiNetworks: true }), startedAt: STARTED_AT, completedAt: COMPLETED_AT });
const sparseUbigi = sparse.offers.find((offer) => offer.provider === 'ubigi');
assert.equal(sparseUbigi.coverage.destination_coverage.state, 'unknown');
assert.equal(sparseUbigi.coverage.network.state, 'unknown');
assert.equal(sparseUbigi.candidates.some((entry) => entry.fieldName === 'network'), false);
assert.equal(sparse.ranking.status, 'not_computed');

assert.throws(
  () => buildComparisonPack({
    snapshots: firstSnapshots,
    startedAt: STARTED_AT,
    completedAt: new Date(new Date(STARTED_AT).getTime() + MAX_CAPTURE_WINDOW_MS + 1).toISOString(),
  }),
  /exceeds/,
);

const airaloSource = SOURCE_CONFIG.find((source) => source.key === 'airalo-europe-plan');
await assert.rejects(
  () => captureSource(airaloSource, {
    fetchImpl: async () => new Response('', { status: 302, headers: { location: 'https://example.com/escape' } }),
    now: () => new Date(STARTED_AT),
  }),
  /escaped the allowlisted hosts/,
);

const legacyAiraloUrl = 'https://www.airalo.com/europe-esim/eurolink-15days-unlimited';
let legacyCall = 0;
const legacyCaptured = await captureSource({ ...airaloSource, url: legacyAiraloUrl }, {
  fetchImpl: async (url) => {
    legacyCall += 1;
    if (legacyCall === 1) {
      assert.equal(String(url), legacyAiraloUrl);
      return new Response('', { status: 302, headers: { location: 'https://www.airalo.com/europe-esim' } });
    }
    assert.equal(String(url), 'https://www.airalo.com/europe-esim');
    return new Response(FIXTURES['airalo-europe-plan'], { status: 200, headers: { 'content-type': 'text/html;charset=utf-8' } });
  },
  now: () => new Date(STARTED_AT),
});
assert.equal(legacyCaptured.snapshot.requestedUrl, legacyAiraloUrl);
assert.equal(legacyCaptured.snapshot.finalUrl, 'https://www.airalo.com/europe-esim');
assert.equal(legacyCaptured.snapshot.canonicalFinalUrl, 'https://www.airalo.com/europe-esim');
assert.equal(legacyCaptured.snapshot.redirectChain.length, 1);
assert.equal(legacyCaptured.snapshot.redirectChain[0].status, 302);

const artifactRoot = path.join('research', 'evidence', `europe-pack-smoke-${process.pid}-${Date.now()}`);
const bodies = new Map(SOURCE_CONFIG.map((source) => [source.key, Buffer.from(FIXTURES[source.key])]));
try {
  const artifact = await writeComparisonArtifact({ captured: { pack: first, snapshots: firstSnapshots, bodies }, outputDirectory: artifactRoot });
  const persisted = JSON.parse(await readFile(artifact.packPath, 'utf8'));
  assert.equal(persisted.packId, first.packId);
  assert.equal(persisted.ranking.status, 'not_computed');
  for (const source of SOURCE_CONFIG) {
    assert.equal(await readFile(path.join(artifact.artifactDirectory, 'sources', `${source.key}.html`), 'utf8'), FIXTURES[source.key]);
  }
  await assert.rejects(
    () => writeComparisonArtifact({ captured: { pack: first, snapshots: firstSnapshots, bodies }, outputDirectory: artifactRoot }),
    /EEXIST/,
  );
} finally {
  await rm(artifactRoot, { recursive: true, force: true });
}

console.log('Europe regional evidence pack smoke passed.');
