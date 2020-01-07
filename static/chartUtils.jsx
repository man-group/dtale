/* eslint max-lines: "off" */
import Chart from "chart.js";
import "chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js";
import "chartjs-plugin-zoom";
import chroma from "chroma-js";
import _ from "lodash";
import moment from "moment";

import { isDateCol } from "./dtale/gridUtils";
import { formatScatterPoints, getScatterMax, getScatterMin } from "./scatterChartUtils";

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

const gradientLinePlugin = (colorScale, yAxisID, minY = null, maxY = null) => ({
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
    const yAxis = chartInstance.scales[yAxisID || "y-axis-0"];
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

function timestampLabel(ts) {
  const startOfDay = moment(new Date(ts))
    .startOf("day")
    .valueOf();
  if (startOfDay == ts) {
    return moment(new Date(ts)).format("YYYY-MM-DD");
  }
  return moment(new Date(ts)).format("YYYY-MM-DD h:mm:ss a");
}

function getTimeCfg(data, minTS, maxTS) {
  const diffInDays = (maxTS - minTS) / (1000 * 3600 * 24);
  let units = "year";
  let stepSize = 1;
  let unitsFmt = "YYYYMMDD";
  if (diffInDays < 10 && diffInDays < _.size(data) - 2) {
    units = "hour";
    stepSize = 4;
    unitsFmt += " hA";
  } else if (diffInDays < 50) {
    units = "day";
  } else if (diffInDays < 365 / 2) {
    units = "week";
  } else if (diffInDays < 365 * 4) {
    units = "month";
  } else if (diffInDays < 365 * 10) {
    units = "quarter";
  }
  return { units, stepSize, unitsFmt };
}

function updateCfgForDates(cfg, { columns, x, y }, { min, max }) {
  if (isDateCol(_.get(_.find(columns || {}, { name: x }), "dtype", ""))) {
    const minTS = min[x];
    const maxTS = max[x];
    const { units, stepSize, unitsFmt } = getTimeCfg(cfg.data.labels || _.map(cfg.data.datasets[0], "x"), minTS, maxTS);
    cfg.options.scales.xAxes = [
      {
        type: "time",
        distribution: "series",
        time: {
          unit: units,
          stepSize,
          displayFormats: {
            [units]: unitsFmt,
          },
        },
        ticks: {
          min: minTS,
          max: maxTS,
        },
      },
    ];
    cfg.options.tooltips.callbacks.title = (tooltipItems, data) =>
      timestampLabel(_.get(data, ["labels", tooltipItems[0].index]));
  }
  _.forEach(y, (yProp, idx) => {
    if (isDateCol(_.get(_.find(columns || [], { name: yProp }), "dtype", ""))) {
      let series = _.get(cfg, ["data", "datasets", idx, "data"], []);
      if (_.isObject(_.head(series))) {
        series = _.map(series, "y");
      }
      const minTS = min[yProp];
      const maxTS = max[yProp];
      const { units, stepSize, unitsFmt } = getTimeCfg(series, minTS, maxTS);
      cfg.options.scales.yAxes[idx] = _.assignIn(cfg.options.scales.yAxes[idx], {
        type: "time",
        distribution: "series",
        time: {
          unit: units,
          stepSize,
          displayFormats: {
            [units]: unitsFmt,
          },
        },
        ticks: {
          min: minTS,
          max: maxTS,
        },
      });
      /*cfg.options.tooltips.callbacks.label = (tooltipItem, data) => {
        const value = timestampLabel(tooltipItem.yLabel);
        if (_.size(data.datasets) * _.size(y) > 1) {
          const label = data.datasets[tooltipItem.datasetIndex].label || "";
          if (label) {
            return `${label}: ${value}`;
          }
        }
        return value;
      }*/
    }
  });
}

function updateLegend(cfg) {
  if (_.size(cfg.data.datasets) < 2) {
    cfg.options.legend = { display: false };
  }
}

function buildSeries(label, data, _idx, yProp) {
  const ptCfg = {
    fill: false,
    lineTension: 0.1,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHitRadius: 5,
    data: data[yProp],
    yAxisID: `y-${yProp}`,
  };
  const labels = [];
  if (label !== "all") {
    labels.push(label);
  }
  if (yProp !== "y") {
    labels.push(yProp);
  }
  if (_.size(labels) > 0) {
    ptCfg.label = _.join(labels, " - ");
  }
  return ptCfg;
}

// eslint-disable-next-line no-unused-vars
function buildTicks(prop, { min, max }, pad = false) {
  const range = { min: min[prop], max: max[prop] };
  if (pad) {
    const padFactor = (range.max - range.min) * 0.01;
    return { min: range.min - padFactor, max: range.max + padFactor };
  }
  return range;
}

function createBaseCfg({ data, min, max }, { x, y, additionalOptions }, seriesFormatter = buildSeries) {
  let seriesIdx = 0;
  const cfg = {
    data: {
      labels: _.get(_.values(data), "0.x"),
      datasets: _.flatMap(_.toPairs(data), ([k, v]) => _.map(y, yProp => seriesFormatter(k, v, seriesIdx++, yProp))),
    },
    options: _.assignIn(
      {
        responsive: true,
        maintainAspectRatio: false,
        pan: { enabled: true, mode: "x" },
        zoom: { enabled: true, mode: "x", speed: 0.5 },
        tooltips: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (tooltipItem, chartData) => {
              const value = _.round(tooltipItem.yLabel, 4);
              if (_.size(data) * _.size(y) > 1) {
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
          yAxes: _.map(y, (yProp, idx) => ({
            scaleLabel: {
              display: true,
              labelString: yProp,
            },
            ticks: buildTicks(yProp, { min, max }),
            id: `y-${yProp}`,
            position: idx % 2 == 0 ? "left" : "right",
          })),
        },
      },
      additionalOptions
    ),
  };
  updateLegend(cfg);
  return cfg;
}

function createLineCfg({ data, min, max }, { columns, x, y, additionalOptions, configHandler }) {
  const seriesCt = _.size(data) * _.size(y);
  const colors = COLOR_SCALE.domain([0, seriesCt]);
  const seriesFormatter = (k, v, i, yProp) => {
    const ptCfg = buildSeries(k, v, i, yProp);
    _.forEach(COLOR_PROPS, cp => (ptCfg[cp] = seriesCt == 1 ? "rgb(42, 145, 209)" : colors(i).hex()));
    return ptCfg;
  };
  const cfg = createBaseCfg({ data, min, max }, { columns, x, y, additionalOptions }, seriesFormatter);
  cfg.type = "line";
  updateCfgForDates(cfg, { columns, x, y }, { min, max });
  return configHandler(cfg);
}

function createBarCfg({ data, min, max }, { columns, x, y, additionalOptions, configHandler }) {
  const cfg = createLineCfg({ data, min, max }, { columns, x, y, additionalOptions, configHandler });
  cfg.type = "bar";
  return cfg;
}

function createStackedCfg({ data, min, max }, { columns, x, y, additionalOptions, configHandler }) {
  const cfg = createLineCfg({ data, min, max }, { columns, x, y, additionalOptions, configHandler });
  cfg.type = "bar";
  cfg.options.scales.xAxes[0].stacked = true;
  _.forEach(cfg.options.scales.yAxes, axisCfg => (axisCfg.stacked = true));
  return cfg;
}

function createPieCfg({ data, min, max }, { columns, x, y, additionalOptions, configHandler }) {
  const seriesCt = _.get(_.values(data), "0.x.length");
  const colors = COLOR_SCALE.domain([0, seriesCt]);
  const seriesFormatter = (k, v, i, yProp) => {
    const ptCfg = buildSeries(k, v, i, yProp);
    ptCfg.backgroundColor = _.map(v.y, (_p, i) => (seriesCt == 1 ? "rgb(42, 145, 209)" : colors(i).hex()));
    return ptCfg;
  };
  const cfg = createBaseCfg({ data, min, max }, { columns, x, y, additionalOptions, configHandler }, seriesFormatter);
  cfg.type = "pie";
  delete cfg.options.scales;
  delete cfg.options.tooltips;
  if (isDateCol(_.find(columns, { name: x }).dtype)) {
    cfg.data.labels = _.map(cfg.data.labels, l => moment(new Date(l)).format("YYYY-MM-DD"));
  }
  return configHandler(cfg);
}

const SCATTER_BUILDER = (data, prop) =>
  _.map(_.zip(data.all.x, data.all[prop]), ([xVal, yVal]) => ({
    x: xVal,
    y: yVal,
  }));

function createScatterCfg(
  { data, min, max },
  { columns, x, y, additionalOptions, configHandler },
  builder = SCATTER_BUILDER
) {
  const yProp = _.head(y);
  const chartData = builder(data, yProp);
  const scatterData = formatScatterPoints(chartData);
  const cfg = {
    type: "scatter",
    data: {
      datasets: [_.assign({ xLabels: [x], yLabels: [yProp] }, scatterData)],
    },
    options: _.assignIn(
      {
        tooltips: {
          callbacks: {
            label: (tooltipItem, chartData) => {
              const dataset = chartData.datasets[tooltipItem.datasetIndex];
              const pointData = dataset.data[tooltipItem.index];
              return [
                `${dataset.xLabels[0]}: ${_.round(pointData.x, 4)}`,
                `${dataset.yLabels[0]}: ${_.round(pointData.y, 4)}`,
              ];
            },
          },
        },
        scales: {
          xAxes: [
            {
              scaleLabel: { display: true, labelString: x },
            },
          ],
          yAxes: [
            {
              ticks: buildTicks(yProp, { min, max }),
              scaleLabel: { display: true, labelString: yProp },
            },
          ],
        },
        legend: { display: false },
        pan: { enabled: true, mode: "x" },
        zoom: { enabled: true, mode: "x" },
        maintainAspectRatio: true,
        responsive: true,
        showLines: false,
      },
      additionalOptions
    ),
  };
  updateCfgForDates(cfg, { columns, x, y }, { min, max });
  return _.isUndefined(configHandler) ? cfg : configHandler(cfg);
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
  createScatterCfg,
  createPieCfg,
  timestampLabel,
  formatScatterPoints,
  getScatterMax,
  getScatterMin,
  buildTicks,
};
