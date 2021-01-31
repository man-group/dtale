import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../test-utils";
import { clickColMenuSubButton, openColMenu, validateHeaders } from "./iframe-utils";

describe("DataViewer column tests", () => {
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

  it("DataViewer: sorting operations", async () => {
    const { DataViewer } = require("../../dtale/DataViewer");
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
    await openColMenu(result, 3);
    clickColMenuSubButton(result, "Asc");
    expect(result.find("div.row div.col").first().text()).toBe("Sort:col4 (ASC)");
    clickColMenuSubButton(result, "Desc");
    expect(result.find("div.row div.col").first().text()).toBe("Sort:col4 (DESC)");
    clickColMenuSubButton(result, "None");
    validateHeaders(result, ["col1", "col2", "col3", "col4"]);
  });
});
