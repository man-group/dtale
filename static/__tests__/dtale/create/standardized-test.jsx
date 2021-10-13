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
  let result, CreateColumn, CreateStandardized;

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
    CreateStandardized = require("../../../popups/create/CreateStandardized").default;
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
    clickBuilder(result, "Standardize");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build standardized column", async () => {
    expect(result.find(CreateStandardized).length).toBe(1);
    const selects = () => result.find(CreateStandardized).find(Select);
    selects().at(1).props().onChange({ value: "col1" });
    result.update();
    selects().first().props().onChange({ value: "quantile" });
    result.update();
    selects().first().props().onChange({ value: "robust" });
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      algo: "robust",
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_robust");
  });

  it("DataViewer: build standardized cfg validation", () => {
    const { validateStandardizedCfg } = require("../../../popups/create/CreateStandardized");
    expect(validateStandardizedCfg(t, { col: null })).toBe("Please select a column!");
    expect(validateStandardizedCfg(t, { col: "col1", algo: "power" })).toBeNull();
  });
});
