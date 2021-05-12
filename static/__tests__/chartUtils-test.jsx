/* eslint max-lines: "off" */
import _ from "lodash";

import { expect, it } from "@jest/globals";

import { mockChartJS } from "./test-utils";

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
    mockChartJS();

    const correlationsUtils = require("../popups/correlations/correlationsUtils").default;
    chartUtils = require("../chartUtils").default;
    colorScale = correlationsUtils.colorScale;
  });

  it("chartUtils: testing gradientLinePlugin with min & max", () => {
    const plugin = chartUtils.gradientLinePlugin(colorScale, "y-corr", 1, -1);
    const dataset = { data: [{ x: 0, y: 0 }] };
    const chartInstance = {
      config: {
        _config: {
          data: { datasets: [dataset] },
        },
      },
      scales: {
        "y-corr": {
          getPixelForValue: px => px,
        },
      },
      ctx: {
        createLinearGradient: (_px1, _px2, _px3, _px4) => ({
          addColorStop: (_px5, _px6) => null,
        }),
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
      config: {
        _config: {
          data: { datasets: [dataset] },
        },
      },
      scales: {
        "y-axis-0": {
          getPixelForValue: px => px,
        },
      },
      ctx: {
        createLinearGradient: (_px1, _px2, _px3, _px4) => ({
          addColorStop: (_px5, _px6) => null,
        }),
      },
    };
    plugin.afterLayout(chartInstance);
    _.forEach(GRADIENT_FUNCS, f => expect(_.isFunction(dataset[f].addColorStop)).toBe(true));
  });

  it("chartUtils: testing lineHoverPlugin", () => {
    const plugin = chartUtils.lineHoverPlugin(colorScale);
    const dataset = { data: [{ x: 0, y: 0 }], yAxisID: "y-corr" };
    const point = {
      element: { x: 0 },
      datasetIndex: 0,
      dataIndex: 0,
    };
    const chartInstance = {
      config: {
        _config: {
          data: { datasets: [dataset] },
        },
      },
      scales: {
        "y-corr": {
          getPixelForValue: px => px,
          top: 0,
          bottom: 10,
        },
      },
      tooltip: { dataPoints: [point] },
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
    expect(chartInstance.ctx.strokeStyle).toBe("rgba(204,204,204,1)");
  });

  it("chartUtils: testing lineHoverPlugin for default", () => {
    const plugin = chartUtils.lineHoverPlugin(colorScale);
    const dataset = {
      data: [{ x: 0, y: 0 }],
      yAxisID: "y-corr",
      selectedPoint: 0,
    };
    const point = {
      element: { x: 0 },
      datasetIndex: 0,
      dataIndex: 0,
    };
    const chartInstance = {
      config: {
        _config: {
          data: { datasets: [dataset] },
        },
      },
      scales: {
        "y-corr": {
          getPixelForValue: px => px,
          top: 0,
          bottom: 10,
        },
      },
      tooltip: { dataPoints: [] },
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
    expect(cfg.options.plugins.tooltip.callbacks.label({ parsed: { y: 0.1 }, datasetIndex: 0 }, cfg.data)).toBe(
      "series1: 0.1"
    );
  });
});
