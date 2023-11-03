/* eslint max-lines: "off" */
import dtaleApp from '../redux/reducers/app';
import mergeApp from '../redux/reducers/merge';
import { createAppStore } from '../redux/store';
import chartsData from './data/charts.json';
import groupedChartsData from './data/charts-grouped.json';
import columnAnalysisData from './data/column-analysis.json';
import correlationsData from './data/correlations.json';
import correlationsTsData from './data/correlations-ts.json';
import scatterData from './data/scatter.json';

const DTYPES = {
  dtypes: [
    {
      name: 'col1',
      index: 0,
      dtype: 'int64',
      min: 2,
      max: 5,
      visible: true,
      hasMissing: 1,
      hasOutliers: 0,
      lowVariance: false,
      unique_ct: 1,
    },
    {
      name: 'col2',
      index: 1,
      dtype: 'float64',
      min: 2.5,
      max: 5.5,
      visible: true,
      hasMissing: 0,
      hasOutliers: 0,
      outlierRange: { lower: 3.5, upper: 4.5 },
      lowVariance: true,
      unique_ct: 1,
    },
    { name: 'col3', index: 2, dtype: 'object', visible: true, unique_ct: 1 },
    {
      name: 'col4',
      index: 3,
      dtype: 'datetime64[ns]',
      visible: true,
      unique_ct: 1,
    },
  ],
  success: true,
};

export const DATA = {
  results: [
    { dtale_index: 0, col1: 1, col2: 2.5, col3: 'foo', col4: '2000-01-01' },
    { dtale_index: 1, col1: 2, col2: 3.5, col3: 'foo', col4: '2000-01-01' },
    { dtale_index: 2, col1: 3, col2: 4.5, col3: 'foo', col4: '2000-01-01' },
    { dtale_index: 3, col1: 4, col2: 5.5, col3: 'foo' },
    { dtale_index: 4, col1: 'nan', col2: 5.5, col3: 'foo' },
  ],
  columns: [{ dtype: 'int64', index: -1, name: 'dtale_index', visible: true }, ...DTYPES.dtypes],
  total: 5,
  success: true,
  final_query: '',
};

const DESCRIBE = {
  col1: {
    describe: {
      count: 4,
      max: 4,
      mean: 2.5,
      min: 1,
      std: 0,
      unique: 4,
      '25%': 1,
      '50%': 2.5,
      '75%': 4,
    },
    uniques: {
      int: {
        data: [1, 2, 3, 4].map((i) => ({ value: i, count: 1 })),
        top: true,
      },
    },
    sequential_diffs: {
      min: 1,
      max: 3,
      avg: 2,
      diffs: {
        data: [1, 2, 3, 4].map((i) => ({ value: i, count: 1 })),
        top: true,
        total: 10,
      },
    },
  },
  col2: {
    describe: {
      count: 4,
      max: 4,
      mean: 4,
      min: 2.5,
      std: 0,
      unique: 4,
      '25%': 2.5,
      '50%': 4,
      '75%': 5.5,
    },
  },
  col3: {
    describe: { count: 4, freq: 4, top: 'foo', unique: 1 },
    string_metrics: {},
    uniques: { str: { data: [{ value: 'foo', count: 1 }], top: false } },
  },
  col4: {
    describe: {
      count: 3,
      first: '2000-01-01',
      freq: 1,
      last: '2000-01-01',
      top: '2000-01-01',
      unique: 1,
    },
  },
};

export const PROCESSES = [
  {
    rows: 50,
    ts: 1525106204000,
    start: '2018-04-30 12:36:44',
    names: 'date,security_id,foo,bar,baz',
    data_id: '8080',
    columns: 5,
  },
  {
    rows: 50,
    name: 'foo',
    ts: 1525106204000,
    start: '2018-04-30 12:36:44',
    names: 'date,security_id,foo,bar,baz',
    data_id: '8081',
    columns: 5,
  },
  {
    rows: 50,
    name: 'foo2',
    ts: 1525106204000,
    start: '2018-04-30 12:36:44',
    names: 'date,security_id,foo,bar,baz',
    data_id: '8082',
    columns: 5,
  },
  {
    rows: 3,
    ts: 1525106204000,
    start: '2018-04-30 12:36:44',
    names: 'date,security_id,foo,bar,baz',
    data_id: '8083',
    columns: 3,
  },
];

const CONTEXT_VARIABLES = {
  contextVars: [
    { name: 'foo', value: 'bar' },
    { name: 'cat', value: 'dog' },
  ],
  columnFilters: { foo: { query: 'foo == 1' } },
  query: 'foo == 1',
  success: true,
};

function getDataId(url) {
  if (url.startsWith('/dtale/filter-info')) {
    return url.split('?')[0].split('/')[3];
  }
  return null;
}

// eslint-disable-next-line max-statements, complexity
function urlFetcher(url) {
  const urlParams = Object.fromEntries(new URLSearchParams(url.split('?')[1]));
  const query = urlParams.query;
  if (url.startsWith('/dtale/data')) {
    if (query === 'error') {
      return { error: 'No data found' };
    }
    return DATA;
  } else if (url.startsWith('/dtale/dtypes')) {
    return DTYPES;
  } else if (url.startsWith('/dtale/column-analysis')) {
    return { code: 'column analysis code test', ...columnAnalysisData, cols: DTYPES.dtypes };
  } else if (url.startsWith('/dtale/correlations-ts')) {
    return { code: 'correlations ts code test', ...correlationsTsData };
  } else if (url.startsWith('/dtale/correlations/')) {
    return { code: 'correlations code test', ...correlationsData };
  } else if (url.startsWith('/dtale/scatter')) {
    if (urlParams.rolling) {
      const dates = Array.from({ length: scatterData.data.all.x.length }, () => '2018-04-30');
      return {
        code: 'scatter code test',
        ...scatterData,
        data: { all: { ...scatterData.data.all, date: dates } },
        date: ' for 2018-12-16 thru 2018-12-19',
      };
    }
    return scatterData;
  } else if (url.startsWith('/dtale/chart-data')) {
    if (urlParams.group) {
      if ((JSON.parse(urlParams.y) ?? []).length > 1) {
        return {
          ...groupedChartsData,
          data: Object.entries(groupedChartsData.data).reduce(
            (res, [key, value]) => ({ ...res, [key]: { ...value, col2: value.col1 } }),
            {},
          ),
        };
      }
      return groupedChartsData;
    }
    if ((JSON.parse(urlParams.y) ?? []).length > 1) {
      return {
        ...chartsData,
        data: Object.entries(chartsData.data).reduce(
          (res, [key, value]) => ({ ...res, [key]: { ...value, col2: value.col1 } }),
          {},
        ),
      };
    }
    return chartsData;
  } else if (
    [
      ...[
        '/dtale/update-visibility',
        '/dtale/update-settings',
        '/dtale/update-locked',
        '/dtale/update-column-position',
      ],
      ...['/dtale/delete-col', '/dtale/edit-cell', '/dtale/update-formats', '/dtale/update-xarray-selection'],
      ...['/dtale/to-xarray', '/dtale/duplicates', '/dtale/web-upload', '/dtale/datasets', '/dtale/update-theme'],
      ...['/dtale/update-query-engine', '/dtale/save-range-highlights'],
    ].find((prefix) => url.startsWith(prefix))
  ) {
    return { success: true };
  } else if (url.startsWith('/dtale/test-filter')) {
    if (query === 'error') {
      return { error: 'No data found' };
    }
    return { success: true };
  } else if (url.startsWith('/dtale/describe')) {
    if (DESCRIBE[urlParams.col]) {
      return { success: true, code: 'describe code test', ...DESCRIBE[urlParams.col] };
    }
    return { error: 'Column not found!' };
  } else if (url.startsWith('/dtale/processes')) {
    return { data: PROCESSES, success: true };
  } else if (url.startsWith('/dtale/build-column')) {
    if (urlParams.name === 'error') {
      return { error: 'error test' };
    }
    return { success: true, url: 'http://localhost:40000/dtale/main/1' };
  } else if (url.startsWith('/dtale/build-replacement')) {
    if (urlParams.name === 'error') {
      return { error: 'error test' };
    }
    return { success: true };
  } else if (url.startsWith('/dtale/reshape')) {
    if (urlParams.index === 'error') {
      return { error: 'error test' };
    }
    return { success: true, data_id: 9999 };
  } else if (url.startsWith('/dtale/filter-info')) {
    return getDataId(url) === 'error' ? { error: 'Error loading context variables' } : CONTEXT_VARIABLES;
  } else if (url.startsWith('/dtale/code-export')) {
    return { code: 'test code' };
  } else if (url.startsWith('/dtale/cleanup-datasets')) {
    return { success: true };
  } else if (url.startsWith('/dtale/column-filter-data')) {
    return { success: true, hasMissing: 0, uniques: [1, 2, 3] };
  } else if (url.startsWith('/dtale/save-column-filter')) {
    return {
      success: true,
      columnFilters: { foo: { query: 'foo == 1', value: [1] } },
    };
  } else if (url.startsWith('/dtale/outliers')) {
    return {
      success: true,
      outliers: [1, 2, 3],
      query: '((a < 1) or ( a > 4))',
      code: 'test code',
      queryApplied: true,
      top: true,
    };
  } else if (url.startsWith('/dtale/bins-tester')) {
    return {
      data: [1, 2, 3, 2, 1],
      labels: ['1', '2', '3', '4', '5'],
    };
  } else if (url.startsWith('/dtale/load-filtered-ranges')) {
    return { ranges: {} };
  }
  return {};
}

export default {
  urlFetcher,
  createDtaleStore: () => createAppStore(dtaleApp),
  createMergeStore: () => createAppStore(mergeApp),
  DATA,
  DTYPES,
};
