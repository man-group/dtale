import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("DataViewer tests", () => {
  const { location, open, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 800,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });
  let result, Reshape, Resample, validateResampleCfg;

  beforeAll(() => {
    dimensions.beforeAll();

    delete window.location;
    delete window.open;
    delete window.opener;
    window.location = {
      reload: jest.fn(),
      pathname: "/dtale/iframe/1",
      assign: jest.fn(),
    };
    window.open = jest.fn();
    window.opener = { code_popup: { code: "test code", title: "Test" } };
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    mockChartJS();

    jest.mock("popsicle", () => mockBuildLibs);

    Reshape = require("../../../popups/reshape/Reshape").ReactReshape;
    Resample = require("../../../popups/reshape/Resample").ReactResample;
    validateResampleCfg = require("../../../popups/reshape/Resample").validateResampleCfg;
  });

  beforeEach(async () => {
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
    clickMainMenuButton(result, "Timeseries");
    await tickUpdate(result);
  });

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.open = open;
    window.opener = opener;
  });

  it("DataViewer: reshape resample", async () => {
    result.find(Reshape).find("div.modal-body").find("button").at(2).simulate("click");
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
    result.find("div.modal-body").find("div.row").last().find("button").last().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(Reshape).length).toBe(1);
    result.find("div.modal-body").find("div.row").last().find("button").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(Reshape).length).toBe(0);

    const cfg = { index: null };
    expect(validateResampleCfg(cfg)).toBe("Missing an index selection!");
    cfg.index = "x";
    expect(validateResampleCfg(cfg)).toBe("Missing offset!");
    cfg.freq = "x";
    expect(validateResampleCfg(cfg)).toBe("Missing aggregation!");
    cfg.agg = "x";
    expect(validateResampleCfg(cfg)).toBeNull();
  });
});
