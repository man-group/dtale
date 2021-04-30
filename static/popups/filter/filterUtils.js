import { fetchJson } from "../../fetcher";
import { buildURLString } from "../../actions/url-utils";
import _ from "lodash";

export function saveFilter(dataId, query, callback) {
  fetchJson(buildURLString(`/dtale/test-filter/${dataId}`, { query, save: true }), callback);
}

export function loadInfo(dataId, handler) {
  fetchJson(buildURLString(`/dtale/filter-info/${dataId}`), data => {
    handler(_.assignIn({ error: null, loading: false }, data));
  });
}
