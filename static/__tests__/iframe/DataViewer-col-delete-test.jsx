import { mount } from "enzyme";
import $ from "jquery";
import React from "react";
import { Provider } from "react-redux";

import { it } from "@jest/globals";

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
  let result, DataViewer, ReactConfirmation, postSpy;

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

    DataViewer = require("../../dtale/DataViewer").DataViewer;
    ReactConfirmation = require("../../popups/Confirmation").ReactConfirmation;
  });

  beforeEach(async () => {
    postSpy = jest.spyOn($, "post");
    postSpy.mockImplementation((_url, _params, callback) => callback());
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

  afterEach(() => postSpy.mockRestore());

  afterAll(dimensions.afterAll);

  it("DataViewer: deleting a column", async () => {
    await openColMenu(result, 3);
    clickColMenuButton(result, "Delete");
    result.find(ReactConfirmation).find("div.modal-footer").find("button").first().simulate("click");
    await tickUpdate(result);
    validateHeaders(result, ["col1", "col2", "col3"]);
  });
});
