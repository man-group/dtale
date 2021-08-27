import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../RemovableError";
import StructuredFilters from "../../popups/filter/StructuredFilters";
import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../test-utils";

const toggleFilterMenu = async result => {
  clickMainMenuButton(result, "Custom Filter");
  await tickUpdate(result);
};

describe("DataViewer tests", () => {
  let result, FilterPanel, DataViewerInfo, store;
  let dataId = 0;
  const { open } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  const clickFilterBtn = text =>
    result
      .find(FilterPanel)
      .first()
      .find("button")
      .findWhere(btn => btn.text() === text)
      .first()
      .simulate("click");

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

    FilterPanel = require("../../popups/filter/FilterPanel").ReactFilterPanel;
    DataViewerInfo = require("../../dtale/info/DataViewerInfo").ReactDataViewerInfo;
  });

  beforeEach(async () => {
    const { DataViewer } = require("../../dtale/DataViewer");
    store = reduxUtils.createDtaleStore();
    const finalDataId = dataId === 2 ? "error" : dataId + "";
    buildInnerHTML({ settings: "", dataId: finalDataId }, store);
    dataId++;
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tick();
    await toggleFilterMenu(result);
  });

  afterAll(() => {
    dimensions.afterAll();
    window.open = open;
  });

  it("DataViewer: filtering", async () => {
    expect(result.find(FilterPanel).length).toBe(1);
    clickFilterBtn("Close");
    result.update();
    expect(result.find(FilterPanel).length).toBe(0);
    await toggleFilterMenu(result);
    clickFilterBtn("Clear");
    await tickUpdate(result);
    expect(result.find(FilterPanel).length).toBe(0);
    await toggleFilterMenu(result);
    result
      .find(FilterPanel)
      .find("button")
      .findWhere(btn => btn.text() === "numexpr")
      .first()
      .simulate("click");
    await tickUpdate(result);
    expect(store.getState().queryEngine).toBe("numexpr");
    result
      .find(FilterPanel)
      .first()
      .find("textarea")
      .simulate("change", { target: { value: "test" } });
    result.update();
    clickFilterBtn("Apply");
    await tickUpdate(result);
    expect(result.find(DataViewerInfo).first().text()).toBe("Filter:test");
    result.find(DataViewerInfo).first().find("i.ico-cancel").last().simulate("click");
    await tickUpdate(result);
    expect(result.find(DataViewerInfo).find("div.data-viewer-info.is-expanded").length).toBe(0);
  });

  it("DataViewer: filtering with errors & documentation", async () => {
    result
      .find(FilterPanel)
      .first()
      .find("textarea")
      .simulate("change", { target: { value: "error" } });
    result.update();
    clickFilterBtn("Apply");
    await tickUpdate(result);
    expect(result.find(RemovableError).find("div.dtale-alert").text()).toBe("No data found");
    result.find(FilterPanel).find(RemovableError).first().instance().props.onRemove();
    result.update();
    expect(result.find(FilterPanel).find("div.dtale-alert").length).toBe(0);
    clickFilterBtn("Help");
    const pandasURL = "https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#indexing-query";
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe(pandasURL);
  });

  it("DataViewer: filtering, context variables error", () => {
    expect(result.find(FilterPanel).find(RemovableError).find("div.dtale-alert").text()).toBe(
      "Error loading context variables"
    );
  });

  it("DataViewer: column filters", async () => {
    const columnFilters = result.find(FilterPanel).find(StructuredFilters).first();
    expect(columnFilters.text()).toBe("Active Column Filters:foo == 1 and");
    columnFilters.find("i.ico-cancel").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(FilterPanel).find(StructuredFilters).first().text()).toBe("");
  });
});
