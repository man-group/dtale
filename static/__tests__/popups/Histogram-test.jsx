import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { withGlobalJquery } from "../test-utils";

const HISTOGRAM_DATA = {
  desc: { count: 20 },
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
  chartData: {
    visible: true,
    type: "histogram",
    title: "Histogram Test",
    col: "bar",
    query: "col == 3",
  },
};

describe("Histogram tests", () => {
  beforeAll(() => {
    const urlParams = qs.stringify({ bins: 20, query: props.chartData.query, col: props.chartData.col });
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (url.startsWith("/dtale/histogram")) {
          const query = qs.parse(url.split("?")[1]).query;
          if (query == "null") {
            return null;
          }
        }
        if (url.startsWith("/dtale/histogram?" + urlParams)) {
          return HISTOGRAM_DATA;
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
  });

  test("Histogram rendering data", done => {
    const Histogram = require("../../popups/Histogram").ReactHistogram;

    const body = document.getElementsByTagName("body")[0];
    body.innerHTML += '<div id="content"></div>';

    const result = mount(<Histogram {...props} />, { attachTo: document.getElementById("content") });
    t.deepEqual(result.find("option").map(o => o.text()), ["5", "10", "20", "50"], "Should render bins options");

    let chart = null;
    setTimeout(() => {
      result.update();
      chart = result.state("chart");
      t.equal(chart.cfg.type, "bar", "should create bar chart");
      t.deepEqual(_.get(chart, "cfg.data.datasets[0].data"), HISTOGRAM_DATA.data, "should load data");
      t.deepEqual(_.get(chart, "cfg.data.labels"), HISTOGRAM_DATA.labels, "should load labels");
      const xlabel = _.get(chart, "cfg.options.scales.xAxes[0].scaleLabel.labelString");
      t.equal(xlabel, "Bin", "should display correct x-axis label");

      const event = { target: { value: 50 } };
      result.find("select").simulate("change", event);

      setTimeout(() => {
        result.update();
        t.ok(chart.destroyed, "should have destroyed old chart");
        t.equal(result.state("bins"), 50, "should update bins");

        result.setProps({ chartData: _.assignIn(props.chartData, { col: "baz" }) });
        t.equal(result.props().chartData.col, "baz", "should update column");

        chart = result.state("chart");
        result.setProps({ chartData: _.assignIn(props.chartData, { visible: false }) });
        t.deepEqual(chart, result.state("chart"), "should not have destroyed old chart");
        done();
      }, 200);
    }, 200);
  });

  test("Histogram missing data", done => {
    const Histogram = require("../../popups/Histogram").ReactHistogram;

    const result = mount(<Histogram {..._.assign({}, props, { query: "null" })} />);
    setTimeout(() => {
      result.update();
      t.notOk(result.state("chart"), "should not create chart");
      done();
    }, 200);
  });
});
