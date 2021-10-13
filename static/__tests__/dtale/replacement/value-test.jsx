import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../../RemovableError";
import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import { clickColMenuButton } from "../../iframe/iframe-utils";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, mockChartJS, mockT as t, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("DataViewer tests", () => {
  let result, CreateReplacement, Value;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  beforeEach(async () => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    CreateReplacement = require("../../../popups/replacement/CreateReplacement").ReactCreateReplacement;
    Value = require("../../../popups/replacement/Value").Value;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tickUpdate(result);
    // select column
    result.find(".main-grid div.headerCell").first().find(".text-nowrap").simulate("click");
    result.update();

    clickColMenuButton(result, "Replacements");
    await tickUpdate(result);
  });

  afterAll(dimensions.afterAll);

  const findValueInputRow = (idx = 0) => result.find(Value).find("div.form-group").at(idx);

  it("DataViewer: value raw replacement w/ new col", async () => {
    result.find(CreateReplacement).find("div.form-group").first().find("button").last().simulate("click");
    result
      .find(CreateReplacement)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "cut_col" } });
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").first().simulate("click");
    result.update();
    expect(result.find(Value).length).toBe(1);
    findValueInputRow()
      .find("input")
      .simulate("change", { target: { value: "3" } });
    findValueInputRow(1).find("button").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    expect(result.find(CreateReplacement).find(RemovableError)).toHaveLength(1);
    findValueInputRow(1).find("i").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
  });

  it("DataViewer: value agg replacement", async () => {
    const validationSpy = jest.spyOn(require("../../../popups/replacement/Value"), "validateValueCfg");
    validationSpy.mockClear();
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").first().simulate("click");
    result.update();
    findValueInputRow(1).find("button").at(1).simulate("click");
    findValueInputRow(1).find(Select).first().props().onChange({ value: "median" });
    findValueInputRow(1).find("i").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(validationSpy.mock.calls[0][1]).toStrictEqual({
      value: [{ type: "agg", value: "nan", replace: "median" }],
    });
  });

  it("DataViewer: value col replacement", async () => {
    const validationSpy = jest.spyOn(require("../../../popups/replacement/Value"), "validateValueCfg");
    validationSpy.mockClear();
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").first().simulate("click");
    result.update();
    findValueInputRow(1).find("button").last().simulate("click");
    findValueInputRow(1).find(Select).first().props().onChange({ value: "col2" });
    findValueInputRow(1).find("i").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(validationSpy.mock.calls[0][1]).toStrictEqual({
      value: [{ type: "col", value: "nan", replace: "col2" }],
    });
  });

  it("DataViewer: value cfg validation", () => {
    const { validateValueCfg } = require("../../../popups/replacement/Value");
    expect(validateValueCfg(t, [])).toBe("Please add (+) a replacement!");
  });
});
