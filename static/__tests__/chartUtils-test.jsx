import _ from "lodash";

import * as t from "./jest-assertions";
import { withGlobalJquery } from "./test-utils";

const GRADIENT_FUNCS = [
  "borderColor",
  "pointHoverBackgroundColor",
  "pointBorderColor",
  "pointBackgroundColor",
  "pointHoverBorderColor",
];

function updateDataCfg(prop, data, cfg) {
  cfg.data.all[prop] = data;
  cfg.min[prop] = data[0];
  cfg.max[prop] = data[data.length - 1];
}

describe("chartUtils tests", () => {
  beforeAll(() => {
    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
      chartCfg.getElementAtEvent = _evt => [{ _datasetIndex: 0, _index: 0, _chart: { config: cfg, data: cfg.data } }];
      return chartCfg;
    });

    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
  });

  test("chartUtils: testing gradientLinePlugin with min & max", done => {
    const { colorScale } = require("../popups/correlations/correlationsUtils").default;
    const { gradientLinePlugin } = require("../chartUtils").default;

    const plugin = gradientLinePlugin(colorScale, "y-corr", 1, -1);
    const dataset = { data: [{ x: 0, y: 0 }] };
    const chartInstance = {
      data: { datasets: [dataset] },
      scales: {
        "y-corr": {
          getPixelForValue: px => px,
        },
      },
      chart: {
        ctx: {
          createLinearGradient: (_px1, _px2, _px3, _px4) => ({
            addColorStop: (_px5, _px6) => null,
          }),
        },
      },
    };
    plugin.afterLayout(chartInstance);
    _.forEach(GRADIENT_FUNCS, f => t.ok(_.isFunction(dataset[f].addColorStop), "should set gradients"));
    done();
  });

  test("chartUtils: testing gradientLinePlugin without min & max", done => {
    const { colorScale } = require("../popups/correlations/correlationsUtils").default;
    const { gradientLinePlugin } = require("../chartUtils").default;

    const plugin = gradientLinePlugin(colorScale);
    const dataset = {
      data: [
        { x: 0, y: 1.1 },
        { x: 1, y: 1.2 },
        { x: 2, y: 1.3 },
      ],
    };
    const chartInstance = {
      data: { datasets: [dataset] },
      scales: {
        "y-axis-0": {
          getPixelForValue: px => px,
        },
      },
      chart: {
        ctx: {
          createLinearGradient: (_px1, _px2, _px3, _px4) => ({
            addColorStop: (_px5, _px6) => null,
          }),
        },
      },
    };
    plugin.afterLayout(chartInstance);
    _.forEach(GRADIENT_FUNCS, f => t.ok(_.isFunction(dataset[f].addColorStop), "should set gradients"));
    done();
  });

  test("chartUtils: testing timestampLabel", done => {
    const { timestampLabel } = require("../chartUtils").default;

    t.equal(timestampLabel(1514782800000), "2018-01-01", "should return date string");
    const tsLabel = timestampLabel(1514786400000);
    t.ok(tsLabel === "2018-01-01 1:00:00 am", "should return timestamp string");
    done();
  });

  test("chartUtils: testing createLineCfg with date axes", done => {
    const { createLineCfg } = require("../chartUtils").default;

    const data = {
      data: {
        all: {
          y: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
          x: [1514782800000, 1514786400000, 1514790000000, 1514793600000, 1514797200000, 1514800800000],
        },
      },
      min: { x: 1514782800000, y: 0.1 },
      max: { x: 1514800800000, y: 0.6 },
      x: "x",
      y: "y",
    };
    const columns = [
      { name: "x", dtype: "datetime64[ns]" },
      { name: "y", dtype: "float64" },
    ];
    let cfg = createLineCfg(data, {
      columns,
      x: "x",
      y: "y",
      configHandler: cfg => cfg,
    });
    t.deepEqual(
      cfg.options.scales.xAxes[0].time,
      { unit: "hour", stepSize: 4, displayFormats: { hour: "YYYYMMDD hA" } },
      "should build hourly config"
    );
    t.equal(cfg.options.tooltips.callbacks.label({ yLabel: 0.1, datasetIndex: 0 }, cfg.data), "0.1");
    updateDataCfg(
      "x",
      [1578200400000, 1578805200000, 1579410000000, 1580014800000, 1580619600000, 1581224400000],
      data
    );
    cfg = createLineCfg(data, {
      columns,
      x: "x",
      y: "y",
      configHandler: cfg => cfg,
    });
    t.deepEqual(
      cfg.options.scales.xAxes[0].time,
      { unit: "day", stepSize: 1, displayFormats: { day: "YYYYMMDD" } },
      "should build daily config"
    );
    updateDataCfg(
      "x",
      [1578200400000, 1578805200000, 1579410000000, 1592107200000, 1592712000000, 1593316800000],
      data
    );
    cfg = createLineCfg(data, {
      columns,
      x: "x",
      y: "y",
      configHandler: cfg => cfg,
    });
    t.deepEqual(
      cfg.options.scales.xAxes[0].time,
      { unit: "week", stepSize: 1, displayFormats: { week: "YYYYMMDD" } },
      "should build weekly config"
    );
    updateDataCfg(
      "x",
      [1580446800000, 1582952400000, 1585627200000, 1635652800000, 1638248400000, 1640926800000],
      data
    );
    cfg = createLineCfg(data, {
      columns,
      x: "x",
      y: "y",
      configHandler: cfg => cfg,
    });
    t.deepEqual(
      cfg.options.scales.xAxes[0].time,
      { unit: "month", stepSize: 1, displayFormats: { month: "YYYYMMDD" } },
      "should build monthly config"
    );
    updateDataCfg(
      "x",
      [1585627200000, 1593489600000, 1601438400000, 1719720000000, 1727668800000, 1735621200000],
      data
    );
    cfg = createLineCfg(data, {
      columns,
      x: "x",
      y: "y",
      configHandler: cfg => cfg,
    });
    t.deepEqual(
      cfg.options.scales.xAxes[0].time,
      { unit: "quarter", stepSize: 1, displayFormats: { quarter: "YYYYMMDD" } },
      "should build quarterly config"
    );
    updateDataCfg(
      "x",
      [1609390800000, 1640926800000, 1672462800000, 1988082000000, 2019618000000, 2051154000000],
      data
    );
    cfg = createLineCfg(data, {
      columns,
      x: "x",
      y: "y",
      configHandler: cfg => cfg,
    });
    t.deepEqual(
      cfg.options.scales.xAxes[0].time,
      { unit: "year", stepSize: 1, displayFormats: { year: "YYYYMMDD" } },
      "should build yearly config"
    );
    done();
  });

  test("chartUtils: testing createLineCfg with date y-axis", done => {
    const { createLineCfg, createScatterCfg } = require("../chartUtils").default;

    const data = {
      data: {
        all: {
          x: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
          y: [1514782800000, 1514786400000, 1514790000000, 1514793600000, 1514797200000, 1514800800000],
        },
      },
      min: { y: 1514782800000, x: 0.1 },
      max: { y: 1514800800000, x: 0.6 },
      x: "x",
      y: "y",
    };
    const columns = [
      { name: "y", dtype: "datetime64[ns]" },
      { name: "x", dtype: "float64" },
    ];
    let cfg = createLineCfg(data, {
      columns,
      x: "x",
      y: "y",
      configHandler: cfg => cfg,
    });
    t.deepEqual(
      cfg.options.scales.yAxes[0].time,
      { unit: "hour", stepSize: 4, displayFormats: { hour: "YYYYMMDD hA" } },
      "should build hourly config for y-axis"
    );
    cfg = createScatterCfg(data, {
      columns,
      x: "x",
      y: "y",
      configHandler: cfg => cfg,
    });
    t.ok(cfg.data.datasets[0].data[0].y == 1514782800000);
    done();
  });

  test("chartUtils: testing buildTicks", done => {
    const { buildTicks } = require("../chartUtils").default;
    const range = { min: { y: 0.1 }, max: { y: 0.6 } };
    t.deepEqual(buildTicks("y", range, true), { min: 0.095, max: 0.605 }, "should build padded ticks");
    done();
  });

  test("chartUtils: testing buildSeries", done => {
    const { createLineCfg } = require("../chartUtils").default;

    const series = {
      y: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
      x: [1514782800000, 1514786400000, 1514790000000, 1514793600000, 1514797200000, 1514800800000],
    };
    const data = {
      data: { series1: series, series2: series },
      min: { x: 1514782800000, y: 0.1 },
      max: { x: 1514800800000, y: 0.6 },
      x: "x",
      y: "y",
    };
    const columns = [
      { name: "x", dtype: "datetime64[ns]" },
      { name: "y", dtype: "float64" },
    ];
    const cfg = createLineCfg(data, {
      columns,
      x: "x",
      y: "y",
      configHandler: cfg => cfg,
    });
    t.equal(cfg.data.datasets[0].label, "series1", "should construct series label");
    t.equal(cfg.options.tooltips.callbacks.label({ yLabel: 0.1, datasetIndex: 0 }, cfg.data), "series1: 0.1");
    done();
  });
});
