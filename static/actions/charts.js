function openChart(chartData) {
  return function (dispatch) {
    dispatch({ type: "open-chart", chartData });
  };
}

function closeChart(chartData) {
  return function (dispatch) {
    dispatch({ type: "close-chart", chartData });
  };
}

export { openChart, closeChart };
