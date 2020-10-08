import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import { CreateTypeConversion } from "../../../popups/create/CreateTypeConversion";
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
        const { urlFetcher, DTYPES } = require("../../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/dtypes")) {
          return {
            dtypes: _.concat(DTYPES.dtypes, {
              name: "col5",
              index: 4,
              dtype: "mixed-integer",
              visible: true,
              unique_ct: 1,
            }),
            success: true,
          };
        }
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
    result
      .find(CreateColumn)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "conv_col" } });
    clickBuilder(result, "Type Conversion");
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  });

  it("DataViewer: build int conversion column", async () => {
    expect(result.find(CreateTypeConversion).length).toBe(1);
    result.find(CreateTypeConversion).find(Select).first().instance().onChange({ value: "col1" });
    result.update();
    result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
    result.update();
    result.find(CreateTypeConversion).find(Select).at(1).instance().onChange({ value: "YYYYMMDD" });
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      to: "date",
      from: "int64",
      col: "col1",
      unit: "YYYYMMDD",
      fmt: null,
      applyAllType: false,
    });
  });

  it("DataViewer: build float conversion column", async () => {
    result.find(CreateTypeConversion).find(Select).first().instance().onChange({ value: "col2" });
    result.update();
    result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col2",
      to: "int",
      from: "float64",
      fmt: null,
      unit: null,
      applyAllType: false,
    });
  });

  it("DataViewer: build string conversion column", async () => {
    result.find(CreateTypeConversion).find(Select).first().instance().onChange({ value: "col3" });
    result.update();
    result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
    result
      .find(CreateTypeConversion)
      .find("div.form-group")
      .at(2)
      .find("input")
      .first()
      .simulate("change", { target: { value: "%d/%m/%Y" } });
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col3",
      to: "date",
      from: "object",
      fmt: "%d/%m/%Y",
      unit: null,
      applyAllType: false,
    });
  });

  it("DataViewer: build mixed conversion column", async () => {
    result.find(CreateColumn).find("div.form-group").first().find("button").first().simulate("click");
    result.find(CreateTypeConversion).find(Select).first().instance().onChange({ value: "col5" });
    result.update();
    result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
    result.find(CreateTypeConversion).find("i.ico-check-box-outline-blank").simulate("click");
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col5",
      fmt: null,
      unit: null,
      to: "date",
      from: "mixed-integer",
      applyAllType: true,
    });
  });

  it("DataViewer: build date conversion column", async () => {
    result.find(CreateTypeConversion).find(Select).first().instance().onChange({ value: "col4" });
    result.update();
    result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
    result.update();
    result.find(CreateTypeConversion).find(Select).at(1).instance().onChange({ value: "ms" });
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col4",
      to: "int",
      from: "datetime64[ns]",
      unit: "ms",
      fmt: null,
      applyAllType: false,
    });
  });

  it("DataViewer: build conversion cfg validation", () => {
    const { validateTypeConversionCfg } = require("../../../popups/create/CreateTypeConversion");
    expect(validateTypeConversionCfg({ col: null })).toBe("Missing a column selection!");
    expect(validateTypeConversionCfg({ col: "col1", to: null })).toBe("Missing a conversion selection!");
    expect(
      validateTypeConversionCfg({
        col: "col2",
        to: "date",
        from: "int64",
        unit: null,
      })
    ).toBe("Missing a unit selection!");
    expect(
      validateTypeConversionCfg({
        col: "col2",
        to: "int",
        from: "datetime64[ns]",
        unit: "D",
      })
    ).toBe("Invalid unit selection, valid options are 'YYYYMMDD' or 'ms'");
    expect(
      validateTypeConversionCfg({
        col: "col2",
        to: "int",
        from: "datetime64[ns]",
        unit: "ms",
      })
    ).toBeNull();
  });
});
