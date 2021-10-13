import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import { buildInnerHTML, mockChartJS, mockD3Cloud, tickUpdate, withGlobalJquery } from "../../test-utils";

function updateChartType(result, cmp, chartType) {
  result.find(cmp).find(Select).first().props().onChange({ value: chartType });
  result.update();
}

describe("Charts scatter tests", () => {
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

  it("Charts: rendering", async () => {
    const filters = result.find(Charts).find(Select);
    filters.first().props().onChange({ value: "col4" });
    filters
      .at(1)
      .props()
      .onChange([{ value: "col1" }]);
    updateChartType(result, ChartsBody, "scatter");
    result.find(Charts).find("button").first().simulate("click");
    await tickUpdate(result);
    updateChartType(result, ChartsBody, "bar");
    result.find(Charts).find("button").first().simulate("click");
    await tickUpdate(result);
  });
});
