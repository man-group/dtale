import { mount } from "enzyme";
import React from "react";
import { ModalClose } from "react-modal-bootstrap";
import { Provider } from "react-redux";

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

  test("DataViewer: correlations", done => {
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
        t.equal(result.find(Correlations).length, 1, "should show correlations");
        result
          .find(ModalClose)
          .first()
          .simulate("click");
        t.equal(result.find(Correlations).length, 0, "should hide correlations");
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
            const layoutObj = {
              chart: tsChart,
              scales: {
                "y-axis-0": {
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
            t.deepEqual(ticks.ticks, [null, null], "should hide first and last tick");
            setTimeout(() => {
              result.update();
              t.ok(result.find(Correlations).instance().state.chart !== null, "should render scatter");
              result
                .find(Correlations)
                .instance()
                .state.chart.cfg.options.onClick({});
              result.update();
              t.deepEqual(store.getState().chartData, { visible: false }, "should hide correlations");
              done();
            }, 400);
          }, 400);
        }, 400);
      }, 400);
    }, 600);
  });
});
