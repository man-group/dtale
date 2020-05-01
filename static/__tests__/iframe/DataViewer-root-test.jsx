/* eslint max-lines: "off" */
/* eslint max-statements: "off" */
import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, findMainMenuButton, tickUpdate, withGlobalJquery } from "../test-utils";

import { clickColMenuButton, openColMenu } from "./iframe-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

class MockDateInput extends React.Component {
  render() {
    return null;
  }
}
MockDateInput.displayName = "DateInput";

describe("DataViewer iframe tests", () => {
  const { location, open, top, self, resourceBaseUrl } = window;
  let result, DataViewer;

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
    delete window.resourceBaseUrl;
    window.location = { reload: jest.fn() };
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

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
    jest.mock("@blueprintjs/datetime", () => ({ DateInput: MockDateInput }));
    DataViewer = require("../../dtale/DataViewer").DataViewer;
  });

  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "", iframe: "True" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tickUpdate(result);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    window.location = location;
    window.open = open;
    window.top = top;
    window.self = self;
    window.resourceBaseUrl = resourceBaseUrl;
  });

  it("DataViewer: validate server calls", async () => {
    window.resourceBaseUrl = "/test-route/";
    await openColMenu(result, 2);
    clickColMenuButton(result, "Column Analysis");
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe(
      "/test-route/dtale/popup/column-analysis/1?selectedCol=col3"
    );
    clickColMenuButton(result, "Describe");
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe(
      "/test-route/dtale/popup/describe/1?selectedCol=col3"
    );
    clickMainMenuButton(result, "Describe");
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/test-route/dtale/popup/describe/1");
    clickMainMenuButton(result, "Correlations");
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/test-route/dtale/popup/correlations/1");
    clickMainMenuButton(result, "Charts");
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/test-route/charts/1");
    clickMainMenuButton(result, "Instances 1");
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/test-route/dtale/popup/instances/1");
    const exports = findMainMenuButton(result, "CSV", "div.btn-group");
    exports.find("button").first().simulate("click");
    let exportURL = window.open.mock.calls[window.open.mock.calls.length - 1][0];
    expect(_.startsWith(exportURL, "/test-route/dtale/data-export/1") && _.includes(exportURL, "tsv=false")).toBe(true);
    exports.find("button").last().simulate("click");
    exportURL = window.open.mock.calls[window.open.mock.calls.length - 1][0];
    expect(_.startsWith(exportURL, "/test-route/dtale/data-export/1") && _.includes(exportURL, "tsv=true")).toBe(true);
  });
});
