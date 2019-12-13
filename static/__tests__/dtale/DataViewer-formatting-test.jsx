import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { ModalClose, ModalFooter } from "react-modal-bootstrap";
import { Provider } from "react-redux";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

const TEXT_TESTS = [
  ["EX: -123456.789 => -123456.789000", "should display precision in sample formatting"],
  ["EX: -123456.789 => -123,456.789000", "should display thousand separator in sample formatting"],
  ["EX: -123456.789 => -123.456789k", "should display abbreviation in sample formatting"],
  ["EX: -123456.789 => -1.234568e+5", "should display exponent in sample formatting"],
  ["EX: -123456.789 => 1.23456789b-BPS", "should display BPS in sample formatting"],
];

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
    window.open = open;
  });

  test("DataViewer: formatting", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const Formatting = require("../../dtale/Formatting").default;

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

    setTimeout(() => {
      result.update();
      // select column
      result
        .find(".main-grid div.headerCell div")
        .at(1)
        .simulate("click");
      result.update();
      clickMainMenuButton(result, "Formats");
      result.update();
      t.equal(result.find(Formatting).length, 1, "should open formatting");
      result
        .find(Formatting)
        .find(ModalClose)
        .first()
        .simulate("click");
      result.update();
      t.notOk(result.find(Formatting).instance().props.visible, "should close formatting");
      result.update();
      clickMainMenuButton(result, "Formats");
      result.update();

      result
        .find(Formatting)
        .find("i.ico-info-outline")
        .first()
        .simulate("click");
      expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("http://numeraljs.com/#format");
      _.forEach(TEXT_TESTS, ([expected, msg], i) => {
        let clicker = result
          .find(Formatting)
          .find("div.form-group")
          .at(i)
          .find("button");
        if (i == 0) {
          clicker = clicker.last();
        } else {
          clicker = clicker.first();
        }
        clicker.simulate("click");
        t.equal(
          result
            .find(Formatting)
            .find("small")
            .first()
            .text(),
          expected,
          msg
        );
      });
      result
        .find(Formatting)
        .find("div.form-group")
        .at(5)
        .find("button")
        .first()
        .simulate("click");
      t.ok(
        _.includes(
          result
            .find(Formatting)
            .find("small")
            .first()
            .html(),
          'style="color: red;"'
        ),
        "should display red highlighting in sample formatting"
      );
      _.forEach(_.range(1, 6), i => {
        result
          .find(Formatting)
          .find("div.form-group")
          .at(i)
          .find("button")
          .last()
          .simulate("click");
      });
      result
        .find(Formatting)
        .find(ModalFooter)
        .first()
        .find("button")
        .first()
        .simulate("click");
      setTimeout(() => {
        result.update();
        const grid = result
          .find(MultiGrid)
          .first()
          .instance();
        t.equal(grid.props.data["0"].col2.view, "2.500000", "should update grid formatting");
        done();
      }, 400);
    }, 400);
  });
});
