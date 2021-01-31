import { mount } from "enzyme";
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

  it("DataViewer: range selection", async () => {
    const { DataViewer, ReactDataViewer } = require("../../../dtale/DataViewer");
    const { ReactGridEventHandler } = require("../../../dtale/GridEventHandler");
    const GridCell = require("../../../dtale/GridCell").ReactGridCell;
    const CopyRangeToClipboard = require("../../../popups/CopyRangeToClipboard").ReactCopyRangeToClipboard;
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
    let cellIdx = result.find(GridCell).at(20).find("div").prop("cell_idx");
    const instance = result.find(ReactGridEventHandler).instance();
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
      shiftKey: true,
    });
    cellIdx = result.find(GridCell).last().find("div").prop("cell_idx");
    instance.handleMouseOver({
      target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
      shiftKey: true,
    });
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
      shiftKey: true,
    });
    result.update();
    expect(result.find(ReactDataViewer).instance().state.rangeSelect).toEqual({
      start: "3|3",
      end: "4|5",
    });
    const copyRange = result.find(CopyRangeToClipboard).first();
    expect(copyRange.instance().state.finalText).toBe("foo\t2000-01-01\nfoo\t\nfoo\t\n");
    copyRange.find("div.form-group").first().find("i").simulate("click");
    expect(copyRange.instance().state.finalText).toBe("col3\tcol4\nfoo\t2000-01-01\nfoo\t\nfoo\t\n");
    copyRange.instance().copy();
    expect(result.find(ReactDataViewer).instance().state.rangeSelect).toBeNull();
  });
});
