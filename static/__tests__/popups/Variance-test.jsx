import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../RemovableError";
import TextEnterFilter from "../../popups/analysis/filters/TextEnterFilter";
import mockPopsicle from "../MockPopsicle";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

const VARIANCE_DATA = {
  check1: {
    result: true,
    size: 21613,
    unique: 13,
  },
  check2: {
    result: false,
    val1: {
      ct: 9805,
      val: 3,
    },
    val2: {
      ct: 6871,
      val: 4,
    },
  },
  jarqueBera: {
    pvalue: 0.0,
    statistic: 2035067.5022880917,
  },
  missingCt: 0,
  outlierCt: 579,
  shapiroWilk: {
    pvalue: 0.0,
    statistic: 0.8514108657836914,
  },
  size: 21613,
};

const props = {
  dataId: "1",
  chartData: {
    visible: true,
    type: "variance",
    selectedCol: "bar",
  },
};

describe("Variance tests", () => {
  let result, ColumnAnalysisChart;

  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/variance")) {
          const col = _.last(url.split("?")[0].split("/"));
          if (col === "error") {
            return { error: "variance error" };
          }
          if (col === "lowVariance") {
            return {
              ...VARIANCE_DATA,
              check2: { ...VARIANCE_DATA.check2, result: true },
            };
          }
          return VARIANCE_DATA;
        }
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = {
        ctx,
        cfg,
        data: cfg.data,
        destroyed: false,
      };
      chartCfg.destroy = function destroy() {
        chartCfg.destroyed = true;
      };
      return chartCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
  });

  beforeEach(async () => {
    const { Variance } = require("../../popups/variance/Variance");
    ColumnAnalysisChart = require("../../popups/analysis/ColumnAnalysisChart").default;

    buildInnerHTML();
    result = mount(<Variance {...props} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
  });

  const input = () => result.find("input");
  const chart = () => result.find(ColumnAnalysisChart).instance().state.chart;
  const updateProps = async newProps => {
    result.setProps(newProps);
    await tickUpdate(result);
    result.unmount();
    result.mount();
    await tickUpdate(result);
  };

  it("Variance rendering variance report", async () => {
    expect(result.find("h1").text()).toBe(`Based on checks 1 & 2 "bar" does not have Low Variance`);
    await updateProps({
      chartData: { visible: true, selectedCol: "lowVariance" },
    });
    expect(result.find("h1").text()).toBe(`Based on checks 1 & 2 "lowVariance" has Low Variance`);
  });

  it("Variance rendering histogram", async () => {
    expect(input().prop("value")).toBe("20");
    expect(chart().cfg.type).toBe("bar");
    const xlabel = _.get(chart(), "cfg.options.scales.xAxes[0].scaleLabel.labelString");
    expect(xlabel).toBe("Bin");
    const currChart = chart();
    input().simulate("change", { target: { value: "" } });
    input().simulate("keyPress", { key: "Shift" });
    input().simulate("keyPress", { key: "Enter" });
    input().simulate("change", { target: { value: "a" } });
    input().simulate("keyPress", { key: "Enter" });
    input().simulate("change", { target: { value: "50" } });
    input().simulate("keyPress", { key: "Enter" });
    await tickUpdate(result);
    expect(currChart.destroyed).toBe(true);
    expect(result.find(TextEnterFilter).instance().state.bins).toBe("50");
  });

  it("Variance error", async () => {
    await updateProps({
      ...props,
      chartData: { ...props.chartData, selectedCol: "error" },
    });
    expect(result.find(RemovableError).text()).toBe("variance error");
  });
});
