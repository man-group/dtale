import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, tickUpdate, withGlobalJquery } from "../../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

describe("DataViewer tests", () => {
  let result, store, XArrayDimensions;

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
        if (_.startsWith(url, "/dtale/xarray-coordinates/1")) {
          return {
            data: [
              { name: "foo", count: 10, dtype: "object" },
              { name: "bar", count: 5, dtype: "float64" },
            ],
          };
        } else if (_.startsWith(url, "/dtale/xarray-dimension-values/1/foo")) {
          return {
            data: [{ value: "foo1" }, { value: "foo2" }, { value: "foo3" }],
          };
        } else if (_.startsWith(url, "/dtale/xarray-dimension-values/1/bar")) {
          return {
            data: [{ value: "bar1" }, { value: "bar2" }, { value: "bar3" }],
          };
        }
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

  beforeEach(async () => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    XArrayDimensions = require("../../../popups/XArrayDimensions").ReactXArrayDimensions;

    store = reduxUtils.createDtaleStore();
    const xarrayDim = "{&quot;foo&quot;:&quot;foo1&quot;}";
    buildInnerHTML({ settings: "", xarray: "True", xarrayDim }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tickUpdate(result);
    clickMainMenuButton(result, "XArray Dimensions");
    await tickUpdate(result);
    await tickUpdate(result);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  });

  it("DataViewer: update selected dimensions of xarray", async () => {
    expect(result.find(XArrayDimensions).find("li").first().find(Select).instance().state.value).toEqual({
      value: "foo1",
    });
    result.find(XArrayDimensions).find("li").first().find(Select).first().instance().onChange({ value: "foo2" });
    result.find(XArrayDimensions).find("li").last().simulate("click");
    await tickUpdate(result);
    result.find(XArrayDimensions).find("li").last().find(Select).first().instance().onChange({ value: "bar2" });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(store.getState().xarrayDim).toEqual({ foo: "foo2", bar: "bar2" });
  });

  it("DataViewer: clearing selected dimensions", async () => {
    result.find(XArrayDimensions).find("li").first().find(Select).first().instance().onChange(null);
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(store.getState().xarrayDim).toEqual({});
  });
});
