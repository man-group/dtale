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

    const plugin = gradientLinePlugin(colorScale, 1, -1);
    const dataset = { data: [{ x: 0, y: 0 }] };
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
});
