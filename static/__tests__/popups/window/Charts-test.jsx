import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import mockPopsicle from "../../MockPopsicle";
import * as t from "../../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

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

    jest.mock("popsicle", () => mockBuildLibs);
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
    buildInnerHTML({ settings: "" });
    const result = mount(<Charts chartData={{ visible: true }} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });

    setTimeout(() => {
      result.update();
      let filters = result.find(Charts).find(Select);
      filters
        .first()
        .instance()
        .onChange({ value: "col4" });
      filters
        .at(1)
        .instance()
        .onChange({ value: "col1" });
      filters
        .at(3)
        .instance()
        .onChange({ value: "count", label: "Count" });
      result
        .find(Charts)
        .find("input.form-control")
        .first()
        .simulate("change", { target: { value: "col4 == '20181201'" } });
      result.update();
      result
        .find(Charts)
        .find("button")
        .first()
        .simulate("click");
      setTimeout(() => {
        result.update();
        t.ok(result.find(ChartsBody).instance().state.charts.length == 1, "should render charts");
        t.ok(
          result.find(Charts).instance().state.url,
          "/dtale/chart-data/1?x=date&y=security_id&query=date%20%3D%3D%20\\'20181201\\'&agg=count",
          "should update chart URL"
        );
        result
          .find(ChartsBody)
          .instance()
          .state.charts[0].cfg.options.onClick();
        result.update();
        t.deepEqual(
          result.find(ChartsBody).instance().state.charts[0].options.scales.xAxes[0],
          { ticks: { max: 1545973200000, min: 1545109200000 } },
          "should limit x-axis"
        );
        t.equal(
          result
            .find(ChartsBody)
            .instance()
            .state.charts[0].cfg.options.tooltips.callbacks.title([{ xLabel: 1545973200000 }]),
          "2018-12-28",
          "should correctly render dates in tooltip"
        );
        result
          .find(Charts)
          .instance()
          .resetZoom();
        result.update();
        t.notOk(
          result.find(ChartsBody).instance().state.charts[0].options.scales.xAxes[0].length == 0,
          "should clear limited x-axis"
        );
        filters = result.find(Charts).find(Select);
        filters
          .last()
          .instance()
          .onChange({ value: "bar" });
        result.update();
        filters
          .last()
          .instance()
          .onChange({ value: "stacked" });
        result.update();
        filters
          .last()
          .instance()
          .onChange({ value: "pie" });
        result.update();
        filters = result.find(Charts).find(Select);
        filters
          .at(3)
          .instance()
          .onChange(null);
        filters
          .at(2)
          .instance()
          .onChange([{ value: "col3" }]);
        result
          .find(Charts)
          .find("button")
          .first()
          .simulate("click");
        setTimeout(() => {
          result.update();
          filters
            .last()
            .instance()
            .onChange({ value: "line" });
          result.update();
          let chartObj = result.find(ChartsBody).instance().state.charts[0];
          t.equal(
            chartObj.cfg.options.tooltips.callbacks.label(
              { xLabel: 1545973200000, yLabel: 1.123456, datasetIndex: 0 },
              chartObj.data
            ),
            "val1: 1.1235",
            "should render tooltip label"
          );
          result
            .find(Charts)
            .find("input")
            .findWhere(i => i.prop("type") === "checkbox")
            .first()
            .simulate("change", { target: { checked: true } });
          result.update();
          t.ok(result.find(ChartsBody).instance().state.charts.length == 2, "should render multiple charts");
          chartObj = result.find(ChartsBody).instance().state.charts[0];
          t.equal(
            chartObj.cfg.options.tooltips.callbacks.label(
              { xLabel: 1545973200000, yLabel: 1.123456, datasetIndex: 0 },
              chartObj.data
            ),
            1.1235,
            "should render tooltip label"
          );
          done();
        }, 400);
      }, 400);
    }, 600);
  });
});
