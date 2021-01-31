import { mount } from "enzyme";
import $ from "jquery";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("DataViewer tests", () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    Object.defineProperty(global.document, "execCommand", { value: _.noop });

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: row range selection", async () => {
    const CopyRangeToClipboard = require("../../../popups/CopyRangeToClipboard").ReactCopyRangeToClipboard;
    const text = "COPIED_TEXT";
    const postSpy = jest.spyOn($, "post");
    postSpy.mockImplementation((_url, _params, callback) => callback(text));
    const { DataViewer, ReactDataViewer } = require("../../../dtale/DataViewer");
    const { ReactGridEventHandler } = require("../../../dtale/GridEventHandler");
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
    const instance = result.find(ReactGridEventHandler).instance();
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: "0|1" } } },
      shiftKey: true,
    });
    expect(result.find(ReactDataViewer).instance().state.rowRange).toEqual({
      start: 1,
      end: 1,
    });
    instance.handleMouseOver({
      target: { attributes: { cell_idx: { nodeValue: "0|2" } } },
      shiftKey: true,
    });
    expect(result.find(ReactDataViewer).instance().state.rowRange).toEqual({
      start: 1,
      end: 2,
    });
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: "0|2" } } },
      shiftKey: true,
    });
    result.update();
    const copyRange = result.find(CopyRangeToClipboard).first();
    expect(copyRange.instance().state.finalText).toBe(text);
    expect(postSpy).toBeCalledTimes(1);
    expect(postSpy).toBeCalledWith(
      "/dtale/build-row-copy/1",
      { start: 1, end: 2, columns: `["col1","col2","col3","col4"]` },
      expect.any(Function)
    );
    postSpy.mockRestore();
  });
});
