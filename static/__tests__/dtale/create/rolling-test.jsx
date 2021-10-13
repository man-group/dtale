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

function submit(res) {
  res.find("div.modal-footer").first().find("button").first().simulate("click");
}

describe("DataViewer tests", () => {
  let result, CreateColumn, CreateRolling;

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
    CreateRolling = require("../../../popups/create/CreateRolling").default;
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
    clickBuilder(result, "Rolling");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build rolling column", async () => {
    expect(result.find(CreateRolling).length).toBe(1);
    result.find(CreateRolling).find(Select).first().props().onChange({ value: "col1" });
    result.find(CreateRolling).find(Select).at(1).props().onChange({ value: "mean" });
    result
      .find(CreateRolling)
      .find("div.form-group")
      .at(2)
      .find("input")
      .last()
      .simulate("change", { target: { value: "1" } });
    result.find(CreateRolling).find("i.ico-check-box-outline-blank").simulate("click");
    result.find(CreateRolling).find(Select).at(2).props().onChange({ value: "col2" });
    result.find(CreateRolling).find(Select).at(3).props().onChange({ value: "triang" });
    result.find(CreateRolling).find("div.form-group").last().find("button").last().simulate("click");
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      center: true,
      closed: "neither",
      comp: "mean",
      min_periods: "1",
      on: "col2",
      win_type: "triang",
      window: "5",
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_rolling_mean");
  });

  it("DataViewer: build rolling cfg validation", () => {
    const { validateRollingCfg } = require("../../../popups/create/CreateRolling");
    expect(validateRollingCfg(t, {})).toBe("Please select a column!");
    expect(
      validateRollingCfg(t, {
        col: "col1",
      })
    ).toBe("Please select a computation!");
    expect(
      validateRollingCfg(t, {
        col: "col1",
        comp: "mean",
      })
    ).toBeNull();
  });
});
