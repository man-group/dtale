/* eslint max-statements: "off" */
import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../../RemovableError";
import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import { buildInnerHTML, mockChartJS, mockWordcloud, tickUpdate, withGlobalJquery } from "../../test-utils";

function updateChartType(result, cmp, chartType) {
  result.find(cmp).find(Select).first().props().onChange({ value: chartType });
  result.update();
}

describe("Charts tests", () => {
  let result, Charts, ChartsBody, Aggregations;
  let testIdx = 0;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    mockWordcloud();
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const urlParams = qs.parse(url.split("?")[1]);
        if (urlParams.x === "error" && _.includes(JSON.parse(urlParams.y), "error2")) {
          return { data: {} };
        }
        if (_.startsWith(url, "/dtale/dtypes/9")) {
          return { error: "error test" };
        }
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);

    Charts = require("../../../popups/charts/Charts").ReactCharts;
    ChartsBody = require("../../../popups/charts/ChartsBody").default;
    Aggregations = require("../../../popups/charts/Aggregations").default;
  });

  beforeEach(async () => {
    buildInnerHTML({ settings: "" });
    const dataId = testIdx++ > 1 ? "9" : "1";
    result = mount(<Charts chartData={{ visible: true }} dataId={dataId} />, {
      attachTo: document.getElementById("content"),
    });

    await tickUpdate(result);
  });

  afterAll(dimensions.afterAll);

  it("Charts: rendering", async () => {
    let filters = result.find(Charts).find(Select);
    filters.first().props().onChange({ value: "col4" });
    filters
      .at(1)
      .props()
      .onChange([{ value: "col1" }]);
    filters.at(3).props().onChange({ value: "rolling", label: "Rolling" });
    result.update();
    result
      .find(Aggregations)
      .find("input")
      .at(1)
      .simulate("change", { target: { value: "10" } });
    result.find(Aggregations).find(Select).last().props().onChange({ value: "corr", label: "Correlation" });
    result
      .find(Charts)
      .find("input.form-control")
      .first()
      .simulate("change", { target: { value: "col4 == '20181201'" } });
    result.update();
    result.find(Charts).find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(ChartsBody).instance().state.charts.length).toBe(1);
    expect(_.last(result.find(Charts).instance().state.url.split("?"))).toBe(
      "x=col4&y=%5B%22col1%22%5D&query=col4%20%3D%3D%20'20181201'&agg=rolling&rollingWin=10&rollingComp=corr"
    );
    result.find(ChartsBody).instance().state.charts[0].cfg.options.onClick();
    result.update();
    result.find(ChartsBody).instance().resetZoom();
    result.update();
    expect(result.find(ChartsBody).instance().state.charts[0].options.scales.x).toEqual({});
    updateChartType(result, ChartsBody, "bar");
    expect(result.find(ChartsBody).instance().state.charts[0].cfg.type).toBe("bar");
    updateChartType(result, ChartsBody, "wordcloud");
    updateChartType(result, ChartsBody, "stacked");
    expect(result.find(ChartsBody).instance().state.charts[0].cfg.options.scales.x.stacked).toBe(true);
    updateChartType(result, ChartsBody, "scatter");
    expect(result.find(ChartsBody).instance().state.charts[0].cfg.type).toBe("scatter");
    updateChartType(result, ChartsBody, "pie");
    expect(result.find(ChartsBody).instance().state.charts[0].cfg.type).toBe("pie");
    filters = result.find(Charts).find(Select);
    filters.at(3).props().onChange(null);
    filters
      .at(2)
      .props()
      .onChange([{ value: "col3" }]);
    result.find(Charts).find("button").first().simulate("click");
    await tickUpdate(result);
    updateChartType(result, ChartsBody, "line");
    let chartObj = result.find(ChartsBody).instance().state.charts[0];
    expect(
      chartObj.cfg.options.plugins.tooltip.callbacks.label(
        { parsed: { x: 1545973200000, y: 1.123456 }, datasetIndex: 0 },
        chartObj.data
      )
    ).toBe("val1 - col1: 1.1235");
    updateChartType(result, ChartsBody, "wordcloud");
    updateChartType(result, ChartsBody, "line");
    result.find(ChartsBody).find(Select).at(1).props().onChange({ value: "On" });
    result.update();
    expect(result.find(ChartsBody).instance().state.charts.length).toBe(2);
    chartObj = result.find(ChartsBody).instance().state.charts[0];
    expect(
      chartObj.cfg.options.plugins.tooltip.callbacks.label(
        { parsed: { x: 1545973200000, y: 1.123456 }, datasetIndex: 0 },
        chartObj.data
      )
    ).toBe("1.1235");
    updateChartType(result, ChartsBody, "wordcloud");
    const wc = result.find("MockComponent").first();
    expect(wc.props().callbacks.getWordTooltip({ fullText: "test", value: 5 })).toBe("test (5)");
    const cb = result.find(ChartsBody).instance();
    expect(cb.shouldComponentUpdate(cb.props, cb.state)).toBe(false);
    expect(cb.shouldComponentUpdate(cb.props, _.assignIn({}, cb.state, { error: "test" }))).toBe(true);
    expect(cb.shouldComponentUpdate(cb.props, _.assignIn({}, cb.state, { data: {} }))).toBe(true);
    expect(cb.shouldComponentUpdate(cb.props, _.assignIn({}, cb.state, { chart: true }))).toBe(false);
  });

  it("Charts: rendering empty data", async () => {
    const filters = result.find(Charts).find(Select);
    filters.first().props().onChange({ value: "error" });
    filters
      .at(1)
      .props()
      .onChange([{ value: "error2" }]);
    result.find(Charts).find("button").first().simulate("click");
    await tickUpdate(result);
    updateChartType(result, ChartsBody, "bar");
    expect(result.find(ChartsBody).instance().state.charts).toBeNull();
  });

  it("Charts: rendering empty data", async () => {
    expect(result.find(RemovableError).text()).toBe("error test");
  });
});
