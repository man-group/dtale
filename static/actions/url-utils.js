import qs from "querystring";

import _ from "lodash";

const URL_KEYS = {
  filters: v => ({
    filters: _.isEmpty(v)
      ? null
      : JSON.stringify(
          _.mapValues(v, f => ({ value: f.filterTerm, type: _.get(f.column, "filterRenderer.displayName") }))
        ),
  }),
  ids: v => ({ ids: _.isEmpty(v) ? null : JSON.stringify(v) }),
  sortInfo: v => ({ sort: _.isEmpty(v) ? null : JSON.stringify(v) }),
  query: v => ({ query: v }),
  selectedCols: v => ({ cols: _.isEmpty(v) ? null : JSON.stringify(v) }),
  selectedCol: v => ({ col: v }),
  tsColumns: v => ({ ts_columns: _.isEmpty(v) ? null : JSON.stringify(v) }),
};

function buildURLParams(state, props = null, required = null) {
  const accumulator = (acc, v, k) => _.assign(_.get(URL_KEYS, k, v => ({ [k]: v }))(v), acc);
  const params = _.reduce(_.isEmpty(props) ? state : _.pick(state, props), accumulator, {});
  if (required) {
    if (_.some(required, r => _.isNil(params[r]))) {
      return {};
    }
  }
  return _.pickBy(params, v => !_.isNil(v));
}

function buildURLString(base, params) {
  return `${base}${base.endsWith("?") ? "" : "?"}${qs.stringify(params)}`;
}

function buildURL(base, state, props) {
  const params = buildURLParams(state, props);
  return buildURLString(base, params);
}

function dtypesUrl(dataId) {
  return `/dtale/dtypes/${dataId}`;
}

function saveColFilterUrl(dataId, col, cfg) {
  return buildURLString(`/dtale/save-column-filter/${dataId}`, { col, cfg: JSON.stringify(cfg) });
}

function toggleOutlierFilterUrl(dataId) {
  return `/dtale/toggle-outlier-filter/${dataId}`;
}

function describeUrl(dataId, col, filtered) {
  return buildURLString(`/dtale/describe/${dataId}`, { col, filtered });
}

function outliersUrl(dataId, col, filtered) {
  return buildURLString(`/dtale/outliers/${dataId}`, { col, filtered });
}

function columnFilterDataUrl(dataId, async = false) {
  return `/dtale/${async ? "async-" : ""}column-filter-data/${dataId}`;
}

function varianceUrl(dataId, col, filtered) {
  return buildURLString(`/dtale/variance/${dataId}`, { col, filtered });
}

function sequentialDiffsUrl(dataId) {
  return `/dtale/sorted-sequential-diffs/${dataId}`;
}

function cleanupEndpoint(endpoint) {
  while (_.includes(endpoint, "//")) {
    endpoint = _.replace(endpoint, "//", "/");
  }
  return endpoint;
}

function corrAnalysisUrl(dataId) {
  return `/dtale/corr-analysis/${dataId}`;
}

function gageUrl(dataId, operator, measurements, filterable) {
  return buildURLString(`/dtale/gage-rnr/${dataId}`, { operator, measurements, filterable });
}

export {
  buildURLParams,
  buildURLString,
  buildURL,
  dtypesUrl,
  saveColFilterUrl,
  toggleOutlierFilterUrl,
  describeUrl,
  outliersUrl,
  columnFilterDataUrl,
  varianceUrl,
  sequentialDiffsUrl,
  cleanupEndpoint,
  corrAnalysisUrl,
  gageUrl,
};
