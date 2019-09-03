import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { withGlobalJquery } from "../test-utils";

describe("CoverageChartBody tests", () => {
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (url.startsWith("coverage-error-test1")) {
          return { data: {} };
        }
        if (url.startsWith("coverage-error-test2")) {
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
  });

  test("CoverageChartBody missing data", done => {
    const CoverageChartBody = require("../../popups/CoverageChartBody").default;

    const result = mount(<CoverageChartBody url="ts-error-test1" visible={true} />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    setTimeout(() => {
      result.update();
      t.ok(_.includes(result.html(), "No data found."), "shoudl render no data message");
      done();
    }, 200);
  });

  test("CoverageChartBody error handling", done => {
    const CoverageChartBody = require("../../popups/CoverageChartBody").default;

    const result = mount(<CoverageChartBody url="coverage-error-test2" visible={true} />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    setTimeout(() => {
      result.update();
      t.ok(_.includes(result.html(), "Error test."), "should render error");
      done();
    }, 200);
  });
});
