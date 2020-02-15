import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

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
        const { urlFetcher } = require("../redux-test-utils").default;
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

  test("DataViewer: build datetime property column", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const CreateColumn = require("../../popups/create/CreateColumn").ReactCreateColumn;
    const { CreateDatetime } = require("../../popups/create/CreateDatetime");

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
        result
          .find(CreateColumn)
          .find("div.form-group")
          .first()
          .find("input")
          .first()
          .simulate("change", { target: { value: "datetime_col" } });
        result
          .find(CreateColumn)
          .find("div.form-group")
          .at(1)
          .find("button")
          .last()
          .simulate("click");
        result.update();
        t.equal(result.find(CreateDatetime).length, 1, "should show build datetime column");
        const dateInputs = result.find(CreateDatetime).first();
        dateInputs
          .find(Select)
          .first()
          .instance()
          .onChange({ value: "col4" });
        dateInputs
          .find("div.form-group")
          .at(2)
          .find("button")
          .first()
          .simulate("click");
        result
          .find("div.modal-footer")
          .first()
          .find("button")
          .first()
          .simulate("click");
        setTimeout(() => {
          result.update();
          done();
        }, 400);
      }, 400);
    }, 600);
  });

  test("DataViewer: build datetime conversion column", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const CreateColumn = require("../../popups/create/CreateColumn").ReactCreateColumn;
    const { CreateDatetime } = require("../../popups/create/CreateDatetime");

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
        result
          .find(CreateColumn)
          .find("div.form-group")
          .first()
          .find("input")
          .first()
          .simulate("change", { target: { value: "datetime_col" } });
        result
          .find(CreateColumn)
          .find("div.form-group")
          .at(1)
          .find("button")
          .last()
          .simulate("click");
        result.update();
        t.equal(result.find(CreateDatetime).length, 1, "should show build datetime column");
        const dateInputs = result.find(CreateDatetime).first();
        dateInputs
          .find(Select)
          .first()
          .instance()
          .onChange({ value: "col4" });
        dateInputs
          .find("div.form-group")
          .at(1)
          .find("button")
          .last()
          .simulate("click");
        dateInputs
          .find("div.form-group")
          .at(2)
          .find("button")
          .first()
          .simulate("click");
        result
          .find("div.modal-footer")
          .first()
          .find("button")
          .first()
          .simulate("click");
        setTimeout(() => {
          result.update();
          done();
        }, 400);
      }, 400);
    }, 600);
  });

  test("DataViewer: build datetime cfg validation", done => {
    const { validateDatetimeCfg } = require("../../popups/create/CreateDatetime");
    t.equal(validateDatetimeCfg({ col: null }), "Missing a column selection!");
    done();
  });
});
