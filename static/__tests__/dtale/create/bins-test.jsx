import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, tick, tickUpdate, withGlobalJquery } from "../../test-utils";
import { clickBuilder } from "./create-test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

describe("DataViewer tests", () => {
  let result, CreateColumn, CreateBins, BinsTester, ColumnAnalysisChart;

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

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
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

  beforeEach(async () => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;
    CreateBins = require("../../../popups/create/CreateBins").CreateBins;
    ColumnAnalysisChart = require("../../../popups//analysis/ColumnAnalysisChart").default;
    BinsTester = require("../../../popups/create/BinsTester").ReactBinsTester;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );

    await tick();
    clickMainMenuButton(result, "Build Column");
    await tickUpdate(result);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  });

  it("DataViewer: build bins cut column", async () => {
    clickBuilder(result, "Bins");
    expect(result.find(CreateBins).length).toBe(1);
    const binInputs = result.find(CreateBins).first();
    binInputs.find(Select).first().instance().onChange({ value: "col2" });
    binInputs.find("div.form-group").at(1).find("button").first().simulate("click");
    binInputs
      .find("div.form-group")
      .at(2)
      .find("input")
      .simulate("change", { target: { value: "4" } });
    binInputs
      .find("div.form-group")
      .at(3)
      .find("input")
      .simulate("change", { target: { value: "foo,bar,bin,baz" } });
    await tickUpdate(result);
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col2",
      bins: "4",
      labels: "foo,bar,bin,baz",
      operation: "cut",
    });
    expect(result.find(BinsTester).find(ColumnAnalysisChart)).toHaveLength(1);
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
  });

  it("DataViewer: build bins qcut column", async () => {
    result
      .find(CreateColumn)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "qcut_col" } });
    clickBuilder(result, "Bins");
    expect(result.find(CreateBins).length).toBe(1);
    const binInputs = result.find(CreateBins).first();
    binInputs.find(Select).first().instance().onChange({ value: "col2" });
    binInputs.find("div.form-group").at(1).find("button").last().simulate("click");
    binInputs
      .find("div.form-group")
      .at(2)
      .find("input")
      .simulate("change", { target: { value: "4" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
  });

  it("DataViewer: build bins cfg validation", () => {
    const { validateBinsCfg } = require("../../../popups/create/CreateBins");
    const cfg = { col: null };
    expect(validateBinsCfg(cfg)).toBe("Missing a column selection!");
    cfg.col = "x";
    cfg.bins = "";
    expect(validateBinsCfg(cfg)).toBe("Missing a bins selection!");
    cfg.bins = "4";
    cfg.labels = "foo";
    expect(validateBinsCfg(cfg)).toBe("There are 4 bins, but you have only specified 1 labels!");
  });
});
