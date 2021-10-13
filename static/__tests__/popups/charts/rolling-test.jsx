import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import { buildInnerHTML, mockChartJS, mockD3Cloud, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("Charts rolling tests", () => {
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
  });

  afterAll(dimensions.afterAll);

  it("Charts: rendering", async () => {
    const Aggregations = require("../../../popups/charts/Aggregations").default;
    const Charts = require("../../../popups/charts/Charts").ReactCharts;
    buildInnerHTML({ settings: "" });
    const result = mount(<Charts chartData={{ visible: true }} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
    const filters = result.find(Charts).find(Select);
    filters.first().props().onChange({ value: "col4" });
    filters
      .at(1)
      .props()
      .onChange([{ value: "col1" }]);
    filters.at(3).props().onChange({ value: "rolling", label: "Rolling" });
    result.update();
    result
      .find(Aggregations)
      .find("input")
      .at(1)
      .simulate("change", { target: { value: "" } });
    result.find(Aggregations).find(Select).last().props().onChange({ value: "corr", label: "Correlation" });
    result.find(Charts).find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(Charts).instance().state.error).toBe("Aggregation (rolling) requires a window");
    result
      .find(Aggregations)
      .find("input")
      .at(1)
      .simulate("change", { target: { value: "10" } });
    result.find(Aggregations).find(Select).last().props().onChange(null);
    result.find(Charts).find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(Charts).instance().state.error).toBe("Aggregation (rolling) requires a computation");
  });
});
