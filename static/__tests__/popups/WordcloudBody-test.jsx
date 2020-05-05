import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import { withGlobalJquery } from "../test-utils";

describe("WordcloudBody tests", () => {
  let WordcloudBody;
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
    WordcloudBody = require("../../popups/charts/WordcloudBody").default;
  });

  it("WordcloudBody missing data", () => {
    const result = mount(<WordcloudBody chartType={{ value: "wordcloud" }} data={{}} />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    expect(result.html()).toBe('<div class="row"></div>');
  });

  it("WordcloudBody invalid chartType type", () => {
    const result = mount(<WordcloudBody chartType={{ value: "bar" }} data={{}} />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    expect(result.html()).toBeNull();
  });

  it("WordcloudBody missing yProp data", () => {
    const result = mount(
      <WordcloudBody chartType={{ value: "wordcloud" }} y={[{ value: "foo" }]} data={{ bar: [1, 2, 3] }} />,
      {
        attachTo: document.getElementById("content"),
      }
    );
    result.update();
    expect(result.html()).toBe('<div class="row"></div>');
  });
});
