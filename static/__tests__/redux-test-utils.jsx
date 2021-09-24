/* eslint max-lines: "off" */
import qs from "querystring";

import _ from "lodash";

import dtaleApp from "../reducers/dtale";
import { createStore } from "../reducers/store";
import chartsData from "./data/charts";
import groupedChartsData from "./data/charts-grouped";
import columnAnalysisData from "./data/column-analysis";
import correlationsData from "./data/correlations";
import correlationsTsData from "./data/correlations-ts";
import scatterData from "./data/scatter";

const pjson = require("../../package.json");

const DTYPES = {
  dtypes: [
    {
      name: "col1",
      index: 0,
      dtype: "int64",
      min: 2,
      max: 5,
      visible: true,
      hasMissing: 1,
      hasOutliers: 0,
      lowVariance: false,
      unique_ct: 1,
    },
    {
      name: "col2",
      index: 1,
      dtype: "float64",
      min: 2.5,
      max: 5.5,
      visible: true,
      hasMissing: 0,
      hasOutliers: 0,
      outlierRange: { lower: 3.5, upper: 4.5 },
      lowVariance: true,
      unique_ct: 1,
    },
    { name: "col3", index: 2, dtype: "object", visible: true, unique_ct: 1 },
    {
      name: "col4",
      index: 3,
      dtype: "datetime64[ns]",
      visible: true,
      unique_ct: 1,
    },
  ],
  success: true,
};

const DATA = {
  results: [
    { dtale_index: 0, col1: 1, col2: 2.5, col3: "foo", col4: "2000-01-01" },
    { dtale_index: 1, col1: 2, col2: 3.5, col3: "foo", col4: "2000-01-01" },
    { dtale_index: 2, col1: 3, col2: 4.5, col3: "foo", col4: "2000-01-01" },
    { dtale_index: 3, col1: 4, col2: 5.5, col3: "foo" },
    { dtale_index: 4, col1: "nan", col2: 5.5, col3: "foo" },
  ],
  columns: _.concat([{ name: "dtale_index", dtype: "int64", visible: true }], DTYPES.dtypes),
  total: 5,
  success: true,
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
      "25%": 1,
      "50%": 2.5,
      "75%": 4,
    },
    uniques: {
      int: {
        data: _.map([1, 2, 3, 4], i => ({ value: i, count: 1 })),
        top: true,
      },
    },
    sequential_diffs: {
      min: 1,
      max: 3,
      avg: 2,
      diffs: {
        data: _.map([1, 2, 3, 4], i => ({ value: i, count: 1 })),
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
      "25%": 2.5,
      "50%": 4,
      "75%": 5.5,
    },
  },
  col3: {
    describe: { count: 4, freq: 4, top: "foo", unique: 1 },
    string_metrics: {},
    uniques: { str: { data: [{ value: "foo", count: 1 }], top: false } },
  },
  col4: {
    describe: {
      count: 3,
      first: "2000-01-01",
      freq: 1,
      last: "2000-01-01",
      top: "2000-01-01",
      unique: 1,
    },
  },
};

export const PROCESSES = [
  {
    rows: 50,
    ts: 1525106204000,
    start: "2018-04-30 12:36:44",
    names: "date,security_id,foo,bar,baz",
    data_id: "8080",
    columns: 5,
  },
  {
    rows: 50,
    name: "foo",
    ts: 1525106204000,
    start: "2018-04-30 12:36:44",
    names: "date,security_id,foo,bar,baz",
    data_id: "8081",
    columns: 5,
  },
  {
    rows: 50,
    name: "foo2",
    ts: 1525106204000,
    start: "2018-04-30 12:36:44",
    names: "date,security_id,foo,bar,baz",
    data_id: "8082",
    columns: 5,
  },
  {
    rows: 3,
    ts: 1525106204000,
    start: "2018-04-30 12:36:44",
    names: "date,security_id,foo,bar,baz",
    data_id: "8083",
    columns: 3,
  },
];

const CONTEXT_VARIABLES = {
  contextVars: [
    { name: "foo", value: "bar" },
    { name: "cat", value: "dog" },
  ],
  columnFilters: { foo: { query: "foo == 1" } },
  query: "foo == 1",
  success: true,
};

function getDataId(url) {
  if (_.startsWith(url, "/dtale/filter-info")) {
    return url.split("?")[0].split("/")[3];
  }
  return null;
}

// eslint-disable-next-line max-statements, complexity
function urlFetcher(url) {
  const urlParams = qs.parse(url.split("?")[1]);
  const query = urlParams.query;
  if (_.startsWith(url, "/dtale/data")) {
    if (query === "error") {
      return { error: "No data found" };
    }
    return DATA;
  } else if (_.startsWith(url, "/dtale/dtypes")) {
    return DTYPES;
  } else if (_.startsWith(url, "/dtale/column-analysis")) {
    return _.assignIn({ code: "column analysis code test" }, columnAnalysisData);
  } else if (_.startsWith(url, "/dtale/correlations-ts")) {
    return _.assignIn({ code: "correlations ts code test" }, correlationsTsData);
  } else if (_.startsWith(url, "/dtale/correlations/")) {
    return _.assignIn({ code: "correlations code test" }, correlationsData);
  } else if (_.startsWith(url, "/dtale/scatter")) {
    if (urlParams.rolling) {
      const dates = _.fill(Array(_.size(scatterData.data.all.x)), "2018-04-30");
      return _.assign({ code: "scatter code test" }, scatterData, {
        data: { all: _.assign({}, scatterData.data.all, { date: dates }) },
        date: " for 2018-12-16 thru 2018-12-19",
      });
    }
    return scatterData;
  } else if (_.startsWith(url, "/dtale/chart-data")) {
    if (urlParams.group) {
      if (_.size(JSON.parse(urlParams.y)) > 1) {
        return _.assignIn({}, groupedChartsData, {
          data: _.mapValues(groupedChartsData.data, d => _.assignIn(d, { col2: d.col1 })),
        });
      }
      return groupedChartsData;
    }
    if (_.size(JSON.parse(urlParams.y)) > 1) {
      return _.assignIn({}, chartsData, {
        data: _.mapValues(chartsData.data, d => _.assignIn(d, { col2: d.col1 })),
      });
    }
    return chartsData;
  } else if (
    _.find(
      _.concat(
        ["/dtale/update-visibility", "/dtale/update-settings", "/dtale/update-locked", "/dtale/update-column-position"],
        ["/dtale/delete-col", "/dtale/edit-cell", "/dtale/update-formats", "/dtale/update-xarray-selection"],
        ["/dtale/to-xarray", "/dtale/duplicates", "/dtale/web-upload", "/dtale/datasets", "/dtale/update-theme"],
        ["/dtale/update-query-engine", "/dtale/save-range-highlights"]
      ),
      prefix => _.startsWith(url, prefix)
    )
  ) {
    return { success: true };
  } else if (_.startsWith(url, "/dtale/test-filter")) {
    if (query === "error") {
      return { error: "No data found" };
    }
    return { success: true };
  } else if (_.startsWith(url, "/dtale/describe")) {
    if (_.has(DESCRIBE, urlParams.col)) {
      return _.assignIn({ success: true, code: "describe code test" }, DESCRIBE[urlParams.col]);
    }
    return { error: "Column not found!" };
  } else if (_.includes(url, "pypi.org")) {
    return { info: { version: pjson.version } };
  } else if (_.startsWith(url, "/dtale/processes")) {
    return { data: PROCESSES, success: true };
  } else if (_.startsWith(url, "/dtale/build-column")) {
    if (urlParams.name === "error") {
      return { error: "error test" };
    }
    return { success: true, url: "http://localhost:40000/dtale/main/1" };
  } else if (_.startsWith(url, "/dtale/build-replacement")) {
    if (urlParams.name === "error") {
      return { error: "error test" };
    }
    return { success: true };
  } else if (_.startsWith(url, "/dtale/reshape")) {
    if (urlParams.index === "error") {
      return { error: "error test" };
    }
    return { success: true };
  } else if (_.startsWith(url, "/dtale/filter-info")) {
    return getDataId(url) === "error" ? { error: "Error loading context variables" } : CONTEXT_VARIABLES;
  } else if (_.startsWith(url, "/dtale/code-export")) {
    return { code: "test code" };
  } else if (_.startsWith(url, "/dtale/cleanup-datasets")) {
    return { success: true };
  } else if (_.startsWith(url, "/dtale/column-filter-data")) {
    return { success: true, hasMissing: false, uniques: [1, 2, 3] };
  } else if (_.startsWith(url, "/dtale/save-column-filter")) {
    return {
      success: true,
      columnFilters: { foo: { query: "foo == 1", value: [1] } },
    };
  } else if (_.startsWith(url, "/dtale/outliers")) {
    return {
      success: true,
      outliers: [1, 2, 3],
      query: "((a < 1) or ( a > 4))",
      code: "test code",
      queryApplied: true,
      top: true,
    };
  } else if (_.startsWith(url, "/dtale/bins-tester")) {
    return {
      data: [1, 2, 3, 2, 1],
      labels: ["1", "2", "3", "4", "5"],
    };
  } else if (_.startsWith(url, "/dtale/load-filtered-ranges")) {
    return { ranges: {} };
  }
  return {};
}

export default {
  urlFetcher,
  createDtaleStore: () => createStore(dtaleApp.store),
  DATA,
  DTYPES,
};
