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
  let result, CreateColumn, CreateEncoder;

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
    CreateEncoder = require("../../../popups/create/CreateEncoder").default;
    CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;
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
    clickBuilder(result, "Encoder");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build encoder column", async () => {
    expect(result.find(CreateEncoder).length).toBe(1);
    const selects = () => result.find(CreateEncoder).find(Select);
    selects().at(1).props().onChange({ value: "col1" });
    result.update();
    selects().first().props().onChange({ value: "one_hot" });
    result.update();
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_one_hot");
    selects().first().props().onChange({ value: "ordinal" });
    result.update();
    selects().first().props().onChange({ value: "feature_hasher" });
    result.update();
    result
      .find(CreateEncoder)
      .find("div.form-group")
      .last()
      .find("input")
      .simulate("change", { target: { value: "4" } });
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      algo: "feature_hasher",
      n: "4",
    });
  });

  it("DataViewer: build encoder cfg validation", () => {
    const { validateEncoderCfg } = require("../../../popups/create/CreateEncoder");
    expect(validateEncoderCfg(t, { col: null })).toBe("Please select a column!");
    expect(validateEncoderCfg(t, { col: "col1", algo: "feature_hasher", n: "0" })).toBe(
      "Features must be an integer greater than zero!"
    );
    expect(validateEncoderCfg(t, { col: "col1", algo: "ordinal" })).toBeNull();
  });
});
