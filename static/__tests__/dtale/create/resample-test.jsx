import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../../test-utils";

import { clickBuilder } from "./create-test-utils";

describe("DataViewer tests", () => {
  const { location, open } = window;
  let result, Resample;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    delete window.location;
    window.location = { href: "http://localhost:8080/dtale/main/1" };
    delete window.open;
    window.open = jest.fn();

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
    Resample = require("../../../popups/reshape/Resample").ReactResample;

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
  });

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.open = open;
  });

  it("DataViewer: build resample", async () => {
    const fetcher = require("../../../fetcher");
    const fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    clickBuilder(result, "Resample");
    expect(result.find(Resample).length).toBe(1);
    const resampleComp = result.find(Resample).first();
    const resampleInputs = resampleComp.find(Select);
    resampleInputs.first().props().onChange({ value: "col1" });
    resampleComp
      .find("div.form-group.row")
      .at(2)
      .find("input")
      .first()
      .simulate("change", { target: { value: "17min" } });
    resampleInputs.last().props().onChange({ value: "mean" });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(fetchJsonSpy.mock.calls[0][0].startsWith("/dtale/reshape/1")).toBe(true);
    expect(window.open).toHaveBeenCalledWith("http://localhost:8080/dtale/main/9999", "_blank");
  });
});
