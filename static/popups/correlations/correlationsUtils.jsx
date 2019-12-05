import chroma from "chroma-js";
import $ from "jquery";
import _ from "lodash";

import chartUtils from "../../chartUtils";
import { formatScatterPoints, getMax, getMin } from "../scatterChartUtils";

function toggleBouncer() {
  $("#scatter-bouncer").toggle();
  $("#rawScatterChart").toggle();
}

const pointFormatter = (xProp, yProp) => point => ({
  x: point[xProp],
  y: point[yProp],
  index: point.index,
});
const colorScale = chroma.scale(["red", "yellow", "green"]).domain([-1, 0, 1]);
const percent = num => (num === "N/A" ? num : `${_.round(num * 100, 2)}%`);

function createScatter(ctx, chartData, xProp, yProp, label, onClick) {
  const formatter = pointFormatter(xProp, yProp);
  const scatterData = formatScatterPoints(chartData, formatter);
  // eslint-disable-next-line new-cap
  const chart = chartUtils.createChart(ctx, {
    type: "scatter",
    data: {
      datasets: [_.assign({ label, xLabels: [xProp], yLabels: [yProp] }, scatterData)],
    },
    options: {
      tooltips: {
        callbacks: {
          title: (tooltipItems, data) => [
            [`Index: ${data.datasets[tooltipItems[0].datasetIndex].data[tooltipItems[0].index].index}`],
          ],
          label: (tooltipItem, data) => {
            const chartData = data.datasets[tooltipItem.datasetIndex];
            const pointData = chartData.data[tooltipItem.index];
            return [
              `${chartData.xLabels[0]}: ${_.round(pointData.x, 4)}`,
              `${chartData.yLabels[0]}: ${_.round(pointData.y, 4)}`,
            ];
          },
        },
      },
      scales: {
        xAxes: [
          {
            ticks: {
              min: getMin(scatterData.data, "x"),
              max: getMax(scatterData.data, "x"),
            },
            scaleLabel: { display: true, labelString: xProp },
          },
        ],
        yAxes: [
          {
            ticks: {
              min: getMin(scatterData.data, "y"),
              max: getMax(scatterData.data, "y"),
            },
            scaleLabel: { display: true, labelString: yProp },
          },
        ],
      },
      legend: { display: false },
      pan: { enabled: true, mode: "x" },
      zoom: { enabled: true, mode: "x" },
      maintainAspectRatio: false,
      responsive: false,
      showLines: false,
      onClick,
    },
  });
  return chart;
}

export default {
  toggleBouncer,
  colorScale,
  createScatter,
  percent,
  pointFormatter,
};
