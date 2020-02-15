import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("DataViewer heatmap tests", () => {
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

  test("DataViewer: heatmap", done => {
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
      clickMainMenuButton(result, "Heat Map");
      result.update();
      let dv = result.find(ReactDataViewer).instance().state;
      t.ok(
        _.every(
          result
            .find(ReactDataViewer)
            .find("div.cell")
            .map(c => _.includes(c.html(), "background: rgb"))
        ),
        "should turn on background css attribute on for all cells"
      );
      t.deepEqual(
        result
          .find(ReactDataViewer)
          .find("div.headerCell")
          .map(hc => hc.text()),
        ["col2"],
        "should render float column headers"
      );
      clickMainMenuButton(result, "Heat Map");
      dv = result.find(ReactDataViewer).instance().state;
      t.ok(_.filter(dv.columns, { visible: true }).length, 5, "should turn all columns back on");
      t.ok(
        _.every(
          result
            .find(ReactDataViewer)
            .find("div.cell")
            .map(c => !_.includes(c.html(), "background: rgb"))
        ),
        "should turn background css attribute off for all cells"
      );
      done();
    }, 600);
  });
});
