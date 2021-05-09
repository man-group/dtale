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
        const versionNumbers = _.map(_.split(version, "."), _.parseInt);
        return versionNumbers;
      }
      return state;
    }
    default:
      return state;
  }
}

export function maxColumnWidth(state = null, action = {}) {
  switch (action.type) {
    case "init-params":
      return toFloat(getHiddenValue("max_column_width"));
    default:
      return state;
  }
}
