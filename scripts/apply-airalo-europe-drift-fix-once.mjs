import { readFileSync, writeFileSync } from 'node:fs';

function replaceExactlyOnce(text, before, after, label) {
  const first = text.indexOf(before);
  if (first < 0) throw new Error(`${label}: target not found`);
  if (text.indexOf(before, first + before.length) >= 0) throw new Error(`${label}: target not unique`);
  return text.slice(0, first) + after + text.slice(first + before.length);
}

const sourcePath = 'scripts/europe-regional-evidence-pack.mjs';
let source = readFileSync(sourcePath, 'utf8');
source = replaceExactlyOnce(
  source,
  "export const PACK_EXTRACTOR_VERSION = '1.0.1';",
  "export const PACK_EXTRACTOR_VERSION = '1.0.2';",
  'extractor version',
);
source = replaceExactlyOnce(
  source,
  String.raw`    /(15\s+days)\s+(Unlimited\s+GB)\s+(\d+(?:[.,]\d{1,2})?\s*€(?:\s*EUR)?)/i,`,
  String.raw`    /(15\s+days)\s+(Unlimited\s+GB)\s+((?:\d+(?:[.,]\d{1,2})?\s*€(?:\s*EUR)?)|(?:(?:US)?\$\s*\d+(?:[.,]\d{1,2})?(?:\s*USD)?))/i,`,
  'Airalo 15-day row locator',
);
writeFileSync(sourcePath, source);

const smokePath = 'scripts/smoke-europe-regional-evidence-pack.mjs';
let smoke = readFileSync(smokePath, 'utf8');
smoke = replaceExactlyOnce(
  smoke,
  "function buildSnapshots({ holaflyPrice = '46,90 €EUR', noise = '', sparseUbigiNetworks = false } = {}) {",
  "function buildSnapshots({ airaloPrice = '44.50 €', holaflyPrice = '46,90 €EUR', noise = '', sparseUbigiNetworks = false } = {}) {",
  'smoke snapshot args',
);
smoke = replaceExactlyOnce(
  smoke,
  "    let html = FIXTURES[source.key];\n    if (source.key === 'holafly-europe-plan') html = html.replace('46,90 €EUR', holaflyPrice);",
  "    let html = FIXTURES[source.key];\n    if (source.key === 'airalo-europe-plan') html = html.replace('44.50 €', airaloPrice);\n    if (source.key === 'holafly-europe-plan') html = html.replace('46,90 €EUR', holaflyPrice);",
  'smoke Airalo price fixture injection',
);
smoke = replaceExactlyOnce(
  smoke,
  "assert.equal(PACK_EXTRACTOR_VERSION, '1.0.1');",
  "assert.equal(PACK_EXTRACTOR_VERSION, '1.0.2');",
  'smoke extractor version',
);
smoke = replaceExactlyOnce(
  smoke,
  "assert.equal(candidate('airalo', 'price').extractorVersion, '1.0.1');",
  `assert.equal(candidate('airalo', 'price').extractorVersion, '1.0.2');

const currentAiraloUsd = buildComparisonPack({ snapshots: buildSnapshots({ airaloPrice: '$49.00 USD' }), startedAt: STARTED_AT, completedAt: COMPLETED_AT });
const currentAiraloOffer = currentAiraloUsd.offers.find((offer) => offer.provider === 'airalo');
const currentAiraloPrice = currentAiraloOffer.candidates.find((entry) => entry.fieldName === 'price');
assert.deepEqual(currentAiraloPrice.normalizedValue, { amount: 49, currency: 'USD' });
assert.equal(currentAiraloPrice.rawValue, '$49.00 USD');
assert.equal(currentAiraloOffer.candidates.every((entry) => entry.status === 'pending'), true);
assert.equal(currentAiraloUsd.ranking.status, 'not_computed');
const currentAiraloChanges = packSemanticDiff(first, currentAiraloUsd);
assert.equal(currentAiraloChanges.length, 1);
assert.equal(currentAiraloChanges[0].provider, 'airalo');`,
  'smoke current USD regression',
);
writeFileSync(smokePath, smoke);

console.log('Airalo Europe bounded drift patch applied.');
