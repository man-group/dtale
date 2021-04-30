import menuUtils from "../../menuUtils";
import $ from "jquery";
import _ from "lodash";

export function buildMenuHandler(prop, propagateState) {
  return menuUtils.openMenu(
    `${prop}Actions`,
    () => propagateState({ menuOpen: prop }),
    () => propagateState({ menuOpen: null }),
    `div.${prop}-menu-toggle`,
    e => {
      const target = $(e.target);
      return target.hasClass("ignore-click") || target.parent().hasClass("ignore-click");
    }
  );
}

export function predefinedFilterStr(filters, name, value) {
  if (value && _.find(filters, { name })?.inputType === "multiselect") {
    return `(${_.join(value, ", ")})`;
  }
  return value;
}
