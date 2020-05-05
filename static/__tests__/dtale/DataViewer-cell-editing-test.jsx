import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, tick, tickUpdate, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

describe("DataViewer tests", () => {
  const { open } = window;

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
      value: 1205,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 775,
    });
    delete window.open;
    window.open = jest.fn();

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = {
        ctx,
        cfg,
        data: cfg.data,
        destroyed: false,
      };
      chartCfg.destroy = function destroy() {
        chartCfg.destroyed = true;
      };
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
    window.open = open;
  });

  it("DataViewer: cell editing", async () => {
    const { DataViewer, ReactDataViewer } = require("../../dtale/DataViewer");
    const GridCell = require("../../dtale/GridCell").ReactGridCell;
    const GridCellEditor = require("../../dtale/GridCellEditor").ReactGridCellEditor;
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tickUpdate(result);
    const cellIdx = result.find(GridCell).last().find("div").prop("cell_idx");
    let instance = result.find(ReactDataViewer).instance();
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
    });
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
    });
    result.update();
    let cellEditor = result.find(GridCellEditor).first();
    cellEditor.instance().onKeyDown({ key: "Escape" });
    instance = result.find(ReactDataViewer).instance();
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
    });
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
    });
    result.update();
    cellEditor = result.find(GridCellEditor).first();
    cellEditor.find("input").simulate("change", { target: { value: "20000101" } });
    cellEditor.instance().onKeyDown({ key: "Enter" });
    await tick();
    expect(result.find(GridCell).last().text()).toBe("20000101");
  });
});
