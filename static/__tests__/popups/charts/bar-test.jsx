import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import AxisEditor from "../../../popups/charts/AxisEditor";
import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import { buildInnerHTML, mockChartJS, mockD3Cloud, tickUpdate, withGlobalJquery } from "../../test-utils";

function updateChartType(result, cmp, chartType) {
  result.find(cmp).find(Select).first().props().onChange({ value: chartType });
  result.update();
}

describe("Charts bar tests", () => {
  let result, Charts, ChartsBody;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    mockD3Cloud();
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
    jest.mock("popsicle", () => mockBuildLibs);

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

  afterAll(dimensions.afterAll);

  const axisEditor = () => result.find(AxisEditor).first();

  it("Charts: rendering", async () => {
    const filters = result.find(Charts).find(Select);
    filters.first().props().onChange({ value: "col4" });
    filters
      .at(1)
      .props()
      .onChange([{ value: "col1" }]);
    updateChartType(result, ChartsBody, "bar");
    result.find(Charts).find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(ChartsBody).instance().state.charts.length).toBe(1);
    result.find(ChartsBody).find(Select).at(1).props().onChange({ value: "col1" });
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
    expect(chartObj.cfg.options.scales["y-col1"].ticks).toEqual({
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
