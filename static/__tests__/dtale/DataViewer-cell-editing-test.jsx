import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../test-utils";

describe("DataViewer tests", () => {
  const { open } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 1205,
    offsetHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    delete window.open;
    window.open = jest.fn();

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    mockChartJS();
    jest.mock("popsicle", () => mockBuildLibs);
  });

  afterAll(() => {
    dimensions.afterAll();
    window.open = open;
  });

  it("DataViewer: cell editing", async () => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const { ReactGridEventHandler } = require("../../dtale/GridEventHandler");
    const GridCell = require("../../dtale/GridCell").ReactGridCell;
    const GridCellEditor = require("../../dtale/GridCellEditor").ReactGridCellEditor;
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
    const cellIdx = result.find(GridCell).last().find("div").prop("cell_idx");
    let instance = result.find(ReactGridEventHandler).instance();
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
    });
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
    });
    result.update();
    let cellEditor = result.find(GridCellEditor).first();
    cellEditor.instance().onKeyDown({ key: "Escape" });
    instance = result.find(ReactGridEventHandler).instance();
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
    });
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
    });
    result.update();
    cellEditor = result.find(GridCellEditor).first();
    cellEditor.find("input").simulate("change", { target: { value: "20000101" } });
    cellEditor.instance().onKeyDown({ key: "Enter" });
    await tick();
    expect(result.find(GridCell).last().text()).toBe("20000101");
  });
});
