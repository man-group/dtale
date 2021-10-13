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
  let result, CreateColumn, CreateTransform;

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
    CreateTransform = require("../../../popups/create/CreateTransform").default;
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
    clickBuilder(result, "Transform");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build transform column", async () => {
    expect(result.find(CreateTransform).length).toBe(1);
    result
      .find(CreateTransform)
      .find(Select)
      .first()
      .props()
      .onChange([{ value: "col1" }]);
    result.update();
    expect(result.find(CreateTransform).find(Select).first().prop("noOptionsMessage")()).toBe("No columns available!");
    expect(result.find(CreateTransform).find(Select).at(1).prop("noOptionsMessage")()).toBe(
      "No columns available for the following dtypes: int, float!"
    );
    result.find(CreateTransform).find(Select).at(1).props().onChange({ value: "col2" });
    result.update();
    result.find(CreateTransform).find(Select).last().props().onChange({ value: "mean" });
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col2",
      group: ["col1"],
      agg: "mean",
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col2_transform");
  });

  it("DataViewer: build transform cfg validation", () => {
    const { validateTransformCfg } = require("../../../popups/create/CreateTransform");
    expect(validateTransformCfg(t, { group: null })).toBe("Please select a group!");
    expect(validateTransformCfg(t, { col: null, group: ["col1"] })).toBe("Please select a column to transform!");
    expect(
      validateTransformCfg(t, {
        col: "col1",
        group: ["col2"],
        agg: null,
      })
    ).toBe("Please select an aggregation!");
    expect(
      validateTransformCfg(t, {
        col: "col1",
        group: ["col2"],
        agg: "mean",
      })
    ).toBeNull();
  });
});
