import { mount } from "enzyme";
import $ from "jquery";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../test-utils";

describe("DataViewer tests", () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 1205,
    offsetHeight: 775,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    Object.defineProperty(global.document, "execCommand", { value: _.noop });

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  afterAll(dimensions.afterAll);

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
    instance.find("div.headerCell").find(".text-nowrap").simulate("click", { shiftKey: true });
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
    instance.find("div.headerCell").find(".text-nowrap").simulate("click", { shiftKey: true });
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
    instance.find("div.headerCell").find(".text-nowrap").simulate("click", { ctrlKey: true });
    expect(result.find(ReactDataViewer).instance().state.ctrlCols).toEqual([1]);
    instance = result.find(ReactHeader).at(2);
    instance.find("div.headerCell").find(".text-nowrap").simulate("click", { ctrlKey: true });
    expect(result.find(ReactDataViewer).instance().state.ctrlCols).toEqual([1, 2]);
    instance = result.find(ReactHeader).at(1);
    instance.find("div.headerCell").find(".text-nowrap").simulate("click", { ctrlKey: true });
    expect(result.find(ReactDataViewer).instance().state.ctrlCols).toEqual([2]);
  });
});
