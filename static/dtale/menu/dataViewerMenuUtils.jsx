import _ from "lodash";

import { cleanupEndpoint } from "../../actions/url-utils";
import menuUtils from "../../menuUtils";

function updateSort(selectedCols, dir, { sortInfo, propagateState }) {
  let updatedSortInfo = _.filter(sortInfo, ([col, _dir]) => !_.includes(selectedCols, col));
  switch (dir) {
    case "ASC":
    case "DESC":
      updatedSortInfo = _.concat(
        updatedSortInfo,
        _.map(selectedCols, col => [col, dir])
      );
      break;
    case "NONE":
    default:
      break;
  }
  propagateState({ sortInfo: updatedSortInfo, triggerResize: true });
}

function buildStyling(val, colType, styleProps) {
  const style = {};
  if (!_.isUndefined(val) && !_.isEmpty(styleProps)) {
    if (styleProps.redNegs) {
      switch (colType) {
        case "float":
        case "int":
          style.color = val < 0 ? "red" : "";
          break;
      }
    }
  }
  return style;
}

function fullPath(path, dataId = null) {
  const finalPath = dataId ? `${path}/${dataId}` : path;
  if (window.resourceBaseUrl && !_.startsWith(finalPath, window.resourceBaseUrl)) {
    return cleanupEndpoint(`${window.resourceBaseUrl}/${finalPath}`);
  }
  return finalPath;
}

function open(path, dataId, height = 450, width = 500) {
  window.open(fullPath(path, dataId), "_blank", `titlebar=1,location=1,status=1,width=${width},height=${height}`);
}

function shouldOpenPopup(height, width) {
  if (global.top === global.self) {
    // not within iframe
    return window.innerWidth < width + 100 || window.innerHeight < height + 100;
  }
  return true;
}

function buildHotkeyHandlers(props) {
  const { propagateState, openChart, dataId } = props;
  const openMenu = () => {
    propagateState({ menuOpen: true });
    menuUtils.buildClickHandler("gridActions", () => propagateState({ menuOpen: false }));
  };
  const openPopup = (type, height = 450, width = 500) => () => {
    if (shouldOpenPopup(height, width)) {
      open(`/dtale/popup/${type}`, dataId, height, width);
    } else {
      openChart(_.assignIn({ type, title: _.capitalize(type) }, props));
    }
  };
  const openTab = type => () => window.open(fullPath(`/dtale/popup/${type}`, dataId), "_blank");
  const openCodeExport = () => open("/dtale/popup/code-export", dataId, 450, 700);
  return {
    openTab,
    openPopup,
    MENU: openMenu,
    DESCRIBE: openTab("describe"),
    FILTER: openPopup("filter", 500, 1100),
    BUILD: openPopup("build", 450, 770),
    DUPLICATES: openPopup("duplicates", 400, 770),
    CHARTS: () => window.open(fullPath("/charts", dataId), "_blank"),
    CODE: openCodeExport,
  };
}

export default {
  updateSort,
  buildStyling,
  fullPath,
  open,
  shouldOpenPopup,
  buildHotkeyHandlers,
};
