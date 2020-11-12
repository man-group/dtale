import { mount } from "enzyme";
import $ from "jquery";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

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
    Object.defineProperty(global.document, "execCommand", { value: _.noop });

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
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  });

  it("DataViewer: column range selection", async () => {
    const CopyRangeToClipboard = require("../../popups/CopyRangeToClipboard").ReactCopyRangeToClipboard;
    const text = "COPIED_TEXT";
    const postSpy = jest.spyOn($, "post");
    postSpy.mockImplementation((_url, _params, callback) => callback(text));
    const { DataViewer, ReactDataViewer } = require("../../dtale/DataViewer");
    const { ReactHeader } = require("../../dtale/Header");
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
    let instance = result.find(ReactHeader).at(1);
    instance.find("div.headerCell").simulate("click", { shiftKey: true });
    //result.update();
    expect(result.find(ReactDataViewer).instance().state.columnRange).toEqual({
      start: 1,
      end: 1,
    });
    instance = result.find(ReactHeader).at(2);
    instance.instance().handleMouseOver({
      shiftKey: true,
    });
    expect(result.find(ReactDataViewer).instance().state.columnRange).toEqual({
      start: 1,
      end: 2,
    });
    instance.find("div.headerCell").simulate("click", { shiftKey: true });
    result.update();
    const copyRange = result.find(CopyRangeToClipboard).first();
    expect(copyRange.instance().state.finalText).toBe(text);
    expect(postSpy).toBeCalledTimes(1);
    expect(postSpy).toBeCalledWith("/dtale/build-column-copy/1", { columns: `["col1","col2"]` }, expect.any(Function));
    postSpy.mockRestore();
  });

  it("DataViewer: column ctrl selection", async () => {
    const { DataViewer, ReactDataViewer } = require("../../dtale/DataViewer");
    const { ReactHeader } = require("../../dtale/Header");
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
    let instance = result.find(ReactHeader).at(1);
    instance.find("div.headerCell").simulate("click", { ctrlKey: true });
    expect(result.find(ReactDataViewer).instance().state.ctrlCols).toEqual([1]);
    instance = result.find(ReactHeader).at(2);
    instance.find("div.headerCell").simulate("click", { ctrlKey: true });
    expect(result.find(ReactDataViewer).instance().state.ctrlCols).toEqual([1, 2]);
    instance = result.find(ReactHeader).at(1);
    instance.find("div.headerCell").simulate("click", { ctrlKey: true });
    expect(result.find(ReactDataViewer).instance().state.ctrlCols).toEqual([2]);
  });
});
