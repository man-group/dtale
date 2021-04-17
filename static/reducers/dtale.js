import _ from "lodash";
import $ from "jquery";
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
  return value ? JSON.parse(value) : {};
}

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

function hideShutdown(state = false, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("hide_shutdown"));
    case "load-preview":
      return true;
    default:
      return state;
  }
}

function allowCellEdits(state = true, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("allow_cell_edits"));
    case "load-preview":
      return false;
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

function theme(state = "light", action = {}) {
  switch (action.type) {
    case "init-params":
      return getHiddenValue("theme");
    case "set-theme":
      $("body").removeClass(`${state}-mode`);
      $("body").addClass(`${action.theme}-mode`);
      return action.theme;
    default:
      return state;
  }
}

function language(state = "en", action = {}) {
  switch (action.type) {
    case "init-params":
      return getHiddenValue("language");
    case "set-language":
      return action.language;
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
    default:
      return state;
  }
}

function pythonVersion(state = null, action = {}) {
  switch (action.type) {
    case "init-params":
    case "load-preview": {
      const version = getHiddenValue("python_version");
      if (version) {
        const versionNumbers = _.map(_.split(version, "."), _.parseInt);
        return versionNumbers;
      }
      return state;
    }
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
    default:
      return state;
  }
}

function columnsToToggle(state = null, action = {}) {
  switch (action.type) {
    case "toggle-columns":
      return action.columns;
    case "clear-toggled-columns":
      return null;
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
  xarray,
  xarrayDim,
  theme,
  language,
  filteredRanges,
  settings,
  pythonVersion,
  isPreview,
  menuPinned,
  menuTooltip,
  ribbonMenuOpen,
  ribbonDropdown,
  sidePanel,
  columnsToToggle,
});

export default { store: dtaleStore, getHiddenValue, toJson };
