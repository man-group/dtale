import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("DataViewer outlier tests", () => {
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
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  test("DataViewer: dtype highlighting", done => {
    const { DataViewer, ReactDataViewer } = require("../../dtale/DataViewer");

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "", hideShutdown: "True", processes: 2 }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );

    setTimeout(() => {
      result.update();
      clickMainMenuButton(result, "Highlight Outliers");
      result.update();
      let dv = result.find(ReactDataViewer).instance().state;
      t.equal(dv.backgroundMode, "outliers");
      clickMainMenuButton(result, "Highlight Outliers");
      result.update();
      dv = result.find(ReactDataViewer).instance().state;
      t.equal(dv.backgroundMode, null);

      done();
    }, 600);
  });
});
