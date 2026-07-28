import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveProductionConsentConfig } from './prepare-production-consent-config.mjs';
import { resolveProductionMeasurementConfig } from './prepare-production-measurement-config.mjs';

const SOURCE_ONLY_EMPTY_KEYS = [
  'CMP_PROVIDER',
  'CMP_EMBED_ID',
  'GTM_ID',
  'GA4_MEASUREMENT_ID',
];

const FORBIDDEN_ADVERTISING_KEYS = [
  'GOOGLE_ADS_ID',
  'GOOGLE_ADS_CONVERSION_ID',
  'GOOGLE_ADS_CONVERSION_LABEL',
  'DOUBLECLICK_ID',
];

export function verifyProductionDeployPreflight(config, environment = process.env) {
  resolveProductionConsentConfig(environment);
  resolveProductionMeasurementConfig(environment);

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('Source Wrangler configuration must be an object.');
  }
  if (!config.vars || typeof config.vars !== 'object' || Array.isArray(config.vars)) {
    throw new TypeError('Source Wrangler configuration must contain a vars object.');
  }

  for (const key of SOURCE_ONLY_EMPTY_KEYS) {
    if (config.vars[key] !== '') {
      throw new Error(`Source ${key} must remain empty before production preparation.`);
    }
  }
  if (config.vars.AFFILIATE_MODE !== 'disabled') {
    throw new Error('Production deploy requires AFFILIATE_MODE=disabled.');
  }
  for (const key of FORBIDDEN_ADVERTISING_KEYS) {
    if (key in config.vars) {
      throw new Error(`Advertising variable ${key} must not be present.`);
    }
  }

  return Object.freeze({ affiliateMode: 'disabled' });
}

async function main() {
  const configPath = path.resolve(process.argv[2] ?? 'wrangler.jsonc');
  const source = await readFile(configPath, 'utf8');
  verifyProductionDeployPreflight(JSON.parse(source));
  console.log('Production deploy inputs and fail-closed guardrails verified.');
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
