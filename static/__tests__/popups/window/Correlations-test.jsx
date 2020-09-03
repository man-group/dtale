import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import CorrelationsTsOptions from "../../../popups/correlations/CorrelationsTsOptions";
import mockPopsicle from "../../MockPopsicle";
import correlationsData from "../../data/correlations";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../../test-utils";

const chartData = {
  visible: true,
  type: "correlations",
  title: "Correlations Test",
  query: "col == 3",
  col1: "col1",
  col2: "col3",
};

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("Correlations tests", () => {
  let result, Correlations, ChartsBody;
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });

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
            return _.assignIn({ rolling: true }, correlationsData);
          }
        }
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
      return chartCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
    Correlations = require("../../../popups/Correlations").Correlations;
    ChartsBody = require("../../../popups/charts/ChartsBody").default;
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  const buildResult = async (props = chartData) => {
    buildInnerHTML({ settings: "" });
    const result = mount(<Correlations chartData={props} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
    return result;
  };

  it("Correlations rendering data", async () => {
    result = await buildResult();
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
    result = await buildResult();
    expect(result.find(ChartsBody).length).toBe(1);
  });

  it("Correlations rendering data w/ one date column", async () => {
    result = await buildResult(_.assign({}, chartData, { query: "one-date" }));
    await tickUpdate(result);
    result.update();
    expect(result.find(ChartsBody).length).toBe(1);
    expect(result.find("select.custom-select").length).toBe(0);
    expect(result.state().selectedDate).toBe("col4");
  });

  it("Correlations rendering data w/ no date columns", async () => {
    result = await buildResult(_.assign({}, chartData, { query: "no-date" }));
    await tickUpdate(result);
    expect(result.find("#rawScatterChart").length).toBe(1);
  });

  it("Correlations rendering rolling data", async () => {
    result = await buildResult(_.assign({}, chartData, { query: "rolling" }));
    await tickUpdate(result);
    expect(result.find(ChartsBody).length).toBe(1);
    expect(result.find("#rawScatterChart").length).toBe(1);
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
    const windowInput = result
      .find(CorrelationsTsOptions)
      .find("input")
      .findWhere(i => i.prop("type") === "text")
      .first();
    windowInput.simulate("change", { target: { value: "" } });
    windowInput.simulate("keyPress", { key: "Shift" });
    windowInput.simulate("keyPress", { key: "Enter" });
    windowInput.simulate("change", { target: { value: "a" } });
    windowInput.simulate("keyPress", { key: "Enter" });
    windowInput.simulate("change", { target: { value: "5" } });
    windowInput.simulate("keyPress", { key: "Enter" });
    await tickUpdate(result);
  });

  it("Correlations w/ col1 pre-selected", async () => {
    result = await buildResult(_.omit(chartData, "col2"));
    expect(result.find(Correlations).instance().state.selectedCols).toEqual(["col1", "col2"]);
  });

  it("Correlations w/ col2 pre-selected", async () => {
    result = await buildResult(_.omit(chartData, "col1"));
    expect(result.find(Correlations).instance().state.selectedCols).toEqual(["col1", "col3"]);
  });
});
