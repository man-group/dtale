import { mount } from "enzyme";
import React from "react";

import { RemovableError } from "../../../RemovableError";
import mockPopsicle from "../../MockPopsicle";
import * as t from "../../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../../test-utils";

const chartData = {
  visible: true,
  query: "col == 3",
  col: "col1",
};

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("Describe tests", () => {
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

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  test("Describe: dtypes error", done => {
    const { Describe } = require("../../../popups/Describe");
    buildInnerHTML({ settings: "" });
    const result = mount(<Describe chartData={chartData} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    setTimeout(() => {
      result.update();
      t.equal(result.find(RemovableError).text(), "dtypes error", "should render error");
      done();
    }, 200);
  });

  test("Describe: describe error", done => {
    const { Describe } = require("../../../popups/Describe");
    buildInnerHTML({ settings: "" });
    const result = mount(<Describe chartData={chartData} dataId="2" />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    setTimeout(() => {
      result.update();
      setTimeout(() => {
        result.update();
        t.equal(result.find(RemovableError).text(), "describe error", "should render error");
        done();
      }, 200);
    }, 200);
  });
});
