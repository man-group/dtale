import _ from "lodash";
import { combineReducers } from "redux";

import { chartData } from "./chart";

function getHiddenValue(id) {
  const hiddenElem = document.getElementById(id);
  if (hiddenElem) {
    return hiddenElem.value;
  }
  return null;
}

function toBool(value) {
  return _.lowerCase(value) === "true";
}

function toJson(value) {
  return _.isNull(value) ? {} : JSON.parse(value);
}

function dataId(state = null, action = {}) {
  switch (action.type) {
    case "init-params":
      return getHiddenValue("data_id");
    default:
      return state;
  }
}

function iframe(state = false, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("iframe"));
    default:
      return state;
  }
}

function editedCell(state = null, action = {}) {
  switch (action.type) {
    case "edit-cell":
      return action.editedCell;
    case "toggle-column-menu":
    case "clear-edit":
      return null;
    default:
      return state;
  }
}

function hideShutdown(state = false, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("hide_shutdown"));
    default:
      return state;
  }
}

function allowCellEdits(state = true, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("allow_cell_edits"));
    default:
      return state;
  }
}

function columnMenuOpen(state = false, action = {}) {
  switch (action.type) {
    case "toggle-column-menu":
      return true;
    case "hide-column-menu":
      return false;
    default:
      return state;
  }
}

function selectedCol(state = null, action = {}) {
  switch (action.type) {
    case "toggle-column-menu":
      return action.colName;
    case "hide-column-menu":
      return null;
    default:
      return state;
  }
}

function selectedToggle(state = null, action = {}) {
  switch (action.type) {
    case "toggle-column-menu":
      return action.toggleId;
    case "hide-column-menu":
      return null;
    default:
      return state;
  }
}

function xarray(state = false, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("xarray"));
    case "convert-to-xarray":
      return true;
    default:
      return state;
  }
}

function xarrayDim(state = {}, action = {}) {
  switch (action.type) {
    case "init-params":
      return toJson(getHiddenValue("xarray_dim"));
    case "update-xarray-dim":
      return action.xarrayDim;
    case "convert-to-xarray":
      return {};
    default:
      return state;
  }
}

const dtaleStore = combineReducers({
  chartData,
  hideShutdown,
  allowCellEdits,
  dataId,
  editedCell,
  iframe,
  columnMenuOpen,
  selectedCol,
  selectedToggle,
  xarray,
  xarrayDim,
});

export default { store: dtaleStore, getHiddenValue };
