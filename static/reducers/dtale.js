import { combineReducers } from "redux";

import { chartData } from "./chart";
import { auth, username } from "./auth";
import * as settingsReducers from "./settings";
import { getHiddenValue, toBool, toJson } from "./utils";

function dataId(state = null, action = {}) {
  switch (action.type) {
    case "init-params":
      return getHiddenValue("data_id");
    case "load-preview":
      return action.dataId;
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

function editedTextAreaHeight(state = 0, action = {}) {
  switch (action.type) {
    case "edited-cell-textarea-height":
      return action.height;
    case "toggle-column-menu":
    case "clear-edit":
      return 0;
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

function filteredRanges(state = {}, action = {}) {
  switch (action.type) {
    case "init-params":
      return toJson(getHiddenValue("filtered_ranges"));
    case "update-filtered-ranges":
      return action.ranges;
    default:
      return state;
  }
}

function settings(state = {}, action = {}) {
  switch (action.type) {
    case "init-params":
      return toJson(getHiddenValue("settings"));
    case "update-settings":
      return { ...state, ...action.settings };
    default:
      return state;
  }
}

function isPreview(state = false, action = {}) {
  switch (action.type) {
    case "load-preview":
      return true;
    default:
      return state;
  }
}

function menuPinned(state = false, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("pin_menu"));
    case "toggle-menu-pinned":
      return !state;
    default:
      return state;
  }
}

function menuTooltip(state = { visible: false }, action = {}) {
  switch (action.type) {
    case "show-menu-tooltip":
      return { visible: true, element: action.element, content: action.content };
    case "hide-menu-tooltip":
    case "hide-ribbon-menu":
    case "clear-edit":
      return { visible: false };
    default:
      return state;
  }
}

function ribbonMenuOpen(state = false, action = {}) {
  switch (action.type) {
    case "show-ribbon-menu":
      return true;
    case "hide-ribbon-menu":
      return false;
    default:
      return state;
  }
}

function ribbonDropdown(state = { visible: false }, action = {}) {
  switch (action.type) {
    case "open-ribbon-dropdown":
      return { visible: true, element: action.element, name: action.name };
    case "hide-ribbon-menu":
      return { visible: false };
    default:
      return state;
  }
}

function sidePanel(state = { visible: false }, action = {}) {
  switch (action.type) {
    case "show-side-panel":
      return { visible: true, view: action.view, column: action.column };
    case "hide-side-panel":
      return { visible: false };
    case "update-side-panel-width":
      return { ...state, offset: action.offset };
    default:
      return state;
  }
}

function dataViewerUpdate(state = null, action = {}) {
  switch (action.type) {
    case "data-viewer-update":
      return action.update;
    case "clear-data-viewer-update":
      return null;
    default:
      return state;
  }
}

export function predefinedFilters(state = [], action = {}) {
  switch (action.type) {
    case "init-params":
      return toJson(getHiddenValue("predefined_filters"));
    default:
      return state;
  }
}

function dragResize(state = null, action = {}) {
  switch (action.type) {
    case "drag-resize":
      return action.x;
    case "stop-resize":
      return null;
    default:
      return state;
  }
}

const dtaleStore = combineReducers({
  chartData,
  dataId,
  editedCell,
  editedTextAreaHeight,
  iframe,
  auth,
  username,
  columnMenuOpen,
  selectedCol,
  xarray,
  xarrayDim,
  filteredRanges,
  settings,
  isPreview,
  menuPinned,
  menuTooltip,
  ribbonMenuOpen,
  ribbonDropdown,
  sidePanel,
  dataViewerUpdate,
  predefinedFilters,
  dragResize,
  ...settingsReducers,
});

export default { store: dtaleStore };
