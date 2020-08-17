import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { ModalClose, ModalFooter } from "react-modal-bootstrap";
import { Provider } from "react-redux";
import Select from "react-select";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../../MockPopsicle";
import { clickColMenuButton } from "../../iframe/iframe-utils";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

const TEXT_TESTS = [
  "EX: -123456.789 => -123456.789000",
  "EX: -123456.789 => -123,456.789000",
  "EX: -123456.789 => -123.456789k",
  "EX: -123456.789 => -1.234568e+5",
  "EX: -123456.789 => 1.23456789b-BPS",
];

describe("DataViewer tests", () => {
  const { open } = window;
  let result, DataViewer, ReactDataViewer, Formatting, NumericFormatting;

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
        const { urlFetcher } = require("../../redux-test-utils").default;
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
    const dv = require("../../../dtale/DataViewer");
    DataViewer = dv.DataViewer;
    ReactDataViewer = dv.ReactDataViewer;
    Formatting = require("../../../popups/formats/Formatting").default;
    NumericFormatting = require("../../../popups/formats/NumericFormatting").default;
  });

  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tickUpdate(result);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    window.open = open;
  });

  it("DataViewer: numeric formatting", async () => {
    // select column
    result.find(".main-grid div.headerCell div").at(1).simulate("click");
    result.update();
    clickColMenuButton(result, "Formats");
    result.update();
    expect(result.find(NumericFormatting).length).toBe(1);
    result.find(Formatting).find(ModalClose).first().simulate("click");
    result.update();
    expect(result.find(Formatting).instance().props.visible).toBe(false);
    result.update();
    clickColMenuButton(result, "Formats");
    result.update();

    result.find(NumericFormatting).find("i.ico-info-outline").first().simulate("click");
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("http://numeraljs.com/#format");
    _.forEach(TEXT_TESTS, (expected, i) => {
      let clicker = result.find(NumericFormatting).find("div.form-group").at(i).find("button");
      if (i == 0) {
        clicker = clicker.last();
      } else {
        clicker = clicker.first();
      }
      clicker.simulate("click");
      expect(result.find(NumericFormatting).find("small").first().text()).toBe(expected);
    });
    result.find(NumericFormatting).find("div.form-group").at(5).find("button").first().simulate("click");
    expect(_.includes(result.find(NumericFormatting).find("small").first().html(), 'style="color: red;"')).toBe(true);
    _.forEach(_.range(1, 6), i => {
      result.find(NumericFormatting).find("div.form-group").at(i).find("button").last().simulate("click");
    });
    result.find(Formatting).find("div.form-group").last().find(Select).instance().onChange({ value: "-" });
    result.find(Formatting).find(ModalFooter).first().find("button").first().simulate("click");
    await tickUpdate(result);
    const grid = result.find(MultiGrid).first().instance();
    expect(grid.props.data["0"].col2.view).toBe("2.500000");
    expect(result.find(ReactDataViewer).instance().state.nanDisplay).toBe("-");
  });
});
