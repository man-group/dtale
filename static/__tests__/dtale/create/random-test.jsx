import { mount } from "enzyme";
import moment from "moment";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { CreateRandom } from "../../../popups/create/CreateRandom";
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
    clickBuilder(result, "Random");
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  });

  it("DataViewer: build random float column", async () => {
    expect(result.find(CreateRandom).length).toBe(1);
    const randomInputs = result.find(CreateRandom).first();
    randomInputs
      .find("div.form-group")
      .at(1)
      .find("input")
      .first()
      .simulate("change", { target: { value: "-2" } });
    randomInputs
      .find("div.form-group")
      .last()
      .find("input")
      .simulate("change", { target: { value: "2" } });
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      type: "float",
      low: "-2",
      high: "2",
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("random_col1");
  });

  it("DataViewer: build random int column", async () => {
    const randomInputs = result.find(CreateRandom).first();
    randomInputs.find("div.form-group").first().find("button").at(1).simulate("click");
    randomInputs
      .find("div.form-group")
      .at(1)
      .find("input")
      .simulate("change", { target: { value: "-2" } });
    randomInputs
      .find("div.form-group")
      .last()
      .find("input")
      .simulate("change", { target: { value: "2" } });
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      type: "int",
      low: "-2",
      high: "2",
    });
  });

  it("DataViewer: build random string column", async () => {
    const randomInputs = result.find(CreateRandom).first();
    randomInputs.find("div.form-group").first().find("button").at(2).simulate("click");
    randomInputs
      .find("div.form-group")
      .at(1)
      .find("input")
      .simulate("change", { target: { value: "5" } });
    randomInputs
      .find("div.form-group")
      .last()
      .find("input")
      .simulate("change", { target: { value: "abcde" } });
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      type: "string",
      chars: "abcde",
      length: "5",
    });
  });

  it("DataViewer: build random choice column", async () => {
    const randomInputs = result.find(CreateRandom).first();
    randomInputs.find("div.form-group").first().find("button").at(3).simulate("click");
    randomInputs
      .find("div.form-group")
      .at(1)
      .find("input")
      .simulate("change", { target: { value: "foo,bar,baz" } });
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      type: "choice",
      choices: "foo,bar,baz",
    });
  });

  it("DataViewer: build random bool column", async () => {
    const randomInputs = result.find(CreateRandom).first();
    randomInputs.find("div.form-group").first().find("button").at(4).simulate("click");
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      type: "bool",
    });
  });

  it("DataViewer: build random date column", async () => {
    const DateInput = require("@blueprintjs/datetime").DateInput;
    const randomInputs = result.find(CreateRandom).first();
    randomInputs.find("div.form-group").first().find("button").last().simulate("click");
    const dateInputs = result.find(CreateColumn).find(DateInput);
    dateInputs
      .first()
      .instance()
      .props.onChange(new Date(moment("20000101")));
    dateInputs
      .find(DateInput)
      .last()
      .instance()
      .props.onChange(new Date(moment("20000102")));
    result.find(CreateColumn).find("i").first().simulate("click");
    result.find(CreateColumn).find("i").last().simulate("click");
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      type: "date",
      start: "20000101",
      end: "20000102",
      businessDay: true,
      timestamps: true,
    });
  });

  it("DataViewer: build random cfg validation", () => {
    const { validateRandomCfg } = require("../../../popups/create/CreateRandom");
    expect(validateRandomCfg({ type: "int", low: "3", high: "2" })).toBe(
      "Invalid range specification, low must be less than high!"
    );
    expect(validateRandomCfg({ type: "date", start: "20000101", end: "19991231" })).toBe("Start must be before End!");
  });
});
