import { mount } from "enzyme";
import $ from "jquery";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../RemovableError";
import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../test-utils";
import { clickColMenuButton, openColMenu, validateHeaders } from "./iframe-utils";

describe("DataViewer iframe tests", () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: renaming a column", async () => {
    const postSpy = jest.spyOn($, "post");
    const { DataViewer } = require("../../dtale/DataViewer");
    const { ReactRename } = require("../../popups/Rename");

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

    await tickUpdate(result);
    await openColMenu(result, 3);
    clickColMenuButton(result, "Rename");
    result
      .find(ReactRename)
      .find("div.modal-body")
      .find("input")
      .first()
      .simulate("change", { target: { value: "col2" } });
    result.update();
    expect(result.find(ReactRename).find(RemovableError).length).toBeGreaterThan(0);
    result
      .find(ReactRename)
      .find("div.modal-body")
      .find("input")
      .first()
      .simulate("change", { target: { value: "col5" } });
    result.update();
    result.find(ReactRename).find("div.modal-footer").find("button").first().simulate("click");
    await tickUpdate(result);
    validateHeaders(result, ["col1", "col2", "col3", "col5"]);
    postSpy.mockRestore();
  });
});
