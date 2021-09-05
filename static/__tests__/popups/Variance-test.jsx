import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../test-utils";

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
  let result, ColumnAnalysisChart, TextEnterFilter;

  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/variance")) {
          const { col } = qs.parse(url.split("?")[1]);
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

    mockChartJS();

    jest.mock("popsicle", () => mockBuildLibs);
  });

  const input = () => result.find("input");
  const chart = () => result.find(ColumnAnalysisChart).instance().state.chart;
  const updateProps = async newProps => {
    const { Variance } = require("../../popups/variance/Variance");
    ColumnAnalysisChart = require("../../popups/analysis/ColumnAnalysisChart").default;
    TextEnterFilter = require("../../popups/analysis/filters/TextEnterFilter").default;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    store.getState().dataId = props.dataId;
    result = mount(
      <Provider store={store}>
        <Variance {...newProps} />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tickUpdate(result);
  };

  beforeEach(async () => {
    await updateProps(props);
  });

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
    const xlabel = _.get(chart(), "cfg.options.scales.x.scaleLabel.labelString");
    expect(xlabel).toBe("Bin");
    const currChart = chart();
    input().simulate("change", { target: { value: "" } });
    input().simulate("keyDown", { key: "Shift" });
    input().simulate("keyDown", { key: "Enter" });
    input().simulate("change", { target: { value: "a" } });
    input().simulate("keyDown", { key: "Enter" });
    input().simulate("change", { target: { value: "50" } });
    input().simulate("keyDown", { key: "Enter" });
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
