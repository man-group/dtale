/* eslint max-statements: "off" */
import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { Aggregations } from "../../../popups/charts/Aggregations";
import mockPopsicle from "../../MockPopsicle";
import * as t from "../../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

function updateChartType(result, cmp, chartType) {
  result.find(cmp).find(Select).first().instance().onChange({ value: chartType });
  result.update();
}

describe("Charts tests", () => {
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
        const urlParams = qs.parse(url.split("?")[1]);
        if (urlParams.x === "error" && _.includes(JSON.parse(urlParams.y), "error2")) {
          return { data: {} };
        }
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementAtEvent = _evt => [{ _index: 0 }];
      chartCfg.update = _.noop;
      chartCfg.options = { scales: { xAxes: [{}] } };
      return chartCfg;
    });

    const mockD3Cloud = withGlobalJquery(() => () => {
      const cloudCfg = {};
      const propUpdate = prop => val => {
        cloudCfg[prop] = val;
        return cloudCfg;
      };
      cloudCfg.size = propUpdate("size");
      cloudCfg.padding = propUpdate("padding");
      cloudCfg.words = propUpdate("words");
      cloudCfg.rotate = propUpdate("rotate");
      cloudCfg.spiral = propUpdate("spiral");
      cloudCfg.random = propUpdate("random");
      cloudCfg.text = propUpdate("text");
      cloudCfg.font = propUpdate("font");
      cloudCfg.fontStyle = propUpdate("fontStyle");
      cloudCfg.fontWeight = propUpdate("fontWeight");
      cloudCfg.fontSize = () => ({
        on: () => ({ start: _.noop }),
      });
      return cloudCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("d3-cloud", () => mockD3Cloud);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  test("Charts: rendering", done => {
    const Charts = require("../../../popups/charts/Charts").ReactCharts;
    const ChartsBody = require("../../../popups/charts/ChartsBody").default;
    const ReactWordcloud = require("react-wordcloud").default;
    buildInnerHTML({ settings: "" });
    const result = mount(<Charts chartData={{ visible: true }} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });

    setTimeout(() => {
      result.update();
      let filters = result.find(Charts).find(Select);
      filters.first().instance().onChange({ value: "col4" });
      filters
        .at(1)
        .instance()
        .onChange([{ value: "col1" }, { value: "col2" }]);
      filters.at(3).instance().onChange({ value: "rolling", label: "Rolling" });
      result.update();
      result
        .find(Aggregations)
        .find("input")
        .at(1)
        .simulate("change", { target: { value: "10" } });
      result.find(Aggregations).find(Select).last().instance().onChange({ value: "corr", label: "Correlation" });
      result
        .find(Charts)
        .find("input.form-control")
        .first()
        .simulate("change", { target: { value: "col4 == '20181201'" } });
      result.update();
      result.find(Charts).find("button").first().simulate("click");
      setTimeout(() => {
        result.update();
        t.ok(result.find(ChartsBody).instance().state.charts.length == 1, "should render charts");
        t.equal(
          _.last(_.split(result.find(Charts).instance().state.url, "?")),
          _.join(
            [
              "x=col4&y=%5B%22col1%22%2C%22col2%22%5D&query=col4%20%3D%3D%20'20181201'",
              "agg=rolling&rollingWin=10&rollingComp=corr",
            ],
            "&"
          ),
          "should update chart URL"
        );
        result.find(ChartsBody).instance().state.charts[0].cfg.options.onClick();
        result.update();
        const { ticks } = result.find(ChartsBody).instance().state.charts[0].options.scales.xAxes[0];
        t.deepEqual(ticks, { max: "2018-12-26", min: "2018-12-18" }, "should limit x-axis");
        result.find(ChartsBody).instance().resetZoom();
        result.update();
        t.notOk(
          result.find(ChartsBody).instance().state.charts[0].options.scales.xAxes[0].length == 0,
          "should clear limited x-axis"
        );
        updateChartType(result, ChartsBody, "bar");
        t.ok(result.find(ChartsBody).instance().state.charts[0].cfg.type === "bar");
        updateChartType(result, ChartsBody, "wordcloud");
        updateChartType(result, ChartsBody, "stacked");
        t.ok(result.find(ChartsBody).instance().state.charts[0].cfg.options.scales.xAxes[0].stacked);
        updateChartType(result, ChartsBody, "scatter");
        t.ok(result.find(ChartsBody).instance().state.charts[0].cfg.type === "scatter");
        updateChartType(result, ChartsBody, "pie");
        t.ok(result.find(ChartsBody).instance().state.charts[0].cfg.type === "pie");
        filters = result.find(Charts).find(Select);
        filters.at(3).instance().onChange(null);
        filters
          .at(2)
          .instance()
          .onChange([{ value: "col1" }, { value: "col3" }]);
        result.find(Charts).find("button").first().simulate("click");
        setTimeout(() => {
          result.update();
          updateChartType(result, ChartsBody, "line");
          let chartObj = result.find(ChartsBody).instance().state.charts[0];
          t.equal(
            chartObj.cfg.options.tooltips.callbacks.label(
              { xLabel: 1545973200000, yLabel: 1.123456, datasetIndex: 0 },
              chartObj.data
            ),
            "val1 - col1: 1.1235",
            "should render tooltip label"
          );
          updateChartType(result, ChartsBody, "wordcloud");
          updateChartType(result, ChartsBody, "line");
          result.find(ChartsBody).find(Select).at(1).instance().onChange({ value: "On" });
          result.update();
          t.ok(result.find(ChartsBody).instance().state.charts.length == 2, "should render multiple charts");
          chartObj = result.find(ChartsBody).instance().state.charts[0];
          t.equal(
            chartObj.cfg.options.tooltips.callbacks.label(
              { xLabel: 1545973200000, yLabel: 1.123456, datasetIndex: 0 },
              chartObj.data
            ),
            "col1: 1.1235",
            "should render tooltip label"
          );
          updateChartType(result, ChartsBody, "wordcloud");
          const wc = result.find(ReactWordcloud).first();
          t.ok(wc.props().callbacks.getWordTooltip({ fullText: "test", value: 5 }), "test (5)", "should show tooltip");
          const cb = result.find(ChartsBody).instance();
          t.notOk(cb.shouldComponentUpdate(cb.props, cb.state), "shouldn't update chart body");
          t.ok(
            cb.shouldComponentUpdate(cb.props, _.assignIn({}, cb.state, { error: "test" })),
            "should update chart body"
          );
          t.ok(cb.shouldComponentUpdate(cb.props, _.assignIn({}, cb.state, { data: {} })), "should update chart body");
          t.notOk(
            cb.shouldComponentUpdate(cb.props, _.assignIn({}, cb.state, { chart: true })),
            "shouldn't update chart body"
          );
          done();
        }, 400);
      }, 400);
    }, 600);
  });
});
