import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, withGlobalJquery } from "../test-utils";

describe("DataViewer within iframe tests", () => {
  const { location, open, top, self } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();

    delete window.location;
    delete window.open;
    delete window.top;
    delete window.self;
    window.location = { reload: jest.fn(), pathname: "/dtale/iframe/1" };
    window.open = jest.fn();
    window.top = { location: { href: "http://test.com" } };
    window.self = { location: { href: "http://test/dtale/iframe" } };

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);

    const mockDateInput = withGlobalJquery(() => require("@blueprintjs/datetime"));
    jest.mock("@blueprintjs/datetime", () => mockDateInput);
  });

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.open = open;
    window.top = top;
    window.self = self;
  });

  it("DataViewer: column menu rendering...", async () => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const { DataViewerMenu } = require("../../dtale/menu/DataViewerMenu");
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
    await tick();
    expect(
      result
        .find(DataViewerMenu)
        .find("ul li span.font-weight-bold")
        .map(s => s.text())
    ).toEqual(
      _.concat(
        ["Open In New Tab", "Convert To XArray", "Describe", "Custom Filter", "show_hide", "Dataframe Functions"],
        ["Clean Column", "Merge & Stack", "Summarize Data", "Timeseries", "Duplicates", "Missing Analysis"],
        ["Feature Analysis", "Correlations", "Predictive Power Score", "Charts", "Network Viewer", "Heat Map"],
        ["Highlight Dtypes", "Highlight Missing", "Highlight Outliers", "Highlight Range", "Low Variance Flag"],
        ["gage_rnr", "Instances 1", "Code Export", "Export", "Load Data", "Refresh Widths", "About", "Theme"],
        ["Reload Data", "Pin menu", "Language", "Shutdown"]
      )
    );
    clickMainMenuButton(result, "Open In New Tab");
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/dtale/main/1");
  });
});
