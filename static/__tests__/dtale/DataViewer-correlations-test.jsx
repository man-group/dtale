import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

describe("DataViewer tests", () => {
  const { opener } = window;
  let result, Correlations, ChartsBody;
  let testIdx = 0;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1105,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 1340,
    });

    delete window.opener;
    window.opener = { location: { reload: jest.fn() } };

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/scatter/0")) {
          return {
            error: "scatter error",
            traceback: "scatter error traceback",
          };
        }
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
      chartCfg.getElementAtEvent = _evt => [{ _datasetIndex: 0, _index: 0, _chart: { config: cfg, data: cfg.data } }];
      chartCfg.getDatasetMeta = _idx => ({
        controller: { _config: { selectedPoint: 0 } },
      });
      return chartCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
    Correlations = require("../../popups/Correlations").Correlations;
    ChartsBody = require("../../popups/charts/ChartsBody").default;
  });

  beforeEach(async () => {
    buildInnerHTML({ settings: "" });
    const props = { dataId: "" + testIdx++, chartData: { visible: true } };
    result = mount(<Correlations {...props} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
    const corrGrid = result.find(Correlations).first().find("div.ReactVirtualized__Grid__innerScrollContainer");
    corrGrid.find("div.cell").at(1).simulate("click");
    await tickUpdate(result);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
    window.opener = opener;
  });

  it("DataViewer: correlations scatter error", async () => {
    expect(result.find(ChartsBody).length).toBe(1);
    const tsChart = result.find(ChartsBody).instance().state.charts[0];
    tsChart.cfg.options.onClick({});
    await tickUpdate(result);
    expect(result.find(RemovableError).length).toBe(1);
  });

  it("DataViewer: correlations", async () => {
    Object.defineProperty(global.document, "queryCommandSupported", {
      value: () => true,
    });
    Object.defineProperty(global.document, "execCommand", { value: _.noop });
    expect(result.find(ChartsBody).length).toBe(1);
    const tsChart = result.find(ChartsBody).instance().state.charts[0];
    const layoutObj = {
      chart: tsChart,
      scales: {
        "y-corr": {
          getPixelForValue: px => px,
        },
      },
      data: tsChart.data,
    };
    layoutObj.chart.ctx.createLinearGradient = (_px1, _px2, _px3, _px4) => ({
      addColorStop: (_px5, _px6) => null,
    });
    tsChart.cfg.plugins[0].afterLayout(layoutObj);
    tsChart.cfg.options.onClick({});
    const ticks = { ticks: [0, 0] };
    tsChart.cfg.options.scales.yAxes[0].afterTickToLabelConversion(ticks);
    expect(ticks.ticks).toEqual([null, null]);
    await tickUpdate(result);
    expect(result.find(Correlations).instance().state.chart !== null).toBe(true);
    result.find(Correlations).instance().state.chart.cfg.options.onClick({});
    await tickUpdate(result);
    expect(window.opener.location.reload).toHaveBeenCalled();
  });
});
