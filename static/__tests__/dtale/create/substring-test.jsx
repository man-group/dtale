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
  let result, CreateColumn, CreateSubstring;
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
    CreateSubstring = require("../../../popups/create/CreateSubstring").default;
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
    clickBuilder(result, "Substring");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build substring column", async () => {
    expect(result.find(CreateSubstring).length).toBe(1);
    result.find(CreateSubstring).find(Select).first().props().onChange({ value: "col1" });
    result
      .find(CreateSubstring)
      .find("div.form-group")
      .at(1)
      .find("input")
      .first()
      .simulate("change", { target: { value: "2" } });
    result
      .find(CreateSubstring)
      .find("div.form-group")
      .last()
      .find("input")
      .first()
      .simulate("change", { target: { value: "4" } });
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      start: 2,
      end: 4,
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_substring");
  });

  it("DataViewer: build substring cfg validation", () => {
    const { validateSubstringCfg } = require("../../../popups/create/CreateSubstring");
    expect(validateSubstringCfg(t, {})).toBe("Missing a column selection!");
    expect(
      validateSubstringCfg(t, {
        col: "col1",
      })
    ).toBe("Invalid range specification, start must be less than end!");
    expect(
      validateSubstringCfg(t, {
        col: "col1",
        start: "4",
        end: "2",
      })
    ).toBe("Invalid range specification, start must be less than end!");
    expect(
      validateSubstringCfg(t, {
        col: "col1",
        start: "2",
        end: "4",
      })
    ).toBeNull();
  });
});
