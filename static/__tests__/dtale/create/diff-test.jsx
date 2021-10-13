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
  let result, CreateColumn, CreateDiff;

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
    CreateDiff = require("../../../popups/create/CreateDiff").default;
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
    clickBuilder(result, "Row Difference");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build row difference column", async () => {
    expect(result.find(CreateDiff).length).toBe(1);
    result.find(CreateDiff).find(Select).first().props().onChange({ value: "col1" });
    result
      .find(CreateDiff)
      .find("div.form-group")
      .at(1)
      .find("input")
      .simulate("change", { target: { value: "4" } });
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      periods: "4",
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_diff");
  });

  it("DataViewer: build row difference cfg validation", () => {
    const { validateDiffCfg } = require("../../../popups/create/CreateDiff");
    expect(validateDiffCfg(t, {})).toBe("Please select a column!");
    expect(
      validateDiffCfg(t, {
        col: "col1",
        periods: "a",
      })
    ).toBe("Please select a valid value for periods!");
    expect(
      validateDiffCfg(t, {
        col: "col1",
        periods: "1",
      })
    ).toBeNull();
  });
});
