import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

const ANALYSIS_DATA = {
  desc: { count: 20 },
  chart_type: "histogram",
  dtype: "float64",
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
  beforeAll(() => {
    const urlParams = qs.stringify({
      bins: 20,
      query: props.chartData.query,
      col: props.chartData.selectedCol,
    });
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/column-analysis")) {
          const params = qs.parse(url.split("?")[1]);
          if (params.query === "null") {
            return null;
          }
          if (params.query === "error") {
            return { error: "column analysis error" };
          }
          if (params.col === "intCol") {
            return _.assignIn({}, ANALYSIS_DATA, { dtype: "int64" });
          }
          if (params.col === "dateCol") {
            return _.assignIn({}, ANALYSIS_DATA, { dtype: "datetime" });
          }
          if (params.col === "strCol") {
            return _.assignIn({}, ANALYSIS_DATA, { dtype: "string" });
          }
        }
        if (_.startsWith(url, "/dtale/column-analysis/1?" + urlParams)) {
          return ANALYSIS_DATA;
        }
        return {};
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = {
        ctx,
        cfg,
        data: cfg.data,
        destroyed: false,
      };
      chartCfg.destroy = function destroy() {
        chartCfg.destroyed = true;
      };
      return chartCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
  });

  test("ColumnAnalysis rendering float data", done => {
    const ColumnAnalysis = require("../../popups/ColumnAnalysis").ReactColumnAnalysis;
    buildInnerHTML();
    const result = mount(<ColumnAnalysis {...props} />, {
      attachTo: document.getElementById("content"),
    });

    let chart = null;
    setTimeout(() => {
      result.update();
      t.deepEqual(result.find("input").prop("value"), "20", "Should render default bins");

      chart = result.state("chart");
      t.equal(chart.cfg.type, "bar", "should create bar chart");
      t.deepEqual(_.get(chart, "cfg.data.datasets[0].data"), ANALYSIS_DATA.data, "should load data");
      t.deepEqual(_.get(chart, "cfg.data.labels"), ANALYSIS_DATA.labels, "should load labels");
      const xlabel = _.get(chart, "cfg.options.scales.xAxes[0].scaleLabel.labelString");
      t.equal(xlabel, "Bin", "should display correct x-axis label");

      result.find("input").simulate("change", { target: { value: "" } });
      result.find("input").simulate("keyPress", { key: "Shift" });
      result.find("input").simulate("keyPress", { key: "Enter" });
      result.find("input").simulate("change", { target: { value: "a" } });
      result.find("input").simulate("keyPress", { key: "Enter" });
      result.find("input").simulate("change", { target: { value: 50 } });
      result.find("input").simulate("keyPress", { key: "Enter" });

      setTimeout(() => {
        result.update();
        t.ok(chart.destroyed, "should have destroyed old chart");
        t.equal(result.state("bins"), 50, "should update bins");

        result.setProps({
          chartData: _.assignIn(props.chartData, { col: "baz" }),
        });
        t.equal(result.props().chartData.col, "baz", "should update column");

        chart = result.state("chart");
        result.setProps({
          chartData: _.assignIn(props.chartData, { visible: false }),
        });
        t.deepEqual(chart, result.state("chart"), "should not have destroyed old chart");
        done();
      }, 200);
    }, 200);
  });

  test("ColumnAnalysis rendering int data", done => {
    const ColumnAnalysis = require("../../popups/ColumnAnalysis").ReactColumnAnalysis;
    buildInnerHTML();
    const currProps = _.assignIn({}, props);
    currProps.chartData.selectedCol = "intCol";
    const result = mount(<ColumnAnalysis {...currProps} />, {
      attachTo: document.getElementById("content"),
    });

    setTimeout(() => {
      result.update();
      done();
    }, 200);
  });

  test("ColumnAnalysis rendering string data", done => {
    const ColumnAnalysis = require("../../popups/ColumnAnalysis").ReactColumnAnalysis;
    buildInnerHTML();
    const currProps = _.assignIn({}, props);
    currProps.chartData.selectedCol = "strCol";
    const result = mount(<ColumnAnalysis {...currProps} />, {
      attachTo: document.getElementById("content"),
    });

    setTimeout(() => {
      result.update();
      done();
    }, 200);
  });

  test("ColumnAnalysis rendering date data", done => {
    const ColumnAnalysis = require("../../popups/ColumnAnalysis").ReactColumnAnalysis;
    buildInnerHTML();
    const currProps = _.assignIn({}, props);
    currProps.chartData.selectedCol = "dateCol";
    const result = mount(<ColumnAnalysis {...currProps} />, {
      attachTo: document.getElementById("content"),
    });

    setTimeout(() => {
      result.update();
      done();
    }, 200);
  });

  test("ColumnAnalysis missing data", done => {
    const ColumnAnalysis = require("../../popups/ColumnAnalysis").ReactColumnAnalysis;
    const currProps = _.clone(props);
    currProps.chartData.query = "null";
    const result = mount(<ColumnAnalysis {...currProps} />);
    setTimeout(() => {
      result.update();
      t.notOk(result.state("chart"), "should not create chart");
      done();
    }, 200);
  });

  test("ColumnAnalysis error", done => {
    const ColumnAnalysis = require("../../popups/ColumnAnalysis").ReactColumnAnalysis;
    const currProps = _.clone(props);
    currProps.chartData.query = "error";
    const result = mount(<ColumnAnalysis {...currProps} />);
    setTimeout(() => {
      result.update();
      t.equal(result.find(RemovableError).text(), "column analysis error", "should render error");
      done();
    }, 200);
  });
});
