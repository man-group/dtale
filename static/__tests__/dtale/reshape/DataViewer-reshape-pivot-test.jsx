import { mount } from "enzyme";
import React from "react";
import Modal from "react-bootstrap/Modal";
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
  let result, Reshape, Pivot;

  beforeAll(() => {
    delete window.location;
    delete window.open;
    delete window.opener;
    dimensions.beforeAll();
    window.location = {
      reload: jest.fn(),
      pathname: "/dtale/column/1",
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
    Pivot = require("../../../popups/reshape/Pivot").Pivot;
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
    window.location = location;
    window.open = open;
    window.opener = opener;
    dimensions.afterAll();
  });

  it("reshape pivot cfg validation", () => {
    const { validatePivotCfg } = require("../../../popups/reshape/Pivot");
    const cfg = { index: null, columns: null, values: null };
    expect(validatePivotCfg(cfg)).toBe("Missing an index selection!");
    cfg.index = "x";
    expect(validatePivotCfg(cfg)).toBe("Missing a columns selection!");
    cfg.columns = "y";
    expect(validatePivotCfg(cfg)).toBe("Missing a value(s) selection!");
  });

  it("DataViewer: reshape pivot", async () => {
    expect(result.find(Reshape).length).toBe(1);
    result.find(Modal.Header).first().find("button").first().simulate("click");
    expect(result.find(Reshape).length).toBe(0);
    clickMainMenuButton(result, "Summarize Data");
    await tickUpdate(result);
    expect(result.find(Pivot).length).toBe(1);
    const pivotComp = result.find(Pivot).first();
    const pivotInputs = pivotComp.find(Select);
    pivotInputs.first().props().onChange({ value: "col1" });
    pivotInputs.at(1).props().onChange({ value: "col2" });
    pivotInputs
      .at(2)
      .props()
      .onChange([{ value: "col3" }]);
    pivotInputs.last().props().onChange({ value: "count" });
    result.find("div.modal-body").find("div.row").last().find("button").last().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(Reshape).length).toBe(1);
    result.find("div.modal-body").find("div.row").last().find("button").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(Reshape).length).toBe(0);
  });
});
