import _ from "lodash";
import querystring from "querystring";

import serverStateManagement from "../dtale/serverStateManagement";

export function init() {
  return dispatch => dispatch({ type: "init-params" });
}

export function openCustomFilter() {
  return dispatch => dispatch({ type: "show-side-panel", view: "filter" });
}

export function openPredefinedFilters() {
  return dispatch => dispatch({ type: "show-side-panel", view: "predefined_filters" });
}

export function toggleColumnMenu(colName) {
  return dispatch => dispatch({ type: "toggle-column-menu", colName });
}

export function hideColumnMenu(colName) {
  return (dispatch, getState) => {
    const { selectedCol } = getState();
    // when clicking another header cell it calls this after the fact and thus causes the user to click again to show it
    if (selectedCol == colName) {
      dispatch({ type: "hide-column-menu", colName });
    }
  };
}

export function closeColumnMenu() {
  return (dispatch, getState) => dispatch({ type: "hide-column-menu", colName: getState().selectedCol });
}

export function updateXArrayDim(xarrayDim, callback) {
  return dispatch => {
    dispatch({ type: "update-xarray-dim", xarrayDim });
    callback();
  };
}

export function convertToXArray(callback) {
  return dispatch => {
    dispatch({ type: "convert-to-xarray" });
    callback();
  };
}

export function setTheme(theme) {
  return dispatch => dispatch({ type: "set-theme", theme });
}

export function setLanguage(language) {
  return dispatch => dispatch({ type: "set-language", language });
}

export function setQueryEngine(engine) {
  return dispatch => dispatch({ type: "set-query-engine", engine });
}

export function isPopup() {
  return _.startsWith(window.location.pathname, "/dtale/popup");
}

export function isJSON(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export function getParams() {
  const params = {};
  const queryParams = querystring.parse(window.location.search.replace(/^.*\?/, ""));
  _.forEach(queryParams, (value, key) => {
    if (value) {
      if (_.includes(value, ",") && !isJSON(value)) {
        value = value.split(",");
      }
      params[key] = value;
    }
  });
  return params;
}

export function updateFilteredRanges(query) {
  return (dispatch, getState) => {
    const state = getState();
    const currQuery = _.get(state, "filteredRanges.query", "");
    if (currQuery !== query) {
      const callback = ranges => dispatch({ type: "update-filtered-ranges", ranges });
      serverStateManagement.loadFilteredRanges(state.dataId, callback);
    }
  };
}

export function updateMaxWidth(width) {
  return dispatch => {
    dispatch({ type: "update-max-width", width });
    dispatch({ type: "data-viewer-update", update: { type: "update-max-width", width } });
  };
}

export function clearMaxWidth() {
  return dispatch => {
    dispatch({ type: "clear-max-width" });
    dispatch({ type: "data-viewer-update", update: { type: "update-max-width", width: null } });
  };
}

export function updateMaxHeight(height) {
  return dispatch => {
    dispatch({ type: "update-max-height", height });
    dispatch({ type: "data-viewer-update", update: { type: "update-max-height", height } });
  };
}

export function clearMaxHeight() {
  return dispatch => {
    dispatch({ type: "clear-max-height" });
    dispatch({ type: "data-viewer-update", update: { type: "update-max-height", height: null } });
  };
}

export function updateShowAllHeatmapColumns(showAllHeatmapColumns) {
  return dispatch => dispatch({ type: "update-show-all-heatmap-columns", showAllHeatmapColumns });
}
