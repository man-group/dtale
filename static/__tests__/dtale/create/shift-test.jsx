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
  let result, CreateColumn, CreateShift, validateShiftCfg;
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
    CreateShift = require("../../../popups/create/CreateShift").default;
    validateShiftCfg = require("../../../popups/create/CreateShift").validateShiftCfg;

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

  it("DataViewer: build shift column", async () => {
    clickBuilder(result, "Shifting");
    expect(result.find(CreateShift).length).toBe(1);
    const shiftInputs = result.find(CreateShift).first();
    shiftInputs.find(Select).first().props().onChange({ value: "col2" });
    shiftInputs
      .find("div.form-group")
      .at(1)
      .find("input")
      .simulate("change", { target: { value: "3" } });
    shiftInputs
      .find("div.form-group")
      .at(2)
      .find("input")
      .simulate("change", { target: { value: "5.5" } });
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col2",
      periods: "3",
      fillValue: "5.5",
      dtype: "float64",
    });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);

    const cfg = { col: null };
    expect(validateShiftCfg(t, cfg)).toBe("Please select a column!");
    cfg.col = "x";
    expect(validateShiftCfg(t, cfg)).toBeNull();
  });
});
