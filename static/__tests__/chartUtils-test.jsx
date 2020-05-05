/* eslint max-lines: "off" */
import _ from "lodash";

import { expect, it } from "@jest/globals";

import { withGlobalJquery } from "./test-utils";

const GRADIENT_FUNCS = [
  "borderColor",
  "pointHoverBackgroundColor",
  "pointBorderColor",
  "pointBackgroundColor",
  "pointHoverBorderColor",
];

describe("chartUtils tests", () => {
  let colorScale, chartUtils;
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
    const correlationsUtils = require("../popups/correlations/correlationsUtils").default;
    chartUtils = require("../chartUtils").default;
    colorScale = correlationsUtils.colorScale;
  });

  it("chartUtils: testing gradientLinePlugin with min & max", () => {
    const plugin = chartUtils.gradientLinePlugin(colorScale, "y-corr", 1, -1);
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
    _.forEach(GRADIENT_FUNCS, f => expect(_.isFunction(dataset[f].addColorStop)).toBe(true));
  });

  it("chartUtils: testing gradientLinePlugin without min & max", () => {
    const plugin = chartUtils.gradientLinePlugin(colorScale);
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
    _.forEach(GRADIENT_FUNCS, f => expect(_.isFunction(dataset[f].addColorStop)).toBe(true));
  });

  it("chartUtils: testing lineHoverPlugin", () => {
    const plugin = chartUtils.lineHoverPlugin(colorScale);
    const dataset = { data: [{ x: 0, y: 0 }] };
    const point = {
      _model: { x: 0 },
      _yScale: { top: 0, bottom: 10 },
      _datasetIndex: 0,
      _index: 0,
    };
    const chartInstance = {
      data: { datasets: [dataset] },
      scales: {
        "y-corr": {
          getPixelForValue: px => px,
        },
      },
      tooltip: { _active: [point] },
      getDatasetMeta: _idx => ({
        controller: { _config: { selectedPoint: 0 } },
        data: [point],
      }),
      ctx: {
        save: _.noop,
        beginPath: _.noop,
        moveTo: _.noop,
        lineTo: _.noop,
        lineWidth: 0,
        strokeStyle: null,
        stroke: _.noop,
        restore: _.noop,
      },
    };
    plugin.afterDraw(chartInstance);
    expect(chartInstance.ctx.lineWidth).toBe(2);
    expect(chartInstance.ctx.strokeStyle).toBe("rgb(42, 145, 209)");
  });

  it("chartUtils: testing buildTicks", () => {
    const range = { min: { y: 0.1 }, max: { y: 0.6 } };
    expect(chartUtils.buildTicks("y", range, true)).toEqual({
      min: 0.095,
      max: 0.605,
    });
  });

  it("chartUtils: testing buildSeries", () => {
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
    const cfg = chartUtils.createLineCfg(data, {
      columns,
      x: "x",
      y: "y",
      configHandler: cfg => cfg,
    });
    expect(cfg.data.datasets[0].label).toBe("series1");
    expect(cfg.options.tooltips.callbacks.label({ yLabel: 0.1, datasetIndex: 0 }, cfg.data)).toBe("series1: 0.1");
  });
});
