/* eslint max-lines: "off" */
import { mount } from "enzyme";
import moment from "moment";
import React from "react";
import { Provider } from "react-redux";

import { CreateRandom } from "../../../popups/create/CreateRandom";
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
    .simulate("change", { target: { value: "rando_col" } });
  res
    .find("div.form-group")
    .at(1)
    .find("button")
    .last()
    .simulate("click");
}

function submit(res) {
  res
    .find("div.modal-footer")
    .first()
    .find("button")
    .first()
    .simulate("click");
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

  test("DataViewer: build random float column", done => {
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
        t.equal(result.find(CreateRandom).length, 1, "should show build random column");
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
        setTimeout(() => {
          t.deepEqual(result.find(CreateColumn).instance().state.cfg, {
            type: "float",
            low: "-2",
            high: "2",
          });
          result.update();
          done();
        }, 400);
      }, 400);
    }, 600);
  });

  test("DataViewer: build random int column", done => {
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
        const randomInputs = result.find(CreateRandom).first();
        randomInputs
          .find("div.form-group")
          .first()
          .find("button")
          .at(1)
          .simulate("click");
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
        setTimeout(() => {
          t.deepEqual(result.find(CreateColumn).instance().state.cfg, {
            type: "int",
            low: "-2",
            high: "2",
          });
          result.update();
          done();
        }, 400);
      }, 400);
    }, 600);
  });

  test("DataViewer: build random string column", done => {
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
        const randomInputs = result.find(CreateRandom).first();
        randomInputs
          .find("div.form-group")
          .first()
          .find("button")
          .at(2)
          .simulate("click");
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
        setTimeout(() => {
          t.deepEqual(result.find(CreateColumn).instance().state.cfg, {
            type: "string",
            chars: "abcde",
            length: "5",
          });
          result.update();
          done();
        }, 400);
      }, 400);
    }, 600);
  });

  test("DataViewer: build random choice column", done => {
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
        const randomInputs = result.find(CreateRandom).first();
        randomInputs
          .find("div.form-group")
          .first()
          .find("button")
          .at(3)
          .simulate("click");
        randomInputs
          .find("div.form-group")
          .at(1)
          .find("input")
          .simulate("change", { target: { value: "foo,bar,baz" } });
        submit(result);
        setTimeout(() => {
          t.deepEqual(result.find(CreateColumn).instance().state.cfg, {
            type: "choice",
            choices: "foo,bar,baz",
          });
          result.update();
          done();
        }, 400);
      }, 400);
    }, 600);
  });

  test("DataViewer: build random bool column", done => {
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
        const randomInputs = result.find(CreateRandom).first();
        randomInputs
          .find("div.form-group")
          .first()
          .find("button")
          .at(4)
          .simulate("click");
        submit(result);
        setTimeout(() => {
          t.deepEqual(result.find(CreateColumn).instance().state.cfg, {
            type: "bool",
          });
          result.update();
          done();
        }, 400);
      }, 400);
    }, 600);
  });

  test("DataViewer: build random date column", done => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    const CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;
    const DateInput = require("@blueprintjs/datetime").DateInput;

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
        const randomInputs = result.find(CreateRandom).first();
        randomInputs
          .find("div.form-group")
          .first()
          .find("button")
          .last()
          .simulate("click");
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
        result
          .find(CreateColumn)
          .find("i")
          .first()
          .simulate("click");
        result
          .find(CreateColumn)
          .find("i")
          .last()
          .simulate("click");
        submit(result);
        setTimeout(() => {
          t.deepEqual(result.find(CreateColumn).instance().state.cfg, {
            type: "date",
            start: "20000101",
            end: "20000102",
            businessDay: true,
            timestamps: true,
          });
          result.update();
          done();
        }, 400);
      }, 400);
    }, 600);
  });

  test("DataViewer: build random cfg validation", done => {
    const { validateRandomCfg } = require("../../../popups/create/CreateRandom");
    t.equal(
      validateRandomCfg({ type: "int", low: "3", high: "2" }),
      "Invalid range specification, low must be less than high!"
    );
    t.equal(validateRandomCfg({ type: "date", start: "20000101", end: "19991231" }), "Start must be before End!");
    done();
  });
});
