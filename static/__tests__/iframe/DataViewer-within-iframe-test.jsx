import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { DataViewerMenu } from "../../dtale/DataViewerMenu";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("DataViewer within iframe tests", () => {
  const { location, open, top, self } = window;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });

    delete window.location;
    delete window.open;
    delete window.top;
    delete window.self;
    window.location = { reload: jest.fn(), pathname: "/dtale/iframe/1" };
    window.open = jest.fn();
    window.top = { location: { href: "http://test.com" } };
    window.self = { location: { href: "http://test/dtale/iframe" } };

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
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

    const mockDateInput = withGlobalJquery(() => require("@blueprintjs/datetime"));

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
    jest.mock("@blueprintjs/datetime", () => mockDateInput);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    window.location = location;
    window.open = open;
    window.top = top;
    window.self = self;
  });

  test("DataViewer: iframe menu rendering...", done => {
    const { DataViewer } = require("../../dtale/DataViewer");

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "", iframe: "True" }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );

    setTimeout(() => {
      result.update();
      t.deepEqual(
        result
          .find(DataViewerMenu)
          .find("ul li span.font-weight-bold")
          .map(s => s.text()),
        _.concat(
          ["Describe", "Custom Filter", "Build Column", "Summarize Data", "Correlations", "Charts", "Heat Map"],
          ["Highlight Dtypes", "Instances 1", "Code Export", "Export", "Refresh Widths", "About", "Reload Data"],
          ["Open In New Tab", "Shutdown"]
        ),
        "Should render default iframe menu options"
      );
      clickMainMenuButton(result, "Open In New Tab");
      expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/dtale/iframe/1");
      done();
    }, 600);
  });
});
