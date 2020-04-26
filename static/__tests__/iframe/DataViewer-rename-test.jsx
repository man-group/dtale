import { mount } from "enzyme";
import $ from "jquery";
import React from "react";
import { Provider } from "react-redux";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";
import { clickColMenuButton } from "./iframe-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("DataViewer iframe tests", () => {
  const { post } = $;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
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
    $.post = post;
  });

  test("DataViewer: renaming a column", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const { ReactRename } = require("../../popups/Rename");

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "", iframe: "True" }, store);
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
      result.find(".main-grid div.headerCell div").last().simulate("click");
      clickColMenuButton(result, "Rename");
      result
        .find(ReactRename)
        .find("div.modal-body")
        .find("input")
        .first()
        .simulate("change", { target: { value: "col2" } });
      result.update();
      t.ok(result.find(ReactRename).find(RemovableError).length > 0);
      result
        .find(ReactRename)
        .find("div.modal-body")
        .find("input")
        .first()
        .simulate("change", { target: { value: "col5" } });
      result.update();
      result.find(ReactRename).find("div.modal-footer").find("button").first().simulate("click");
      setTimeout(() => {
        result.update();
        t.deepEqual(
          result.find(".main-grid div.headerCell").map(hc => hc.text()),
          ["col1", "col2", "col3", "col5"],
          "should render column headers"
        );
        done();
      }, 400);
    }, 600);
  });
});
