import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import { clickColMenuButton } from "../../iframe/iframe-utils";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, mockChartJS, mockT as t, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("DataViewer tests", () => {
  let result, CreateReplacement, Imputer;
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
    Imputer = require("../../../popups/replacement/Imputer").Imputer;

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

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  const findImputerInputRow = (idx = 0) => result.find(Imputer).find("div.form-group").at(idx);

  it("DataViewer: imputer iterative replacement w/ new col", async () => {
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
    expect(result.find(Imputer).length).toBe(1);
    findImputerInputRow().find("button").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
  });

  it("DataViewer: imputer knn replacement", async () => {
    const validationSpy = jest.spyOn(require("../../../popups/replacement/Imputer"), "validateImputerCfg");
    validationSpy.mockClear();
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").last().simulate("click");
    result.update();
    findImputerInputRow().find("button").at(1).simulate("click");
    findImputerInputRow(1)
      .find("input")
      .simulate("change", { target: { value: "3" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(validationSpy.mock.calls[0][1]).toStrictEqual({
      type: "knn",
      nNeighbors: "3",
    });
  });

  it("DataViewer: imputer simple replacement", async () => {
    const validationSpy = jest.spyOn(require("../../../popups/replacement/Imputer"), "validateImputerCfg");
    validationSpy.mockClear();
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").last().simulate("click");
    result.update();
    findImputerInputRow().find("button").last().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(validationSpy.mock.calls[0][1]).toStrictEqual({ type: "simple" });
  });

  it("DataViewer: imputer cfg validation", () => {
    const { validateImputerCfg } = require("../../../popups/replacement/Imputer");
    expect(validateImputerCfg(t, { type: null })).toBe("Please select an imputer!");
  });
});
