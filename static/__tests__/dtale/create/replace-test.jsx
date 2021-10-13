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
  let result, CreateColumn, CreateReplace;
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
    CreateReplace = require("../../../popups/create/CreateReplace").default;
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
    clickBuilder(result, "Replace");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build replace column", async () => {
    expect(result.find(CreateReplace).length).toBe(1);
    result.find(CreateReplace).find(Select).first().props().onChange({ value: "col1" });
    result
      .find(CreateReplace)
      .find("div.form-group")
      .at(1)
      .find("input")
      .simulate("change", { target: { value: "foo" } });
    result
      .find(CreateReplace)
      .find("div.form-group")
      .at(2)
      .find("input")
      .simulate("change", { target: { value: "bar" } });
    result.find(CreateReplace).find("i.ico-check-box-outline-blank").first().simulate("click");
    result.find(CreateReplace).find("i.ico-check-box-outline-blank").first().simulate("click");
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      search: "foo",
      replacement: "bar",
      caseSensitive: true,
      regex: true,
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_replace");
  });

  it("DataViewer: build replace cfg validation", () => {
    const { validateReplaceCfg } = require("../../../popups/create/CreateReplace");
    expect(validateReplaceCfg(t, {})).toBe("Missing a column selection!");
    expect(
      validateReplaceCfg(t, {
        col: "col1",
      })
    ).toBe("You must enter a substring to search for!");
    expect(
      validateReplaceCfg(t, {
        col: "col1",
        search: "foo",
      })
    ).toBe("You must enter a replacement!");
    expect(
      validateReplaceCfg(t, {
        col: "col1",
        search: "foo",
        replacement: "bar",
      })
    ).toBeNull();
  });
});
