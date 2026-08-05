import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import {
  MAX_CAPTURE_WINDOW_MS,
  SCENARIO,
  SOURCE_CONFIG,
  buildComparisonPack,
  buildSourceSnapshot,
  captureSource,
  packSemanticDiff,
  parseArgs,
  writeComparisonArtifact,
} from './italy-comparison-evidence-pack.mjs';

const STARTED_AT = '2026-08-03T18:00:00.000Z';
const COMPLETED_AT = '2026-08-03T18:00:30.000Z';

const FIXTURES = Object.freeze({
  'airalo-italy-plan': `<!doctype html><html lang="it"><body>
    <title>eSIM Italia, da 4.00 €</title>
    <h1>eSIM per Italia</h1><p>Italia Wind Tre</p><p>+altri 2</p>
    <section>Scegli il tuo pacchetto 3 giorni Illimitato GB 10.00 € 5 giorni Illimitato GB 15.50 € 7 giorni Illimitato GB 21.00 € 10 giorni Illimitato GB 29.00 € Velocità ridotta a 1 Mbps dopo il consumo giornaliero di 3 GB. 15 giorni Illimitato GB 40.00 €</section>
  </body></html>`,
  'airalo-unlimited-fup': `<!doctype html><html lang="en"><body>
    <h1>Unlimited Data Plans - Fair Use Policy</h1>
    <p>You can also use your device as a personal hotspot to share your connection with other devices. There is no limit on tethering or the number of devices you connect.</p>
    <p>When you use more than 3GB in a day, we'll slow down your internet speed to 1 Mbps for the rest of that day. Your daily allowance resets every 24 hours from activation.</p>
  </body></html>`,
  'holafly-italy-plan': `<!doctype html><html lang="it-IT"><body>
    <h1>eSIM per l'Italia</h1>
    <p>Dati illimitati</p>
    <p>La nostra eSIM internazionale per Italia include una copertura veloce 4G LTE e 5G (ove disponibile).</p>
    <p>Reti: Vodafone Italy / WINDTRE</p>
    <p>Il tuo piano si attiverà una volta arrivato a destinazione e acceso la tua eSIM.</p>
    <p>Condividi 1 GB di dati al giorno con familiari, amici o compagni di viaggio.</p>
    <table><tr><td>7 giorni</td><td>22,50 €EUR</td></tr><tr><td>10 giorni</td><td>30,50 €EUR</td></tr><tr><td>15 giorni</td><td>41,50 €EUR</td></tr></table>
  </body></html>`,
  'holafly-unlimited-faq': `<!doctype html><html lang="it-IT"><body>
    <h1>Holafly offre eSIM con dati illimitati?</h1>
    <p>Alcuni operatori potrebbero limitare la velocità dopo aver raggiunto una soglia di alta velocità, solitamente durante le ore di punta, a causa della loro Politica di Uso Corretto (FUP). Questo rallentamento dura un giorno e la velocità torna alla normalità il giorno successivo.</p>
  </body></html>`,
  'ubigi-italy-plan': `<!doctype html><html lang="en-GB"><body>
    <h1>eSIM • ITALY • 50GB • 30 days • US$29</h1>
    <ul><li>Smartstart – your data plan activation starts upon arrival at destination.</li><li>Data sharing allowed.</li></ul>
    <section>Destination Network(s) Italy Network(s): Iliad Network(s): WindTre</section>
    <img alt="Icon ecommerce 3G"><img alt="Icon ecommerce 4G"><img alt="Icon ecommerce 5G">
  </body></html>`,
  'ubigi-activation': `<!doctype html><html lang="en-US"><body>
    <h1>When does my Ubigi data plan activate?</h1>
    <p>Your data plan activates automatically upon arrival in a covered area, starting its validity period. This ensures you can fully use it without losing any days before your travel.</p>
    <p>Once purchased, your data plan appears in the My Account tab on your Ubigi account, where you can track data plan usage and renewal details. Getting started with SmartStart is easy. Upon arrival, simply switch on your Ubigi line in your mobile settings; your data plan will activate automatically and its validity will begin. This intentionally long intermediate copy proves that activation evidence is located as independent statements rather than by relying on a brittle maximum-distance regex across unrelated help-page copy.</p>
    <p>Note: If you are already in a covered area when you purchase the data plan, activation starts immediately.</p>
  </body></html>`,
});

function buildSnapshots({ holaflyPrice = '30,50 €EUR', noise = '', ubigiNetworkDetails = true } = {}) {
  const snapshots = new Map();
  for (const [index, source] of SOURCE_CONFIG.entries()) {
    let html = FIXTURES[source.key];
    if (source.key === 'holafly-italy-plan') html = html.replace('30,50 €EUR', holaflyPrice);
    if (source.key === 'airalo-italy-plan' && noise) html = html.replace('</body>', `<footer>${noise}</footer></body>`);
    if (source.key === 'ubigi-italy-plan' && !ubigiNetworkDetails) {
      html = html
        .replace('    <section>Destination Network(s) Italy Network(s): Iliad Network(s): WindTre</section>\n', '')
        .replace('    <img alt="Icon ecommerce 3G"><img alt="Icon ecommerce 4G"><img alt="Icon ecommerce 5G">\n', '');
    }
    snapshots.set(source.key, buildSourceSnapshot({
      sourceKey: source.key,
      requestedUrl: source.url,
      finalUrl: source.url,
      redirectChain: [],
      fetchedAt: `2026-08-03T18:00:0${index}.000Z`,
      httpStatus: 200,
      contentType: 'text/html; charset=UTF-8',
      body: Buffer.from(html),
    }));
  }
  return snapshots;
}

const firstSnapshots = buildSnapshots();
const first = buildComparisonPack({ snapshots: firstSnapshots, startedAt: STARTED_AT, completedAt: COMPLETED_AT });

assert.equal(first.schemaVersion, 1);
assert.equal(first.scenario.id, SCENARIO.id);
assert.equal(first.scenario.tripDays, 10);
assert.equal(first.sources.length, SOURCE_CONFIG.length);
assert.equal(first.offers.length, 3);
assert.equal(first.ranking.status, 'not_computed');
assert.match(first.packId, /^pack:sha256:[0-9a-f]{64}$/);
assert.match(first.semanticFingerprint, /^sha256:[0-9a-f]{64}$/);
assert.equal(first.sources.every((source) => !('html' in source) && !('visibleText' in source)), true);

const byProvider = new Map(first.offers.map((offer) => [offer.provider, offer]));
const candidate = (provider, fieldName) => byProvider.get(provider).candidates.find((entry) => entry.fieldName === fieldName);

assert.deepEqual(candidate('airalo', 'price').normalizedValue, { amount: 29, currency: 'EUR' });
assert.equal(candidate('airalo', 'price').rawValue, '29.00 €');
assert.deepEqual(candidate('airalo', 'validity_days').normalizedValue, { duration: 10, unit: 'day' });
assert.deepEqual(candidate('airalo', 'unlimited_policy').normalizedValue, { unlimitedLabel: true });
assert.deepEqual(candidate('airalo', 'fair_use_policy').normalizedValue, {
  highSpeedThreshold: { quantity: 3, unit: 'GB', period: '24h' },
  postThresholdSpeedMbps: 1,
  resetsEvery: '24h_from_activation',
});
assert.deepEqual(candidate('airalo', 'hotspot_share_limit').normalizedValue, { separateTetheringCapDeclared: false, overallFupApplies: true });
assert.equal(byProvider.get('airalo').coverage.activation_policy.state, 'unknown');
assert.equal(byProvider.get('airalo').coverage.network.state, 'partial');
assert.equal(byProvider.get('airalo').coverage.radio_technology.state, 'unknown');

assert.deepEqual(candidate('holafly', 'price').normalizedValue, { amount: 30.5, currency: 'EUR' });
assert.deepEqual(candidate('holafly', 'validity_days').normalizedValue, { duration: 10, unit: 'day' });
assert.deepEqual(candidate('holafly', 'hotspot_share_limit').normalizedValue, { quantity: 1, unit: 'GB', period: 'day' });
assert.deepEqual(candidate('holafly', 'network').normalizedValue, { operators: ['Vodafone Italy', 'WINDTRE'], completeness: 'declared' });
assert.deepEqual(candidate('holafly', 'radio_technology').normalizedValue, { technologies: ['4G LTE', '5G'], qualifier: 'where_available' });
assert.equal(byProvider.get('holafly').coverage.fair_use_policy.state, 'partial');

assert.deepEqual(candidate('ubigi', 'price').normalizedValue, { amount: 29, currency: 'USD' });
assert.deepEqual(candidate('ubigi', 'data_gb').normalizedValue, { quantity: 50, unit: 'GB' });
assert.deepEqual(candidate('ubigi', 'validity_days').normalizedValue, { duration: 30, unit: 'day' });
assert.deepEqual(candidate('ubigi', 'destination_coverage').normalizedValue, { countries: ['IT'], scope: 'local' });
assert.deepEqual(candidate('ubigi', 'activation_policy').normalizedValue, { trigger: 'covered_area_connection', purchaseWhileCovered: 'immediate' });
assert.equal(candidate('ubigi', 'activation_policy').evidence.length, 3);
assert.deepEqual(candidate('ubigi', 'network').normalizedValue, { operators: ['Iliad', 'WindTre'], completeness: 'declared' });
assert.deepEqual(candidate('ubigi', 'radio_technology').normalizedValue, { technologies: ['3G', '4G', '5G'], qualifier: 'declared_for_destination' });
assert.equal(byProvider.get('ubigi').coverage.hotspot_share_limit.state, 'unknown');

const sparseUbigi = buildComparisonPack({ snapshots: buildSnapshots({ ubigiNetworkDetails: false }), startedAt: STARTED_AT, completedAt: COMPLETED_AT });
const sparseUbigiOffer = sparseUbigi.offers.find((offer) => offer.provider === 'ubigi');
assert.deepEqual(sparseUbigiOffer.candidates.find((entry) => entry.fieldName === 'destination_coverage').normalizedValue, { countries: ['IT'], scope: 'local' });
assert.equal(sparseUbigiOffer.coverage.destination_coverage.state, 'observed');
assert.equal(sparseUbigiOffer.coverage.network.state, 'unknown');
assert.equal(sparseUbigiOffer.coverage.radio_technology.state, 'unknown');
assert.equal(sparseUbigiOffer.candidates.some((entry) => entry.fieldName === 'network'), false);
assert.equal(sparseUbigiOffer.candidates.some((entry) => entry.fieldName === 'radio_technology'), false);
assert.equal(sparseUbigi.ranking.status, 'not_computed');

for (const offer of first.offers) {
  assert.equal(offer.candidates.every((entry) => entry.status === 'pending'), true);
  assert.equal(offer.candidates.every((entry) => typeof entry.rawValue === 'string' && entry.rawValue.length > 0), true);
  assert.equal(offer.candidates.every((entry) => /^sha256:[0-9a-f]{64}$/.test(entry.candidateKey)), true);
  assert.equal(offer.candidates.every((entry) => entry.evidence.length > 0), true);
}
assert.equal(first.offers.some((offer) => offer.candidates.some((entry) => entry.fieldName === 'price_eur')), false);
assert.equal(JSON.stringify(first).includes('winner'), false);

const noisy = buildComparisonPack({ snapshots: buildSnapshots({ noise: 'unrelated footer drift' }), startedAt: STARTED_AT, completedAt: COMPLETED_AT });
assert.notEqual(noisy.sources.find((source) => source.sourceKey === 'airalo-italy-plan').snapshotId, first.sources.find((source) => source.sourceKey === 'airalo-italy-plan').snapshotId);
assert.equal(noisy.semanticFingerprint, first.semanticFingerprint, 'Unrelated raw drift must not create a semantic pack delta.');
assert.deepEqual(packSemanticDiff(first, noisy), []);

const changed = buildComparisonPack({ snapshots: buildSnapshots({ holaflyPrice: '31,50 €EUR' }), startedAt: STARTED_AT, completedAt: COMPLETED_AT });
const changes = packSemanticDiff(first, changed);
assert.equal(changes.length, 1);
assert.equal(changes[0].provider, 'holafly');
assert.deepEqual(changed.offers.find((offer) => offer.provider === 'holafly').candidates.find((entry) => entry.fieldName === 'price').normalizedValue, { amount: 31.5, currency: 'EUR' });

assert.throws(
  () => buildComparisonPack({ snapshots: firstSnapshots, startedAt: STARTED_AT, completedAt: new Date(new Date(STARTED_AT).getTime() + MAX_CAPTURE_WINDOW_MS + 1).toISOString() }),
  /exceeds/,
);
assert.throws(() => parseArgs(['--out', '../outside']), /repository/);
assert.throws(() => parseArgs(['--compare', '../../pack.json']), /repository/);

const airaloSource = SOURCE_CONFIG.find((source) => source.key === 'airalo-italy-plan');
await assert.rejects(
  () => captureSource(airaloSource, {
    fetchImpl: async () => new Response('', { status: 302, headers: { location: 'https://example.com/escape' } }),
    now: () => new Date(STARTED_AT),
  }),
  /escaped the allowlisted hosts/,
);

const artifactRoot = path.join('research', 'evidence', `pack-smoke-${process.pid}-${Date.now()}`);
const bodies = new Map(SOURCE_CONFIG.map((source) => [source.key, Buffer.from(FIXTURES[source.key])]));
try {
  const artifact = await writeComparisonArtifact({ captured: { pack: first, snapshots: firstSnapshots, bodies }, outputDirectory: artifactRoot });
  const persisted = JSON.parse(await readFile(artifact.packPath, 'utf8'));
  assert.equal(persisted.packId, first.packId);
  assert.equal(persisted.ranking.status, 'not_computed');
  assert.equal(persisted.artifactLocation.startsWith('research/evidence/'), true);
  for (const source of SOURCE_CONFIG) {
    const raw = await readFile(path.join(artifact.artifactDirectory, 'sources', `${source.key}.html`), 'utf8');
    assert.equal(raw, FIXTURES[source.key]);
  }
  await assert.rejects(
    () => writeComparisonArtifact({ captured: { pack: first, snapshots: firstSnapshots, bodies }, outputDirectory: artifactRoot }),
    /EEXIST/,
  );
} finally {
  await rm(artifactRoot, { recursive: true, force: true });
}

console.log('Italy comparison evidence pack smoke passed.');
