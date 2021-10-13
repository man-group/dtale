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
  let result, CreateColumn, CreateSimilarity;

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
    CreateSimilarity = require("../../../popups/create/CreateSimilarity").default;
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
    clickBuilder(result, "Similarity");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build similarity column", async () => {
    expect(result.find(CreateSimilarity).length).toBe(1);
    const selects = () => result.find(CreateSimilarity).find(Select);
    selects().at(1).props().onChange({ value: "col1" });
    result.update();
    selects().last().props().onChange({ value: "col2" });
    result.update();
    selects().first().props().onChange({ value: "damerau-leveneshtein" });
    result.update();
    selects().first().props().onChange({ value: "jaro-winkler" });
    result.update();
    selects().first().props().onChange({ value: "jaccard" });
    result.update();
    result
      .find(CreateSimilarity)
      .find("div.form-group")
      .last()
      .find("input")
      .simulate("change", { target: { value: "4" } });
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      left: "col1",
      right: "col2",
      algo: "jaccard",
      k: "4",
      normalized: false,
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_col2_distance");
  });

  it("DataViewer: build similarity cfg validation", () => {
    const { validateSimilarityCfg } = require("../../../popups/create/CreateSimilarity");
    expect(validateSimilarityCfg(t, { left: null })).toBe("Please select a left column!");
    expect(validateSimilarityCfg(t, { left: "col1", right: null })).toBe("Please select a right column!");
    expect(
      validateSimilarityCfg(t, {
        left: "col1",
        right: "col2",
        algo: "jaccard",
      })
    ).toBe("Please select a valid value for k!");
    expect(
      validateSimilarityCfg(t, {
        left: "col1",
        right: "col2",
        algo: "jaccard",
        k: "4",
      })
    ).toBeNull();
  });
});
