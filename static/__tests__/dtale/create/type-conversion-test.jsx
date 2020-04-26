/* eslint max-lines: "off" */
import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { CreateTypeConversion } from "../../../popups/create/CreateTypeConversion";
import mockPopsicle from "../../MockPopsicle";
import * as t from "../../jest-assertions";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, withGlobalJquery } from "../../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

function initialize(res) {
  res
    .find("div.form-group")
    .first()
    .find("input")
    .first()
    .simulate("change", { target: { value: "conv_col" } });
  res.find("div.form-group").at(1).find("button").last().simulate("click");
}

function submit(res) {
  res.find("div.modal-footer").first().find("button").first().simulate("click");
}

describe("DataViewer tests", () => {
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

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  });

  test("DataViewer: build int conversion column", done => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    const CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );

    setTimeout(() => {
      result.update();
      clickMainMenuButton(result, "Build Column");
      setTimeout(() => {
        result.update();
        initialize(result.find(CreateColumn));
        result.update();
        t.equal(result.find(CreateTypeConversion).length, 1, "should show build conversion column");
        result.find(CreateTypeConversion).find(Select).first().instance().onChange({ value: "col1" });
        result.update();
        result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
        result.update();
        result.find(CreateTypeConversion).find(Select).at(1).instance().onChange({ value: "YYYYMMDD" });
        submit(result);
        setTimeout(() => {
          t.deepEqual(result.find(CreateColumn).instance().state.cfg, {
            to: "date",
            from: "int64",
            col: "col1",
            unit: "YYYYMMDD",
            fmt: null,
          });
          result.update();
          done();
        }, 400);
      }, 400);
    }, 600);
  });

  test("DataViewer: build float conversion column", done => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    const CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );

    setTimeout(() => {
      result.update();
      clickMainMenuButton(result, "Build Column");
      setTimeout(() => {
        result.update();
        initialize(result.find(CreateColumn));
        result.update();
        result.find(CreateTypeConversion).find(Select).first().instance().onChange({ value: "col2" });
        result.update();
        result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
        submit(result);
        setTimeout(() => {
          t.deepEqual(result.find(CreateColumn).instance().state.cfg, {
            col: "col2",
            to: "int",
            from: "float64",
            fmt: null,
            unit: null,
          });
          result.update();
          done();
        }, 400);
      }, 400);
    }, 600);
  });

  test("DataViewer: build string conversion column", done => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    const CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );

    setTimeout(() => {
      result.update();
      clickMainMenuButton(result, "Build Column");
      setTimeout(() => {
        result.update();
        initialize(result.find(CreateColumn));
        result.update();
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
        setTimeout(() => {
          t.deepEqual(result.find(CreateColumn).instance().state.cfg, {
            col: "col3",
            to: "date",
            from: "object",
            fmt: "%d/%m/%Y",
            unit: null,
          });
          result.update();
          done();
        }, 400);
      }, 400);
    }, 600);
  });

  test("DataViewer: build date conversion column", done => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    const CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );

    setTimeout(() => {
      result.update();
      clickMainMenuButton(result, "Build Column");
      setTimeout(() => {
        result.update();
        initialize(result.find(CreateColumn));
        result.update();
        result.find(CreateTypeConversion).find(Select).first().instance().onChange({ value: "col4" });
        result.update();
        result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
        result.update();
        result.find(CreateTypeConversion).find(Select).at(1).instance().onChange({ value: "ms" });
        submit(result);
        setTimeout(() => {
          t.deepEqual(result.find(CreateColumn).instance().state.cfg, {
            col: "col4",
            to: "int",
            from: "datetime64[ns]",
            unit: "ms",
            fmt: null,
          });
          result.update();
          done();
        }, 400);
      }, 400);
    }, 600);
  });

  test("DataViewer: build conversion cfg validation", done => {
    const { validateTypeConversionCfg } = require("../../../popups/create/CreateTypeConversion");
    t.equal(validateTypeConversionCfg({ col: null }), "Missing a column selection!");
    t.equal(validateTypeConversionCfg({ col: "col1", to: null }), "Missing a conversion selection!");
    t.equal(
      validateTypeConversionCfg({
        col: "col2",
        to: "date",
        from: "int64",
        unit: null,
      }),
      "Missing a unit selection!"
    );
    t.equal(
      validateTypeConversionCfg({
        col: "col2",
        to: "int",
        from: "datetime64[ns]",
        unit: "D",
      }),
      "Invalid unit selection, valid options are 'YYYYMMDD' or 'ms'"
    );
    t.equal(
      validateTypeConversionCfg({
        col: "col2",
        to: "int",
        from: "datetime64[ns]",
        unit: "ms",
      }),
      null
    );
    done();
  });
});
