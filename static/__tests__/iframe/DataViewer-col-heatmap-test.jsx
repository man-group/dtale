import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../test-utils";
import { clickColMenuButton, findColMenuButton, openColMenu, validateHeaders } from "./iframe-utils";

describe("DataViewer iframe tests", () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });
  let result, DataViewer;

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

    DataViewer = require("../../dtale/DataViewer").DataViewer;
  });

  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "", iframe: "True" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tickUpdate(result);
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: toggling heatmap column", async () => {
    await openColMenu(result, 1);
    clickColMenuButton(result, "Heat Map");
    await tickUpdate(result);
    validateHeaders(result, ["col1", "col2", "col3", "col4"]);
    expect(result.find("ReactDataViewer").instance().state.backgroundMode).toBe("heatmap-col-col2");
    await openColMenu(result, 1);
    clickColMenuButton(result, "Heat Map");
    await tickUpdate(result);
    expect(result.find("ReactDataViewer").instance().state.backgroundMode).toBeNull();
    await openColMenu(result, 3);
    expect(findColMenuButton(result, "Heat Map")).toHaveLength(0);
  });
});
