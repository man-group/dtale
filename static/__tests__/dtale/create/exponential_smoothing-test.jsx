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
  let result, CreateColumn, CreateExponentialSmoothing;

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
    CreateExponentialSmoothing = require("../../../popups/create/CreateExponentialSmoothing").default;
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
    clickBuilder(result, "Exponential Smoothing");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build exponential smoothing column", async () => {
    expect(result.find(CreateExponentialSmoothing).length).toBe(1);
    result.find(CreateExponentialSmoothing).find(Select).first().props().onChange({ value: "col1" });
    result
      .find(CreateExponentialSmoothing)
      .find("div.form-group")
      .at(1)
      .find("input")
      .last()
      .simulate("change", { target: { value: "0.3" } });
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      alpha: 0.3,
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_exp_smooth");
  });

  it("DataViewer: build exponential smoothing cfg validation", () => {
    const { validateExponentialSmoothingCfg } = require("../../../popups/create/CreateExponentialSmoothing");
    expect(validateExponentialSmoothingCfg(t, {})).toBe("Please select a column to smooth!");
    expect(
      validateExponentialSmoothingCfg(t, {
        col: "col1",
      })
    ).toBe("Please enter a valid float for alpha!");
    expect(
      validateExponentialSmoothingCfg(t, {
        col: "col1",
        alpha: 0.3,
      })
    ).toBeNull();
  });
});
