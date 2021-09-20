import { getHiddenValue, toBool, toFloat } from "./utils";
import $ from "jquery";
import _ from "lodash";

export function hideShutdown(state = false, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("hide_shutdown"));
    case "load-preview":
      return true;
    default:
      return state;
  }
}

export function openCustomFilterOnStartup(state = false, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("open_custom_filter_on_startup"));
    case "load-preview":
      return false;
    default:
      return state;
  }
}

export function openPredefinedFiltersOnStartup(state = false, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("open_predefined_filters_on_startup")) && getHiddenValue("predefined_filters");
    case "load-preview":
      return false;
    default:
      return state;
  }
}

export function hideDropRows(state = false, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("hide_drop_rows"));
    default:
      return state;
  }
}

export function allowCellEdits(state = true, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("allow_cell_edits"));
    case "load-preview":
      return false;
    default:
      return state;
  }
}

export function theme(state = "light", action = {}) {
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

export function language(state = "en", action = {}) {
  switch (action.type) {
    case "init-params":
      return getHiddenValue("language");
    case "set-language":
      return action.language;
    default:
      return state;
  }
}

export function pythonVersion(state = null, action = {}) {
  switch (action.type) {
    case "init-params":
    case "load-preview": {
      const version = getHiddenValue("python_version");
      if (version) {
        const versionNumbers = _.map(version.split("."), _.parseInt);
        return versionNumbers;
      }
      return state;
    }
    default:
      return state;
  }
}

export function isVSCode(state = false, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("is_vscode")) && global.top !== global.self;
    case "load-preview":
      return false;
    default:
      return state;
  }
}

export function maxColumnWidth(state = null, action = {}) {
  switch (action.type) {
    case "init-params":
      return toFloat(getHiddenValue("max_column_width"), true);
    case "update-max-width":
      return action.width;
    case "clear-max-width":
      return null;
    default:
      return state;
  }
}

export function maxRowHeight(state = null, action = {}) {
  switch (action.type) {
    case "init-params":
      return toFloat(getHiddenValue("max_row_height"), true);
    case "update-max-height":
      return action.height;
    case "clear-max-height":
      return null;
    default:
      return state;
  }
}

export function mainTitle(state = null, action = {}) {
  switch (action.type) {
    case "init-params":
      return getHiddenValue("main_title");
    default:
      return state;
  }
}

export function mainTitleFont(state = null, action = {}) {
  switch (action.type) {
    case "init-params":
      return getHiddenValue("main_title_font");
    default:
      return state;
  }
}

export function queryEngine(state = "python", action = {}) {
  switch (action.type) {
    case "init-params":
      return getHiddenValue("query_engine");
    case "set-query-engine":
      return action.engine;
    default:
      return state;
  }
}

export function showAllHeatmapColumns(state = false, action = {}) {
  switch (action.type) {
    case "update-show-all-heatmap-columns":
      return action.showAllHeatmapColumns;
    default:
      return state;
  }
}
