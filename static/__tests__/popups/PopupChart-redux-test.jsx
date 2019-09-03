import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { withGlobalJquery } from "../test-utils";

describe("PopupChart redux tests", () => {
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    jest.mock("popsicle", () => mockBuildLibs);
  });

  test("PopupChart redux rendering", () => {
    const chartActions = require("../../actions/charts");
    const PopupChart = require("../../popups/PopupChart").PopupChart;

    const store = reduxUtils.createDtaleStore();
    const result = mount(
      <Provider store={store}>
        <PopupChart onClose={_.noop} />
      </Provider>
    );
    t.notOk(result.find("canvas").length, "should render nothing by default");

    store.dispatch(
      chartActions.openChart({
        type: "histogram",
        node: "foo",
        col: "bar",
        query: "baz",
        title: "Histogram Test",
      })
    );
    result.update();

    t.ok(result.find("#universeHistogram").length, "should render histogram canvas");
  });
});
