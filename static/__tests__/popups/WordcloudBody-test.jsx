import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { withGlobalJquery } from "../test-utils";

describe("WordcloudBody tests", () => {
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (url.startsWith("chart-data-error-test1")) {
          return { data: {} };
        }
        if (url.startsWith("chart-data-error-test2")) {
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

    const mockD3Cloud = withGlobalJquery(() => () => {
      const cloudCfg = {};
      const propUpdate = prop => val => {
        cloudCfg[prop] = val;
        return cloudCfg;
      };
      cloudCfg.size = propUpdate("size");
      cloudCfg.padding = propUpdate("padding");
      cloudCfg.words = propUpdate("words");
      cloudCfg.rotate = propUpdate("rotate");
      cloudCfg.spiral = propUpdate("spiral");
      cloudCfg.random = propUpdate("random");
      cloudCfg.text = propUpdate("text");
      cloudCfg.font = propUpdate("font");
      cloudCfg.fontStyle = propUpdate("fontStyle");
      cloudCfg.fontWeight = propUpdate("fontWeight");
      cloudCfg.fontSize = () => ({
        on: () => ({ start: _.noop }),
      });
      return cloudCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("d3-cloud", () => mockD3Cloud);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
  });

  test("WordcloudBody missing data", done => {
    const WordcloudBody = require("../../popups/charts/WordcloudBody").default;

    const result = mount(<WordcloudBody chartType="wordcloud" data={{}} />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    t.notOk(result.html(), "shouldn't render anything");
    done();
  });

  test("WordcloudBody invalid chartType type", done => {
    const WordcloudBody = require("../../popups/charts/WordcloudBody").default;

    const result = mount(<WordcloudBody chartType="bar" data={{}} />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    t.notOk(result.html(), "shouldn't render anything");
    done();
  });
});
