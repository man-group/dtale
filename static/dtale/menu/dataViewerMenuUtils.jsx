import _ from "lodash";

import { cleanupEndpoint } from "../../actions/url-utils";

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

export default { updateSort, buildStyling, fullPath, open, shouldOpenPopup };
