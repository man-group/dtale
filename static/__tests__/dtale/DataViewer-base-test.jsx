import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../test-utils";

const COL_PROPS = _.map(reduxUtils.DATA.columns, (c, i) => _.assignIn({ width: i == 0 ? 70 : 20, locked: i == 0 }, c));

describe("DataViewer tests", () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: base operations (column selection, locking, sorting, moving to front, col-analysis,...", async () => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const { DataViewerMenu } = require("../../dtale/menu/DataViewerMenu");
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
    const grid = result.find(MultiGrid).first().instance();
    expect(result.find(".main-grid div.headerCell").map(hc => hc.text())).toEqual(["col1", "col2", "col3", "col4"]);
    expect(grid.props.columns).toEqual(COL_PROPS);
    result.find("div.crossed").first().find("div.grid-menu").first().simulate("click");
    expect(
      result
        .find(DataViewerMenu)
        .find("ul li span.font-weight-bold")
        .map(s => s.text())
    ).toEqual(
      _.concat(
        ["Convert To XArray", "Describe", "Custom Filter", "Build Column", "Merge & Stack", "Summarize Data"],
        ["Duplicates", "Correlations", "Predictive Power Score", "Charts", "Network Viewer", "Heat Map"],
        ["Highlight Dtypes", "Highlight Missing", "Highlight Outliers", "Highlight Range", "Low Variance Flag"],
        ["Instances 1", "Code Export", "Export", "Load Data", "Refresh Widths", "About", "Theme", "Reload Data"],
        ["Pin menu", "Shutdown"]
      )
    );
    await tick();
    clickMainMenuButton(result, "Refresh Widths");
    clickMainMenuButton(result, "Shutdown", "a");
  });
});
