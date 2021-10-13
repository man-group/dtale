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
  let result, store, CreateColumn, CreateDatetime;

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
    CreateDatetime = require("../../../popups/create/CreateDatetime").default;

    store = reduxUtils.createDtaleStore();
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

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build datetime property column", async () => {
    result
      .find(CreateColumn)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "datetime_col" } });
    clickBuilder(result, "Datetime");
    expect(result.find(CreateDatetime).length).toBe(1);
    const dateInputs = result.find(CreateDatetime).first();
    dateInputs.find(Select).first().props().onChange({ value: "col4" });
    dateInputs.find("div.form-group").at(2).find("button").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
  });

  it("DataViewer: build datetime conversion column", async () => {
    result
      .find(CreateColumn)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "datetime_col" } });
    clickBuilder(result, "Datetime");
    expect(result.find(CreateDatetime).length).toBe(1);
    const dateInputs = result.find(CreateDatetime).first();
    dateInputs.find(Select).first().props().onChange({ value: "col4" });
    dateInputs.find("div.form-group").at(1).find("button").last().simulate("click");
    dateInputs.find("div.form-group").at(2).find("button").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
  });

  it("DataViewer: build datetime cfg validation", () => {
    const { validateDatetimeCfg } = require("../../../popups/create/CreateDatetime");
    expect(validateDatetimeCfg(t, { col: null })).toBe("Missing a column selection!");
  });
});
