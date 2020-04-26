import { mount } from "enzyme";
import $ from "jquery";
import React from "react";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

describe("DataViewer tests", () => {
  const { post } = $;
  const { close, opener } = window;

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

  test("DataViewer: describe", done => {
    const { Describe } = require("../../popups/Describe");
    const DtypesGrid = require("../../popups/describe/DtypesGrid").DtypesGrid;
    const Details = require("../../popups/describe/Details").Details;
    const props = { dataId: "1", chartData: { visible: true } };
    buildInnerHTML({ settings: "" });
    const result = mount(<Describe {...props} />, {
      attachTo: document.getElementById("content"),
    });

    setTimeout(() => {
      result.update();
      let details = result.find(Details).first();
      details.find("div.row").at(2).find("button").last().simulate("click");
      setTimeout(() => {
        result.update();
        details = result.find(Details).first();
        t.equal(
          details.find("div.row").at(3).find("span.font-weight-bold").first().text(),
          "3 Outliers Found (top 100):"
        );
        details.find("div.row").at(3).find("a").simulate("click");
        setTimeout(() => {
          let dtypesGrid = result.find(DtypesGrid).first();
          t.equal(dtypesGrid.find("div[role='row']").length, 5, "should render dtypes");

          dtypesGrid.find("div[role='columnheader']").first().simulate("click");
          dtypesGrid = result.find(DtypesGrid).first();
          t.equal(
            dtypesGrid.find("div.headerCell").first().find("svg.ReactVirtualized__Table__sortableHeaderIcon--ASC")
              .length,
            1,
            "should sort col1 ASC"
          );
          dtypesGrid.find("div[role='columnheader']").first().simulate("click");
          dtypesGrid = result.find(DtypesGrid).first();
          t.equal(
            dtypesGrid.find("div.headerCell").first().find("svg.ReactVirtualized__Table__sortableHeaderIcon--DESC")
              .length,
            1,
            "should sort col1 DESC"
          );
          dtypesGrid.find("div[role='columnheader']").first().simulate("click");
          dtypesGrid = result.find(DtypesGrid).first();
          t.equal(
            dtypesGrid.find("div.headerCell").first().find("svg.ReactVirtualized__Table__sortableHeaderIcon").length,
            0,
            "should remove col1 sort"
          );
          dtypesGrid
            .find("div.headerCell")
            .at(2)
            .find("input")
            .first()
            .simulate("change", { target: { value: "1" } });
          dtypesGrid = result.find(DtypesGrid).first();
          t.equal(dtypesGrid.find("div[role='row']").length, 2, "should render filtered dtypes");
          dtypesGrid.find("div[title='col1']").first().simulate("click");
          setTimeout(() => {
            result.update();
            t.equal(result.find(Describe).first().find("h1").first().text(), "col1", "should describe col1");
            dtypesGrid = result.find(DtypesGrid).first();
            dtypesGrid.find("div.headerCell").at(1).find("i.ico-check-box").simulate("click");
            dtypesGrid.find("div.headerCell").at(1).find("i.ico-check-box").simulate("click");
            dtypesGrid.find("i.ico-check-box").last().simulate("click");
            result.find("div.modal-footer").first().find("button").first().simulate("click");
            expect($.post.mock.calls[0][0]).toBe("/dtale/update-visibility/1");
            $.post.mock.calls[0][2](); // execute callback
            result.update();
            expect($.post.mock.calls[0][1].visibility).toBe('{"col1":false,"col2":true,"col3":true,"col4":true}');
            done();
          }, 400);
        }, 400);
      }, 400);
    }, 600);
  });
});
