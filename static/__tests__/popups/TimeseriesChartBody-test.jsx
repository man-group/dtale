import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { buildURL } from "../../actions/url-utils";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { withGlobalJquery } from "../test-utils";

const tsData = {
  data: {
    "x1:y1:z1": {
      data: [
        { corr: 0.019643, date: 1543813200000 },
        { corr: 0.021222, date: 1543899600000 },
        { corr: 0.023697, date: 1543986000000 },
        { corr: 0.024955, date: 1544072400000 },
        { corr: 0.023206, date: 1544158800000 },
        { corr: 0.024867, date: 1544418000000 },
        { corr: 0.023164, date: 1544504400000 },
      ],
    },
    "x2:y2:z2": {
      data: [
        { corr: 0.019643, date: 1543813200000 },
        { corr: 0.021222, date: 1543899600000 },
        { corr: 0.023697, date: 1543986000000 },
        { corr: 0.024955, date: 1544072400000 },
        { corr: 0.023206, date: 1544158800000 },
        { corr: 0.024867, date: 1544418000000 },
        { corr: 0.023164, date: 1544504400000 },
      ],
    },
  },
};

describe("TimeseriesChartBody tests", () => {
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (url.startsWith("ts-test")) {
          return tsData;
        }
        if (url.startsWith("ts-error-test1")) {
          return { data: {} };
        }
        if (url.startsWith("ts-error-test2")) {
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

  test("TimeseriesChartBody rendering chart per dataset", done => {
    const TimeseriesChartBody = require("../../popups/TimeseriesChartBody").TimeseriesChartBody;

    const body = document.getElementsByTagName("body")[0];
    body.innerHTML += '<input type="hidden" id="settings" value="" />';
    body.innerHTML += '<div id="content" style="height: 1000px;width: 1000px;"></div>';

    const url = buildURL("ts-test", { tsColumns: { x1: ["y1"], x2: ["y2"] } });
    const result = mount(<TimeseriesChartBody url={url} visible={true} chartPerDataset={true} />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    setTimeout(() => {
      result.update();
      t.ok(result.state().chart["y1-ts-chart"], "should render chart 1");
      t.ok(result.state().chart["y2-ts-chart"], "should render chart 2");

      const tooltipFuncs = result.state().chart["y1-ts-chart"].cfg.options.tooltips.callbacks;
      t.equal(tooltipFuncs.title([{ xLabel: 1543813200000 }]), "2018-12-03", "tooltip title");
      t.equal(tooltipFuncs.label({ yLabel: 0.019643 }), 0.0196, "tooltip label");

      result.setProps({ visible: false });
      result.update();
      result.unmount();

      done();
    }, 200);
  });

  test("TimeseriesChartBody missing data", done => {
    const TimeseriesChartBody = require("../../popups/TimeseriesChartBody").TimeseriesChartBody;

    const result = mount(<TimeseriesChartBody url="ts-error-test1" visible={true} />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    setTimeout(() => {
      result.update();
      t.ok(_.includes(result.html(), "No data found."), "shoudl render no data message");
      result.unmount();
      done();
    }, 200);
  });

  test("TimeseriesChartBody error handling", done => {
    const TimeseriesChartBody = require("../../popups/TimeseriesChartBody").TimeseriesChartBody;

    const result = mount(<TimeseriesChartBody url="ts-error-test2" visible={true} />, {
      attachTo: document.getElementById("content"),
    });
    result.update();
    setTimeout(() => {
      result.update();
      t.ok(_.includes(result.html(), "Error test."), "should render error");
      result.unmount();
      done();
    }, 200);
  });
});
