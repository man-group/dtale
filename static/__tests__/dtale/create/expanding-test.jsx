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
  let result, CreateColumn, CreateExpanding, validateExpandingCfg;
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
    CreateExpanding = require("../../../popups/create/CreateExpanding").default;
    validateExpandingCfg = require("../../../popups/create/CreateExpanding").validateExpandingCfg;

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
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build expanding column", async () => {
    clickBuilder(result, "Expanding");
    expect(result.find(CreateExpanding).length).toBe(1);
    const expandingInputs = result.find(CreateExpanding).first();
    expandingInputs.find(Select).first().props().onChange({ value: "col2" });
    expandingInputs
      .find("div.form-group")
      .at(1)
      .find("input")
      .simulate("change", { target: { value: "4" } });
    expandingInputs.find(Select).last().props().onChange({ value: "sum" });
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col2",
      periods: "4",
      agg: "sum",
    });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);

    const cfg = { col: null };
    expect(validateExpandingCfg(t, cfg)).toBe("Please select a column!");
    cfg.col = "x";
    expect(validateExpandingCfg(t, cfg)).toBe("Please select an aggregation!");
    cfg.agg = "sum";
    expect(validateExpandingCfg(t, cfg)).toBeNull();
  });
});
