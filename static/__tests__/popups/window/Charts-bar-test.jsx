import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import AxisEditor from "../../../popups/charts/AxisEditor";
import mockPopsicle from "../../MockPopsicle";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

function updateChartType(result, cmp, chartType) {
  result.find(cmp).find(Select).first().instance().onChange({ value: chartType });
  result.update();
}

describe("Charts bar tests", () => {
  let result, Charts, ChartsBody;

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
      const chartCfg = { ctx, data: cfg.data, destroyed: false, config: cfg };
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
    Charts = require("../../../popups/charts/Charts").ReactCharts;
    ChartsBody = require("../../../popups/charts/ChartsBody").default;
  });

  beforeEach(async () => {
    buildInnerHTML({ settings: "" });
    result = mount(<Charts chartData={{ visible: true }} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  const axisEditor = () => result.find(AxisEditor).first();

  it("Charts: rendering", async () => {
    const filters = result.find(Charts).find(Select);
    filters.first().instance().onChange({ value: "col4" });
    filters
      .at(1)
      .instance()
      .onChange([{ value: "col1" }]);
    updateChartType(result, ChartsBody, "bar");
    result.find(Charts).find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(ChartsBody).instance().state.charts.length).toBe(1);
    result.find(ChartsBody).find(Select).at(1).instance().onChange({ value: "col1" });
    result.update();
    axisEditor().find("span.axis-select").simulate("click");
    axisEditor()
      .find("input")
      .first()
      .simulate("change", { target: { value: "40" } });
    axisEditor()
      .find("input")
      .last()
      .simulate("change", { target: { value: "42" } });
    axisEditor().instance().closeMenu();
    const chartObj = result.find(ChartsBody).instance().state.charts[0];
    expect(chartObj.config.options.scales.yAxes[0].ticks).toEqual({
      min: 40,
      max: 42,
    });
    axisEditor().find("span.axis-select").simulate("click");
    axisEditor()
      .find("input")
      .first()
      .simulate("change", { target: { value: "40" } });
    axisEditor()
      .find("input")
      .last()
      .simulate("change", { target: { value: "a" } });
    axisEditor().instance().closeMenu();
    expect(axisEditor().instance().state.errors[0]).toBe("col1 has invalid max!");
    axisEditor()
      .find("input")
      .last()
      .simulate("change", { target: { value: "39" } });
    axisEditor().instance().closeMenu();
    expect(axisEditor().instance().state.errors[0]).toBe("col1 must have a min < max!");
  });
});
