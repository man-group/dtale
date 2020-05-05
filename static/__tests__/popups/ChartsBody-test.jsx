import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import { tickUpdate, withGlobalJquery } from "../test-utils";

describe("ChartsBody tests", () => {
  let result;
  let testIdx = 1;

  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "chart-data-error-test1")) {
          return { data: {} };
        }
        if (_.startsWith(url, "chart-data-error-test2")) {
          return { error: "Error test." };
        }
        const { urlFetcher } = require("../redux-test-utils").default;
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
    const ChartsBody = require("../../popups/charts/ChartsBody").default;
    result = mount(<ChartsBody url={"chart-data-error-test" + testIdx++} visible={true} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
  });

  it("ChartsBody missing data", async () => {
    expect(_.includes(result.html(), "No data found.")).toBe(true);
  });

  it("ChartsBody error handling", async () => {
    expect(_.includes(result.html(), "Error test.")).toBe(true);
    result.setProps({ visible: false });
    expect(result.html()).toBeNull();
  });
});
