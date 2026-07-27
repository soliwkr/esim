import assert from 'node:assert/strict';
import {
  ADC_TOKEN_ARGS,
  EXPORTS,
  SEARCH_CONSOLE_READONLY_SCOPE,
  fetchAllRows,
  parseArgs,
  rowsToCsv,
} from './export-search-console.mjs';

assert.deepEqual(ADC_TOKEN_ARGS, [
  'auth',
  'application-default',
  'print-access-token',
  `--scopes=${SEARCH_CONSOLE_READONLY_SCOPE}`,
]);

const options = parseArgs([
  '--site', 'sc-domain:senzaroaming.it',
  '--start', '2026-07-01',
  '--end', '2026-07-27',
  '--data-state', 'final',
  '--country', 'ITA',
  '--row-limit', '2',
  '--out', 'tmp/gsc',
], '2026-07-27');

assert.deepEqual(options, {
  siteUrl: 'sc-domain:senzaroaming.it',
  startDate: '2026-07-01',
  endDate: '2026-07-27',
  dataState: 'final',
  country: 'ita',
  rowLimit: 2,
  outputDirectory: 'tmp/gsc',
});

assert.deepEqual(parseArgs([], '2026-07-27'), {
  siteUrl: 'sc-domain:senzaroaming.it',
  startDate: '2026-06-29',
  endDate: '2026-07-26',
  dataState: 'all',
  country: '',
  rowLimit: 25_000,
  outputDirectory: 'research/seo/gsc/2026-07-26',
});
assert.throws(() => parseArgs(['--start', '2026/07/01'], '2026-07-27'), /YYYY-MM-DD/);
assert.throws(
  () => parseArgs(['--start', '2026-07-27', '--end', '2026-07-01'], '2026-07-27'),
  /cannot be after/,
);
assert.throws(() => parseArgs(['--row-limit', '25001'], '2026-07-27'), /between 1 and 25000/);
assert.throws(() => parseArgs(['--country', 'italy'], '2026-07-27'), /three-letter/);
assert.equal(EXPORTS.length, 6);

const requests = [];
const responses = [
  {
    ok: true,
    status: 200,
    payload: {
      rows: [
        { keys: ['esim'], clicks: 2, impressions: 10, ctr: 0.2, position: 4.5 },
        { keys: ['esim estero'], clicks: 1, impressions: 5, ctr: 0.2, position: 7 },
      ],
      responseAggregationType: 'byProperty',
      metadata: { first_incomplete_date: '2026-07-27' },
    },
  },
  {
    ok: true,
    status: 200,
    payload: {
      rows: [{ keys: ['migliore esim'], clicks: 0, impressions: 2, ctr: 0, position: 35 }],
      responseAggregationType: 'byProperty',
    },
  },
];

const fetchImpl = async (url, init) => {
  requests.push({ url, init, body: JSON.parse(init.body) });
  const response = responses.shift();
  return {
    ok: response.ok,
    status: response.status,
    text: async () => JSON.stringify(response.payload),
  };
};

const result = await fetchAllRows({
  accessToken: 'not-a-real-token',
  options,
  dimensions: ['query'],
  fetchImpl,
});
assert.equal(result.rows.length, 3);
assert.equal(requests.length, 2);
assert.equal(requests[0].body.startRow, 0);
assert.equal(requests[1].body.startRow, 2);
assert.deepEqual(requests[0].body.dimensionFilterGroups, [{
  groupType: 'and',
  filters: [{ dimension: 'country', operator: 'equals', expression: 'ita' }],
}]);
assert.match(requests[0].init.headers.authorization, /^Bearer /);
assert.doesNotMatch(JSON.stringify(result), /not-a-real-token/);

assert.equal(
  rowsToCsv(['query'], [
    { keys: ['esim, viaggio'], clicks: 1, impressions: 3, ctr: 1 / 3, position: 2.5 },
    { keys: ['"migliore" esim'], clicks: 0, impressions: 1, ctr: 0, position: 20 },
  ]),
  'query,clicks,impressions,ctr,position\n"esim, viaggio",1,3,0.3333333333333333,2.5\n"""migliore"" esim",0,1,0,20\n',
);

console.log('Search Console direct export smoke passed.');
