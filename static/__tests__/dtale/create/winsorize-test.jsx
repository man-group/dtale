import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";
import ReactSlider from "react-slider";

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

function submit(res) {
  res.find("div.modal-footer").first().find("button").first().simulate("click");
}

describe("DataViewer tests", () => {
  let result, CreateColumn, CreateWinsorize;

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
    CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;
    CreateWinsorize = require("../../../popups/create/CreateWinsorize").default;
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
    clickMainMenuButton(result, "Dataframe Functions");
    await tickUpdate(result);
    clickBuilder(result, "Winsorize");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  const findWinsorize = () => result.find(CreateWinsorize);

  it("DataViewer: build winsorize column", async () => {
    expect(result.find(CreateWinsorize).length).toBe(1);
    findWinsorize().find(Select).first().props().onChange({ value: "col1" });
    result.update();
    findWinsorize().find(Select).first().props().onChange(null);
    result.update();
    findWinsorize().find(Select).first().props().onChange({ value: "col1" });
    result.update();
    findWinsorize()
      .find(Select)
      .last()
      .props()
      .onChange([{ value: "col2" }]);
    result.update();
    findWinsorize().find(ReactSlider).prop("onAfterChange")([20, 80]);
    result.update();
    findWinsorize().find(ReactSlider).prop("onAfterChange")([20, 80]);
    result.update();
    findWinsorize()
      .find("div.form-group")
      .at(2)
      .find("input")
      .first()
      .simulate("change", { target: { value: "30" } });
    result.update();
    findWinsorize()
      .find("div.form-group")
      .at(2)
      .find("input")
      .last()
      .simulate("change", { target: { value: "70" } });
    result.update();
    findWinsorize().find("i").first().simulate("click");
    result.update();
    findWinsorize().find("i").last().simulate("click");
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      group: ["col2"],
      limits: [0.3, 0.3],
      inclusive: [false, false],
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_winsorize");
  });

  it("DataViewer: build winsorize cfg validation", () => {
    const { validateWinsorizeCfg } = require("../../../popups/create/CreateWinsorize");
    expect(validateWinsorizeCfg(t, { col: null })).toBe("Please select a column to winsorize!");
    expect(
      validateWinsorizeCfg(t, {
        col: "col1",
        group: ["col2"],
        limits: [0.1, 0.1],
        inclusive: [true, false],
      })
    ).toBeNull();
  });
});
