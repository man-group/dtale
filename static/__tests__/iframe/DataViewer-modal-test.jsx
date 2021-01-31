import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../test-utils";
import { clickColMenuButton, openColMenu, validateHeaders } from "./iframe-utils";

describe("DataViewer iframe tests", () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerHeight: 1240,
    innerWidth: 1005,
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

  it("DataViewer: column analysis display in a modal", async () => {
    const bu = require("../../dtale/backgroundUtils").default;
    const { DataViewer } = require("../../dtale/DataViewer");
    const ColumnMenu = require("../../dtale/column/ColumnMenu").ReactColumnMenu;
    const ColumnAnalysis = require("../../popups/analysis/ColumnAnalysis").ReactColumnAnalysis;
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
    result.find(MultiGrid).first().instance();
    validateHeaders(result, ["col1", "col2", "col3", "col4"]);
    await openColMenu(result, 1);
    expect(result.find("#column-menu-div").length).toBe(1);
    expect(result.find(ColumnMenu).first().find("header").first().text()).toBe(
      `Column "col2"Data Type:float64${bu.flagIcon}Low Variance:True`
    );
    clickColMenuButton(result, "Column Analysis");
    await tickUpdate(result);
    expect(result.find(ColumnAnalysis).length).toBe(1);
  });
});
