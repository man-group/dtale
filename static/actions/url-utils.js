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
  return _.pickBy(params, _.identity);
}

function buildURLString(base, params) {
  return `${base}${base.endsWith("?") ? "" : "?"}${qs.stringify(params)}`;
}

function buildURL(base, state, props) {
  const params = buildURLParams(state, props);
  return buildURLString(base, params);
}

export { buildURLParams, buildURLString, buildURL };
