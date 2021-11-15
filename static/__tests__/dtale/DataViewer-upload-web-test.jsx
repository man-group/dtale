import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../test-utils";

describe("DataViewer tests", () => {
  let result, DataViewer, Upload;
  const { close, location, open, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    delete window.location;
    delete window.close;
    delete window.open;
    delete window.opener;
    window.location = {
      reload: jest.fn(),
      pathname: "/dtale/column/1",
      assign: jest.fn(),
    };
    window.close = jest.fn();
    window.open = jest.fn();
    window.opener = { location: { assign: jest.fn() } };

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/web-upload")) {
          return { success: true, data_id: "2" };
        }
        if (_.startsWith(url, "/dtale/datasets")) {
          return {
            success: true,
            data_id: new URLSearchParams(url.split("?")[1]).get("dataset"),
          };
        }
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
    mockChartJS();

    DataViewer = require("../../dtale/DataViewer").DataViewer;
    Upload = require("../../popups/upload/Upload").ReactUpload;
  });

  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tick();
    clickMainMenuButton(result, "Load Data");
    await tickUpdate(result);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.close = close;
    window.open = open;
    window.opener = opener;
  });

  const upload = () => result.find(Upload).first();

  it("DataViewer: upload from web", async () => {
    let uploadModal = upload();
    uploadModal.find("div.form-group").first().find("button").first().simulate("click");
    uploadModal
      .find("div.form-group")
      .at(1)
      .find("input")
      .simulate("change", { target: { value: "http://test" } });
    uploadModal
      .find("div.form-group")
      .at(2)
      .find("input")
      .simulate("change", { target: { value: "http://test" } });
    result.update();
    uploadModal = upload();
    uploadModal.find("div.row").at(1).find("button").first().simulate("click");
    await tickUpdate(result);
    await tickUpdate(result);
    expect(window.location.assign).toBeCalledWith("/2");
  });

  it("DataViewer: upload dataset", async () => {
    upload().find("div.form-group").last().find("button").first().simulate("click");
    await tickUpdate(result);
    await tickUpdate(result);
    expect(window.location.assign).toBeCalledWith("/covid");
  });
});
