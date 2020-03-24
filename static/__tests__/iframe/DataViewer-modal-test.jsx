import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";
import { clickColMenuButton } from "./iframe-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

describe("DataViewer iframe tests", () => {
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
      value: 1005,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 1240,
    });

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

  test("DataViewer: column analysis display in a modal", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const ColumnMenu = require("../../dtale/iframe/ColumnMenu").ReactColumnMenu;
    const ColumnAnalysis = require("../../popups/analysis/ColumnAnalysis").ReactColumnAnalysis;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "", iframe: "True" }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );

    setTimeout(() => {
      result.update();
      result
        .find(MultiGrid)
        .first()
        .instance();
      t.deepEqual(
        result.find(".main-grid div.headerCell").map(hc => hc.text()),
        ["col1", "col2", "col3", "col4"],
        "should render column headers"
      );
      result
        .find(".main-grid div.headerCell div")
        .at(1)
        .simulate("click");
      t.equal(result.find("#column-menu-div").length, 1, "should show column menu");
      t.equal(
        result
          .find(ColumnMenu)
          .first()
          .find("header")
          .first()
          .text(),
        'Column "col2"',
        "should show col2 menu"
      );
      clickColMenuButton(result, "Column Analysis");
      setTimeout(() => {
        result.update();
        t.equal(result.find(ColumnAnalysis).length, 1, "should show column analysis");
        done();
      }, 400);
    }, 600);
  });
});
