import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

describe("DataViewer tests", () => {
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

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/scatter")) {
          return {
            error: "scatter errror",
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
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  });

  test("DataViewer: correlations scatter error", done => {
    const Correlations = require("../../popups/Correlations").Correlations;
    const ChartsBody = require("../../popups/charts/ChartsBody").default;
    buildInnerHTML({ settings: "" });
    const props = { dataId: "1", chartData: { visible: true } };
    const result = mount(<Correlations {...props} />, {
      attachTo: document.getElementById("content"),
    });

    setTimeout(() => {
      result.update();
      const corrGrid = result
        .find(Correlations)
        .first()
        .find("div.ReactVirtualized__Grid__innerScrollContainer");
      corrGrid
        .find("div.cell")
        .at(1)
        .simulate("click");
      setTimeout(() => {
        result.update();
        t.equal(result.find(ChartsBody).length, 1, "should show correlation timeseries");
        const tsChart = result.find(ChartsBody).instance().state.charts[0];
        tsChart.cfg.options.onClick({});
        setTimeout(() => {
          result.update();
          t.equal(result.find(RemovableError).length, 1, "should render scatter error");
          done();
        }, 400);
      }, 400);
    }, 400);
  });
});
