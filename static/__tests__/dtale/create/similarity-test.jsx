import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import { CreateSimilarity } from "../../../popups/create/CreateSimilarity";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, tick, tickUpdate, withGlobalJquery } from "../../test-utils";
import { clickBuilder } from "./create-test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

function submit(res) {
  res.find("div.modal-footer").first().find("button").first().simulate("click");
}

describe("DataViewer tests", () => {
  let result, CreateColumn;

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
    CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;
    const { DataViewer } = require("../../../dtale/DataViewer");

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
    clickBuilder(result, "Similarity");
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  });

  it("DataViewer: build similarity column", async () => {
    expect(result.find(CreateSimilarity).length).toBe(1);
    const selects = () => result.find(CreateSimilarity).find(Select);
    selects().at(1).instance().onChange({ value: "col1" });
    result.update();
    selects().last().instance().onChange({ value: "col2" });
    result.update();
    selects().first().instance().onChange({ value: "damerau-leveneshtein" });
    result.update();
    selects().first().instance().onChange({ value: "jaro-winkler" });
    result.update();
    selects().first().instance().onChange({ value: "jaccard" });
    result.update();
    result
      .find(CreateSimilarity)
      .find("div.form-group")
      .last()
      .find("input")
      .simulate("change", { target: { value: "4" } });
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      left: "col1",
      right: "col2",
      algo: "jaccard",
      k: "4",
      normalized: false,
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_col2_distance");
  });

  it("DataViewer: build similarity cfg validation", () => {
    const { validateSimilarityCfg } = require("../../../popups/create/CreateSimilarity");
    expect(validateSimilarityCfg({ left: null })).toBe("Please select a left column!");
    expect(validateSimilarityCfg({ left: "col1", right: null })).toBe("Please select a right column!");
    expect(
      validateSimilarityCfg({
        left: "col1",
        right: "col2",
        algo: "jaccard",
      })
    ).toBe("Please select a valid value for k!");
    expect(
      validateSimilarityCfg({
        left: "col1",
        right: "col2",
        algo: "jaccard",
        k: "4",
      })
    ).toBeNull();
  });
});
