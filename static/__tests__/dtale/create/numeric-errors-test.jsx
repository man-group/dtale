import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../../RemovableError";
import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, withGlobalJquery } from "../../test-utils";

describe("DataViewer tests", () => {
  let result, CreateColumn;

  function findNumericInputs(r) {
    const CreateNumeric = require("../../../popups/create/CreateNumeric").default;
    return r.find(CreateNumeric).first();
  }

  function findLeftInputs(r) {
    return findNumericInputs(r).find("div.form-group").at(1);
  }

  const simulateClick = async r => {
    r.simulate("click");
    await tick();
  };

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
    const { DataViewer } = require("../../../dtale/DataViewer");
    CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;

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
    await tick();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build column errors", async () => {
    expect(result.find(CreateColumn).length).toBe(1);
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    expect(result.find(RemovableError).text()).toBe("Name is required!");
    result
      .find(CreateColumn)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "col4" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    expect(result.find(RemovableError).text()).toBe("The column 'col4' already exists!");
    result
      .find(CreateColumn)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "error" } });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    expect(result.find(RemovableError).text()).toBe("Please select an operation!");

    await simulateClick(findNumericInputs(result).find("div.form-group").first().find("button").first());
    await simulateClick(findLeftInputs(result).find("button").first());
    findLeftInputs(result).find(Select).first().props().onChange({ value: "col1" });
    await tick();
    findNumericInputs(result).find("div.form-group").at(2).find(Select).first().props().onChange({ value: "col2" });
    await simulateClick(result.find("div.modal-footer").first().find("button").first());
    expect(result.find(RemovableError).text()).toBe("error test");
  });
});
