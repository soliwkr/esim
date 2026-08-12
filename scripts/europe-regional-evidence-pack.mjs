import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_OUTPUT_DIRECTORY,
  MAX_CAPTURE_WINDOW_MS,
  MAX_REDIRECTS,
  MAX_RESPONSE_BYTES,
  htmlToVisibleText,
  packSemanticDiff,
  packSemanticFingerprint,
  parseArgs,
} from './italy-comparison-evidence-pack.mjs';

export const PACK_SCHEMA_VERSION = 1;
export const PACK_EXTRACTOR_VERSION = '1.0.2';

export const SCENARIO = Object.freeze({
  id: 'europe-14d-multicountry-high-data-hotspot',
  region: 'europe',
  countries: Object.freeze(['IT', 'FR', 'ES']),
  tripDays: 14,
  dataUse: 'high',
  hotspotRequired: true,
  deviceAssumptions: Object.freeze({ esimCapable: true, unlocked: true }),
  selectionRule: 'shortest_observed_validity_covering_trip_without_forcing_isomorphic_skus',
});

export const SOURCE_CONFIG = Object.freeze([
  Object.freeze({
    key: 'airalo-europe-plan',
    provider: 'airalo',
    role: 'regional_store_page',
    sourceAuditKey: 'candidate-airalo-europe-store-unlimited-15d',
    url: 'https://www.airalo.com/europe-esim',
    allowedHosts: Object.freeze(['www.airalo.com', 'airalo.com']),
    allowedPathPrefixes: Object.freeze(['/europe-esim']),
  }),
  Object.freeze({
    key: 'airalo-unlimited-fup',
    provider: 'airalo',
    role: 'official_policy',
    sourceAuditKey: 'candidate-airalo-unlimited-fup',
    url: 'https://www.airalo.com/m/resources/unlimited-data-plans-fair-use-policy',
    allowedHosts: Object.freeze(['www.airalo.com', 'airalo.com']),
    allowedPathPrefixes: Object.freeze(['/m/resources/unlimited-data-plans-fair-use-policy']),
  }),
  Object.freeze({
    key: 'holafly-europe-plan',
    provider: 'holafly',
    role: 'regional_product_page',
    sourceAuditKey: 'candidate-holafly-europe-product',
    url: 'https://esim.holafly.com/it/esim-europa/',
    allowedHosts: Object.freeze(['esim.holafly.com']),
    allowedPathPrefixes: Object.freeze(['/it/esim-europa']),
  }),
  Object.freeze({
    key: 'holafly-unlimited-faq',
    provider: 'holafly',
    role: 'official_help',
    sourceAuditKey: 'candidate-holafly-unlimited-faq',
    url: 'https://esim.holafly.com/it/faq/informazioni-sulle-esim/esim-con-traffico-dati-illimitato/',
    allowedHosts: Object.freeze(['esim.holafly.com']),
    allowedPathPrefixes: Object.freeze(['/it/faq/informazioni-sulle-esim/esim-con-traffico-dati-illimitato']),
  }),
  Object.freeze({
    key: 'ubigi-europe-plan',
    provider: 'ubigi',
    role: 'regional_product_page',
    sourceAuditKey: 'candidate-ubigi-europe-25gb-30d',
    url: 'https://cellulardata.ubigi.com/rates-and-coverage/europe-data-plans/europe-25gb-30-days/',
    allowedHosts: Object.freeze(['cellulardata.ubigi.com']),
    allowedPathPrefixes: Object.freeze(['/rates-and-coverage/europe-data-plans/europe-25gb-30-days']),
  }),
  Object.freeze({
    key: 'ubigi-activation',
    provider: 'ubigi',
    role: 'official_help',
    sourceAuditKey: 'candidate-ubigi-activation',
    url: 'https://cellulardata.ubigi.com/help-center/faq/esim-data-plan/when-does-my-ubigi-data-plan-activate/',
    allowedHosts: Object.freeze(['cellulardata.ubigi.com']),
    allowedPathPrefixes: Object.freeze(['/help-center/faq/esim-data-plan/when-does-my-ubigi-data-plan-activate']),
  }),
]);

const SOURCE_BY_KEY = new Map(SOURCE_CONFIG.map((source) => [source.key, source]));
const HTML_CONTENT_TYPE = /^(?:text\/html|application\/xhtml\+xml)(?:\s*;|$)/i;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const TRACKING_QUERY_KEYS = new Set(['gclid', 'fbclid', 'msclkid']);
const LOCALE_PATTERN = /<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i;

const observedField = () => Object.freeze({ state: 'observed', reason: null });
const partialField = (reason) => Object.freeze({ state: 'partial', reason });
const unknownField = (reason) => Object.freeze({ state: 'unknown', reason });
const notApplicableField = (reason) => Object.freeze({ state: 'not_applicable', reason });

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

function parseDecimal(value) {
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) throw new Error(`Invalid decimal value: ${value}`);
  return number;
}

function parsePrice(value) {
  const eur = value.match(/(\d+(?:[.,]\d{1,2})?)\s*€\s*(?:EUR)?/i);
  if (eur) return { amount: parseDecimal(eur[1]), currency: 'EUR' };
  const usd = value.match(/(?:US)?\$\s*(\d+(?:[.,]\d{1,2})?)|\$\s*(\d+(?:[.,]\d{1,2})?)\s*USD/i);
  if (usd) return { amount: parseDecimal(usd[1] || usd[2]), currency: 'USD' };
  throw new Error(`Unable to parse source price: ${value}`);
}

function requireRepoLocalPath(value, label) {
  if (!value || path.isAbsolute(value)) throw new Error(`${label} must be repository-local.`);
  const absolute = path.resolve(value);
  const relative = path.relative(process.cwd(), absolute);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`${label} must stay inside the repository.`);
  return absolute;
}

function sourceConfig(sourceKey) {
  const source = SOURCE_BY_KEY.get(sourceKey);
  if (!source) throw new Error(`Unknown source key: ${sourceKey}`);
  return source;
}

function requireAllowedSourceUrl(value, source, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
  if (parsed.protocol !== 'https:') throw new Error(`${label} must use HTTPS.`);
  if (parsed.username || parsed.password) throw new Error(`${label} must not contain credentials.`);
  if (!source.allowedHosts.includes(parsed.hostname)) throw new Error(`${label} escaped the allowlisted hosts for ${source.key}.`);
  if (!source.allowedPathPrefixes.some((prefix) => parsed.pathname.startsWith(prefix))) throw new Error(`${label} escaped the allowlisted path for ${source.key}.`);
  return parsed;
}

function canonicalizeSourceUrl(value, source) {
  const parsed = requireAllowedSourceUrl(value, source, 'Evidence URL');
  const kept = new URLSearchParams();
  for (const [key, entryValue] of parsed.searchParams) {
    const lower = key.toLowerCase();
    if (lower.startsWith('utm_') || TRACKING_QUERY_KEYS.has(lower)) continue;
    kept.append(key, entryValue);
  }
  parsed.search = kept.toString();
  parsed.hash = '';
  return parsed.toString();
}

function findFirstMatch(text, pattern, label) {
  const match = text.match(pattern);
  if (!match || match.index == null) throw new Error(`${label}: expected a match.`);
  return match;
}

function findOptionalMatch(text, pattern) {
  const match = text.match(pattern);
  return match && match.index != null ? match : null;
}

function locatorFromMatch(snapshot, match, rawValue, relativeStart = null) {
  const matchIndex = match.index ?? -1;
  const inside = relativeStart == null ? match[0].indexOf(rawValue) : relativeStart;
  if (matchIndex < 0 || inside < 0) throw new Error(`Unable to locate ${rawValue} in ${snapshot.sourceKey}.`);
  const start = matchIndex + inside;
  return Object.freeze({
    type: 'document_text',
    sourceKey: snapshot.sourceKey,
    snapshotId: snapshot.snapshotId,
    visibleTextSha256: snapshot.visibleTextSha256,
    start,
    end: start + rawValue.length,
    textAnchor: rawValue,
  });
}

function rawHtmlLocator(snapshot, pattern, label) {
  const match = snapshot.html.match(pattern);
  if (!match || match.index == null) throw new Error(`${label}: expected raw HTML evidence.`);
  return Object.freeze({
    type: 'raw_html',
    sourceKey: snapshot.sourceKey,
    snapshotId: snapshot.snapshotId,
    bodySha256: snapshot.bodySha256,
    start: match.index,
    end: match.index + match[0].length,
    textAnchor: match[0].slice(0, 160),
  });
}

function evidenceRef(snapshot, locator) {
  return Object.freeze({ sourceKey: snapshot.sourceKey, snapshotId: snapshot.snapshotId, locator });
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

function buildCandidate({ provider, offerKey, fieldName, rawValue, normalizedValue, evidence, observedAt, warnings = [] }) {
  if (typeof rawValue !== 'string' || !rawValue.trim()) throw new Error(`${provider}/${fieldName}: rawValue is required.`);
  const candidate = {
    candidateKey: '',
    subjectType: 'scenario_offer',
    subjectKey: offerKey,
    fieldName,
    scope: Object.freeze({ provider, region: 'europe', countries: SCENARIO.countries, scenarioId: SCENARIO.id, deviceModel: null, deviceRegion: null }),
    rawValue,
    normalizedValue,
    evidence: Object.freeze(evidence),
    observedAt,
    extractorId: 'europe-regional-evidence-pack',
    extractorVersion: PACK_EXTRACTOR_VERSION,
    warnings: Object.freeze([...warnings]),
    status: 'pending',
  };
  candidate.candidateKey = candidateKey(candidate);
  return Object.freeze(candidate);
}

export function buildSourceSnapshot({ sourceKey, requestedUrl, finalUrl, redirectChain = [], fetchedAt, httpStatus, contentType, etag = null, lastModified = null, body }) {
  const source = sourceConfig(sourceKey);
  if (!Buffer.isBuffer(body) || body.length === 0) throw new Error(`${sourceKey}: body is required.`);
  if (body.length > MAX_RESPONSE_BYTES) throw new Error(`${sourceKey}: body exceeds ${MAX_RESPONSE_BYTES} bytes.`);
  if (httpStatus < 200 || httpStatus >= 300) throw new Error(`${sourceKey}: HTTP ${httpStatus} is not successful.`);
  if (!HTML_CONTENT_TYPE.test(contentType || '')) throw new Error(`${sourceKey}: unsupported content type ${contentType || '(missing)'}.`);
  const canonicalRequestedUrl = canonicalizeSourceUrl(requestedUrl, source);
  const canonicalFinalUrl = canonicalizeSourceUrl(finalUrl, source);
  const html = body.toString('utf8');
  const visibleText = htmlToVisibleText(html);
  if (!visibleText) throw new Error(`${sourceKey}: visible text is empty.`);
  const bodyHash = sha256(body);
  const snapshotId = `snapshot:sha256:${hashCanonical({ sourceAuditKey: source.sourceAuditKey, finalUrl: canonicalFinalUrl, bodySha256: bodyHash })}`;
  return Object.freeze({
    schemaVersion: 1,
    sourceKey,
    provider: source.provider,
    role: source.role,
    sourceAuditKey: source.sourceAuditKey,
    snapshotId,
    requestedUrl,
    canonicalRequestedUrl,
    finalUrl,
    canonicalFinalUrl,
    redirectChain: Object.freeze(redirectChain.map((entry) => Object.freeze({ ...entry }))),
    fetchedAt,
    httpStatus,
    contentType,
    locale: html.match(LOCALE_PATTERN)?.[1]?.trim() || null,
    etag,
    lastModified,
    bodySha256: `sha256:${bodyHash}`,
    byteLength: body.length,
    visibleTextSha256: `sha256:${sha256(visibleText)}`,
    html,
    visibleText,
  });
}

function snapshotPublicMetadata(snapshot) {
  const { html, visibleText, ...metadata } = snapshot;
  return metadata;
}

function addRegionalIdentity({ plan, provider, offerKey, candidates, coverage, observedAt, headingPattern, countPattern = null }) {
  const heading = findFirstMatch(plan.visibleText, headingPattern, `${provider} Europe heading`);
  candidates.push(buildCandidate({
    provider,
    offerKey,
    fieldName: 'plan_type',
    rawValue: heading[0],
    normalizedValue: { type: 'regional', region: 'EUROPE' },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, heading, heading[0]))],
    observedAt,
    warnings: ['regional_classification_scoped_to_official_europe_product_surface'],
  }));
  coverage.plan_type = observedField();
  if (countPattern) {
    const count = findFirstMatch(plan.visibleText, countPattern, `${provider} declared country count`);
    const countryCount = Number(count[1]);
    candidates.push(buildCandidate({
      provider,
      offerKey,
      fieldName: 'destination_coverage',
      rawValue: count[0],
      normalizedValue: { scope: 'regional', region: 'EUROPE', declaredCountryCount: countryCount },
      evidence: [evidenceRef(plan, locatorFromMatch(plan, count, count[0]))],
      observedAt,
      warnings: ['scenario_country_membership_not_inferred_from_region_label'],
    }));
    coverage.destination_coverage = partialField(`Official surface declares Europe coverage across ${countryCount} countries, but this bounded extractor does not infer that every scenario country is included unless individually located.`);
  }
  return heading;
}

function extractAiralo(snapshots) {
  const plan = snapshots.get('airalo-europe-plan');
  const fup = snapshots.get('airalo-unlimited-fup');
  const offerKey = 'airalo:europe:unlimited-15d';
  const observedAt = plan.fetchedAt > fup.fetchedAt ? plan.fetchedAt : fup.fetchedAt;
  const candidates = [];
  const coverage = {};

  addRegionalIdentity({
    plan,
    provider: 'airalo',
    offerKey,
    candidates,
    coverage,
    observedAt,
    headingPattern: /\bEurope\b/i,
    countPattern: /(\d{1,3})\s+Countries and Networks/i,
  });

  const row = findFirstMatch(
    plan.visibleText,
    /(15\s+days)\s+(Unlimited\s+GB)\s+((?:\d+(?:[.,]\d{1,2})?\s*€(?:\s*EUR)?)|(?:(?:US)?\$\s*\d+(?:[.,]\d{1,2})?(?:\s*USD)?))/i,
    'Airalo 15-day unlimited price row',
  );
  candidates.push(buildCandidate({ provider: 'airalo', offerKey, fieldName: 'validity_days', rawValue: row[1], normalizedValue: { duration: 15, unit: 'day' }, evidence: [evidenceRef(plan, locatorFromMatch(plan, row, row[1]))], observedAt, warnings: ['selected_observed_store_row_covers_14_day_scenario'] }));
  candidates.push(buildCandidate({ provider: 'airalo', offerKey, fieldName: 'unlimited_policy', rawValue: row[2], normalizedValue: { unlimitedLabel: true }, evidence: [evidenceRef(plan, locatorFromMatch(plan, row, row[2]))], observedAt }));
  candidates.push(buildCandidate({ provider: 'airalo', offerKey, fieldName: 'price', rawValue: row[3], normalizedValue: parsePrice(row[3]), evidence: [evidenceRef(plan, locatorFromMatch(plan, row, row[3]))], observedAt, warnings: ['source_currency_preserved', 'selected_from_canonical_regional_store_row'] }));
  coverage.validity_days = observedField();
  coverage.unlimited_policy = observedField();
  coverage.price = observedField();
  coverage.data_gb = notApplicableField('Selected scenario offer is explicitly unlimited; no numeric total data cap is synthesized.');

  const threshold = findFirstMatch(fup.visibleText, /more than\s+3\s*GB\s+in a day[\s\S]{0,220}?1\s*Mbps/i, 'Airalo FUP threshold');
  candidates.push(buildCandidate({ provider: 'airalo', offerKey, fieldName: 'fair_use_policy', rawValue: threshold[0], normalizedValue: { highSpeedThreshold: { quantity: 3, unit: 'GB', period: '24h' }, postThresholdSpeedMbps: 1, resetsEvery: '24h_from_activation' }, evidence: [evidenceRef(fup, locatorFromMatch(fup, threshold, threshold[0]))], observedAt }));
  coverage.fair_use_policy = observedField();

  const hotspot = findFirstMatch(fup.visibleText, /personal hotspot[\s\S]{0,180}?no limit on tethering or the number of devices/i, 'Airalo hotspot policy');
  candidates.push(buildCandidate({ provider: 'airalo', offerKey, fieldName: 'hotspot_policy', rawValue: hotspot[0], normalizedValue: { allowed: true }, evidence: [evidenceRef(fup, locatorFromMatch(fup, hotspot, hotspot[0]))], observedAt }));
  candidates.push(buildCandidate({ provider: 'airalo', offerKey, fieldName: 'hotspot_share_limit', rawValue: hotspot[0], normalizedValue: { separateTetheringCapDeclared: false, overallFupApplies: true }, evidence: [evidenceRef(fup, locatorFromMatch(fup, hotspot, hotspot[0]))], observedAt, warnings: ['not_equivalent_to_unlimited_high_speed_hotspot'] }));
  coverage.hotspot_policy = observedField();
  coverage.hotspot_share_limit = observedField();

  coverage.activation_policy = unknownField('The canonical regional store capture does not expose an exact activation trigger for the selected 15-day unlimited row; no provider default is inferred.');
  coverage.network = unknownField('The regional store surface declares a country/network count but this bounded extractor does not flatten or infer a Europe-wide operator list.');
  coverage.radio_technology = unknownField('No exact regional radio-technology statement is captured in the bounded Airalo source set.');
  coverage.voice_sms_included = unknownField('The regional source set does not prove native voice/SMS inclusion for the selected offer.');

  return Object.freeze({ provider: 'airalo', offerKey, label: 'Europe unlimited — 15 days', candidates: Object.freeze(candidates), coverage: Object.freeze(coverage) });
}

function extractHolafly(snapshots) {
  const plan = snapshots.get('holafly-europe-plan');
  const fup = snapshots.get('holafly-unlimited-faq');
  const offerKey = 'holafly:europe:unlimited-15d';
  const observedAt = plan.fetchedAt > fup.fetchedAt ? plan.fetchedAt : fup.fetchedAt;
  const candidates = [];
  const coverage = {};

  addRegionalIdentity({ plan, provider: 'holafly', offerKey, candidates, coverage, observedAt, headingPattern: /eSIM per l['’]Europa/i, countPattern: /(\d{1,3})\s+paesi inclusi/i });
  const row = findFirstMatch(plan.visibleText, /(15\s+giorni)\s+(\d+(?:[.,]\d{1,2})?\s*€(?:\s*EUR)?)/i, 'Holafly 15-day price row');
  candidates.push(buildCandidate({ provider: 'holafly', offerKey, fieldName: 'validity_days', rawValue: row[1], normalizedValue: { duration: 15, unit: 'day' }, evidence: [evidenceRef(plan, locatorFromMatch(plan, row, row[1]))], observedAt, warnings: ['selected_observed_price_table_row_covers_14_day_scenario'] }));
  candidates.push(buildCandidate({ provider: 'holafly', offerKey, fieldName: 'price', rawValue: row[2], normalizedValue: parsePrice(row[2]), evidence: [evidenceRef(plan, locatorFromMatch(plan, row, row[2]))], observedAt, warnings: ['source_currency_preserved'] }));
  coverage.validity_days = observedField();
  coverage.price = observedField();

  const unlimited = findFirstMatch(plan.visibleText, /Dati illimitati/i, 'Holafly unlimited label');
  candidates.push(buildCandidate({ provider: 'holafly', offerKey, fieldName: 'unlimited_policy', rawValue: unlimited[0], normalizedValue: { unlimitedLabel: true }, evidence: [evidenceRef(plan, locatorFromMatch(plan, unlimited, unlimited[0]))], observedAt }));
  coverage.unlimited_policy = observedField();
  coverage.data_gb = notApplicableField('Selected scenario offer is explicitly unlimited; no numeric total data cap is synthesized.');

  const fupMatch = findFirstMatch(fup.visibleText, /Politica di Uso Corretto \(FUP\)[\s\S]{0,260}?giorno successivo/i, 'Holafly FUP statement');
  candidates.push(buildCandidate({ provider: 'holafly', offerKey, fieldName: 'fair_use_policy', rawValue: fupMatch[0], normalizedValue: { operatorFupMayReduceSpeed: true, exactHighSpeedThreshold: null, recovery: 'next_day' }, evidence: [evidenceRef(fup, locatorFromMatch(fup, fupMatch, fupMatch[0]))], observedAt, warnings: ['exact_threshold_unknown', 'regional_technical_specs_required_for_threshold'] }));
  coverage.fair_use_policy = partialField('Official help confirms FUP-based speed reduction but does not provide an exact Europe high-speed threshold in the captured source set.');

  const activation = findFirstMatch(plan.visibleText, /piano si attiverà una volta arrivato a destinazione e acceso la tua eSIM/i, 'Holafly activation');
  candidates.push(buildCandidate({ provider: 'holafly', offerKey, fieldName: 'activation_policy', rawValue: activation[0], normalizedValue: { trigger: 'arrival_and_esim_enabled' }, evidence: [evidenceRef(plan, locatorFromMatch(plan, activation, activation[0]))], observedAt }));
  coverage.activation_policy = observedField();

  const hotspot = findFirstMatch(plan.visibleText, /Condividi\s+1\s*GB\s+di dati al giorno/i, 'Holafly hotspot allowance');
  candidates.push(buildCandidate({ provider: 'holafly', offerKey, fieldName: 'hotspot_policy', rawValue: hotspot[0], normalizedValue: { allowed: true }, evidence: [evidenceRef(plan, locatorFromMatch(plan, hotspot, hotspot[0]))], observedAt }));
  candidates.push(buildCandidate({ provider: 'holafly', offerKey, fieldName: 'hotspot_share_limit', rawValue: hotspot[0], normalizedValue: { quantity: 1, unit: 'GB', period: 'day' }, evidence: [evidenceRef(plan, locatorFromMatch(plan, hotspot, hotspot[0]))], observedAt }));
  coverage.hotspot_policy = observedField();
  coverage.hotspot_share_limit = observedField();

  const technology = findFirstMatch(plan.visibleText, /4G LTE e 5G \(ove disponibile\)/i, 'Holafly radio technology');
  candidates.push(buildCandidate({ provider: 'holafly', offerKey, fieldName: 'radio_technology', rawValue: technology[0], normalizedValue: { technologies: ['4G LTE', '5G'], qualifier: 'where_available' }, evidence: [evidenceRef(plan, locatorFromMatch(plan, technology, technology[0]))], observedAt, warnings: ['technology_statement_not_performance_measurement'] }));
  coverage.radio_technology = observedField();
  coverage.network = unknownField('The captured Europe product page does not expose a provider-attributed operator list for the regional plan.');

  const dataOnly = findOptionalMatch(plan.visibleText, /includono solo dati mobili/i);
  if (dataOnly) {
    candidates.push(buildCandidate({ provider: 'holafly', offerKey, fieldName: 'voice_sms_included', rawValue: dataOnly[0], normalizedValue: { dataOnly: true, nativeVoice: false, nativeSms: false }, evidence: [evidenceRef(plan, locatorFromMatch(plan, dataOnly, dataOnly[0]))], observedAt, warnings: ['voip_apps_use_mobile_data'] }));
    coverage.voice_sms_included = observedField();
  } else {
    coverage.voice_sms_included = unknownField('No exact native voice/SMS inclusion statement was captured.');
  }

  return Object.freeze({ provider: 'holafly', offerKey, label: 'Europe unlimited — 15 days', candidates: Object.freeze(candidates), coverage: Object.freeze(coverage) });
}

function networkBlock(plan, country, nextCountryPattern) {
  return findOptionalMatch(plan.visibleText, new RegExp(`\\b${country}\\b\\s+Network\\(s\\):\\s+([\\s\\S]{1,180}?)(?=\\s+${nextCountryPattern}\\b|$)`, 'i'));
}

function operatorsFromBlock(block) {
  if (!block) return [];
  return block[1].split(/Network\(s\):/i).map((part) => part.trim()).filter(Boolean).map((part) => part.replace(/\s+/g, ' '));
}

function extractUbigi(snapshots) {
  const plan = snapshots.get('ubigi-europe-plan');
  const activationSource = snapshots.get('ubigi-activation');
  const offerKey = 'ubigi:europe:25gb-30d';
  const observedAt = plan.fetchedAt > activationSource.fetchedAt ? plan.fetchedAt : activationSource.fetchedAt;
  const candidates = [];
  const coverage = {};

  const heading = addRegionalIdentity({ plan, provider: 'ubigi', offerKey, candidates, coverage, observedAt, headingPattern: /eSIM\s*[•·]\s*EUROPE\b/i });
  const data = findFirstMatch(plan.visibleText, /\b25\s*GB\b/i, 'Ubigi Europe data');
  const validity = findFirstMatch(plan.visibleText, /\b30\s+days\b/i, 'Ubigi Europe validity');
  const price = findFirstMatch(plan.visibleText, /US\$\s*\d+(?:[.,]\d{1,2})?/i, 'Ubigi Europe price');
  candidates.push(buildCandidate({ provider: 'ubigi', offerKey, fieldName: 'data_gb', rawValue: data[0], normalizedValue: { quantity: 25, unit: 'GB' }, evidence: [evidenceRef(plan, locatorFromMatch(plan, data, data[0]))], observedAt }));
  candidates.push(buildCandidate({ provider: 'ubigi', offerKey, fieldName: 'validity_days', rawValue: validity[0], normalizedValue: { duration: 30, unit: 'day' }, evidence: [evidenceRef(plan, locatorFromMatch(plan, validity, validity[0]))], observedAt, warnings: ['selected_validity_covers_14_day_scenario'] }));
  candidates.push(buildCandidate({ provider: 'ubigi', offerKey, fieldName: 'price', rawValue: price[0], normalizedValue: parsePrice(price[0]), evidence: [evidenceRef(plan, locatorFromMatch(plan, price, price[0]))], observedAt, warnings: ['source_currency_preserved'] }));
  coverage.data_gb = observedField();
  coverage.validity_days = observedField();
  coverage.price = observedField();
  coverage.unlimited_policy = notApplicableField('Selected Ubigi offer is a finite 25GB plan.');
  coverage.fair_use_policy = notApplicableField('No unlimited/FUP comparison is required for the finite allowance in this bounded pack.');

  const franceBlock = networkBlock(plan, 'France', 'Germany');
  const italyBlock = networkBlock(plan, 'Italy', 'Jersey');
  const spainBlock = networkBlock(plan, 'Spain', 'Sweden');
  const countryBlocks = [franceBlock, italyBlock, spainBlock];
  const confirmedCodes = ['FR', 'IT', 'ES'].filter((_, index) => countryBlocks[index]);
  if (confirmedCodes.length) {
    candidates.push(buildCandidate({
      provider: 'ubigi',
      offerKey,
      fieldName: 'destination_coverage',
      rawValue: heading[0],
      normalizedValue: { scope: 'regional', region: 'EUROPE', scenarioCountriesConfirmed: confirmedCodes.sort((a, b) => ['IT', 'FR', 'ES'].indexOf(a) - ['IT', 'FR', 'ES'].indexOf(b)) },
      evidence: [evidenceRef(plan, locatorFromMatch(plan, heading, heading[0])), ...countryBlocks.filter(Boolean).map((block) => evidenceRef(plan, locatorFromMatch(plan, block, block[0])))],
      observedAt,
      warnings: confirmedCodes.length === 3 ? ['scenario_country_evidence_from_coverage_blocks'] : ['scenario_country_membership_partial'],
    }));
    coverage.destination_coverage = confirmedCodes.length === 3 ? observedField() : partialField(`Only ${confirmedCodes.length} of 3 scenario-country coverage blocks were located.`);
  } else {
    coverage.destination_coverage = unknownField('The Europe heading is present but none of the scenario-country coverage blocks were located in the static capture.');
  }

  const sharing = findFirstMatch(plan.visibleText, /Data sharing allowed/i, 'Ubigi data sharing');
  candidates.push(buildCandidate({ provider: 'ubigi', offerKey, fieldName: 'hotspot_policy', rawValue: sharing[0], normalizedValue: { allowed: true }, evidence: [evidenceRef(plan, locatorFromMatch(plan, sharing, sharing[0]))], observedAt }));
  coverage.hotspot_policy = observedField();
  coverage.hotspot_share_limit = unknownField('Data sharing is explicitly allowed, but no exact share cap or explicit absence of a cap is proven by the captured source set.');

  const smartStartPlan = findFirstMatch(plan.visibleText, /Smartstart[\s\S]{0,160}?activation starts upon arrival at destination/i, 'Ubigi regional SmartStart');
  const arrival = findFirstMatch(activationSource.visibleText, /activates automatically upon arrival in a covered area/i, 'Ubigi activation arrival');
  const purchaseWhileCovered = findFirstMatch(activationSource.visibleText, /already in a covered area when you purchase the data plan[\s\S]{0,140}?activation starts immediately/i, 'Ubigi activation while covered');
  candidates.push(buildCandidate({
    provider: 'ubigi',
    offerKey,
    fieldName: 'activation_policy',
    rawValue: smartStartPlan[0],
    normalizedValue: { trigger: 'covered_area_connection', purchaseWhileCovered: 'immediate' },
    evidence: [
      evidenceRef(plan, locatorFromMatch(plan, smartStartPlan, smartStartPlan[0])),
      evidenceRef(activationSource, locatorFromMatch(activationSource, arrival, arrival[0])),
      evidenceRef(activationSource, locatorFromMatch(activationSource, purchaseWhileCovered, purchaseWhileCovered[0])),
    ],
    observedAt,
  }));
  coverage.activation_policy = observedField();

  if (franceBlock && italyBlock && spainBlock) {
    candidates.push(buildCandidate({
      provider: 'ubigi',
      offerKey,
      fieldName: 'network',
      rawValue: `${franceBlock[0]} | ${italyBlock[0]} | ${spainBlock[0]}`,
      normalizedValue: {
        byCountry: {
          FR: operatorsFromBlock(franceBlock),
          IT: operatorsFromBlock(italyBlock),
          ES: operatorsFromBlock(spainBlock),
        },
        completeness: 'scenario_countries_only',
      },
      evidence: [
        evidenceRef(plan, locatorFromMatch(plan, franceBlock, franceBlock[0])),
        evidenceRef(plan, locatorFromMatch(plan, italyBlock, italyBlock[0])),
        evidenceRef(plan, locatorFromMatch(plan, spainBlock, spainBlock[0])),
      ],
      observedAt,
      warnings: ['regional_network_mapping_is_country_scoped', 'not_a_performance_measurement'],
    }));
    coverage.network = partialField('Operators are normalized only for the three scenario countries; the regional plan covers additional countries that are not flattened into this candidate.');
  } else {
    coverage.network = unknownField('Per-country operator blocks for all three scenario countries were not available in the static capture.');
  }

  try {
    const tech3 = rawHtmlLocator(plan, /(?:alt=["'][^"']*3G[^"']*["']|Icon ecommerce 3G)/i, 'Ubigi 3G marker');
    const tech4 = rawHtmlLocator(plan, /(?:alt=["'][^"']*4G[^"']*["']|Icon ecommerce 4G)/i, 'Ubigi 4G marker');
    const tech5 = rawHtmlLocator(plan, /(?:alt=["'][^"']*5G[^"']*["']|Icon ecommerce 5G)/i, 'Ubigi 5G marker');
    candidates.push(buildCandidate({ provider: 'ubigi', offerKey, fieldName: 'radio_technology', rawValue: '3G / 4G / 5G', normalizedValue: { technologies: ['3G', '4G', '5G'], qualifier: 'coverage_table_markers_with_country_exceptions_possible' }, evidence: [evidenceRef(plan, tech3), evidenceRef(plan, tech4), evidenceRef(plan, tech5)], observedAt, warnings: ['technology_statement_not_performance_measurement', 'regional_country_exceptions_may_apply'] }));
    coverage.radio_technology = partialField('Coverage-table technology markers are present, but country-specific exceptions can exist and are not flattened into a single regional guarantee.');
  } catch {
    coverage.radio_technology = unknownField('The static capture did not preserve all 3G/4G/5G coverage-table markers.');
  }

  const dataOnly = findOptionalMatch(plan.visibleText, /Ubigi is a data-only service/i);
  if (dataOnly) {
    candidates.push(buildCandidate({ provider: 'ubigi', offerKey, fieldName: 'voice_sms_included', rawValue: dataOnly[0], normalizedValue: { dataOnly: true, nativeVoice: false, nativeSms: false }, evidence: [evidenceRef(plan, locatorFromMatch(plan, dataOnly, dataOnly[0]))], observedAt, warnings: ['messaging_and_calls_available_through_data_apps'] }));
    coverage.voice_sms_included = observedField();
  } else {
    coverage.voice_sms_included = unknownField('The captured product surface did not expose the data-only service statement.');
  }

  return Object.freeze({ provider: 'ubigi', offerKey, label: 'Europe 25GB — 30 days', candidates: Object.freeze(candidates), coverage: Object.freeze(coverage) });
}

export function buildComparisonPack({ snapshots, startedAt, completedAt }) {
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) throw new Error('Invalid pack capture window.');
  const captureWindowMs = end - start;
  if (captureWindowMs > MAX_CAPTURE_WINDOW_MS) throw new Error(`Capture window ${captureWindowMs} ms exceeds ${MAX_CAPTURE_WINDOW_MS} ms.`);
  for (const source of SOURCE_CONFIG) if (!snapshots.has(source.key)) throw new Error(`Missing source snapshot: ${source.key}`);
  const offers = Object.freeze([extractAiralo(snapshots), extractHolafly(snapshots), extractUbigi(snapshots)]);
  const sources = Object.freeze(SOURCE_CONFIG.map((source) => snapshotPublicMetadata(snapshots.get(source.key))));
  const packId = `pack:sha256:${hashCanonical({ scenario: SCENARIO, sourceSnapshotIds: sources.map((source) => source.snapshotId) })}`;
  const pack = {
    schemaVersion: PACK_SCHEMA_VERSION,
    packId,
    scenario: SCENARIO,
    startedAt,
    completedAt,
    captureWindowMs,
    sources,
    offers,
    ranking: Object.freeze({ status: 'not_computed', reason: 'Evidence pack preserves facts, unknowns and conflicts; it does not rank providers.' }),
    semanticFingerprint: '',
  };
  pack.semanticFingerprint = packSemanticFingerprint(pack);
  return Object.freeze(pack);
}

async function fetchWithRedirects(source, fetchImpl) {
  const redirectChain = [];
  let current = requireAllowedSourceUrl(source.url, source, 'Requested URL');
  for (let index = 0; index <= MAX_REDIRECTS; index += 1) {
    const response = await fetchImpl(current, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        accept: 'text/html,application/xhtml+xml;q=0.9',
        'user-agent': 'SenzaRoamingEuropeRegionalEvidencePackSpike/1.0 (+https://senzaroaming.it/metodo)',
      },
    });
    if (REDIRECT_STATUSES.has(response.status)) {
      if (index === MAX_REDIRECTS) throw new Error(`${source.key}: exceeded ${MAX_REDIRECTS} redirects.`);
      const location = response.headers.get('location');
      if (!location) throw new Error(`${source.key}: redirect without Location.`);
      const next = requireAllowedSourceUrl(new URL(location, current).toString(), source, 'Redirect URL');
      redirectChain.push(Object.freeze({ status: response.status, from: current.toString(), to: next.toString() }));
      current = next;
      continue;
    }
    return { response, finalUrl: current.toString(), redirectChain };
  }
  throw new Error(`${source.key}: unreachable redirect state.`);
}

export async function captureSource(source, { fetchImpl = fetch, now = () => new Date() } = {}) {
  const fetchedAt = now().toISOString();
  const { response, finalUrl, redirectChain } = await fetchWithRedirects(source, fetchImpl);
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) throw new Error(`${source.key}: declared response exceeds ${MAX_RESPONSE_BYTES} bytes.`);
  const body = Buffer.from(await response.arrayBuffer());
  return Object.freeze({
    snapshot: buildSourceSnapshot({
      sourceKey: source.key,
      requestedUrl: source.url,
      finalUrl,
      redirectChain,
      fetchedAt,
      httpStatus: response.status,
      contentType: response.headers.get('content-type') || '',
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified'),
      body,
    }),
    body,
  });
}

export async function captureComparisonPack({ fetchImpl = fetch, now = () => new Date() } = {}) {
  const startedAt = now().toISOString();
  const snapshots = new Map();
  const bodies = new Map();
  for (const source of SOURCE_CONFIG) {
    const captured = await captureSource(source, { fetchImpl, now });
    snapshots.set(source.key, captured.snapshot);
    bodies.set(source.key, captured.body);
  }
  const completedAt = now().toISOString();
  return Object.freeze({ pack: buildComparisonPack({ snapshots, startedAt, completedAt }), snapshots, bodies });
}

function artifactDirectoryName(pack) {
  return `${pack.completedAt.replace(/[:.]/g, '-')}-${pack.packId.replace('pack:sha256:', '').slice(0, 12)}`;
}

export async function writeComparisonArtifact({ captured, outputDirectory = DEFAULT_OUTPUT_DIRECTORY, mkdirImpl = mkdir, writeFileImpl = writeFile }) {
  const root = requireRepoLocalPath(outputDirectory, '--out');
  await mkdirImpl(root, { recursive: true });
  const artifactDirectory = path.join(root, artifactDirectoryName(captured.pack));
  await mkdirImpl(artifactDirectory, { recursive: false });
  const sourcesDirectory = path.join(artifactDirectory, 'sources');
  await mkdirImpl(sourcesDirectory, { recursive: false });
  for (const source of SOURCE_CONFIG) {
    const snapshot = captured.snapshots.get(source.key);
    const body = captured.bodies.get(source.key);
    if (`sha256:${sha256(body)}` !== snapshot.bodySha256) throw new Error(`${source.key}: raw body hash mismatch before persistence.`);
    await writeFileImpl(path.join(sourcesDirectory, `${source.key}.html`), body, { flag: 'wx' });
  }
  const packPath = path.join(artifactDirectory, 'pack.json');
  const persistedPack = Object.freeze({ ...captured.pack, artifactLocation: path.relative(process.cwd(), artifactDirectory).split(path.sep).join('/') });
  await writeFileImpl(packPath, `${JSON.stringify(persistedPack, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  return Object.freeze({ artifactDirectory, packPath, pack: persistedPack });
}

async function loadPack(filename) {
  const payload = JSON.parse(await readFile(requireRepoLocalPath(filename, '--compare'), 'utf8'));
  if (!Array.isArray(payload.offers) || payload.ranking?.status !== 'not_computed') throw new Error(`Invalid comparison pack: ${filename}`);
  return payload;
}

function printPack(artifact) {
  console.log(`Evidence pack: ${artifact.pack.packId}`);
  console.log(`Artifact: ${path.relative(process.cwd(), artifact.artifactDirectory)}`);
  console.log(`Capture window: ${artifact.pack.captureWindowMs} ms`);
  console.log(`Semantic fingerprint: ${artifact.pack.semanticFingerprint}`);
  for (const offer of artifact.pack.offers) {
    console.log(`${offer.provider}: ${offer.label}`);
    for (const candidate of offer.candidates) console.log(`  ${candidate.fieldName}: ${JSON.stringify(candidate.normalizedValue)} [${candidate.status}]`);
    for (const [fieldName, state] of Object.entries(offer.coverage)) {
      if (state.state !== 'observed') console.log(`  ${fieldName}: ${state.state}${state.reason ? ` — ${state.reason}` : ''}`);
    }
  }
  console.log(`Ranking: ${artifact.pack.ranking.status}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: npm run evidence:europe-regional-pack -- [--out <directory>] [--compare <pack.json>]');
    console.log('Captures six fixed official Europe regional sources for Airalo, Holafly and Ubigi.');
    console.log('No dependency installation, ranking, FX conversion, D1 write or deploy is performed.');
    return;
  }
  const captured = await captureComparisonPack();
  const artifact = await writeComparisonArtifact({ captured, outputDirectory: options.out });
  printPack(artifact);
  if (options.compare) {
    const previous = await loadPack(options.compare);
    const changes = packSemanticDiff(previous, artifact.pack);
    console.log(`Provider semantic changes: ${changes.length}`);
    for (const change of changes) console.log(`- ${change.provider}`);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) await main();
