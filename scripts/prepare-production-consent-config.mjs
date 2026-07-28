import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LEGACY_KEYS = ['CMP_SITE_ID', 'CMP_COOKIE_POLICY_ID'];
const IUBENDA_EMBED_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function resolveProductionConsentConfig(environment = process.env) {
  const provider = environment.CMP_PROVIDER?.trim().toLowerCase() ?? '';
  const embedId = environment.CMP_EMBED_ID?.trim().toLowerCase() ?? '';

  if (!provider || !embedId) {
    throw new Error('Production consent configuration is incomplete.');
  }
  if (provider !== 'iubenda') {
    throw new Error('Production consent provider is not supported.');
  }
  if (!IUBENDA_EMBED_ID_PATTERN.test(embedId)) {
    throw new Error('Production consent embed ID is invalid.');
  }

  return Object.freeze({ provider, embedId });
}

export function applyProductionConsentConfig(input, productionConsent) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Compiled Wrangler configuration must be an object.');
  }
  if (
    !productionConsent ||
    productionConsent.provider !== 'iubenda' ||
    !IUBENDA_EMBED_ID_PATTERN.test(productionConsent.embedId)
  ) {
    throw new TypeError('Validated production consent configuration is required.');
  }

  const config = structuredClone(input);
  if (!config.vars || typeof config.vars !== 'object' || Array.isArray(config.vars)) {
    throw new TypeError('Compiled Wrangler configuration must contain a vars object.');
  }
  if (config.vars.CMP_PROVIDER !== '' || config.vars.CMP_EMBED_ID !== '') {
    throw new Error('Source consent variables must remain empty before production preparation.');
  }
  if (config.vars.GTM_ID !== '') {
    throw new Error('Production consent preparation requires GTM_ID to remain empty.');
  }
  for (const key of LEGACY_KEYS) {
    if (key in config.vars) throw new Error(`Legacy consent variable ${key} must not be present.`);
  }

  config.vars.CMP_PROVIDER = productionConsent.provider;
  config.vars.CMP_EMBED_ID = productionConsent.embedId;
  return config;
}

async function main() {
  const configPath = path.resolve(process.argv[2] ?? 'apps/web/dist/server/wrangler.json');
  const source = await readFile(configPath, 'utf8');
  const parsed = JSON.parse(source);
  const productionConsent = resolveProductionConsentConfig();
  const configured = applyProductionConsentConfig(parsed, productionConsent);
  await writeFile(configPath, `${JSON.stringify(configured, null, 2)}\n`, 'utf8');
  console.log(`Prepared fail-closed production consent configuration at ${configPath}.`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
