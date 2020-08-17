import { mount } from "enzyme";
import $ from "jquery";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, tick, tickUpdate, withGlobalJquery } from "../test-utils";
import { clickColMenuButton, openColMenu } from "./iframe-utils";

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

  it("DataViewer: renaming a column", async () => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const CreateColumn = require("../../popups/create/CreateColumn").ReactCreateColumn;
    const CreateTypeConversion = require("../../popups/create/CreateTypeConversion").CreateTypeConversion;

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

    await tickUpdate(result);
    await openColMenu(result, 2);
    clickColMenuButton(result, "Type Conversion");
    await tickUpdate(result);
    result.find(CreateTypeConversion).find("div.form-group").first().find("button").at(2).simulate("click");
    result.update();
    result.find(CreateColumn).find("div.modal-footer").find("button").first().simulate("click");
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col3",
      fmt: null,
      unit: null,
      to: "float",
      from: "object",
      applyAllType: false,
    });
  });
});
