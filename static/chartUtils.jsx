import Chart from "chart.js";
import "chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js";
import "chartjs-plugin-zoom";
import chroma from "chroma-js";
import _ from "lodash";
import moment from "moment";

import { isDateCol } from "./dtale/gridUtils";

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

const COLOR_PROPS = [
  "borderColor",
  "backgroundColor",
  "pointHoverBackgroundColor",
  "pointBorderColor",
  "pointBackgroundColor",
  "pointHoverBackgroundColor",
  "pointHoverBorderColor",
];

function buildRGBA(colorScale) {
  return val =>
    "rgba(" +
    colorScale(val)
      .rgba()
      .join(",") +
    ")";
}

const gradientLinePlugin = (colorScale, minY = null, maxY = null) => ({
  afterLayout: chartInstance => {
    const rgbaBuilder = buildRGBA(colorScale);
    // The context, needed for the creation of the linear gradient.
    const ctx = chartInstance.chart.ctx;
    // The first (and, assuming, only) dataset.
    const dataset = chartInstance.data.datasets[0];
    // Calculate sort data for easy min/max access.
    let finalMinY = minY;
    let finalMaxY = maxY;
    if (_.isNull(minY) || _.isNull(maxY)) {
      const data = _.sortBy(dataset.data || [], "y");
      finalMinY = _.isNull(finalMinY) ? _.head(data).y : finalMinY;
      finalMaxY = _.isNull(finalMaxY) ? _.last(data).y : finalMaxY;
    }
    // Calculate Y pixels for min and max values.
    const yAxis = chartInstance.scales["y-axis-0"];
    const minValueYPixel = yAxis.getPixelForValue(minY);
    const maxValueYPixel = yAxis.getPixelForValue(maxY);
    // Create the gradient.
    const gradient = ctx.createLinearGradient(0, minValueYPixel, 0, maxValueYPixel);
    gradient.addColorStop(0, rgbaBuilder(minY)); //red
    if (finalMinY < 0 && finalMaxY > 0) {
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

const COLOR_SCALE = chroma.scale(["orange", "yellow", "green", "lightblue", "darkblue"]);

function updateCfgForDates(cfg, { columns, x }) {
  if (isDateCol(_.find(columns, { name: x }).dtype)) {
    const units = _.size(cfg.data.labels) > 150 ? "month" : "day";
    cfg.options.scales.xAxes = [
      {
        type: "time",
        distribution: "series",
        time: {
          unit: units,
          displayFormats: {
            [units]: "YYYYMMDD",
          },
        },
        ticks: {
          min: _.get(cfg.data.labels, "0"),
          max: _.get(cfg.data.labels, cfg.data.labels.length - 1),
        },
      },
    ];
    cfg.options.tooltips.callbacks.title = (tooltipItems, _data) =>
      moment(new Date(tooltipItems[0].xLabel)).format("YYYY-MM-DD");
  }
}

function updateLegend(cfg) {
  if (_.size(cfg.data.datasets) < 2) {
    cfg.options.legend = { display: false };
  }
}

function buildSeries(label, { y }, _idx) {
  const ptCfg = {
    fill: false,
    lineTension: 0.1,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHitRadius: 5,
    data: y,
  };
  if (label !== "all") {
    ptCfg.label = label;
  }
  return ptCfg;
}

function createBaseCfg({ data }, { x, y, additionalOptions }, seriesFormatter = buildSeries) {
  const cfg = {
    data: {
      labels: _.get(_.values(data), "0.x"),
      datasets: _.map(_.toPairs(data), ([k, v], i) => seriesFormatter(k, v, i)),
    },
    options: _.assignIn(
      {
        responsive: true,
        pan: { enabled: true, mode: "x" },
        zoom: { enabled: true, mode: "x", speed: 0.5 },
        tooltips: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (tooltipItem, chartData) => {
              const value = _.round(tooltipItem.yLabel, 4);
              if (_.size(data) > 1) {
                const label = chartData.datasets[tooltipItem.datasetIndex].label || "";
                if (label) {
                  return `${label}: ${value}`;
                }
              }
              return value + "";
            },
          },
        },
        hover: {
          mode: "nearest",
          intersect: true,
        },
        scales: {
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: x,
              },
            },
          ],
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: y,
              },
            },
          ],
        },
      },
      additionalOptions
    ),
  };
  updateLegend(cfg);
  return cfg;
}

function createLineCfg({ data }, { columns, x, y, additionalOptions, configHandler }) {
  const seriesCt = _.size(data);
  const colors = COLOR_SCALE.domain([0, seriesCt]);
  const seriesFormatter = (k, v, i) => {
    const ptCfg = buildSeries(k, v, i);
    _.forEach(COLOR_PROPS, cp => (ptCfg[cp] = seriesCt == 1 ? "rgb(42, 145, 209)" : colors(i).hex()));
    return ptCfg;
  };
  const cfg = createBaseCfg({ data }, { columns, x, y, additionalOptions }, seriesFormatter);
  cfg.type = "line";
  updateCfgForDates(cfg, { columns, x });
  return configHandler(cfg);
}

function createBarCfg({ data }, { columns, x, y, additionalOptions, configHandler }) {
  const cfg = createLineCfg({ data }, { columns, x, y, additionalOptions, configHandler });
  cfg.type = "bar";
  return cfg;
}

function createStackedCfg({ data }, { columns, x, y, additionalOptions, configHandler }) {
  const cfg = createLineCfg({ data }, { columns, x, y, additionalOptions, configHandler });
  cfg.type = "bar";
  cfg.options.scales.xAxes[0].stacked = true;
  cfg.options.scales.yAxes[0].stacked = true;
  return cfg;
}

function createPieCfg({ data }, { columns, x, y, additionalOptions, configHandler }) {
  const seriesCt = _.get(_.values(data), "0.x.length");
  const colors = COLOR_SCALE.domain([0, seriesCt]);
  const seriesFormatter = (k, v, i) => {
    const ptCfg = buildSeries(k, v, i);
    ptCfg.backgroundColor = _.map(v.y, (_p, i) => (seriesCt == 1 ? "rgb(42, 145, 209)" : colors(i).hex()));
    return ptCfg;
  };
  const cfg = createBaseCfg({ data }, { columns, x, y, additionalOptions, configHandler }, seriesFormatter);
  cfg.type = "pie";
  delete cfg.options.scales;
  delete cfg.options.tooltips;
  if (isDateCol(_.find(columns, { name: x }).dtype)) {
    cfg.data.labels = _.map(cfg.data.labels, l => moment(new Date(l)).format("YYYY-MM-DD"));
  }
  return configHandler(cfg);
}

export default {
  createChart,
  chartWrapper,
  fitToContainer,
  TS_COLORS,
  gradientLinePlugin,
  createLineCfg,
  createBarCfg,
  createStackedCfg,
  createPieCfg,
};
