import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveProductionConsentConfig } from './prepare-production-consent-config.mjs';

const FORBIDDEN_ADVERTISING_KEYS = [
  'GOOGLE_ADS_ID',
  'GOOGLE_ADS_CONVERSION_ID',
  'GOOGLE_ADS_CONVERSION_LABEL',
  'DOUBLECLICK_ID',
];
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;
const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;

export function resolveProductionMeasurementConfig(environment = process.env) {
  const gtmId = environment.GTM_ID?.trim().toUpperCase() ?? '';
  const ga4MeasurementId = environment.GA4_MEASUREMENT_ID?.trim().toUpperCase() ?? '';

  if (!gtmId || !ga4MeasurementId) {
    throw new Error('Production measurement configuration is incomplete.');
  }
  if (!GTM_ID_PATTERN.test(gtmId)) {
    throw new Error('Production GTM ID is invalid.');
  }
  if (!GA4_MEASUREMENT_ID_PATTERN.test(ga4MeasurementId)) {
    throw new Error('Production GA4 measurement ID is invalid.');
  }

  return Object.freeze({ gtmId, ga4MeasurementId });
}

export function applyProductionMeasurementConfig(input, productionMeasurement, productionConsent) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Compiled Wrangler configuration must be an object.');
  }
  if (
    !productionMeasurement ||
    !GTM_ID_PATTERN.test(productionMeasurement.gtmId) ||
    !GA4_MEASUREMENT_ID_PATTERN.test(productionMeasurement.ga4MeasurementId)
  ) {
    throw new TypeError('Validated production measurement configuration is required.');
  }
  if (
    !productionConsent ||
    productionConsent.provider !== 'iubenda' ||
    typeof productionConsent.embedId !== 'string'
  ) {
    throw new TypeError('Validated production consent configuration is required.');
  }

  const config = structuredClone(input);
  if (!config.vars || typeof config.vars !== 'object' || Array.isArray(config.vars)) {
    throw new TypeError('Compiled Wrangler configuration must contain a vars object.');
  }

  if (config.vars.CMP_PROVIDER !== productionConsent.provider) {
    throw new Error('Measurement deploy requires the verified production CMP provider.');
  }
  if (config.vars.CMP_EMBED_ID !== productionConsent.embedId) {
    throw new Error('Measurement deploy requires the verified production CMP embed.');
  }
  if (config.vars.GTM_ID !== '') {
    throw new Error('Source GTM_ID must remain empty before production preparation.');
  }
  if (config.vars.GA4_MEASUREMENT_ID !== '') {
    throw new Error('Source GA4_MEASUREMENT_ID must remain empty before production preparation.');
  }
  if (config.vars.AFFILIATE_MODE !== 'disabled') {
    throw new Error('Measurement foundation requires AFFILIATE_MODE=disabled.');
  }
  for (const key of FORBIDDEN_ADVERTISING_KEYS) {
    if (key in config.vars) throw new Error(`Advertising variable ${key} must not be present.`);
  }

  config.vars.GTM_ID = productionMeasurement.gtmId;
  config.vars.GA4_MEASUREMENT_ID = productionMeasurement.ga4MeasurementId;
  return config;
}

async function main() {
  const configPath = path.resolve(process.argv[2] ?? 'apps/web/dist/server/wrangler.json');
  const source = await readFile(configPath, 'utf8');
  const parsed = JSON.parse(source);
  const productionConsent = resolveProductionConsentConfig();
  const productionMeasurement = resolveProductionMeasurementConfig();
  const configured = applyProductionMeasurementConfig(
    parsed,
    productionMeasurement,
    productionConsent,
  );
  await writeFile(configPath, `${JSON.stringify(configured, null, 2)}\n`, 'utf8');
  console.log(`Prepared consent-gated production measurement configuration at ${configPath}.`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
