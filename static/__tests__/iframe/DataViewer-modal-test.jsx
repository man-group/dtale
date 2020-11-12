import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";
import { clickColMenuButton, openColMenu, validateHeaders } from "./iframe-utils";

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

  it("DataViewer: column analysis display in a modal", async () => {
    const bu = require("../../dtale/backgroundUtils").default;
    const { DataViewer } = require("../../dtale/DataViewer");
    const ColumnMenu = require("../../dtale/column/ColumnMenu").ReactColumnMenu;
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
    await tickUpdate(result);
    result.find(MultiGrid).first().instance();
    validateHeaders(result, ["col1", "col2", "col3", "col4"]);
    await openColMenu(result, 1);
    expect(result.find("#column-menu-div").length).toBe(1);
    expect(result.find(ColumnMenu).first().find("header").first().text()).toBe(
      `Column "col2"Data Type:float64${bu.flagIcon}Low Variance:True`
    );
    clickColMenuButton(result, "Column Analysis");
    await tickUpdate(result);
    expect(result.find(ColumnAnalysis).length).toBe(1);
  });
});
