import qs from "querystring";

import _ from "lodash";

import dtaleApp from "../reducers/dtale";
import { createStore } from "../reducers/store";
import chartsData from "./data/charts";
import groupedChartsData from "./data/charts-grouped";
import correlationsData from "./data/correlations";
import correlationsTsData from "./data/correlations-ts";
import histogramData from "./data/histogram";
import scatterData from "./data/scatter";

const pjson = require("../../package.json");

const DATA = {
  results: [
    { dtale_index: 0, col1: 1, col2: 2.5, col3: "foo", col4: "2000-01-01" },
    { dtale_index: 1, col1: 2, col2: 3.5, col3: "foo", col4: "2000-01-01" },
    { dtale_index: 2, col1: 3, col2: 4.5, col3: "foo", col4: "2000-01-01" },
    { dtale_index: 3, col1: 4, col2: 5.5, col3: "foo" },
  ],
  columns: [
    { name: "dtale_index", dtype: "int64", visible: true },
    { name: "col1", dtype: "int64", visible: true },
    { name: "col2", dtype: "float64", min: 2.5, max: 5.5, visible: true },
    { name: "col3", dtype: "object", visible: true },
    { name: "col4", dtype: "datetime64[ns]", visible: true },
  ],
  total: 4,
  success: true,
};

const DTYPES = {
  dtypes: [
    { index: 0, name: "col1", dtype: "int64", visible: true },
    { index: 1, name: "col2", dtype: "float64", visible: true },
    { index: 2, name: "col3", dtype: "string", visible: true },
    { index: 3, name: "col4", dtype: "datetime[ns]", visible: true },
  ],
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
    uniques: { data: [1, 2, 3, 4], top: true },
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
    uniques: { data: ["foo"], top: false },
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

const PROCESSES = [
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
  context_variables: {
    foo: "bar",
    cat: "dog",
  },
  success: true,
};

function getDataId(url) {
  if (_.startsWith(url, "/dtale/context-variables")) {
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
  } else if (_.startsWith(url, "/dtale/histogram")) {
    return histogramData;
  } else if (_.startsWith(url, "/dtale/correlations-ts")) {
    return correlationsTsData;
  } else if (_.startsWith(url, "/dtale/correlations/")) {
    return correlationsData;
  } else if (_.startsWith(url, "/dtale/scatter")) {
    if (urlParams.rolling) {
      const dates = _.fill(Array(_.size(scatterData.data.all.x)), "2018-04-30");
      return _.assign({}, scatterData, {
        data: { all: _.assign({}, scatterData.data.all, { date: dates }) },
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
      ["/dtale/update-visibility", "/dtale/update-settings", "/dtale/update-locked", "/dtale/update-column-position"],
      prefix => _.startsWith(url, prefix)
    )
  ) {
    return { success: true };
  } else if (_.startsWith(url, "/dtale/test-filter")) {
    if (query === "error") {
      return { error: "No data found" };
    }
    return { success: true };
  } else if (_.startsWith(url, "/dtale/dtypes")) {
    return DTYPES;
  } else if (_.startsWith(url, "/dtale/describe")) {
    const column = _.last(url.split("/"));
    if (_.has(DESCRIBE, column)) {
      return _.assignIn({ success: true }, DESCRIBE[column]);
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
    return { success: true };
  } else if (_.startsWith(url, "/dtale/context-variables")) {
    return getDataId(url) === "error" ? { error: "Error loading context variables" } : CONTEXT_VARIABLES;
  }
  return {};
}

function createDtaleStore() {
  return createStore(dtaleApp.store);
}

export default {
  urlFetcher,
  createDtaleStore,
};
