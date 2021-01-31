import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../RemovableError";
import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../test-utils";

describe("DataViewer tests", () => {
  let result, DataViewer, ReactDataViewer;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (url === "/dtale/data/1?ids=%5B%22100-101%22%5D") {
          return { error: "No data found" };
        }
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);

    const dv = require("../../dtale/DataViewer");
    DataViewer = dv.DataViewer;
    ReactDataViewer = dv.ReactDataViewer;
  });

  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
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

  afterAll(dimensions.afterAll);

  const dataViewer = () => result.find(ReactDataViewer).instance();

  it("DataViewer: base operations (column selection, locking, sorting, moving to front, col-analysis,...", async () => {
    dataViewer().getData(dataViewer().state.ids, true);
    dataViewer().getData(dataViewer().state.ids, true);
    expect(_.pick(dataViewer().state, ["loading", "loadQueue"])).toEqual({
      loading: true,
      loadQueue: [[0, 55]],
    });
    dataViewer().getData(dataViewer().state.ids, true);
    expect(_.pick(dataViewer().state, ["loading", "loadQueue"])).toEqual({
      loading: true,
      loadQueue: [
        [0, 55],
        [0, 55],
      ],
    });
    await tickUpdate(result);
    expect(_.pick(dataViewer().state, ["loading", "loadQueue"])).toEqual({
      loading: false,
      loadQueue: [],
    });
    dataViewer().getData(dataViewer().state.ids);
    dataViewer().getData([0, 1, 2, 3]);
    result.find(ReactDataViewer).setState({ ids: [100, 101], loadQueue: [], loading: false });
    result.update();
    dataViewer().getData(dataViewer().state.ids, true);
    await tickUpdate(result);
    expect(result.find(RemovableError).length).toBe(1);
  });
});
