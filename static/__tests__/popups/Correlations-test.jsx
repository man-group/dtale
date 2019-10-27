import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

const chartData = {
  visible: true,
  type: "correlations",
  title: "Correlations Test",
  query: "col == 3",
  columns: [
    { name: "dtale_index", dtype: "int64" },
    { name: "col1", dtype: "int64" },
    { name: "col2", dtype: "float64" },
    { name: "col3", dtype: "object" },
    { name: "col4", dtype: "datetime64[ns]" },
    { name: "col5", dtype: "datetime64[ns]" },
  ],
};

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("Correlations tests", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 500 });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 500 });

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (url.startsWith("/dtale/correlations")) {
          const query = qs.parse(url.split("?")[1]).query;
          if (query == "null") {
            return { error: "No data found." };
          }
        }
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
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

  test("Correlations rendering data", done => {
    const Correlations = require("../../popups/Correlations").ReactCorrelations;
    const TimeseriesChartBody = require("../../popups/TimeseriesChartBody").TimeseriesChartBody;
    buildInnerHTML("");
    const result = mount(<Correlations chartData={chartData} />, { attachTo: document.getElementById("content") });
    result.update();
    setTimeout(() => {
      result.update();
      const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
      corrGrid
        .find("div.cell")
        .at(1)
        .simulate("click");
      setTimeout(() => {
        result.update();
        t.equal(result.find(TimeseriesChartBody).length, 1, "should show correlation timeseries");
        t.deepEqual(
          result
            .find("select.custom-select")
            .first()
            .find("option")
            .map(o => o.text()),
          ["col4", "col5"],
          "should render date options for timeseries"
        );
        result
          .find("select.custom-select")
          .first()
          .simulate("change", { target: { value: "col5" } });
        setTimeout(() => {
          result.update();
          t.ok((result.state().selectedDate = "col5"), "should change timeseries date");
          done();
        }, 200);
      }, 200);
    }, 200);
  });

  test("Correlations missing data", done => {
    const Correlations = require("../../popups/Correlations").ReactCorrelations;
    const result = mount(<Correlations chartData={_.assign({}, chartData, { query: "null" })} />);
    setTimeout(() => {
      result.update();
      t.notOk(result.find("div.ReactVirtualized__Grid__innerScrollContainer").length, "should not create grid");
      done();
    }, 200);
  });
});
