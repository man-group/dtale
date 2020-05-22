import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../../RemovableError";
import mockPopsicle from "../../MockPopsicle";
import { clickColMenuButton } from "../../iframe/iframe-utils";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

describe("DataViewer tests", () => {
  let result, CreateReplacement, Strings;

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
    CreateReplacement = require("../../../popups/replacement/CreateReplacement").ReactCreateReplacement;
    Strings = require("../../../popups/replacement/Strings").Strings;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tickUpdate(result);
    // select column
    result.find(".main-grid div.headerCell div").at(2).simulate("click");
    result.update();

    clickColMenuButton(result, "Replacements");
    await tickUpdate(result);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  });

  it("DataViewer: strings replacement w/ new col", async () => {
    result.find(CreateReplacement).find("div.form-group").first().find("button").last().simulate("click");
    result
      .find(CreateReplacement)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "cut_col" } });
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").last().simulate("click");
    result.update();
    expect(result.find(Strings).length).toBe(1);
    const stringsInputs = result.find(Strings).first();
    stringsInputs
      .find("div.form-group")
      .first()
      .find("input")
      .simulate("change", { target: { value: "nan" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
  });

  it("DataViewer: strings replacement", async () => {
    const validationSpy = jest.spyOn(require("../../../popups/replacement/Strings"), "validateStringsCfg");
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").last().simulate("click");
    result.update();
    expect(result.find(Strings).length).toBe(1);
    const stringsInputs = result.find(Strings).first();
    stringsInputs
      .find("div.form-group")
      .first()
      .find("input")
      .simulate("change", { target: { value: "A" } });
    stringsInputs.find("div.form-group").at(1).find("i").simulate("click");
    stringsInputs.find("div.form-group").at(2).find("i").simulate("click");
    stringsInputs
      .find("div.form-group")
      .last()
      .find("input")
      .simulate("change", { target: { value: "nan" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(validationSpy.mock.calls[0][0]).toStrictEqual({
      value: "A",
      isChar: true,
      ignoreCase: true,
      replace: "nan",
    });
  });

  it("DataViewer: string replacement w/ new invalid col", async () => {
    result.find(CreateReplacement).find("div.form-group").first().find("button").last().simulate("click");
    result
      .find(CreateReplacement)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "error" } });
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").last().simulate("click");
    result.update();
    expect(result.find(Strings).length).toBe(1);
    const spacesInputs = result.find(Strings).first();
    spacesInputs
      .find("div.form-group")
      .first()
      .find("input")
      .simulate("change", { target: { value: "nan" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(CreateReplacement).find(RemovableError)).toHaveLength(1);
  });

  it("DataViewer: strings cfg validation", () => {
    const { validateStringsCfg } = require("../../../popups/replacement/Strings");
    let cfg = { value: null };
    expect(validateStringsCfg(cfg)).toBe("Please enter a character or substring!");
    cfg = { value: "A", replace: null };
    expect(validateStringsCfg(cfg)).toBe("Please enter a replacement value!");
  });
});
