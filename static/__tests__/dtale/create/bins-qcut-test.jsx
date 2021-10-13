import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../../test-utils";

import { clickBuilder } from "./create-test-utils";

describe("DataViewer tests", () => {
  let result, CreateColumn, CreateBins;
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
    CreateBins = require("../../../popups/create/CreateBins").default;

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

  it("DataViewer: build bins qcut column", async () => {
    result
      .find(CreateColumn)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "qcut_col" } });
    clickBuilder(result, "Bins");
    expect(result.find(CreateBins).length).toBe(1);
    const binInputs = result.find(CreateBins).first();
    binInputs.find(Select).first().props().onChange({ value: "col2" });
    binInputs.find("div.form-group").at(1).find("button").last().simulate("click");
    binInputs
      .find("div.form-group")
      .at(2)
      .find("input")
      .simulate("change", { target: { value: "4" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
  });
});
