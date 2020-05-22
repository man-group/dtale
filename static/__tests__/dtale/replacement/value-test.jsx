import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

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
  let result, CreateReplacement, Value;

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
    Value = require("../../../popups/replacement/Value").Value;

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
    result.find(".main-grid div.headerCell div").first().simulate("click");
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

  const findValueInputRow = (idx = 0) => result.find(Value).find("div.form-group").at(idx);

  it("DataViewer: value raw replacement w/ new col", async () => {
    result.find(CreateReplacement).find("div.form-group").first().find("button").last().simulate("click");
    result
      .find(CreateReplacement)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "cut_col" } });
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").first().simulate("click");
    result.update();
    expect(result.find(Value).length).toBe(1);
    findValueInputRow()
      .find("input")
      .simulate("change", { target: { value: "3" } });
    findValueInputRow(1).find("button").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    expect(result.find(CreateReplacement).find(RemovableError)).toHaveLength(1);
    findValueInputRow(1).find("i").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
  });

  it("DataViewer: value agg replacement", async () => {
    const validationSpy = jest.spyOn(require("../../../popups/replacement/Value"), "validateValueCfg");
    validationSpy.mockClear();
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").first().simulate("click");
    result.update();
    findValueInputRow(1).find("button").at(1).simulate("click");
    findValueInputRow(1).find(Select).first().instance().onChange({ value: "median" });
    findValueInputRow(1).find("i").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(validationSpy.mock.calls[0][0]).toStrictEqual({
      value: [{ type: "agg", value: "nan", replace: "median" }],
    });
  });

  it("DataViewer: value col replacement", async () => {
    const validationSpy = jest.spyOn(require("../../../popups/replacement/Value"), "validateValueCfg");
    validationSpy.mockClear();
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").first().simulate("click");
    result.update();
    findValueInputRow(1).find("button").last().simulate("click");
    findValueInputRow(1).find(Select).first().instance().onChange({ value: "col2" });
    findValueInputRow(1).find("i").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(validationSpy.mock.calls[0][0]).toStrictEqual({
      value: [{ type: "col", value: "nan", replace: "col2" }],
    });
  });

  it("DataViewer: value cfg validation", () => {
    const { validateValueCfg } = require("../../../popups/replacement/Value");
    expect(validateValueCfg([])).toBe("Please add (+) a replacement!");
  });
});
