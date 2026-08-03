import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractUbigiPlanCandidates } from './evidence-snapshot-spike.mjs';

export const PACK_SCHEMA_VERSION = 1;
export const PACK_EXTRACTOR_VERSION = '1.0.0';
export const MAX_RESPONSE_BYTES = 2_500_000;
export const MAX_REDIRECTS = 5;
export const MAX_CAPTURE_WINDOW_MS = 10 * 60 * 1000;
export const DEFAULT_OUTPUT_DIRECTORY = path.join('research', 'evidence', 'packs');

export const SCENARIO = Object.freeze({
  id: 'italy-10d-high-data-hotspot',
  destination: 'italy',
  tripDays: 10,
  dataUse: 'high',
  hotspotRequired: true,
  deviceAssumptions: Object.freeze({ esimCapable: true, unlocked: true }),
});

export const SOURCE_CONFIG = Object.freeze([
  Object.freeze({
    key: 'airalo-italy-plan',
    provider: 'airalo',
    role: 'product_catalog',
    sourceAuditKey: 'candidate-airalo-italy-catalog',
    url: 'https://www.airalo.com/it/italy-esim/',
    allowedHosts: Object.freeze(['www.airalo.com', 'airalo.com']),
    allowedPathPrefixes: Object.freeze(['/it/italy-esim', '/italy-esim']),
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
    key: 'holafly-italy-plan',
    provider: 'holafly',
    role: 'product_page',
    sourceAuditKey: 'candidate-holafly-italy-product',
    url: 'https://esim.holafly.com/it/esim-italia/',
    allowedHosts: Object.freeze(['esim.holafly.com']),
    allowedPathPrefixes: Object.freeze(['/it/esim-italia']),
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
    key: 'ubigi-italy-plan',
    provider: 'ubigi',
    role: 'product_page',
    sourceAuditKey: 'provider-ubigi-commerce',
    url: 'https://cellulardata.ubigi.com/rates-and-coverage/italy-data-plans/italy-50gb-30-days/',
    allowedHosts: Object.freeze(['cellulardata.ubigi.com']),
    allowedPathPrefixes: Object.freeze(['/rates-and-coverage/italy-data-plans/italy-50gb-30-days']),
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
const ENTITY_PATTERN = /&(#\d+|#x[0-9a-f]+|amp|lt|gt|quot|apos|nbsp|euro);/gi;
const REMOVE_BLOCKS_PATTERN = /<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const TAG_PATTERN = /<[^>]+>/g;
const SPACE_PATTERN = /\s+/g;
const LOCALE_PATTERN = /<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i;

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

function decodeEntity(match, entity) {
  const lower = entity.toLowerCase();
  const named = new Map([
    ['amp', '&'], ['lt', '<'], ['gt', '>'], ['quot', '"'], ['apos', "'"], ['nbsp', ' '], ['euro', '€'],
  ]);
  if (named.has(lower)) return named.get(lower);
  const radix = lower.startsWith('#x') ? 16 : 10;
  const digits = lower.startsWith('#x') ? lower.slice(2) : lower.startsWith('#') ? lower.slice(1) : '';
  if (!digits) return match;
  const codePoint = Number.parseInt(digits, radix);
  return Number.isInteger(codePoint) ? String.fromCodePoint(codePoint) : match;
}

export function htmlToVisibleText(html) {
  return html
    .replace(REMOVE_BLOCKS_PATTERN, ' ')
    .replace(ENTITY_PATTERN, decodeEntity)
    .replace(TAG_PATTERN, ' ')
    .replace(SPACE_PATTERN, ' ')
    .trim();
}

function extractLocale(html) {
  return html.match(LOCALE_PATTERN)?.[1]?.trim() || null;
}

function requireRepoLocalPath(value, label) {
  if (!value || path.isAbsolute(value)) throw new Error(`${label} must be repository-local.`);
  const absolute = path.resolve(value);
  const relative = path.relative(process.cwd(), absolute);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside the repository.`);
  }
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
  if (!source.allowedHosts.includes(parsed.hostname)) {
    throw new Error(`${label} escaped the allowlisted hosts for ${source.key}.`);
  }
  if (!source.allowedPathPrefixes.some((prefix) => parsed.pathname.startsWith(prefix))) {
    throw new Error(`${label} escaped the allowlisted path for ${source.key}.`);
  }
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

function parseDecimal(value) {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) throw new Error(`Invalid decimal value: ${value}`);
  return number;
}

function parseUsd(value) {
  const match = value.match(/\$\s*(\d+(?:[.,]\d{1,2})?)\s*USD/i);
  if (!match) throw new Error(`Unable to parse USD price: ${value}`);
  return { amount: Number(match[1].replace(',', '.')), currency: 'USD' };
}

function parseEur(value) {
  const match = value.match(/(\d+(?:[.,]\d{1,2})?)\s*€\s*EUR/i);
  if (!match) throw new Error(`Unable to parse EUR price: ${value}`);
  return { amount: parseDecimal(match[1]), currency: 'EUR' };
}

function findMatch(text, pattern, label) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const matches = [...text.matchAll(new RegExp(pattern.source, flags))];
  if (matches.length !== 1) throw new Error(`${label}: expected exactly one match, found ${matches.length}.`);
  return matches[0];
}

function findFirstMatch(text, pattern, label) {
  const match = text.match(pattern);
  if (!match || match.index == null) throw new Error(`${label}: expected a match.`);
  return match;
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

function locatorForValue(snapshot, rawValue, label) {
  const escaped = rawValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...snapshot.visibleText.matchAll(new RegExp(escaped, 'g'))];
  if (matches.length !== 1) throw new Error(`${label}: expected unique text anchor ${rawValue}, found ${matches.length}.`);
  return locatorFromMatch(snapshot, matches[0], rawValue, 0);
}

function rawHtmlLocator(snapshot, pattern, label) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const matches = [...snapshot.html.matchAll(new RegExp(pattern.source, flags))];
  if (matches.length < 1) throw new Error(`${label}: expected raw HTML evidence.`);
  const match = matches[0];
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
    normalizedValue: candidate.normalizedValue,
    evidence: candidate.evidence.map((entry) => ({ sourceKey: entry.sourceKey, snapshotId: entry.snapshotId })),
    extractorVersion: candidate.extractorVersion,
  })}`;
}

function buildCandidate({ provider, offerKey, fieldName, normalizedValue, evidence, observedAt, warnings = [] }) {
  const candidate = {
    candidateKey: '',
    subjectType: 'scenario_offer',
    subjectKey: offerKey,
    fieldName,
    scope: Object.freeze({
      provider,
      destination: 'italy',
      scenarioId: SCENARIO.id,
      deviceModel: null,
      deviceRegion: null,
    }),
    normalizedValue,
    evidence: Object.freeze(evidence),
    observedAt,
    extractorId: 'italy-comparison-evidence-pack',
    extractorVersion: PACK_EXTRACTOR_VERSION,
    warnings: Object.freeze([...warnings]),
    status: 'pending',
  };
  candidate.candidateKey = candidateKey(candidate);
  return Object.freeze(candidate);
}

function fieldState(state, reason = null) {
  return Object.freeze({ state, reason });
}

function observedField() {
  return fieldState('observed');
}

function partialField(reason) {
  return fieldState('partial', reason);
}

function unknownField(reason) {
  return fieldState('unknown', reason);
}

function notApplicableField(reason) {
  return fieldState('not_applicable', reason);
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
    locale: extractLocale(html),
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

function extractAiralo(snapshots) {
  const plan = snapshots.get('airalo-italy-plan');
  const fup = snapshots.get('airalo-unlimited-fup');
  const offerKey = 'airalo:italy:unlimited-10d';
  const observedAt = plan.fetchedAt > fup.fetchedAt ? plan.fetchedAt : fup.fetchedAt;
  const candidates = [];
  const coverage = {};

  const scopeMatch = findFirstMatch(plan.visibleText, /(?:Italia|Italy)\s+Wind Tre/i, 'Airalo Italy scope');
  const scopeRaw = scopeMatch[0].match(/Italia|Italy/i)[0];
  candidates.push(buildCandidate({
    provider: 'airalo', offerKey, fieldName: 'destination_coverage', normalizedValue: { countries: ['IT'], scope: 'local' },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, scopeMatch, scopeRaw))], observedAt,
  }));
  coverage.destination_coverage = observedField();

  const row = findMatch(plan.visibleText, /(10\s+(?:giorni|days))\s+(?:Illimitato|Unlimited)\s+GB\s+(\$\s*\d+(?:[.,]\d{1,2})?\s*USD)/i, 'Airalo 10-day unlimited row');
  const validityRaw = row[1];
  const priceRaw = row[2];
  candidates.push(buildCandidate({
    provider: 'airalo', offerKey, fieldName: 'validity_days', normalizedValue: { duration: 10, unit: 'day' },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, row, validityRaw))], observedAt,
  }));
  coverage.validity_days = observedField();
  candidates.push(buildCandidate({
    provider: 'airalo', offerKey, fieldName: 'price', normalizedValue: parseUsd(priceRaw),
    evidence: [evidenceRef(plan, locatorFromMatch(plan, row, priceRaw))], observedAt,
    warnings: ['source_currency_preserved', 'no_implicit_price_eur'],
  }));
  coverage.price = observedField();

  const unlimitedMatch = findFirstMatch(row[0], /(?:Illimitato|Unlimited)\s+GB/i, 'Airalo unlimited label');
  candidates.push(buildCandidate({
    provider: 'airalo', offerKey, fieldName: 'unlimited_policy', normalizedValue: { unlimitedLabel: true },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, row, unlimitedMatch[0], unlimitedMatch.index))], observedAt,
  }));
  coverage.unlimited_policy = observedField();
  coverage.data_gb = notApplicableField('Selected scenario offer is explicitly unlimited; no numeric total data cap is synthesized.');

  const threshold = findFirstMatch(fup.visibleText, /more than\s+3\s*GB\s+in a day[\s\S]{0,220}?1\s*Mbps/i, 'Airalo FUP threshold');
  candidates.push(buildCandidate({
    provider: 'airalo', offerKey, fieldName: 'fair_use_policy',
    normalizedValue: { highSpeedThreshold: { quantity: 3, unit: 'GB', period: '24h' }, postThresholdSpeedMbps: 1, resetsEvery: '24h_from_activation' },
    evidence: [evidenceRef(fup, locatorFromMatch(fup, threshold, threshold[0]))], observedAt,
  }));
  coverage.fair_use_policy = observedField();

  const hotspot = findFirstMatch(fup.visibleText, /personal hotspot[\s\S]{0,180}?no limit on tethering or the number of devices/i, 'Airalo hotspot policy');
  candidates.push(buildCandidate({
    provider: 'airalo', offerKey, fieldName: 'hotspot_policy', normalizedValue: { allowed: true },
    evidence: [evidenceRef(fup, locatorFromMatch(fup, hotspot, hotspot[0]))], observedAt,
  }));
  candidates.push(buildCandidate({
    provider: 'airalo', offerKey, fieldName: 'hotspot_share_limit',
    normalizedValue: { separateTetheringCapDeclared: false, overallFupApplies: true },
    evidence: [evidenceRef(fup, locatorFromMatch(fup, hotspot, hotspot[0]))], observedAt,
    warnings: ['not_equivalent_to_unlimited_high_speed_hotspot'],
  }));
  coverage.hotspot_policy = observedField();
  coverage.hotspot_share_limit = observedField();

  const network = findFirstMatch(plan.visibleText, /(?:Italia|Italy)\s+(Wind Tre)/i, 'Airalo primary network');
  candidates.push(buildCandidate({
    provider: 'airalo', offerKey, fieldName: 'network',
    normalizedValue: { operators: [network[1]], completeness: 'partial', additionalOperatorsUnresolved: 2 },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, network, network[1]))], observedAt,
    warnings: ['expanded_network_list_not_captured'],
  }));
  coverage.network = partialField('Public surface exposes Wind Tre plus two additional networks that are not expanded in this static capture.');
  coverage.radio_technology = unknownField('No exact plan technology statement is captured in the bounded Airalo source set.');
  coverage.activation_policy = unknownField('Airalo activation can be package-specific; exact Validity Policy for the selected package is not captured by this pack.');

  return Object.freeze({ provider: 'airalo', offerKey, label: 'Italy unlimited — 10 days', candidates: Object.freeze(candidates), coverage: Object.freeze(coverage) });
}

function extractHolafly(snapshots) {
  const plan = snapshots.get('holafly-italy-plan');
  const fup = snapshots.get('holafly-unlimited-faq');
  const offerKey = 'holafly:italy:unlimited-10d';
  const observedAt = plan.fetchedAt > fup.fetchedAt ? plan.fetchedAt : fup.fetchedAt;
  const candidates = [];
  const coverage = {};

  const scope = findFirstMatch(plan.visibleText, /eSIM per l['’]Italia/i, 'Holafly Italy scope');
  candidates.push(buildCandidate({
    provider: 'holafly', offerKey, fieldName: 'destination_coverage', normalizedValue: { countries: ['IT'], scope: 'local' },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, scope, scope[0]))], observedAt,
  }));
  coverage.destination_coverage = observedField();

  const row = findMatch(plan.visibleText, /(10\s+giorni)\s+(\d+(?:[.,]\d{1,2})\s*€\s*EUR)/i, 'Holafly 10-day price row');
  candidates.push(buildCandidate({
    provider: 'holafly', offerKey, fieldName: 'validity_days', normalizedValue: { duration: 10, unit: 'day' },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, row, row[1]))], observedAt,
  }));
  candidates.push(buildCandidate({
    provider: 'holafly', offerKey, fieldName: 'price', normalizedValue: parseEur(row[2]),
    evidence: [evidenceRef(plan, locatorFromMatch(plan, row, row[2]))], observedAt,
    warnings: ['source_currency_preserved'],
  }));
  coverage.validity_days = observedField();
  coverage.price = observedField();

  const unlimited = findFirstMatch(plan.visibleText, /Dati illimitati/i, 'Holafly unlimited label');
  candidates.push(buildCandidate({
    provider: 'holafly', offerKey, fieldName: 'unlimited_policy', normalizedValue: { unlimitedLabel: true },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, unlimited, unlimited[0]))], observedAt,
  }));
  coverage.unlimited_policy = observedField();
  coverage.data_gb = notApplicableField('Selected scenario offer is explicitly unlimited; no numeric total data cap is synthesized.');

  const fupMatch = findFirstMatch(fup.visibleText, /Politica di Uso Corretto \(FUP\)[\s\S]{0,260}?giorno successivo/i, 'Holafly FUP statement');
  candidates.push(buildCandidate({
    provider: 'holafly', offerKey, fieldName: 'fair_use_policy',
    normalizedValue: { operatorFupMayReduceSpeed: true, exactHighSpeedThreshold: null, recovery: 'next_day' },
    evidence: [evidenceRef(fup, locatorFromMatch(fup, fupMatch, fupMatch[0]))], observedAt,
    warnings: ['exact_threshold_unknown', 'destination_technical_specs_required_for_threshold'],
  }));
  coverage.fair_use_policy = partialField('Official help confirms FUP-based speed reduction but does not provide the exact Italy high-speed threshold in this captured source.');

  const activation = findFirstMatch(plan.visibleText, /piano si attiverà una volta arrivato a destinazione e acceso la tua eSIM/i, 'Holafly activation');
  candidates.push(buildCandidate({
    provider: 'holafly', offerKey, fieldName: 'activation_policy', normalizedValue: { trigger: 'arrival_and_esim_enabled' },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, activation, activation[0]))], observedAt,
  }));
  coverage.activation_policy = observedField();

  const hotspot = findFirstMatch(plan.visibleText, /Condividi\s+1\s*GB\s+di dati al giorno/i, 'Holafly hotspot allowance');
  candidates.push(buildCandidate({
    provider: 'holafly', offerKey, fieldName: 'hotspot_policy', normalizedValue: { allowed: true },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, hotspot, hotspot[0]))], observedAt,
  }));
  candidates.push(buildCandidate({
    provider: 'holafly', offerKey, fieldName: 'hotspot_share_limit', normalizedValue: { quantity: 1, unit: 'GB', period: 'day' },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, hotspot, hotspot[0]))], observedAt,
  }));
  coverage.hotspot_policy = observedField();
  coverage.hotspot_share_limit = observedField();

  const network = findFirstMatch(plan.visibleText, /Vodafone Italy\s*\/\s*WINDTRE/i, 'Holafly networks');
  candidates.push(buildCandidate({
    provider: 'holafly', offerKey, fieldName: 'network', normalizedValue: { operators: ['Vodafone Italy', 'WINDTRE'], completeness: 'declared' },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, network, network[0]))], observedAt,
  }));
  coverage.network = observedField();

  const technology = findFirstMatch(plan.visibleText, /4G LTE e 5G \(ove disponibile\)/i, 'Holafly radio technology');
  candidates.push(buildCandidate({
    provider: 'holafly', offerKey, fieldName: 'radio_technology', normalizedValue: { technologies: ['4G LTE', '5G'], qualifier: 'where_available' },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, technology, technology[0]))], observedAt,
    warnings: ['technology_statement_not_performance_measurement'],
  }));
  coverage.radio_technology = observedField();

  return Object.freeze({ provider: 'holafly', offerKey, label: 'Italy unlimited — 10 days', candidates: Object.freeze(candidates), coverage: Object.freeze(coverage) });
}

function extractUbigi(snapshots) {
  const plan = snapshots.get('ubigi-italy-plan');
  const activationSource = snapshots.get('ubigi-activation');
  const offerKey = 'ubigi:italy:50gb-30d';
  const observedAt = plan.fetchedAt > activationSource.fetchedAt ? plan.fetchedAt : activationSource.fetchedAt;
  const candidates = [];
  const coverage = {};

  const base = extractUbigiPlanCandidates({ html: plan.html, snapshotId: plan.snapshotId, observedAt: plan.fetchedAt });
  for (const candidate of base.candidates) {
    candidates.push(Object.freeze({ ...candidate, subjectType: 'scenario_offer', subjectKey: offerKey, scope: Object.freeze({ ...candidate.scope, scenarioId: SCENARIO.id }) }));
    coverage[candidate.fieldName] = observedField();
  }
  coverage.unlimited_policy = notApplicableField('Selected Ubigi offer is a finite 50GB plan.');
  coverage.fair_use_policy = notApplicableField('No unlimited/FUP comparison is required for the finite allowance in this bounded pack.');

  const destination = findFirstMatch(plan.visibleText, /Destination\s+Network\(s\)[\s\S]{0,180}?Italy/i, 'Ubigi Italy destination');
  const italy = destination[0].match(/Italy/i)[0];
  candidates.push(buildCandidate({
    provider: 'ubigi', offerKey, fieldName: 'destination_coverage', normalizedValue: { countries: ['IT'], scope: 'local' },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, destination, italy))], observedAt,
  }));
  coverage.destination_coverage = observedField();

  const sharing = findFirstMatch(plan.visibleText, /Data sharing allowed/i, 'Ubigi data sharing');
  candidates.push(buildCandidate({
    provider: 'ubigi', offerKey, fieldName: 'hotspot_policy', normalizedValue: { allowed: true },
    evidence: [evidenceRef(plan, locatorFromMatch(plan, sharing, sharing[0]))], observedAt,
  }));
  coverage.hotspot_policy = observedField();
  coverage.hotspot_share_limit = unknownField('Data sharing is explicitly allowed, but no exact share cap or explicit absence of a cap is proven by the captured source set.');

  const smartStartPlan = findFirstMatch(plan.visibleText, /Smartstart[\s\S]{0,120}?activation starts upon arrival at destination/i, 'Ubigi product SmartStart');
  const smartStartHelp = findFirstMatch(activationSource.visibleText, /activates automatically upon arrival in a covered area[\s\S]{0,300}?already in a covered area[\s\S]{0,120}?activation starts immediately/i, 'Ubigi SmartStart help');
  candidates.push(buildCandidate({
    provider: 'ubigi', offerKey, fieldName: 'activation_policy',
    normalizedValue: { trigger: 'covered_area_connection', purchaseWhileCovered: 'immediate' },
    evidence: [
      evidenceRef(plan, locatorFromMatch(plan, smartStartPlan, smartStartPlan[0])),
      evidenceRef(activationSource, locatorFromMatch(activationSource, smartStartHelp, smartStartHelp[0])),
    ],
    observedAt,
  }));
  coverage.activation_policy = observedField();

  const iliad = locatorForValue(plan, 'Iliad', 'Ubigi Iliad network');
  const windTre = locatorForValue(plan, 'WindTre', 'Ubigi WindTre network');
  candidates.push(buildCandidate({
    provider: 'ubigi', offerKey, fieldName: 'network', normalizedValue: { operators: ['Iliad', 'WindTre'], completeness: 'declared' },
    evidence: [evidenceRef(plan, iliad), evidenceRef(plan, windTre)], observedAt,
  }));
  coverage.network = observedField();

  const technologies = ['3G', '4G', '5G'].map((technologyName) => rawHtmlLocator(plan, new RegExp(`(?:Icon ecommerce\\s*)?${technologyName}`, 'i'), `Ubigi ${technologyName}`));
  candidates.push(buildCandidate({
    provider: 'ubigi', offerKey, fieldName: 'radio_technology', normalizedValue: { technologies: ['3G', '4G', '5G'], qualifier: 'declared_for_destination' },
    evidence: technologies.map((locator) => evidenceRef(plan, locator)), observedAt,
    warnings: ['raw_html_icon_evidence', 'technology_statement_not_performance_measurement'],
  }));
  coverage.radio_technology = observedField();

  return Object.freeze({ provider: 'ubigi', offerKey, label: 'Italy 50GB — 30 days', candidates: Object.freeze(candidates), coverage: Object.freeze(coverage) });
}

function semanticOfferProjection(offer) {
  return {
    provider: offer.provider,
    offerKey: offer.offerKey,
    candidates: offer.candidates.map((candidate) => ({ fieldName: candidate.fieldName, normalizedValue: candidate.normalizedValue, warnings: candidate.warnings })).sort((a, b) => a.fieldName.localeCompare(b.fieldName)),
    coverage: offer.coverage,
  };
}

export function packSemanticProjection(pack) {
  return Object.freeze({
    scenario: pack.scenario,
    offers: pack.offers.map(semanticOfferProjection).sort((a, b) => a.provider.localeCompare(b.provider)),
    ranking: pack.ranking,
  });
}

export function packSemanticFingerprint(pack) {
  return `sha256:${hashCanonical(packSemanticProjection(pack))}`;
}

export function packSemanticDiff(previousPack, currentPack) {
  const previous = packSemanticProjection(previousPack);
  const current = packSemanticProjection(currentPack);
  const changes = [];
  const providers = [...new Set([...previous.offers.map((entry) => entry.provider), ...current.offers.map((entry) => entry.provider)])].sort();
  for (const provider of providers) {
    const before = previous.offers.find((entry) => entry.provider === provider) ?? null;
    const after = current.offers.find((entry) => entry.provider === provider) ?? null;
    if (canonicalJson(before) !== canonicalJson(after)) changes.push({ provider, before, after });
  }
  return Object.freeze(changes);
}

export function buildComparisonPack({ snapshots, startedAt, completedAt }) {
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) throw new Error('Invalid pack capture window.');
  const captureWindowMs = end - start;
  if (captureWindowMs > MAX_CAPTURE_WINDOW_MS) throw new Error(`Capture window ${captureWindowMs} ms exceeds ${MAX_CAPTURE_WINDOW_MS} ms.`);
  for (const source of SOURCE_CONFIG) {
    if (!snapshots.has(source.key)) throw new Error(`Missing source snapshot: ${source.key}`);
  }

  const offers = Object.freeze([extractAiralo(snapshots), extractHolafly(snapshots), extractUbigi(snapshots)]);
  const sourceMetadata = Object.freeze(SOURCE_CONFIG.map((source) => snapshotPublicMetadata(snapshots.get(source.key))));
  const packId = `pack:sha256:${hashCanonical({ scenario: SCENARIO, sourceSnapshotIds: sourceMetadata.map((source) => source.snapshotId) })}`;
  const pack = {
    schemaVersion: PACK_SCHEMA_VERSION,
    packId,
    scenario: SCENARIO,
    startedAt,
    completedAt,
    captureWindowMs,
    sources: sourceMetadata,
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
      headers: { accept: 'text/html,application/xhtml+xml;q=0.9', 'user-agent': 'SenzaRoamingEvidencePackSpike/1.0 (+https://senzaroaming.it/metodo)' },
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
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new Error(`${source.key}: declared response exceeds ${MAX_RESPONSE_BYTES} bytes.`);
  }
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
  const persistedPack = Object.freeze({
    ...captured.pack,
    artifactLocation: path.relative(process.cwd(), artifactDirectory).split(path.sep).join('/'),
  });
  await writeFileImpl(packPath, `${JSON.stringify(persistedPack, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  return Object.freeze({ artifactDirectory, packPath, pack: persistedPack });
}

export function parseArgs(argv) {
  const options = { out: DEFAULT_OUTPUT_DIRECTORY, compare: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--out') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error('--out requires a value.');
      options.out = value;
    } else if (flag === '--compare') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error('--compare requires a pack.json path.');
      options.compare = value;
    } else if (flag === '--help' || flag === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${flag}`);
    }
  }
  requireRepoLocalPath(options.out, '--out');
  if (options.compare) requireRepoLocalPath(options.compare, '--compare');
  return Object.freeze(options);
}

async function loadPack(filename) {
  const payload = JSON.parse(await readFile(requireRepoLocalPath(filename, '--compare'), 'utf8'));
  if (!Array.isArray(payload.offers) || payload.ranking?.status !== 'not_computed') throw new Error(`Invalid comparison pack: ${filename}`);
  return payload;
}

function usage() {
  return `Usage: npm run evidence:italy-pack -- [options]\n\n` +
    `Captures a fixed allowlist of official Airalo, Holafly and Ubigi Italy sources.\n` +
    `The command never computes a provider ranking.\n\n` +
    `Options:\n` +
    `  --out <directory>       Local pack root (default: ${DEFAULT_OUTPUT_DIRECTORY})\n` +
    `  --compare <pack.json>   Compare provider semantic evidence with a previous pack\n` +
    `  -h, --help              Show this help\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const captured = await captureComparisonPack();
  const artifact = await writeComparisonArtifact({ captured, outputDirectory: options.out });
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

  if (options.compare) {
    const previous = await loadPack(options.compare);
    const changes = packSemanticDiff(previous, artifact.pack);
    console.log(`Provider semantic changes: ${changes.length}`);
    for (const change of changes) console.log(`- ${change.provider}`);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) await main();
