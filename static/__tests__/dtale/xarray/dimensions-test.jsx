import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("DataViewer tests", () => {
  let result, store, XArrayDimensions;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/xarray-coordinates/1")) {
          return {
            data: [
              { name: "foo", count: 10, dtype: "object" },
              { name: "bar", count: 5, dtype: "float64" },
            ],
          };
        } else if (_.startsWith(url, "/dtale/xarray-dimension-values/1/foo")) {
          return {
            data: [{ value: "foo1" }, { value: "foo2" }, { value: "foo3" }],
          };
        } else if (_.startsWith(url, "/dtale/xarray-dimension-values/1/bar")) {
          return {
            data: [{ value: "bar1" }, { value: "bar2" }, { value: "bar3" }],
          };
        }
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  beforeEach(async () => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    XArrayDimensions = require("../../../popups/XArrayDimensions").ReactXArrayDimensions;

    store = reduxUtils.createDtaleStore();
    const xarrayDim = "{&quot;foo&quot;:&quot;foo1&quot;}";
    buildInnerHTML({ settings: "", xarray: "True", xarrayDim }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tickUpdate(result);
    clickMainMenuButton(result, "XArray Dimensions");
    await tickUpdate(result);
    await tickUpdate(result);
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: update selected dimensions of xarray", async () => {
    expect(result.find(XArrayDimensions).state().dimensionData[0]).toEqual({
      value: "foo1",
    });
    result.find(XArrayDimensions).find("li").first().find(Select).first().props().onChange({ value: "foo2" });
    result.find(XArrayDimensions).find("li").last().simulate("click");
    await tickUpdate(result);
    result.find(XArrayDimensions).find("li").last().find(Select).first().props().onChange({ value: "bar2" });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(store.getState().xarrayDim).toEqual({ foo: "foo2", bar: "bar2" });
  });
});
