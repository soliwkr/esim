import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const ALLOWED_ENTITY_TYPES = new Set(['provider', 'destination', 'plan', 'device', 'page', 'policy']);
const ALLOWED_SOURCE_KINDS = new Set([
  'official_provider',
  'official_help',
  'official_terms',
  'regulator',
  'manufacturer',
  'first_party_test',
  'editorial_reference',
]);
const ALLOWED_ONBOARDING_STATES = new Set(['required', 'registered_expected']);

export function canonicalizeRegistryUrl(value) {
  if (typeof value !== 'string' || value.trim() !== value || value.length === 0) {
    throw new Error('registry_url_invalid');
  }
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new Error('registry_url_invalid');
  }
  url.hostname = url.hostname.toLowerCase();
  if (url.port === '443') url.port = '';
  return url.toString();
}

export function validateReconciliationManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== 1 || manifest.mappingVersion !== 1) {
    throw new Error('source_reconciliation_schema_unsupported');
  }
  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) {
    throw new Error('source_reconciliation_sources_missing');
  }
  if (manifest.rules?.matchCardinality !== 'exactly_one'
      || manifest.rules?.allowProviderRootFallback !== false
      || manifest.rules?.allowRedirectAutoRemap !== false
      || manifest.rules?.allowImporterAutoRegistration !== false
      || manifest.rules?.hardcodeEnvironmentSourceRegistryIds !== false) {
    throw new Error('source_reconciliation_rules_invalid');
  }

  const seen = new Set();
  for (const entry of manifest.sources) {
    if (!entry || typeof entry.sourceAuditKey !== 'string' || !entry.sourceAuditKey) {
      throw new Error('source_audit_key_invalid');
    }
    if (seen.has(entry.sourceAuditKey)) throw new Error(`source_audit_key_duplicate:${entry.sourceAuditKey}`);
    seen.add(entry.sourceAuditKey);
    if ('sourceRegistryId' in entry || 'source_id' in entry || 'sourceId' in entry) {
      throw new Error(`environment_source_id_forbidden:${entry.sourceAuditKey}`);
    }
    if (!ALLOWED_ENTITY_TYPES.has(entry.entityType)) {
      throw new Error(`entity_type_invalid:${entry.sourceAuditKey}`);
    }
    if (typeof entry.entityKey !== 'string' || !entry.entityKey) {
      throw new Error(`entity_key_invalid:${entry.sourceAuditKey}`);
    }
    if (!ALLOWED_SOURCE_KINDS.has(entry.sourceKind)) {
      throw new Error(`source_kind_invalid:${entry.sourceAuditKey}`);
    }
    if (!ALLOWED_ONBOARDING_STATES.has(entry.onboardingState)) {
      throw new Error(`onboarding_state_invalid:${entry.sourceAuditKey}`);
    }
    canonicalizeRegistryUrl(entry.registryCanonicalUrl);
    if (!Array.isArray(entry.packRequestedUrls) || entry.packRequestedUrls.length === 0) {
      throw new Error(`pack_requested_urls_missing:${entry.sourceAuditKey}`);
    }
    for (const requestedUrl of entry.packRequestedUrls) canonicalizeRegistryUrl(requestedUrl);
  }
  return manifest;
}

export function validateManifestAgainstPackSources(manifest, packSourceGroups) {
  validateReconciliationManifest(manifest);
  if (!packSourceGroups || typeof packSourceGroups !== 'object' || Array.isArray(packSourceGroups)) {
    throw new Error('pack_source_groups_invalid');
  }

  const byAuditKey = new Map(manifest.sources.map((entry) => [entry.sourceAuditKey, entry]));
  const referencedAuditKeys = new Set();

  for (const [packName, sources] of Object.entries(packSourceGroups)) {
    if (!packName || !Array.isArray(sources) || sources.length === 0) {
      throw new Error('pack_source_group_invalid');
    }
    for (const source of sources) {
      if (!source || typeof source.sourceAuditKey !== 'string' || !source.sourceAuditKey) {
        throw new Error(`pack_source_audit_key_invalid:${packName}`);
      }
      const entry = byAuditKey.get(source.sourceAuditKey);
      if (!entry) throw new Error(`pack_source_unmapped:${packName}:${source.sourceAuditKey}`);
      if (entry.provider !== source.provider) {
        throw new Error(`pack_source_provider_mismatch:${packName}:${source.sourceAuditKey}`);
      }
      if (entry.evidenceRole !== source.role) {
        throw new Error(`pack_source_role_mismatch:${packName}:${source.sourceAuditKey}`);
      }
      const requestedUrl = canonicalizeRegistryUrl(source.url);
      const approvedRequestedUrls = new Set(entry.packRequestedUrls.map(canonicalizeRegistryUrl));
      if (!approvedRequestedUrls.has(requestedUrl)) {
        throw new Error(`pack_requested_url_unmapped:${packName}:${source.sourceAuditKey}`);
      }
      referencedAuditKeys.add(source.sourceAuditKey);
    }
  }

  const unreferenced = manifest.sources
    .map((entry) => entry.sourceAuditKey)
    .filter((sourceAuditKey) => !referencedAuditKeys.has(sourceAuditKey));
  if (unreferenced.length > 0) {
    throw new Error(`source_reconciliation_entry_unreferenced:${unreferenced.sort().join(',')}`);
  }

  return Object.freeze({
    packCount: Object.keys(packSourceGroups).length,
    packSourceReferences: Object.values(packSourceGroups).reduce((total, sources) => total + sources.length, 0),
    uniqueSourceIdentities: referencedAuditKeys.size,
  });
}

export function resolveSourceRegistryEntry(entry, registryRows) {
  if (!Array.isArray(registryRows)) throw new Error('source_registry_rows_invalid');
  const canonicalUrl = canonicalizeRegistryUrl(entry.registryCanonicalUrl);
  const matches = registryRows.filter((row) => {
    if (!row || row.status !== 'active') return false;
    if (row.entity_type !== entry.entityType || row.entity_key !== entry.entityKey) return false;
    if (row.source_kind !== entry.sourceKind) return false;
    try {
      return canonicalizeRegistryUrl(row.url) === canonicalUrl;
    } catch {
      return false;
    }
  });

  if (matches.length === 0) {
    return Object.freeze({
      sourceAuditKey: entry.sourceAuditKey,
      status: 'blocked',
      reason: 'source_not_registered',
      sourceRegistryId: null,
    });
  }
  if (matches.length > 1) {
    return Object.freeze({
      sourceAuditKey: entry.sourceAuditKey,
      status: 'blocked',
      reason: 'source_registry_ambiguous',
      sourceRegistryId: null,
      matchCount: matches.length,
    });
  }

  const sourceRegistryId = Number(matches[0].id);
  if (!Number.isSafeInteger(sourceRegistryId) || sourceRegistryId < 1) {
    throw new Error(`source_registry_id_invalid:${entry.sourceAuditKey}`);
  }
  return Object.freeze({
    sourceAuditKey: entry.sourceAuditKey,
    status: 'resolved',
    reason: null,
    sourceRegistryId,
    registryCanonicalUrl: canonicalUrl,
  });
}

export function reconcileManifest(manifest, registryRows) {
  validateReconciliationManifest(manifest);
  return manifest.sources.map((entry) => resolveSourceRegistryEntry(entry, registryRows));
}

export async function loadReconciliationManifest(pathname = 'research/evidence/source-reconciliation-map.json') {
  const manifest = JSON.parse(await readFile(pathname, 'utf8'));
  return validateReconciliationManifest(manifest);
}

async function cli() {
  const manifestPath = process.argv[2] || 'research/evidence/source-reconciliation-map.json';
  const registryExportPath = process.argv[3];
  if (!registryExportPath) {
    throw new Error('Usage: node scripts/evidence-source-reconciliation.mjs <manifest.json> <source-registry-export.json>');
  }
  const manifest = await loadReconciliationManifest(manifestPath);
  const registryRows = JSON.parse(await readFile(registryExportPath, 'utf8'));
  const results = reconcileManifest(manifest, registryRows);
  process.stdout.write(`${JSON.stringify({ mappingVersion: manifest.mappingVersion, results }, null, 2)}\n`);
  if (results.some((result) => result.status !== 'resolved')) process.exitCode = 2;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  cli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
