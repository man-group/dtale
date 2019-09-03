import _ from "lodash";

function chartData(state = { visible: false }, action = {}) {
  switch (action.type) {
    case "open-chart":
      return _.assign({ visible: true }, action.chartData);
    case "loaded-report-data":
    case "close-chart":
      return { visible: false };
  }
  return state;
}

export { chartData };
