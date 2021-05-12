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
  let result, CreateReplacement, Spaces;
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
    Spaces = require("../../../popups/replacement/Spaces").Spaces;

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

  it("DataViewer: spaces replacement w/ new col", async () => {
    result.find(CreateReplacement).find("div.form-group").first().find("button").last().simulate("click");
    result
      .find(CreateReplacement)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "cut_col" } });
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").at(1).simulate("click");
    result.update();
    expect(result.find(Spaces).length).toBe(1);
    const spacesInputs = result.find(Spaces).first();
    spacesInputs
      .find("div.form-group")
      .first()
      .find("input")
      .simulate("change", { target: { value: "nan" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
  });

  it("DataViewer: spaces replacement", async () => {
    const validationSpy = jest.spyOn(require("../../../popups/replacement/Spaces"), "validateSpacesCfg");
    result.find(CreateReplacement).find("div.form-group").at(1).find("button").at(1).simulate("click");
    result.update();
    expect(result.find(Spaces).length).toBe(1);
    const spacesInputs = result.find(Spaces).first();
    spacesInputs
      .find("div.form-group")
      .first()
      .find("input")
      .simulate("change", { target: { value: "nan" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(validationSpy.mock.calls[0][1]).toStrictEqual({ replace: "nan" });
  });

  it("DataViewer: spaces cfg validation", () => {
    const { validateSpacesCfg } = require("../../../popups/replacement/Spaces");
    const cfg = { replace: null };
    expect(validateSpacesCfg(t, cfg)).toBe("Please enter a replacement value!");
  });
});
