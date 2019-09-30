import qs from "querystring";

import _ from "lodash";

import dtaleApp from "../reducers/dtale";
import { createStore } from "../reducers/store";
import correlationsData from "./data/correlations";
import correlationsTsData from "./data/correlations-ts";
import coverageData from "./data/coverage";
import histogramData from "./data/histogram";
import scatterData from "./data/scatter";

const DATA = {
  results: [
    { dtale_index: 0, col1: 1, col2: 2.5, col3: "foo", col4: "2000-01-01" },
    { dtale_index: 1, col1: 2, col2: 3.5, col3: "foo", col4: "2000-01-01" },
    { dtale_index: 2, col1: 3, col2: 4.5, col3: "foo", col4: "2000-01-01" },
    { dtale_index: 3, col1: 4, col2: 5.5, col3: "foo" },
  ],
  columns: [
    { name: "dtale_index", dtype: "int64" },
    { name: "col1", dtype: "int64" },
    { name: "col2", dtype: "float64" },
    { name: "col3", dtype: "object" },
    { name: "col4", dtype: "datetime64[ns]" },
  ],
  total: 4,
  success: true,
};

const DTYPES = {
  dtypes: [
    { index: 0, name: "col1", dtype: "int64" },
    { index: 1, name: "col2", dtype: "float64" },
    { index: 2, name: "col3", dtype: "string" },
    { index: 3, name: "col4", dtype: "datetime[ns]" },
  ],
  success: true,
};

const DESCRIBE = {
  col1: { describe: { count: 4, max: 4, mean: 2.5, min: 1, std: 0, unique: 4, "25%": 1, "50%": 2.5, "75%": 4 } },
  col2: { describe: { count: 4, max: 4, mean: 4, min: 2.5, std: 0, unique: 4, "25%": 2.5, "50%": 4, "75%": 5.5 } },
  col3: { describe: { count: 4, freq: 4, top: "foo", unique: 1 }, uniques: ["foo"] },
  col4: { describe: { count: 3, first: "2000-01-01", freq: 1, last: "2000-01-01", top: "2000-01-01", unique: 1 } },
};

function urlFetcher(url) {
  const urlParams = qs.parse(url.split("?")[1]);
  const query = urlParams.query;
  if (url.startsWith("/dtale/data")) {
    if (query === "error") {
      return { error: "No data found" };
    }
    return DATA;
  } else if (url.startsWith("/dtale/histogram")) {
    return histogramData;
  } else if (url.startsWith("/dtale/correlations-ts?")) {
    return correlationsTsData;
  } else if (url.startsWith("/dtale/correlations?")) {
    return correlationsData;
  } else if (url.startsWith("/dtale/scatter")) {
    return scatterData;
  } else if (url.startsWith("/dtale/coverage")) {
    return coverageData;
  } else if (url.startsWith("/dtale/update-settings")) {
    return { success: true };
  } else if (url.startsWith("/dtale/test-filter")) {
    if (query === "error") {
      return { error: "No data found" };
    }
    return { success: true };
  } else if (url.startsWith("/dtale/dtypes")) {
    return DTYPES;
  } else if (url.startsWith("/dtale/describe")) {
    const column = _.last(url.split("/"));
    if (_.has(DESCRIBE, column)) {
      return _.assignIn({ success: true }, DESCRIBE[column]);
    }
    return { error: "Column not found!" };
  } else if (_.includes(url, "pypi.org")) {
    return { info: { version: "1.0.0" } };
  }
  return {};
}

function createDtaleStore() {
  return createStore(dtaleApp);
}

export default {
  urlFetcher,
  createDtaleStore,
};
