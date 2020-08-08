import { mount } from "enzyme";
import $ from "jquery";
import React from "react";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import { buildInnerHTML, tick, tickUpdate, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

describe("DataViewer tests", () => {
  const { post } = $;
  const { close, opener } = window;
  let result, DtypesGrid, Details, Describe, DescribeFilters, DetailsCharts, ColumnAnalysisChart, CategoryInputs;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1205,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 775,
    });

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

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
      chartCfg.getElementAtEvent = _evt => [{ _datasetIndex: 0, _index: 0, _chart: { config: cfg, data: cfg.data } }];
      return chartCfg;
    });

    $.post = jest.fn();

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
    DtypesGrid = require("../../popups/describe/DtypesGrid").DtypesGrid;
    Details = require("../../popups/describe/Details").Details;
    Describe = require("../../popups/describe/Describe").Describe;
    DescribeFilters = require("../../popups/analysis/filters/DescribeFilters").DescribeFilters;
    DetailsCharts = require("../../popups/describe/DetailsCharts").default;
    ColumnAnalysisChart = require("../../popups/analysis/ColumnAnalysisChart").default;
    CategoryInputs = require("../../popups/analysis/filters/CategoryInputs").default;
  });

  beforeEach(async () => {
    const props = { dataId: "1", chartData: { visible: true } };
    buildInnerHTML({ settings: "" });
    result = mount(<Describe {...props} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
    $.post = post;
    window.opener = opener;
    window.close = close;
  });

  const dtypesGrid = result => result.find(DtypesGrid).first();
  const details = result => result.find(Details).first();

  it("DataViewer: describe base grid operations", async () => {
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
    expect($.post.mock.calls[0][0]).toBe("/dtale/update-visibility/1");
    $.post.mock.calls[0][2](); // execute callback
    result.update();
    expect($.post.mock.calls[0][1].visibility).toBe('{"col1":false,"col2":true,"col3":true,"col4":true}');
  });
});
