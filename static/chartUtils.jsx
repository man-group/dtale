import Chart from "chart.js";
import "chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js";
import "chartjs-plugin-zoom";
import _ from "lodash";

// needed to add these parameters because Chart.Zoom.js causes Chart.js to look for them
const DEFAULT_OPTIONS = { pan: { enabled: false }, zoom: { enabled: false } };

function createChart(ctx, cfg) {
  const options = _.assign({}, DEFAULT_OPTIONS, cfg.options || {});
  const finalCfg = _.assign({}, cfg, { options });
  return new Chart(ctx, finalCfg);
}

// http://stackoverflow.com/a/10215724/509706
function fitToContainer(canvas) {
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function chartWrapper(ctxId, prevChart, builder) {
  const ctx = document.getElementById(ctxId);
  if (ctx) {
    if (prevChart) {
      prevChart.destroy();
    }
    fitToContainer(ctx);
    return builder(ctx);
  }
  return null;
}

const TS_COLORS = [
  "rgb(42, 145, 209)",
  "rgb(255, 99, 132)",
  "rgb(255, 159, 64)",
  "rgb(255, 205, 86)",
  "rgb(75, 192, 192)",
  "rgb(54, 162, 235)",
  "rgb(153, 102, 255)",
  "rgb(231,233,237)",
];

function buildRGBA(colorScale) {
  return val =>
    "rgba(" +
    colorScale(val)
      .rgba()
      .join(",") +
    ")";
}

const gradientLinePlugin = colorScale => ({
  afterLayout: chartInstance => {
    const rgbaBuilder = buildRGBA(colorScale);
    // The context, needed for the creation of the linear gradient.
    const ctx = chartInstance.chart.ctx;
    // The first (and, assuming, only) dataset.
    const dataset = chartInstance.data.datasets[0];
    // Calculate sort data for easy min/max access.
    const data = _.sortBy(dataset.data || [], "y");
    const minY = _.head(data).y,
      maxY = _.last(data).y;
    // Calculate Y pixels for min and max values.
    const yAxis = chartInstance.scales["y-axis-0"];
    const minValueYPixel = yAxis.getPixelForValue(minY);
    const maxValueYPixel = yAxis.getPixelForValue(maxY);
    // Create the gradient.
    const gradient = ctx.createLinearGradient(0, minValueYPixel, 0, maxValueYPixel);
    gradient.addColorStop(0, rgbaBuilder(minY)); //red
    if (minY < 0 && maxY > 0) {
      gradient.addColorStop(0.5, rgbaBuilder(0)); //yellow
    }
    gradient.addColorStop(1, rgbaBuilder(maxY)); //green
    dataset.borderColor = gradient;
    dataset.pointHoverBackgroundColor = gradient;
    dataset.pointBorderColor = gradient;
    dataset.pointBackgroundColor = gradient;
    dataset.pointHoverBackgroundColor = gradient;
    dataset.pointHoverBorderColor = gradient;
    // Uncomment this for some effects, especially together with commenting the `fill: false` option below.
    // dataset.backgroundColor = gradient;
  },
});

export default {
  createChart,
  chartWrapper,
  fitToContainer,
  TS_COLORS,
  gradientLinePlugin,
};
