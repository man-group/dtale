import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

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

  test("Popup redux rendering", done => {
    const chartActions = require("../../actions/charts");
    const Popup = require("../../popups/Popup").Popup;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({}, store);
    const result = mount(
      <Provider store={store}>
        <Popup onClose={_.noop} />
      </Provider>
    );
    t.notOk(result.find("canvas").length, "should render nothing by default");

    store.dispatch(
      chartActions.openChart({
        type: "column-analysis",
        node: "foo",
        col: "bar",
        query: "baz",
        title: "ColumnAnalysis Test",
      })
    );
    setTimeout(() => {
      result.update();

      t.ok(result.find("#columnAnalysisChart").length, "should render column analysis canvas");
      done();
    }, 400);
  });
});
