import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { RemovableError } from "../../RemovableError";
import { DataViewerMenu } from "../../dtale/DataViewerMenu";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("DataViewer tests", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 500 });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 500 });

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        if (url.startsWith("/dtale/scatter")) {
          return { error: "scatter errror", traceback: "scatter error traceback" };
        }
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
      chartCfg.getElementAtEvent = _evt => [{ _datasetIndex: 0, _index: 0, _chart: { config: cfg, data: cfg.data } }];
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
  });

  test("DataViewer: correlations scatter error", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const Correlations = require("../../popups/Correlations").ReactCorrelations;
    const TimeseriesChartBody = require("../../popups/TimeseriesChartBody").TimeseriesChartBody;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML("");
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );

    setTimeout(() => {
      result.update();
      result
        .find(DataViewerMenu)
        .find("ul li button")
        .at(2)
        .simulate("click");
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
          t.equal(result.find(TimeseriesChartBody).length, 1, "should show correlation timeseries");
          const tsChart = result.find(TimeseriesChartBody).instance().state.chart["ts-chart"];
          tsChart.cfg.options.onClick({});
          setTimeout(() => {
            result.update();
            t.ok(result.find(RemovableError).length == 1, "should render scatter error");
            done();
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  });
});
