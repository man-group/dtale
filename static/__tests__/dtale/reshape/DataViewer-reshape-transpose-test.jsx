import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("DataViewer tests", () => {
  const { location, open, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 800,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });
  let result, Reshape, Transpose, validateTransposeCfg;

  beforeAll(() => {
    dimensions.beforeAll();

    delete window.location;
    delete window.open;
    delete window.opener;
    window.location = {
      reload: jest.fn(),
      pathname: "/dtale/iframe/1",
      assign: jest.fn(),
    };
    window.open = jest.fn();
    window.opener = { code_popup: { code: "test code", title: "Test" } };
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    mockChartJS();

    jest.mock("popsicle", () => mockBuildLibs);

    Reshape = require("../../../popups/reshape/Reshape").ReactReshape;
    Transpose = require("../../../popups/reshape/Transpose").Transpose;
    validateTransposeCfg = require("../../../popups/reshape/Transpose").validateTransposeCfg;
  });

  beforeEach(async () => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tick();
    clickMainMenuButton(result, "Summarize Data");
    await tickUpdate(result);
  });

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.open = open;
    window.opener = opener;
  });

  it("DataViewer: reshape transpose", async () => {
    result.find(Reshape).find("div.modal-body").find("button").at(2).simulate("click");
    expect(result.find(Transpose).length).toBe(1);
    const transposeComp = result.find(Transpose).first();
    const transposeInputs = transposeComp.find(Select);
    transposeInputs
      .first()
      .props()
      .onChange([{ value: "col1" }]);
    transposeInputs
      .last()
      .props()
      .onChange([{ value: "col2" }]);
    result.find("div.modal-body").find("div.row").last().find("button").last().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(Reshape).length).toBe(1);
    result.find("div.modal-body").find("div.row").last().find("button").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(Reshape).length).toBe(0);

    const cfg = { index: null };
    expect(validateTransposeCfg(cfg)).toBe("Missing an index selection!");
    cfg.index = ["x"];
    expect(validateTransposeCfg(cfg)).toBeNull();
  });
});
