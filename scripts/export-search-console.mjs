import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_SITE_URL = 'sc-domain:senzaroaming.it';
export const SEARCH_ANALYTICS_ENDPOINT = 'https://www.googleapis.com/webmasters/v3/sites';
export const SEARCH_CONSOLE_READONLY_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
export const ADC_TOKEN_ARGS = Object.freeze([
  'auth',
  'application-default',
  'print-access-token',
  `--scopes=${SEARCH_CONSOLE_READONLY_SCOPE}`,
]);
export const MAX_ROW_LIMIT = 25_000;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const COUNTRY_PATTERN = /^[a-zA-Z]{3}$/;

function isoDate(value) {
  return value.toISOString().slice(0, 10);
}

function shiftUtcDate(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function requireDate(value, label) {
  if (!DATE_PATTERN.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }
  return value;
}

function nextValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
}

export function parseArgs(argv, today = isoDate(new Date())) {
  const defaultEnd = shiftUtcDate(today, -1);
  const options = {
    siteUrl: DEFAULT_SITE_URL,
    startDate: shiftUtcDate(defaultEnd, -27),
    endDate: defaultEnd,
    dataState: 'all',
    country: '',
    rowLimit: MAX_ROW_LIMIT,
    outputDirectory: path.join('research', 'seo', 'gsc', defaultEnd),
  };

  let outputExplicit = false;
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--site') options.siteUrl = nextValue(argv, index++, flag);
    else if (flag === '--start') options.startDate = nextValue(argv, index++, flag);
    else if (flag === '--end') options.endDate = nextValue(argv, index++, flag);
    else if (flag === '--data-state') options.dataState = nextValue(argv, index++, flag);
    else if (flag === '--country') options.country = nextValue(argv, index++, flag).toLowerCase();
    else if (flag === '--row-limit') options.rowLimit = Number(nextValue(argv, index++, flag));
    else if (flag === '--out') {
      options.outputDirectory = nextValue(argv, index++, flag);
      outputExplicit = true;
    } else if (flag === '--help' || flag === '-h') {
      return { help: true };
    } else {
      throw new Error(`Unknown argument: ${flag}`);
    }
  }

  options.startDate = requireDate(options.startDate, '--start');
  options.endDate = requireDate(options.endDate, '--end');
  if (options.startDate > options.endDate) throw new Error('--start cannot be after --end.');
  if (!['all', 'final'].includes(options.dataState)) {
    throw new Error('--data-state must be all or final.');
  }
  if (options.country && !COUNTRY_PATTERN.test(options.country)) {
    throw new Error('--country must be a three-letter ISO 3166-1 alpha-3 code.');
  }
  if (!Number.isInteger(options.rowLimit) || options.rowLimit < 1 || options.rowLimit > MAX_ROW_LIMIT) {
    throw new Error(`--row-limit must be an integer between 1 and ${MAX_ROW_LIMIT}.`);
  }
  if (!options.siteUrl.startsWith('sc-domain:') && !/^https?:\/\//i.test(options.siteUrl)) {
    throw new Error('--site must be a Search Console domain property or URL-prefix property.');
  }
  if (!outputExplicit) {
    options.outputDirectory = path.join('research', 'seo', 'gsc', options.endDate);
  }

  return Object.freeze(options);
}

export function obtainAdcAccessToken({ gcloudBin = process.env.GCLOUD_BIN || 'gcloud' } = {}) {
  const result = spawnSync(
    gcloudBin,
    ADC_TOKEN_ARGS,
    {
      encoding: 'utf8',
      env: process.env,
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    },
  );

  if (result.error?.code === 'ENOENT') {
    throw new Error('gcloud is not installed or not available in PATH.');
  }
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const diagnostic = (result.stderr || result.stdout || '').trim();
    throw new Error(
      `Unable to obtain an ADC access token.${diagnostic ? ` ${diagnostic}` : ''}`,
    );
  }

  const token = result.stdout.trim();
  if (!token) throw new Error('ADC returned an empty access token.');
  return token;
}

function requestUrl(siteUrl) {
  return `${SEARCH_ANALYTICS_ENDPOINT}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
}

function dimensionFilters(options) {
  if (!options.country) return undefined;
  return [{
    groupType: 'and',
    filters: [{ dimension: 'country', operator: 'equals', expression: options.country }],
  }];
}

export async function fetchAllRows({
  accessToken,
  options,
  dimensions,
  fetchImpl = fetch,
}) {
  const rows = [];
  const responseMetadata = [];
  let startRow = 0;

  for (let page = 0; page < 100; page += 1) {
    const body = {
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions,
      type: 'web',
      dataState: options.dataState,
      aggregationType: 'auto',
      rowLimit: options.rowLimit,
      startRow,
    };
    const filters = dimensionFilters(options);
    if (filters) body.dimensionFilterGroups = filters;

    const response = await fetchImpl(requestUrl(options.siteUrl), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Search Console returned invalid JSON for ${dimensions.join('+')}.`);
    }
    if (!response.ok) {
      const message = payload?.error?.message || text || `HTTP ${response.status}`;
      throw new Error(`Search Console ${dimensions.join('+')} query failed: ${message}`);
    }

    const pageRows = Array.isArray(payload.rows) ? payload.rows : [];
    rows.push(...pageRows);
    responseMetadata.push({
      startRow,
      rowCount: pageRows.length,
      responseAggregationType: payload.responseAggregationType ?? null,
      metadata: payload.metadata ?? null,
    });

    if (pageRows.length < options.rowLimit) break;
    startRow += pageRows.length;
    if (page === 99) throw new Error(`Search Console pagination limit reached for ${dimensions.join('+')}.`);
  }

  return { rows, responseMetadata };
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function rowsToCsv(dimensions, rows) {
  const headers = [...dimensions, 'clicks', 'impressions', 'ctr', 'position'];
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) {
    const keys = Array.isArray(row.keys) ? row.keys : [];
    const values = [
      ...dimensions.map((_, index) => keys[index] ?? ''),
      row.clicks ?? 0,
      row.impressions ?? 0,
      row.ctr ?? 0,
      row.position ?? 0,
    ];
    lines.push(values.map(csvCell).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export const EXPORTS = Object.freeze([
  Object.freeze({ name: 'daily', dimensions: Object.freeze(['date']) }),
  Object.freeze({ name: 'queries', dimensions: Object.freeze(['query']) }),
  Object.freeze({ name: 'pages', dimensions: Object.freeze(['page']) }),
  Object.freeze({ name: 'query-pages', dimensions: Object.freeze(['query', 'page']) }),
  Object.freeze({ name: 'countries', dimensions: Object.freeze(['country']) }),
  Object.freeze({ name: 'devices', dimensions: Object.freeze(['device']) }),
]);

export async function exportSearchConsole({
  options,
  accessToken,
  fetchImpl = fetch,
  writeFileImpl = writeFile,
  mkdirImpl = mkdir,
  now = new Date(),
}) {
  const outputDirectory = path.resolve(options.outputDirectory);
  await mkdirImpl(outputDirectory, { recursive: true });

  const manifests = [];
  for (const definition of EXPORTS) {
    const result = await fetchAllRows({
      accessToken,
      options,
      dimensions: definition.dimensions,
      fetchImpl,
    });
    const filename = `${definition.name}.csv`;
    await writeFileImpl(
      path.join(outputDirectory, filename),
      rowsToCsv(definition.dimensions, result.rows),
      'utf8',
    );
    manifests.push({
      name: definition.name,
      filename,
      dimensions: definition.dimensions,
      rowCount: result.rows.length,
      requests: result.responseMetadata,
    });
  }

  const metadata = {
    schemaVersion: 1,
    source: 'Google Search Console Search Analytics API',
    endpoint: `${SEARCH_ANALYTICS_ENDPOINT}/{siteUrl}/searchAnalytics/query`,
    scope: SEARCH_CONSOLE_READONLY_SCOPE,
    extractedAt: now.toISOString(),
    siteUrl: options.siteUrl,
    startDate: options.startDate,
    endDate: options.endDate,
    dataState: options.dataState,
    countryFilter: options.country || null,
    searchType: 'web',
    rowLimit: options.rowLimit,
    exports: manifests,
    limitations: [
      'Search Console can omit anonymized queries.',
      'The API returns top rows and does not guarantee every row.',
      'Rows marked incomplete by response metadata can change.',
    ],
  };
  await writeFileImpl(
    path.join(outputDirectory, 'metadata.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    'utf8',
  );
  return { outputDirectory, metadata };
}

function usage() {
  return `Usage: npm run seo:gsc-export -- [options]\n\nOptions:\n  --site <property>       Search Console property (default: ${DEFAULT_SITE_URL})\n  --start <YYYY-MM-DD>    Start date (default: 28-day window)\n  --end <YYYY-MM-DD>      End date (default: yesterday)\n  --data-state <all|final> Include fresh or finalized data (default: all)\n  --country <ISO3>        Optional country filter, for example ita\n  --row-limit <1-25000>   Rows per API request (default: ${MAX_ROW_LIMIT})\n  --out <directory>       Output directory\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const accessToken = obtainAdcAccessToken();
  const result = await exportSearchConsole({ options, accessToken });
  console.log(`Search Console export written to ${result.outputDirectory}.`);
  for (const entry of result.metadata.exports) {
    console.log(`${entry.filename}: ${entry.rowCount} rows`);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
