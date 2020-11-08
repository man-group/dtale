import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../../MockPopsicle";
import { tickUpdate, withGlobalJquery } from "../../test-utils";

describe("ChartsBody tests", () => {
  let result, ChartsBody;

  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "chart-data-error-test1")) {
          return { data: {} };
        }
        if (_.startsWith(url, "chart-data-error-test2")) {
          return { error: "Error test." };
        }
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, data: cfg.data, destroyed: false, config: cfg };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementAtEvent = _evt => [{ _index: 0 }];
      chartCfg.update = _.noop;
      chartCfg.options = { scales: { xAxes: [{}] } };
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
    ChartsBody = require("../../../popups/charts/ChartsBody").default;
  });

  const mountChart = async props => {
    result = mount(<ChartsBody {...props} visible={true} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
  };

  it("handles missing data", async () => {
    await mountChart({ url: "chart-data-error-test1" });
    expect(_.includes(result.html(), "No data found.")).toBe(true);
  });

  it("handles errors", async () => {
    await mountChart({ url: "chart-data-error-test2" });
    expect(_.includes(result.html(), "Error test.")).toBe(true);
    result.setProps({ visible: false });
    expect(result.html()).toBeNull();
  });
});
