import { mount } from "enzyme";
import _ from "lodash";
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
  let result, CreateColumn, CreateCleaning;

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
        const { urlFetcher, DTYPES } = require("../../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/dtypes")) {
          return {
            dtypes: _.concat(DTYPES.dtypes, {
              name: "col5",
              index: 4,
              dtype: "mixed-integer",
              visible: true,
              unique_ct: 1,
            }),
            success: true,
          };
        }
        return urlFetcher(url);
      })
    );
    mockChartJS();
    jest.mock("popsicle", () => mockBuildLibs);
  });

  beforeEach(async () => {
    CreateCleaning = require("../../../popups/create/CreateCleaning").default;
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
    result
      .find(CreateColumn)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "conv_col" } });
    clickBuilder(result, "Cleaning");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build config", async () => {
    expect(result.find(CreateCleaning).length).toBe(1);
    result.find(CreateCleaning).find(Select).first().props().onChange({ value: "col1" });
    result.update();
    result.find(CreateCleaning).find("div.form-group").at(1).find("button").first().simulate("click");
    result
      .find(CreateCleaning)
      .find("div.form-group")
      .at(1)
      .find("button")
      .findWhere(btn => btn.text() === "Drop Stop Words")
      .first()
      .simulate("click");
    result.update();
    result
      .find(CreateCleaning)
      .find("div.form-group")
      .last()
      .find("input")
      .simulate("change", { target: { value: "foo,bar" } });
    result.update();
    result
      .find(CreateCleaning)
      .find("div.form-group")
      .at(1)
      .find("button")
      .findWhere(btn => btn.text() === "Update Word Case")
      .first()
      .simulate("click");
    result.update();
    result.find(CreateCleaning).find("div.form-group").last().find("button").first().simulate("click");
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      cleaners: ["hidden_chars", "drop_multispace", "stopwords", "update_case"],
      caseType: "upper",
      stopwords: ["foo", "bar"],
    });
  });

  it("DataViewer: toggle off cleaner", async () => {
    expect(result.find(CreateCleaning).length).toBe(1);
    result.find(CreateCleaning).find(Select).first().props().onChange({ value: "col1" });
    result.update();
    result.find(CreateCleaning).find("div.form-group").at(1).find("button").first().simulate("click");
    result.find(CreateCleaning).find("div.form-group").at(1).find("button").first().simulate("click");
    result.find(CreateCleaning).find("div.form-group").at(1).find("button").at(1).simulate("click");
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      cleaners: ["hidden_chars", "drop_punctuation"],
    });
  });

  it("DataViewer: build conversion cfg validation", () => {
    const { validateCleaningCfg } = require("../../../popups/create/CreateCleaning");
    expect(validateCleaningCfg(t, { col: null })).toBe("Please select a column to clean!");
    expect(validateCleaningCfg(t, { col: "col1" })).toBe("Please apply function(s)!");
    expect(
      validateCleaningCfg(t, {
        col: "col2",
        cleaners: ["update_case"],
      })
    ).toBe("Please select a case to apply!");
    expect(
      validateCleaningCfg(t, {
        col: "col2",
        cleaners: ["update_case", "stopwords"],
        caseType: "upper",
      })
    ).toBe("Please enter a comma-separated string of stop words!");
    expect(
      validateCleaningCfg(t, {
        col: "col2",
        cleaners: ["hidden_chars", "update_case", "stopwords"],
        caseType: "upper",
        stopwords: ["foo"],
      })
    ).toBeNull();
  });
});
