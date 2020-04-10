/* eslint max-lines: "off" */
import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import CorrelationsTsOptions from "../../popups/correlations/CorrelationsTsOptions";
import mockPopsicle from "../MockPopsicle";
import correlationsData from "../data/correlations";
import * as t from "../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

const chartData = {
  visible: true,
  type: "correlations",
  title: "Correlations Test",
  query: "col == 3",
};

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("Correlations tests", () => {
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

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
      chartCfg.getElementAtEvent = _evt => [{ _datasetIndex: 0, _index: 0, _chart: { config: cfg, data: cfg.data } }];
      chartCfg.getDatasetMeta = _idx => ({
        controller: { _config: { selectedPoint: 0 } },
      });
      return chartCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  test("Correlations rendering data", done => {
    const Correlations = require("../../popups/Correlations").Correlations;
    const ChartsBody = require("../../popups/charts/ChartsBody").default;
    buildInnerHTML({ settings: "" });
    const result = mount(<Correlations chartData={chartData} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    setTimeout(() => {
      result.update();
      const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
      corrGrid
        .find("div.cell")
        .at(1)
        .simulate("click");
      setTimeout(() => {
        result.update();
        t.equal(result.find(ChartsBody).length, 1, "should show correlation timeseries");
        t.deepEqual(
          result
            .find("select.custom-select")
            .first()
            .find("option")
            .map(o => o.text()),
          ["col4", "col5"],
          "should render date options for timeseries"
        );
        result
          .find("select.custom-select")
          .first()
          .simulate("change", { target: { value: "col5" } });
        setTimeout(() => {
          result.update();
          t.ok((result.state().selectedDate = "col5"), "should change timeseries date");
          done();
        }, 200);
      }, 200);
    }, 200);
  });

  test("Correlations rendering data and filtering it", done => {
    const Correlations = require("../../popups/Correlations").Correlations;
    const CorrelationsGrid = require("../../popups/correlations/CorrelationsGrid").default;
    buildInnerHTML({ settings: "" });
    const result = mount(<Correlations chartData={chartData} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    setTimeout(() => {
      result.update();
      let corrGrid = result.find(CorrelationsGrid).first();
      const filters = corrGrid.find(Select);
      filters
        .first()
        .instance()
        .onChange({ value: "col1" });
      result.update();
      corrGrid = result.find(CorrelationsGrid).first();
      t.deepEqual([correlationsData.data[0]], corrGrid.instance().state.correlations, "should filter on col1");
      filters
        .last()
        .instance()
        .onChange({ value: "col3" });
      result.update();
      t.deepEqual(
        [{ column: "col1", col3: -0.098802 }],
        corrGrid.instance().state.correlations,
        "should filter on col2"
      );
      done();
    }, 200);
  });

  test("Correlations rendering data w/ one date column", done => {
    const Correlations = require("../../popups/Correlations").Correlations;
    const ChartsBody = require("../../popups/charts/ChartsBody").default;
    buildInnerHTML({ settings: "" });
    const result = mount(<Correlations chartData={_.assign({}, chartData, { query: "one-date" })} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    setTimeout(() => {
      result.update();
      const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
      corrGrid
        .find("div.cell")
        .at(1)
        .simulate("click");
      setTimeout(() => {
        result.update();
        t.equal(result.find(ChartsBody).length, 1, "should show correlation timeseries");
        t.ok(result.find("select.custom-select").length == 0, "should not render date options for timeseries");
        t.ok((result.state().selectedDate = "col5"), "should select timeseries date");
        done();
      }, 200);
    }, 200);
  });

  test("Correlations rendering data w/ no date columns", done => {
    const Correlations = require("../../popups/Correlations").Correlations;
    buildInnerHTML({ settings: "" });
    const props = {
      chartData: _.assign({}, chartData, { query: "no-date" }),
      dataId: "1",
      onClose: _.noop,
      propagateState: _.noop,
    };
    const result = mount(<Correlations {...props} />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    setTimeout(() => {
      result.update();
      const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
      corrGrid
        .find("div.cell")
        .at(1)
        .simulate("click");
      setTimeout(() => {
        result.update();
        t.equal(result.find("#rawScatterChart").length, 1, "should show scatter chart");
        const scatterChart = result.find(Correlations).instance().state.chart;
        const title = scatterChart.cfg.options.tooltips.callbacks.title(
          [{ datasetIndex: 0, index: 0 }],
          scatterChart.data
        );
        t.deepEqual(title, ["index: 0"], "should render title");
        const label = scatterChart.cfg.options.tooltips.callbacks.label(
          { datasetIndex: 0, index: 0 },
          scatterChart.data
        );
        t.deepEqual(label, ["col1: 1.4", "col2: 1.5"], "should render label");
        scatterChart.cfg.options.onClick({});
        const corr = result.instance();

        t.ok(corr.shouldComponentUpdate(_.assignIn({ foo: 1 }, corr.props)), "should update");
        t.ok(!corr.shouldComponentUpdate(corr.props, _.assignIn({}, corr.state, { chart: null })), "shouldn't update");
        t.ok(!corr.shouldComponentUpdate(corr.props, corr.state), "shouldn't update");
        done();
      }, 200);
    }, 200);
  });

  test("Correlations rendering rolling data", done => {
    const Correlations = require("../../popups/Correlations").Correlations;
    const ChartsBody = require("../../popups/charts/ChartsBody").default;
    const CorrelationScatterStats = require("../../popups/correlations/CorrelationScatterStats").default;
    buildInnerHTML({ settings: "" });
    const result = mount(<Correlations chartData={_.assign({}, chartData, { query: "rolling" })} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    setTimeout(() => {
      result.update();
      const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
      corrGrid
        .find("div.cell")
        .at(1)
        .simulate("click");
      setTimeout(() => {
        result.update();
        t.equal(result.find(ChartsBody).length, 1, "should show correlation timeseries");
        result
          .find(ChartsBody)
          .instance()
          .state.charts[0].cfg.options.onClick({ foo: 1 });
        setTimeout(() => {
          result.update();
          t.ok(result.find(Correlations).instance().state.chart, "should show scatter chart");
          t.ok(
            _.startsWith(result.find(CorrelationScatterStats).text(), "col1 vs. col2 for 2018-12-16 thru 2018-12-19")
          );
          t.deepEqual(
            result
              .find(Correlations)
              .instance()
              .state.chart.cfg.options.tooltips.callbacks.title(
                [{ datasetIndex: 0, index: 0 }],
                result.find(Correlations).instance().state.chart.data
              ),
            ["index: 0", "date: 2018-04-30"]
          );
          t.deepEqual(
            result
              .find("select.custom-select")
              .first()
              .find("option")
              .map(o => o.text()),
            ["col4", "col5"],
            "should render date options for timeseries"
          );
          t.ok((result.state().selectedDate = "col4"), "should select timeseries date");
          result
            .find(CorrelationsTsOptions)
            .find("input")
            .findWhere(i => i.prop("type") === "text")
            .simulate("change", { target: { value: "5" } });
          setTimeout(() => {
            result.update();
            done();
          }, 200);
        }, 400);
      }, 200);
    }, 200);
  });

  test("Correlations missing data", done => {
    const Correlations = require("../../popups/Correlations").Correlations;
    const result = mount(<Correlations chartData={_.assign({}, chartData, { query: "null" })} dataId="1" />);
    setTimeout(() => {
      result.update();
      t.notOk(result.find("div.ReactVirtualized__Grid__innerScrollContainer").length, "should not create grid");
      done();
    }, 200);
  });

  test("Correlations - percent formatting", done => {
    const { percent } = require("../../popups/correlations/correlationsUtils").default;
    t.equal(percent("N/A"), "N/A", "should return N/A");
    done();
  });
});
