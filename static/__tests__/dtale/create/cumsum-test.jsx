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
  let result, CreateColumn, CreateCumsum;
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
    CreateCumsum = require("../../../popups/create/CreateCumsum").default;
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
    clickBuilder(result, "Cumulative Sum");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build cumulative sum column", async () => {
    expect(result.find(CreateCumsum).length).toBe(1);
    result.find(CreateCumsum).find(Select).first().props().onChange({ value: "col1" });
    result
      .find(CreateCumsum)
      .find(Select)
      .last()
      .props()
      .onChange([{ value: "col2" }]);
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      group: ["col2"],
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_cumsum");
  });

  it("DataViewer: build cumulative sum cfg validation", () => {
    const { validateCumsumCfg } = require("../../../popups/create/CreateCumsum");
    expect(validateCumsumCfg(t, {})).toBe("Please select a column!");
    expect(
      validateCumsumCfg(t, {
        col: "col1",
      })
    ).toBeNull();
  });
});
