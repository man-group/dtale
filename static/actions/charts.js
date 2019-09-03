function openChart(chartData) {
  return function(dispatch) {
    dispatch({ type: "open-chart", chartData });
  };
}

function closeChart() {
  return function(dispatch) {
    dispatch({ type: "close-chart" });
  };
}

export { openChart, closeChart };
