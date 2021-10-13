/* eslint max-lines: "off" */
import {
  BarController,
  BarElement,
  Chart,
  CategoryScale,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  ScatterController,
  Title,
  Tooltip,
} from "chart.js";
import { BoxPlotController } from "@sgratzl/chartjs-chart-boxplot";
import zoomPlugin from "chartjs-plugin-zoom";
import chroma from "chroma-js";
import _ from "lodash";
import moment from "moment";
import Plotly from "plotly.js-geo-dist-min";

import { buildRGBA } from "./colors";
import * as gu from "./dtale/gridUtils";
import { formatScatterPoints, getScatterMax, getScatterMin } from "./scatterChartUtils";

Chart.register(
  BarController,
  BarElement,
  BoxPlotController,
  CategoryScale,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  ScatterController,
  Title,
  Tooltip,
  zoomPlugin
);

function createChart(ctx, cfg) {
  const options = cfg.options || {};
  const finalCfg = { ...cfg, options };
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

const gradientLinePlugin = (colorScale, yAxisID, minY = null, maxY = null) => ({
  afterLayout: (chartInstance, _args, _options) => {
    const rgbaBuilder = buildRGBA(colorScale);
    // The context, needed for the creation of the linear gradient.
    const ctx = chartInstance.ctx;
    // The first (and, assuming, only) dataset.
    const dataset = chartInstance.config._config.data.datasets[0];
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

function drawLine(chart, point, colorBuilder) {
  const ctx = chart.ctx,
    x = point.element.x,
    dataset = chart.config._config.data.datasets[point.datasetIndex],
    yAxisID = dataset.yAxisID,
    topY = chart.scales[yAxisID].top,
    bottomY = chart.scales[yAxisID].bottom,
    value = dataset.data[point.dataIndex];

  // draw line
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, topY);
  ctx.lineTo(x, bottomY);
  ctx.lineWidth = 2;
  ctx.strokeStyle = colorBuilder(value);
  ctx.stroke();
  ctx.restore();
}

const lineHoverPlugin = colorScale => ({
  afterDraw: (chartInstance, _args, _options) => {
    if (chartInstance.tooltip.dataPoints?.length) {
      drawLine(chartInstance, chartInstance.tooltip.dataPoints[0], buildRGBA(colorScale));
      return;
    }
    const selectedPoint = chartInstance.config._config.data.datasets[0].selectedPoint;
    if (!_.isUndefined(selectedPoint)) {
      const point = {
        element: chartInstance.getDatasetMeta(0).data[selectedPoint],
        dataIndex: selectedPoint,
        datasetIndex: 0,
      };
      drawLine(chartInstance, point, () => "rgb(42, 145, 209)");
    }
  },
});

const COLOR_SCALE = chroma.scale(["orange", "yellow", "green", "lightblue", "darkblue"]);

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
        plugins: {
          zoom: {
            pan: { enabled: true, mode: "x" },
            zoom: {
              wheel: { enabled: true, speed: 0.5 },
              pinch: { enabled: true },
              mode: "x",
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: (tooltipItem, chartData) => {
                const value = _.round(tooltipItem.parsed.y, 4);
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
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
        scales: {
          x: {
            scaleLabel: {
              display: true,
              labelString: x,
            },
          },
          ..._.reduce(
            y,
            (res, yProp, idx) => ({
              ...res,
              [`y-${yProp}`]: {
                scaleLabel: {
                  display: true,
                  labelString: yProp,
                },
                ticks: buildTicks(yProp, { min, max }),
                position: idx % 2 == 0 ? "left" : "right",
              },
            }),
            {}
          ),
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
  cfg.options.scales.x.stacked = true;
  _.forEach(cfg.options.scales, (axisCfg, axisId) => {
    if (_.startsWith(axisId, "y")) {
      axisCfg.stacked = true;
    }
  });
  return cfg;
}

function createPieCfg({ data, min, max }, { columns, x, y, additionalOptions, configHandler }) {
  const seriesCt = _.get(_.values(data), "0.x.length");
  const colors = COLOR_SCALE.domain([0, seriesCt]);
  const seriesFormatter = (k, v, i, yProp) => {
    const ptCfg = buildSeries(k, v, i, yProp);
    ptCfg.backgroundColor = _.map(v[yProp], (_p, i) => (seriesCt == 1 ? "rgb(42, 145, 209)" : colors(i).hex()));
    return ptCfg;
  };
  const cfg = createBaseCfg({ data, min, max }, { columns, x, y, additionalOptions, configHandler }, seriesFormatter);
  cfg.type = "pie";
  delete cfg.options.scales;
  delete cfg.options?.plugins?.tooltip;
  if (gu.isDateCol(_.find(columns, { name: x }).dtype)) {
    cfg.data.labels = _.map(cfg.data.labels, l => moment(new Date(l)).format("YYYY-MM-DD"));
  }
  return configHandler(cfg);
}

const SCATTER_BUILDER = (data, prop) =>
  _.map(_.zip(data.all.x, data.all[prop]), ([xVal, yVal]) => ({
    x: xVal,
    y: yVal,
  }));

function createScatterCfg({ data, min, max }, { x, y, additionalOptions, configHandler }, builder = SCATTER_BUILDER) {
  const yProp = _.head(y);
  const chartData = builder(data, yProp);
  const scatterData = formatScatterPoints(chartData);
  const cfg = {
    type: "scatter",
    data: {
      datasets: [_.assign({ xLabels: [x], yLabels: [yProp] }, scatterData)],
    },
    options: {
      scales: {
        x: {
          scaleLabel: { display: true, labelString: x },
        },
        y: {
          ticks: buildTicks(yProp, { min, max }),
          scaleLabel: { display: true, labelString: yProp },
        },
      },
      legend: { display: false },
      plugins: {
        zoom: {
          pan: { enabled: true, mode: "x" },
          zoom: {
            wheel: { enabled: true, speed: 0.5 },
            pinch: { enabled: true },
            mode: "x",
          },
        },
        tooltip: {
          callbacks: {
            label: tooltipItem => {
              const pointData = tooltipItem.raw;
              return [
                `${tooltipItem.dataset.xLabels[0]}: ${_.round(pointData.x, 4)}`,
                `${tooltipItem.dataset.yLabels[0]}: ${_.round(pointData.y, 4)}`,
              ];
            },
          },
        },
      },
      maintainAspectRatio: true,
      responsive: true,
      showLines: false,
      ...additionalOptions,
    },
  };
  return _.isUndefined(configHandler) ? cfg : configHandler(cfg);
}

function createGeolocation(ctxId, fetchedData) {
  const layout = {
    autosize: true,
    legend: { orientation: "h" },
    margin: { b: 0, l: 0, r: 0, t: 0 },
    geo: { fitbounds: "locations" },
  };
  const data = [
    {
      type: "scattergeo",
      mode: "markers",
      marker: { color: "darkblue" },
      lat: fetchedData.lat,
      lon: fetchedData.lon,
    },
  ];
  Plotly.newPlot(ctxId, data, layout);
}

function createQQ(ctxId, fetchedData) {
  const layout = {
    autosize: true,
    legend: { orientation: "h" },
    margin: { b: 0, l: 0, r: 0, t: 0 },
  };
  const data = [
    {
      type: "scattergl",
      mode: "markers",
      marker: { color: "darkblue" },
      name: "qq",
      x: fetchedData.x,
      y: fetchedData.y,
    },
    {
      type: "scattergl",
      mode: "lines",
      marker: { color: "red" },
      name: "OLS Trendline",
      x: fetchedData.x2,
      y: fetchedData.y2,
    },
  ];
  Plotly.newPlot(ctxId, data, layout);
}

export default {
  createChart,
  chartWrapper,
  fitToContainer,
  TS_COLORS,
  gradientLinePlugin,
  lineHoverPlugin,
  createLineCfg,
  createBarCfg,
  createGeolocation,
  createQQ,
  createStackedCfg,
  createScatterCfg,
  createPieCfg,
  formatScatterPoints,
  getScatterMax,
  getScatterMin,
  buildTicks,
};
