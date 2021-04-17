/* eslint max-statements: "off" */
import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";

import {
  buildInnerHTML,
  clickMainMenuButton,
  findMainMenuButton,
  mockChartJS,
  tickUpdate,
  withGlobalJquery,
} from "../test-utils";

import { clickColMenuButton, openColMenu } from "./iframe-utils";

class MockDateInput extends React.Component {
  render() {
    return null;
  }
}
MockDateInput.displayName = "DateInput";

describe("DataViewer iframe tests", () => {
  const { location, open, top, self, resourceBaseUrl } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 500,
    innerHeight: 500,
  });
  let result, DataViewer, store;

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();

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
    jest.mock("popsicle", () => mockBuildLibs);

    jest.mock("@blueprintjs/datetime", () => ({ DateInput: MockDateInput }));
    DataViewer = require("../../dtale/DataViewer").DataViewer;
  });

  beforeEach(async () => {
    store = reduxUtils.createDtaleStore();
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
    dimensions.afterAll();
    window.location = location;
    window.open = open;
    window.top = top;
    window.self = self;
    window.resourceBaseUrl = resourceBaseUrl;
  });

  it("DataViewer: validate server calls", async () => {
    window.resourceBaseUrl = "/test-route/";
    await openColMenu(result, 2);
    clickColMenuButton(result, "Describe(Column Analysis)");
    expect(window.open.mock.calls[0][0]).toBe("/test-route/dtale/popup/describe/1?selectedCol=col3");
    clickMainMenuButton(result, "Describe");
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/test-route/dtale/popup/describe/1");
    clickMainMenuButton(result, "Correlations");
    expect(store.getState().sidePanel).toEqual({
      visible: true,
      view: "correlations",
    });
    clickMainMenuButton(result, "Charts");
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/test-route/dtale/charts/1");
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
