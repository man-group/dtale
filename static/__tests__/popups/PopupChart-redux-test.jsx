import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

describe("Popup redux tests", () => {
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    jest.mock("popsicle", () => mockBuildLibs);
  });

  it("Popup redux rendering", async () => {
    const chartActions = require("../../actions/charts");
    const Popup = require("../../popups/Popup").Popup;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({}, store);
    const result = mount(
      <Provider store={store}>
        <Popup onClose={_.noop} />
      </Provider>
    );
    expect(result.find("canvas").length).toBe(0);
    store.dispatch(
      chartActions.openChart({
        type: "column-analysis",
        node: "foo",
        col: "bar",
        query: "baz",
        title: "ColumnAnalysis Test",
      })
    );
    await tickUpdate(result);
    expect(result.find("#columnAnalysisChart").length).toBeGreaterThan(0);
  });
});
