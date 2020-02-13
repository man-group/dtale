import { mount } from "enzyme";
import React from "react";
import { ModalFooter } from "react-modal-bootstrap";
import { Provider } from "react-redux";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import mockPopsicle from "../MockPopsicle";
import { clickColMenuButton } from "../iframe/iframe-utils";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

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

  test("DataViewer: date formatting", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const Formatting = require("../../popups/formats/Formatting").default;
    const DateFormatting = require("../../popups/formats/DateFormatting").default;

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
        .last()
        .simulate("click");
      result.update();
      clickColMenuButton(result, "Formats");
      result.update();
      t.equal(result.find(DateFormatting).length, 1, "should open numeric formatting");

      result
        .find(Formatting)
        .find("i.ico-info-outline")
        .first()
        .simulate("click");
      const momentUrl = "https://momentjs.com/docs/#/displaying/format/";
      expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe(momentUrl);
      const input = result
        .find(DateFormatting)
        .find("div.form-group")
        .at(0)
        .find("input");

      input.simulate("change", { target: { value: "YYYYMMDD" } });
      t.equal(
        result
          .find(DateFormatting)
          .find("div.row")
          .last()
          .text(),
        "Raw:December 31st 1999, 7:00:00 pmFormatted:19991231",
        "should update formatting hint"
      );

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
        t.equal(grid.props.data["0"].col4.view.length, 8, "should update grid formatting");
        done();
      }, 400);
    }, 400);
  });
});
