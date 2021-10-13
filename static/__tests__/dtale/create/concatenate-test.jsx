import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import {
  buildInnerHTML,
  clickMainMenuButton,
  mockChartJS,
  mockT as t,
  tick,
  tickUpdate,
  withGlobalJquery,
} from "../../test-utils";

import { clickBuilder } from "./create-test-utils";

describe("DataViewer tests", () => {
  let result, CreateColumn;

  function findConcatenateInputs(r) {
    const CreateConcatenate = require("../../../popups/create/CreateConcatenate").default;
    return r.find(CreateConcatenate).first();
  }

  function findLeftInputs(r) {
    return findConcatenateInputs(r).find("div.form-group").first();
  }

  const simulateClick = async r => {
    r.simulate("click");
    await tick();
  };

  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    mockChartJS();

    jest.mock("popsicle", () => mockBuildLibs);
  });

  beforeEach(async () => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );

    await tick();
    clickMainMenuButton(result, "Dataframe Functions");
    await tickUpdate(result);
    clickBuilder(result, "Concatenate");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build concatenate column", async () => {
    const CreateConcatenate = require("../../../popups/create/CreateConcatenate").default;
    expect(result.find(CreateConcatenate).length).toBe(1);
    result
      .find(CreateColumn)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "numeric_col" } });
    await simulateClick(findLeftInputs(result).find("button").first());
    await simulateClick(findLeftInputs(result).find("button").last());
    await simulateClick(findLeftInputs(result).find("button").first());
    findLeftInputs(result).find(Select).first().props().onChange({ value: "col1" });
    await tick();
    findConcatenateInputs(result)
      .find("div.form-group")
      .last()
      .find(Select)
      .first()
      .props()
      .onChange({ value: "col2" });
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      left: { col: "col1", type: "col" },
      right: { col: "col2", type: "col" },
    });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(CreateColumn)).toHaveLength(0);
  });

  it("DataViewer: build concatenate cfg validation", () => {
    const { validateConcatenateCfg } = require("../../../popups/create/CreateConcatenate");
    const cfg = {};
    cfg.left = { type: "col", col: null };
    expect(validateConcatenateCfg(t, cfg)).toBe("Left side is missing a column selection!");
    cfg.left = { type: "val", val: null };
    expect(validateConcatenateCfg(t, cfg)).toBe("Left side is missing a static value!");
    cfg.left.val = "x";
    cfg.right = { type: "col", col: null };
    expect(validateConcatenateCfg(t, cfg)).toBe("Right side is missing a column selection!");
    cfg.right = { type: "val", val: null };
    expect(validateConcatenateCfg(t, cfg)).toBe("Right side is missing a static value!");
  });
});
