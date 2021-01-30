import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { it } from "@jest/globals";

import mockPopsicle from "../../MockPopsicle";
import { buildInnerHTML, mockChartJS, mockD3Cloud, tickUpdate, withGlobalJquery } from "../../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

function updateChartType(result, cmp, chartType) {
  result.find(cmp).find(Select).first().instance().onChange({ value: chartType });
  result.update();
}

describe("Charts scatter tests", () => {
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
    mockChartJS();
    mockD3Cloud();

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

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  it("Charts: rendering", async () => {
    const filters = result.find(Charts).find(Select);
    filters.first().instance().onChange({ value: "col4" });
    filters
      .at(1)
      .instance()
      .onChange([{ value: "col1" }]);
    updateChartType(result, ChartsBody, "scatter");
    result.find(Charts).find("button").first().simulate("click");
    await tickUpdate(result);
    updateChartType(result, ChartsBody, "bar");
    result.find(Charts).find("button").first().simulate("click");
    await tickUpdate(result);
  });
});
