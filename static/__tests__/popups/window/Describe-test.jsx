import { mount } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../../RemovableError";
import mockPopsicle from "../../MockPopsicle";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../../test-utils";

const chartData = {
  visible: true,
  query: "col == 3",
  col: "col1",
};

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("Describe tests", () => {
  let result;
  let testIdx = 1;

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
        if (url === "/dtale/dtypes/1") {
          return { error: "dtypes error" };
        }
        if (url === "/dtale/describe/2/col1") {
          return { error: "describe error" };
        }
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
      return chartCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
  });

  beforeEach(async () => {
    const { Describe } = require("../../../popups/describe/Describe");
    buildInnerHTML({ settings: "" });
    result = mount(<Describe chartData={chartData} dataId={"" + testIdx++} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  it("Describe: dtypes error", async () => {
    expect(result.find(RemovableError).text()).toBe("dtypes error");
  });

  it("Describe: describe error", async () => {
    await tickUpdate(result);
    expect(result.find(RemovableError).text()).toBe("describe error");
  });
});
