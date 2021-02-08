import _ from "lodash";

function chartData(state = { visible: false }, action = {}) {
  switch (action.type) {
    case "open-chart":
      return _.assign({ visible: true }, action.chartData);
    case "loaded-report-data":
    case "update-xarray-dim":
    case "convert-to-xarray":
    case "close-chart":
    case "loading-datasets":
      return _.assign({ visible: false }, action.chartData);
  }
  return state;
}

export { chartData };
