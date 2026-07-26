import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRODUCTION_CONSENT_EMBED_ID,
  PRODUCTION_CONSENT_PROVIDER,
} from './prepare-production-consent-config.mjs';

export const PRODUCTION_GTM_ID = 'GTM-W3LSK9RZ';
export const PRODUCTION_GA4_MEASUREMENT_ID = 'G-GWJ9YPPVJW';

const FORBIDDEN_ADVERTISING_KEYS = [
  'GOOGLE_ADS_ID',
  'GOOGLE_ADS_CONVERSION_ID',
  'GOOGLE_ADS_CONVERSION_LABEL',
  'DOUBLECLICK_ID',
];

export function applyProductionMeasurementConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Compiled Wrangler configuration must be an object.');
  }

  const config = structuredClone(input);
  if (!config.vars || typeof config.vars !== 'object' || Array.isArray(config.vars)) {
    throw new TypeError('Compiled Wrangler configuration must contain a vars object.');
  }

  if (config.vars.CMP_PROVIDER !== PRODUCTION_CONSENT_PROVIDER) {
    throw new Error('Measurement deploy requires the verified production CMP provider.');
  }
  if (config.vars.CMP_EMBED_ID !== PRODUCTION_CONSENT_EMBED_ID) {
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

  config.vars.GTM_ID = PRODUCTION_GTM_ID;
  config.vars.GA4_MEASUREMENT_ID = PRODUCTION_GA4_MEASUREMENT_ID;
  return config;
}

async function main() {
  const configPath = path.resolve(process.argv[2] ?? 'apps/web/dist/server/wrangler.json');
  const source = await readFile(configPath, 'utf8');
  const parsed = JSON.parse(source);
  const configured = applyProductionMeasurementConfig(parsed);
  await writeFile(configPath, `${JSON.stringify(configured, null, 2)}\n`, 'utf8');
  console.log(`Prepared consent-gated production measurement configuration at ${configPath}.`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
