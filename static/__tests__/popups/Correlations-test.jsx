/* eslint max-lines: "off" */
import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import { MockComponent } from "../MockComponent";
import mockPopsicle from "../MockPopsicle";
import correlationsData from "../data/correlations";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../test-utils";

const chartData = {
  visible: true,
  type: "correlations",
  title: "Correlations Test",
  query: "col == 3",
};

describe("Correlations tests", () => {
  let Correlations, ChartsBody, CorrelationsGrid, CorrelationScatterStats, CorrelationsTsOptions;
  const { location, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    jest.mock("../../dtale/side/SidePanelButtons", () => ({
      SidePanelButtons: MockComponent,
    }));
    dimensions.beforeAll();

    delete window.opener;
    window.opener = { location: { reload: jest.fn() } };
    delete window.location;
    window.location = { pathname: "/dtale/popup" };

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/correlations/")) {
          const query = qs.parse(url.split("?")[1]).query;
          if (query == "null") {
            return { error: "No data found." };
          }
          if (query == "one-date") {
            return {
              data: correlationsData.data,
              dates: [{ name: "col4", rolling: false }],
            };
          }
          if (query == "no-date") {
            return { data: correlationsData.data, dates: [] };
          }
          if (query == "rolling") {
            const dates = [
              { name: "col4", rolling: true },
              { name: "col5", rolling: false },
            ];
            return { data: correlationsData.data, dates };
          }
        }
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    mockChartJS();
    jest.mock("popsicle", () => mockBuildLibs);

    Correlations = require("../../popups/Correlations").default;
    ChartsBody = require("../../popups/charts/ChartsBody").default;
    CorrelationsGrid = require("../../popups/correlations/CorrelationsGrid").default;
    CorrelationScatterStats = require("../../popups/correlations/CorrelationScatterStats").default;
    CorrelationsTsOptions = require("../../popups/correlations/CorrelationsTsOptions").default;
  });

  beforeEach(async () => {
    buildInnerHTML({ settings: "" });
  });

  afterAll(() => {
    dimensions.afterAll();
    window.opener = opener;
    window.location = location;
  });

  const buildResult = async (props = { chartData }) => {
    const result = mount(<Correlations {...props} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
    return result;
  };

  it("Correlations rendering data", async () => {
    const result = await buildResult();
    const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
    corrGrid.find("div.cell").at(1).simulate("click");
    await tickUpdate(result);
    expect(result.find(ChartsBody).length).toBe(1);
    expect(
      result
        .find("select.custom-select")
        .first()
        .find("option")
        .map(o => o.text())
    ).toEqual(["col4", "col5"]);
    result
      .find("select.custom-select")
      .first()
      .simulate("change", { target: { value: "col5" } });
    await tickUpdate(result);
    expect(result.state().selectedDate).toBe("col5");
  });

  it("Correlations rendering data and filtering it", async () => {
    const result = await buildResult();
    let corrGrid = result.find(CorrelationsGrid).first();
    const filters = corrGrid.find(Select);
    filters.first().props().onChange({ value: "col1" });
    result.update();
    corrGrid = result.find(CorrelationsGrid).first();
    expect([correlationsData.data[0]]).toEqual(corrGrid.instance().state.correlations);
    filters.last().props().onChange({ value: "col3" });
    result.update();
    expect([{ column: "col1", col3: -0.098802 }]).toEqual(corrGrid.instance().state.correlations);
  });

  it("Correlations rendering data w/ one date column", async () => {
    const result = await buildResult({
      chartData: { ...chartData, query: "one-date" },
    });
    const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
    corrGrid.find("div.cell").at(1).simulate("click");
    await tickUpdate(result);
    expect(result.find(ChartsBody).length).toBe(1);
    expect(result.find("select.custom-select").length).toBe(0);
    expect(result.state().selectedDate).toBe("col4");
  });

  it("Correlations rendering data w/ no date columns", async () => {
    const props = {
      chartData: _.assign({}, chartData, { query: "no-date" }),
      onClose: _.noop,
      propagateState: _.noop,
    };
    const result = await buildResult(props);
    const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
    corrGrid.find("div.cell").at(1).simulate("click");
    await tickUpdate(result);
    expect(result.find("#rawScatterChart").length).toBe(1);
    const scatterChart = result.find(Correlations).instance().state.chart;
    const title = scatterChart.cfg.options.plugins.tooltip.callbacks.title([{ raw: { index: 0 } }], scatterChart.data);
    expect(title).toEqual(["index: 0"]);
    const label = scatterChart.cfg.options.plugins.tooltip.callbacks.label(
      {
        raw: { x: 1.4, y: 1.5 },
        dataset: { xLabels: ["col1"], yLabels: ["col2"] },
      },
      scatterChart.data
    );
    expect(label).toEqual(["col1: 1.4", "col2: 1.5"]);
    scatterChart.cfg.options.onClick({});
    const corr = result.instance();
    expect(corr.shouldComponentUpdate(_.assignIn({ foo: 1 }, corr.props))).toBe(true);
    expect(corr.shouldComponentUpdate(corr.props, _.assignIn({}, corr.state, { chart: null }))).toBe(false);
    expect(corr.shouldComponentUpdate(corr.props, corr.state)).toBe(false);
  });

  it("Correlations rendering rolling data", async () => {
    const result = await buildResult({
      chartData: { ...chartData, query: "rolling" },
    });
    await tickUpdate(result);
    const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
    corrGrid.find("div.cell").at(1).simulate("click");
    await tickUpdate(result);
    expect(result.find(ChartsBody).length).toBe(1);
    result.find(ChartsBody).instance().state.charts[0].cfg.options.onClick({ foo: 1 });
    await tickUpdate(result);
    expect(result.find(Correlations).instance().state.chart).toBeDefined();
    expect(result.find(CorrelationScatterStats).text()).toMatch(/col1 vs. col2 for 2018-12-16 thru 2018-12-19/);
    expect(
      result
        .find(Correlations)
        .instance()
        .state.chart.cfg.options.plugins.tooltip.callbacks.title(
          [{ raw: { index: 0, date: "2018-04-30" }, datasetIndex: 0, index: 0 }],
          result.find(Correlations).instance().state.chart.data
        )
    ).toEqual(["index: 0", "date: 2018-04-30"]);
    expect(
      result
        .find("select.custom-select")
        .first()
        .find("option")
        .map(o => o.text())
    ).toEqual(["col4", "col5"]);
    expect(result.state().selectedDate).toBe("col4");
    result
      .find(CorrelationsTsOptions)
      .find("input")
      .findWhere(i => i.prop("type") === "text")
      .first()
      .simulate("change", { target: { value: "5" } });
    const minPeriods = result
      .find(CorrelationsTsOptions)
      .find("input")
      .findWhere(i => i.prop("type") === "text")
      .first();
    minPeriods.simulate("change", { target: { value: "5" } });
    minPeriods.simulate("keyPress", { key: "Enter" });
    await tickUpdate(result);
  });

  it("Correlations missing data", async () => {
    const result = await buildResult({
      chartData: { ...chartData, query: "null" },
    });
    expect(result.find("div.ReactVirtualized__Grid__innerScrollContainer").length).toBe(0);
  });

  it("Correlations - percent formatting", () => {
    const { percent } = require("../../popups/correlations/correlationsUtils").default;
    expect(percent("N/A")).toBe("N/A");
  });
});
