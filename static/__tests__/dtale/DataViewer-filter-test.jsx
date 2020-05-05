import { mount } from "enzyme";
import React from "react";
import { ModalClose } from "react-modal-bootstrap";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, tick, tickUpdate, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

const toggleFilterMenu = async result => {
  clickMainMenuButton(result, "Custom Filter");
  await tickUpdate(result);
};

describe("DataViewer tests", () => {
  const { open } = window;
  let result, Filter, DataViewerInfo;
  let dataId = 0;

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
    Filter = require("../../popups/Filter").ReactFilter;
    DataViewerInfo = require("../../dtale/DataViewerInfo").ReactDataViewerInfo;
  });

  beforeEach(async () => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const store = reduxUtils.createDtaleStore();
    const finalDataId = dataId === 2 ? "error" : dataId + "";
    buildInnerHTML({ settings: "", dataId: finalDataId }, store);
    dataId++;
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tick();
    await toggleFilterMenu(result);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
    window.open = open;
  });

  it("DataViewer: filtering", async () => {
    expect(result.find(Filter).length).toBe(1);
    result.find(ModalClose).first().simulate("click");
    result.update();
    expect(result.find(Filter).length).toBe(0);
    await toggleFilterMenu(result);
    result.find(Filter).first().find("div.modal-footer").first().find("button").at(1).simulate("click");
    await tickUpdate(result);
    expect(result.find(Filter).length).toBe(0);
    await toggleFilterMenu(result);
    result
      .find(Filter)
      .first()
      .find("textarea")
      .simulate("change", { target: { value: "test" } });
    result.update();
    result.find(Filter).first().find("button").last().simulate("click");
    await tickUpdate(result);
    expect(result.find(DataViewerInfo).first().text()).toBe("Filter:test");
    result.find(DataViewerInfo).first().find("i.ico-cancel").last().simulate("click");
    await tickUpdate(result);
    expect(result.find(DataViewerInfo).find("div.row").length).toBe(0);
  });

  it("DataViewer: filtering with errors & documentation", async () => {
    result
      .find(Filter)
      .first()
      .find("textarea")
      .simulate("change", { target: { value: "error" } });
    result.update();
    result.find(Filter).first().find("button").last().simulate("click");
    await tickUpdate(result);
    expect(result.find(RemovableError).find("div.dtale-alert").text()).toBe("No data found");
    result.find(Filter).find(RemovableError).first().instance().props.onRemove();
    result.update();
    expect(result.find(Filter).find("div.dtale-alert").length).toBe(0);
    result.find(Filter).find("div.modal-footer").find("button").first().simulate("click");
    const pandasURL = "https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#indexing-query";
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe(pandasURL);
  });

  test("DataViewer: filtering, context variables error", () => {
    expect(result.find(Filter).find(RemovableError).find("div.dtale-alert").text()).toBe(
      "Error loading context variables"
    );
  });

  it("DataViewer: column filters", async () => {
    const mainCol = result.find(Filter).find("div.col-md-12.h-100");
    expect(mainCol.text()).toBe("Active Column Filters:foo == 1 andCustom Filter:foo == 1");
    mainCol.find("i.ico-cancel").first().simulate("click");
    await tick();
    expect(result.find(Filter).find("div.col-md-12.h-100").text()).toBe("Custom Filter:foo == 1");
  });
});
