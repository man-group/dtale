import _ from "lodash";
import querystring from "querystring";

import serverStateManagement from "../dtale/serverStateManagement";

function init() {
  return dispatch => dispatch({ type: "init-params" });
}

function toggleColumnMenu(colName) {
  return dispatch => dispatch({ type: "toggle-column-menu", colName });
}

function hideColumnMenu(colName) {
  return (dispatch, getState) => {
    const { selectedCol } = getState();
    // when clicking another header cell it calls this after the fact and thus causes the user to click again to show it
    if (selectedCol == colName) {
      dispatch({ type: "hide-column-menu", colName });
    }
  };
}

function closeColumnMenu() {
  return (dispatch, getState) => dispatch({ type: "hide-column-menu", colName: getState().selectedCol });
}

function updateXArrayDim(xarrayDim, callback) {
  return dispatch => {
    dispatch({ type: "update-xarray-dim", xarrayDim });
    callback();
  };
}

function convertToXArray(callback) {
  return dispatch => {
    dispatch({ type: "convert-to-xarray" });
    callback();
  };
}

function setTheme(theme) {
  return dispatch => dispatch({ type: "set-theme", theme });
}

function setLanguage(language) {
  return dispatch => dispatch({ type: "set-language", language });
}

function isPopup() {
  return _.startsWith(window.location.pathname, "/dtale/popup");
}

function isJSON(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function getParams() {
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

function updateFilteredRanges(query) {
  return (dispatch, getState) => {
    const state = getState();
    const currQuery = _.get(state, "filteredRanges.query", "");
    if (currQuery !== query) {
      const callback = ranges => dispatch({ type: "update-filtered-ranges", ranges });
      serverStateManagement.loadFilteredRanges(state.dataId, callback);
    }
  };
}

function updateMaxWidth(width) {
  return dispatch => {
    dispatch({ type: "update-max-width", width });
    dispatch({ type: "data-viewer-update", update: { type: "update-max-width", width } });
  };
}

function clearMaxWidth() {
  return dispatch => {
    dispatch({ type: "clear-max-width" });
    dispatch({ type: "data-viewer-update", update: { type: "update-max-width", width: null } });
  };
}

export default {
  init,
  toggleColumnMenu,
  hideColumnMenu,
  closeColumnMenu,
  updateXArrayDim,
  convertToXArray,
  isPopup,
  getParams,
  setTheme,
  setLanguage,
  updateFilteredRanges,
  updateMaxWidth,
  clearMaxWidth,
};
