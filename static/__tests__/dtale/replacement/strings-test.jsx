import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../../RemovableError";
import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import { clickColMenuButton } from "../../iframe/iframe-utils";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, mockChartJS, mockT as t, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("DataViewer tests", () => {
  let result, CreateReplacement, Strings;
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
    Strings = require("../../../popups/replacement/Strings").Strings;

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
    result.find(".main-grid div.headerCell").at(2).find(".text-nowrap").simulate("click");
    result.update();

    clickColMenuButton(result, "Replacements");
    await tickUpdate(result);
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: strings replacement w/ new col", async () => {
    result.find(CreateReplacement).find("div.form-group").first().find("button").last().simulate("click");
    result
      .find(CreateReplacement)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "cut_col" } });
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").last().simulate("click");
    result.update();
    expect(result.find(Strings).length).toBe(1);
    const stringsInputs = result.find(Strings).first();
    stringsInputs
      .find("div.form-group")
      .first()
      .find("input")
      .simulate("change", { target: { value: "nan" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
  });

  it("DataViewer: strings replacement", async () => {
    const validationSpy = jest.spyOn(require("../../../popups/replacement/Strings"), "validateStringsCfg");
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").last().simulate("click");
    result.update();
    expect(result.find(Strings).length).toBe(1);
    const stringsInputs = result.find(Strings).first();
    stringsInputs
      .find("div.form-group")
      .first()
      .find("input")
      .simulate("change", { target: { value: "A" } });
    stringsInputs.find("div.form-group").at(1).find("i").simulate("click");
    stringsInputs.find("div.form-group").at(2).find("i").simulate("click");
    stringsInputs
      .find("div.form-group")
      .last()
      .find("input")
      .simulate("change", { target: { value: "nan" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(validationSpy.mock.calls[0][1]).toStrictEqual({
      value: "A",
      isChar: true,
      ignoreCase: true,
      replace: "nan",
    });
  });

  it("DataViewer: string replacement w/ new invalid col", async () => {
    result.find(CreateReplacement).find("div.form-group").first().find("button").last().simulate("click");
    result
      .find(CreateReplacement)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "error" } });
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").last().simulate("click");
    result.update();
    expect(result.find(Strings).length).toBe(1);
    const spacesInputs = result.find(Strings).first();
    spacesInputs
      .find("div.form-group")
      .first()
      .find("input")
      .simulate("change", { target: { value: "nan" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(CreateReplacement).find(RemovableError)).toHaveLength(1);
  });

  it("DataViewer: strings cfg validation", () => {
    const { validateStringsCfg } = require("../../../popups/replacement/Strings");
    let cfg = { value: null };
    expect(validateStringsCfg(t, cfg)).toBe("Please enter a character or substring!");
    cfg = { value: "A", replace: null };
    expect(validateStringsCfg(t, cfg)).toBe("Please enter a replacement value!");
  });
});
