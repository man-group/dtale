import { mount } from "enzyme";
import React from "react";
import { ModalFooter } from "react-modal-bootstrap";
import { Provider } from "react-redux";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../../MockPopsicle";
import { clickColMenuButton } from "../../iframe/iframe-utils";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../../test-utils";

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
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    window.open = open;
  });

  it("DataViewer: date formatting", async () => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    const Formatting = require("../../../popups/formats/Formatting").default;
    const DateFormatting = require("../../../popups/formats/DateFormatting").default;

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

    await tickUpdate(result);
    // select column
    result.find(".main-grid div.headerCell div").last().simulate("click");
    result.update();
    clickColMenuButton(result, "Formats");
    result.update();
    expect(result.find(DateFormatting).length).toBe(1);

    result.find(Formatting).find("i.ico-info-outline").first().simulate("click");
    const momentUrl = "https://momentjs.com/docs/#/displaying/format/";
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe(momentUrl);
    const input = result.find(DateFormatting).find("div.form-group").at(0).find("input");

    input.simulate("change", { target: { value: "YYYYMMDD" } });
    expect(result.find(DateFormatting).find("div.row").last().text()).toBe(
      "Raw:December 31st 1999, 7:00:00 pmFormatted:19991231"
    );

    result.find(Formatting).find(ModalFooter).first().find("button").first().simulate("click");
    await tickUpdate(result);
    const grid = result.find(MultiGrid).first().instance();
    expect(grid.props.data["0"].col4.view.length).toBe(8);
  });
});
