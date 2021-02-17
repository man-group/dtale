import { mount } from "enzyme";
import $ from "jquery";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../test-utils";

describe("DataViewer tests", () => {
  let result, DtypesGrid, Details, Describe, DescribeFilters, DetailsCharts, ColumnAnalysisChart, CategoryInputs;
  let postSpy;
  const { close, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();

    delete window.opener;
    delete window.close;
    window.opener = { location: { reload: jest.fn() } };
    window.close = jest.fn();

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    mockChartJS();
    jest.mock("popsicle", () => mockBuildLibs);

    DtypesGrid = require("../../popups/describe/DtypesGrid").default;
    Details = require("../../popups/describe/Details").Details;
    Describe = require("../../popups/describe/Describe").Describe;
    DescribeFilters = require("../../popups/analysis/filters/DescribeFilters").default;
    DetailsCharts = require("../../popups/describe/DetailsCharts").default;
    ColumnAnalysisChart = require("../../popups/analysis/ColumnAnalysisChart").default;
    CategoryInputs = require("../../popups/analysis/filters/CategoryInputs").default;
  });

  beforeEach(async () => {
    postSpy = jest.spyOn($, "post");
    postSpy.mockImplementation((_url, _params, callback) => callback());
    const props = { dataId: "1", chartData: { visible: true } };
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <Describe {...props} />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tickUpdate(result);
  });

  afterEach(() => postSpy.mockRestore());

  afterAll(() => {
    dimensions.afterAll();
    window.opener = opener;
    window.close = close;
  });

  const dtypesGrid = result => result.find(DtypesGrid).first();
  const details = result => result.find(Details).first();

  it("DataViewer: describe base grid operations", async () => {
    details(result)
      .find("button")
      .findWhere(btn => btn.text() === "Diffs")
      .first()
      .simulate("click");
    expect(
      details(result)
        .find("span.font-weight-bold")
        .findWhere(span => span.text() === "Sequential Difference Values (top 100 most common):")
    ).not.toHaveLength(0);
    details(result)
      .find("button")
      .findWhere(btn => btn.text() === "Outliers")
      .first()
      .simulate("click");
    await tickUpdate(result);
    expect(result.find(DetailsCharts)).toHaveLength(1);
    expect(
      details(result)
        .find("span.font-weight-bold")
        .findWhere(span => span.text() === "3 Outliers Found (top 100):")
    ).not.toHaveLength(0);
    details(result).find("a").last().simulate("click");
    await tick();
    expect(dtypesGrid(result).find("div[role='row']").length).toBe(5);
    dtypesGrid(result).find("div[role='columnheader']").first().simulate("click");
    expect(
      dtypesGrid(result).find("div.headerCell").first().find("svg.ReactVirtualized__Table__sortableHeaderIcon--ASC")
        .length
    ).toBe(1);
    dtypesGrid(result).find("div[role='columnheader']").first().simulate("click");
    expect(
      dtypesGrid(result).find("div.headerCell").first().find("svg.ReactVirtualized__Table__sortableHeaderIcon--DESC")
        .length
    ).toBe(1);
    dtypesGrid(result).find("div[role='columnheader']").first().simulate("click");
    expect(
      dtypesGrid(result).find("div.headerCell").first().find("svg.ReactVirtualized__Table__sortableHeaderIcon").length
    ).toBe(0);
    result
      .find(DescribeFilters)
      .find("button")
      .findWhere(btn => btn.text() === "Histogram")
      .first()
      .simulate("click");
    await tickUpdate(result);
    expect(result.find(ColumnAnalysisChart)).toHaveLength(1);
    result
      .find(DescribeFilters)
      .find("button")
      .findWhere(btn => btn.text() === "Categories")
      .first()
      .simulate("click");
    await tickUpdate(result);
    expect(result.find("div.missing-category")).toHaveLength(1);
    result.find(CategoryInputs).first().instance().props.updateCategory("categoryCol", "foo");
    await tickUpdate(result);
    expect(result.find(ColumnAnalysisChart)).toHaveLength(1);
  });

  it("DataViewer: showing/hiding columns from Describe popup & jumping sessions", async () => {
    dtypesGrid(result)
      .find("div.headerCell")
      .at(2)
      .find("input")
      .first()
      .simulate("change", { target: { value: "1" } });
    expect(dtypesGrid(result).find("div[role='row']").length).toBe(2);
    dtypesGrid(result).find("div[title='col1']").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(Details).find("div.row").first().find("span").first().text()).toBe("col1");
    dtypesGrid(result).find("div.headerCell").at(1).find("i.ico-check-box").simulate("click");
    dtypesGrid(result).find("div.headerCell").at(1).find("i.ico-check-box-outline-blank").simulate("click");
    dtypesGrid(result).find("i.ico-check-box").last().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    result.update();
    expect(postSpy).toBeCalledTimes(1);
    const firstPostCall = postSpy.mock.calls[0];
    expect(firstPostCall[0]).toBe("/dtale/update-visibility/1");
    expect(firstPostCall[1].visibility).toBe('{"col1":false,"col2":true,"col3":true,"col4":true}');
  });
});
