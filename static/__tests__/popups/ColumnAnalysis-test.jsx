import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../test-utils";

const ANALYSIS_DATA = {
  desc: { count: 20 },
  chart_type: "histogram",
  dtype: "float64",
  cols: [
    { name: "intCol", dtype: "int64" },
    { name: "bar", dtype: "float64", coord: "lat" },
    { name: "strCol", dtype: "string" },
    { name: "dateCol", dtype: "datetime" },
    { name: "baz", dtype: "float64" },
    { name: "lon", coord: "lon", dtype: "float64" },
  ],
  query: null,
  data: [6, 13, 13, 30, 34, 57, 84, 135, 141, 159, 170, 158, 126, 94, 70, 49, 19, 7, 9, 4],
  labels: [
    "-3.0",
    "-2.7",
    "-2.4",
    "-2.1",
    "-1.8",
    "-1.5",
    "-1.2",
    "-0.9",
    "-0.6",
    "-0.3",
    "0.0",
    "0.3",
    "0.6",
    "0.9",
    "1.2",
    "1.5",
    "1.8",
    "2.1",
    "2.4",
    "2.7",
    "3.0",
  ],
};

const props = {
  dataId: "1",
  chartData: {
    visible: true,
    type: "column-analysis",
    title: "ColumnAnalysis Test",
    selectedCol: "bar",
    query: "col == 3",
  },
};

describe("ColumnAnalysis tests", () => {
  let result, ColumnAnalysisChart, ColumnAnalysisFilters;

  beforeAll(() => {
    mockChartJS();
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/column-analysis")) {
          const params = qs.parse(url.split("?")[1]);
          const ordinal = ANALYSIS_DATA.data;
          const count = ANALYSIS_DATA.data;
          if (params.col === "null") {
            return null;
          }
          if (params.col === "error") {
            return { error: "column analysis error" };
          }
          if (params.col === "intCol") {
            if (params.type === "value_counts") {
              return _.assignIn({}, ANALYSIS_DATA, {
                chart_type: "value_counts",
                ordinal,
              });
            }
            return _.assignIn({}, ANALYSIS_DATA, {
              dtype: "int64",
              chart_type: "histogram",
            });
          }
          if (params.col === "dateCol") {
            return _.assignIn({}, ANALYSIS_DATA, {
              dtype: "datetime",
              chart_type: "value_counts",
              ordinal,
            });
          }
          if (params.col === "strCol") {
            return _.assignIn({}, ANALYSIS_DATA, {
              dtype: "string",
              chart_type: "value_counts",
              ordinal,
            });
          }
          if (_.includes(["bar", "baz"], params.col)) {
            if (params.type === "categories") {
              return _.assignIn({}, ANALYSIS_DATA, {
                chart_type: "categories",
                count,
              });
            }
            if (params.type === "geolocation") {
              return {
                ...ANALYSIS_DATA,
                chart_type: "geolocation",
                lat: [1, 2, 3],
                lon: [4, 5, 6],
              };
            }
            if (params.type === "qq") {
              return {
                ...ANALYSIS_DATA,
                chart_type: "qq",
                x: [1],
                y: [1],
                x2: [1],
                y2: [1],
              };
            }
            return ANALYSIS_DATA;
          }
        }
        return {};
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  beforeEach(async () => {
    const ColumnAnalysis = require("../../popups/analysis/ColumnAnalysis").ReactColumnAnalysis;
    ColumnAnalysisChart = require("../../popups/analysis/ColumnAnalysisChart").default;
    ColumnAnalysisFilters = require("../../popups/analysis/filters/ColumnAnalysisFilters").default;

    buildInnerHTML();
    result = mount(<ColumnAnalysis {...props} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
  });

  const input = () => result.find("input");
  const chart = () => result.find(ColumnAnalysisChart).instance().state.chart;
  const updateProps = newProps => {
    result.setProps(newProps);
    result.update();
  };
  const filters = () => result.find(ColumnAnalysisFilters);

  it("ColumnAnalysis rendering float data", async () => {
    expect(result.find("ButtonToggle").prop("options")[2].label).toBe("Geolocation");
    expect(input().prop("value")).toBe("20");
    expect(chart().cfg.type).toBe("bar");
    expect(_.get(chart(), "cfg.data.datasets[0].data")).toEqual(ANALYSIS_DATA.data);
    expect(_.get(chart(), "cfg.data.labels")).toEqual(ANALYSIS_DATA.labels);
    const xlabel = _.get(chart(), "cfg.options.scales.x.scaleLabel.labelString");
    expect(xlabel).toBe("Bin");
    const currChart = chart();
    input().simulate("change", { target: { value: "" } });
    input().simulate("keyDown", { key: "Shift" });
    input().simulate("keyDown", { key: "Enter" });
    input().simulate("change", { target: { value: "a" } });
    input().simulate("keyDown", { key: "Enter" });
    input().simulate("change", { target: { value: "50" } });
    input().simulate("keyDown", { key: "Enter" });
    await tickUpdate(result);
    expect(currChart.destroyed).toBe(true);
    expect(result.find(ColumnAnalysisFilters).instance().state.bins).toBe("50");
  });

  it("ColumnAnalysis chart functionality", async () => {
    updateProps({
      ...props,
      chartData: { ...props.chartData, selectedCol: "baz" },
    });
    expect(result.props().chartData.selectedCol).toBe("baz");
    const currChart = chart();
    updateProps({
      ...props,
      chartData: _.assignIn(props.chartData, { visible: false }),
    });
    expect(currChart).toEqual(chart());
    updateProps({
      ...props,
      chartData: _.assignIn(props.chartData, { visible: true }),
    });
    result.find(ColumnAnalysisFilters).find("button").at(1).simulate("click");
    result.update();
    filters().find(Select).first().props().onChange({ value: "col1" });
    await tickUpdate(result);
    filters()
      .find("input")
      .first()
      .simulate("change", { target: { value: "50" } });
    filters().find("input").first().simulate("keyDown", { key: "Enter" });
    await tickUpdate(result);
  });

  it("geolocation chart functionality", async () => {
    result.find("ButtonToggle").find("button").at(2).simulate("click");
    await tickUpdate(result);
    const id = result.find(ColumnAnalysisChart).instance().state.id;
    expect(result.find(`div#${id}`)).toHaveLength(1);
    expect(result.find("GeoFilters")).toHaveLength(1);
    expect(result.find("GeoFilters").text()).toBe("Latitude:barLongitude:lon");
  });

  it("qq plot chart functionality", async () => {
    result.find("ButtonToggle").find("button").last().simulate("click");
    await tickUpdate(result);
    const id = result.find(ColumnAnalysisChart).instance().state.id;
    expect(result.find(`div#${id}`)).toHaveLength(1);
  });

  it("ColumnAnalysis rendering int data", async () => {
    const currProps = _.assignIn({}, props);
    currProps.chartData.selectedCol = "intCol";
    updateProps(currProps);
    filters().find("button").at(1).simulate("click");
    await tickUpdate(result);
  });

  it("ColumnAnalysis rendering string data", async () => {
    const currProps = _.assignIn({}, props);
    currProps.chartData.selectedCol = "strCol";
    updateProps(currProps);
  });

  it("ColumnAnalysis rendering date data", async () => {
    const currProps = _.assignIn({}, props);
    currProps.chartData.selectedCol = "dateCol";
    updateProps(currProps);
    const ordinalInputs = result.find(Select);
    ordinalInputs.first().props().onChange({ value: "col1" });
    await tickUpdate(result);
  });

  it("ColumnAnalysis missing data", async () => {
    updateProps({
      ...props,
      chartData: { ...props.chartData, selectedCol: "null" },
    });
    result.unmount();
    result.mount();
    await tickUpdate(result);
    expect(chart()).toBeNull();
  });

  it("ColumnAnalysis error", async () => {
    updateProps({
      ...props,
      chartData: { ...props.chartData, selectedCol: "error" },
    });
    result.unmount();
    result.mount();
    await tickUpdate(result);
    expect(result.find(RemovableError).text()).toBe("column analysis error");
  });
});
