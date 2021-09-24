import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";

import {
  buildInnerHTML,
  clickMainMenuButton,
  findMainMenuButton,
  tick,
  tickUpdate,
  withGlobalJquery,
} from "../test-utils";

describe("DataViewer highlighting tests", () => {
  let result, DataViewer, ReactDataViewer, RangeHighlight, saveRangeHighlightsSpy;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
    const dv = require("../../dtale/DataViewer");
    DataViewer = dv.DataViewer;
    ReactDataViewer = dv.ReactDataViewer;
    RangeHighlight = require("../../popups/RangeHighlight").RangeHighlight;
    const serverState = require("../../dtale/serverStateManagement").default;
    saveRangeHighlightsSpy = jest.spyOn(serverState, "saveRangeHighlights");
    saveRangeHighlightsSpy.mockImplementation(() => undefined);
  });

  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "", hideShutdown: "True", processes: 2 }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tick();
  });

  afterAll(dimensions.afterAll);

  const heatMapBtn = () => findMainMenuButton(result, "By Col", "div.btn-group");
  const dataViewer = () => result.find(ReactDataViewer);
  const allRange = () => result.find(RangeHighlight).find("div.form-group").last();
  const updateRange = () => {
    saveRangeHighlightsSpy.mock.calls[saveRangeHighlightsSpy.mock.calls.length - 1][2]();
    result.update();
  };

  it("DataViewer: heatmap", async () => {
    heatMapBtn().find("button").first().simulate("click");
    result.update();
    expect(
      _.every(
        dataViewer()
          .find("div.cell")
          .map(c => _.includes(c.html(), "background: rgb"))
      )
    ).toBe(true);
    expect(
      dataViewer()
        .find("div.headerCell")
        .map(hc => hc.find(".text-nowrap").text())
    ).toEqual(["col1", "col2"]);
    heatMapBtn().find("button").last().simulate("click");
    expect(
      dataViewer()
        .find("div.headerCell")
        .map(hc => hc.find(".text-nowrap").text())
    ).toEqual(["col1", "col2"]);
    heatMapBtn().find("button").last().simulate("click");
    expect(_.filter(dataViewer(result).instance().state.columns, { visible: true }).length).toBe(5);
    expect(
      _.every(
        dataViewer()
          .find("div.cell")
          .map(c => !_.includes(c.html(), "background: rgb"))
      )
    ).toBe(true);
  });

  it("DataViewer: dtype highlighting", async () => {
    clickMainMenuButton(result, "Highlight Dtypes");
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBe("dtypes");
    clickMainMenuButton(result, "Highlight Dtypes");
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBeNull();
  });

  it("DataViewer: missing highlighting", async () => {
    clickMainMenuButton(result, "Highlight Missing");
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBe("missing");
    clickMainMenuButton(result, "Highlight Missing");
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBeNull();
  });

  it("DataViewer: outlier highlighting", async () => {
    clickMainMenuButton(result, "Highlight Outliers");
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBe("outliers");
    clickMainMenuButton(result, "Highlight Outliers");
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBeNull();
  });

  it("DataViewer: range highlighting", async () => {
    const RangeHighlightOption = require("../../dtale/menu/RangeHighlightOption").default;
    clickMainMenuButton(result, "Highlight Range");
    result.update();
    result
      .find(RangeHighlight)
      .find("div.form-group")
      .forEach((input, idx) => {
        if (idx > 0 && idx < 4) {
          input.find("i").simulate("click");
          input.find("input").simulate("change", { target: { value: "3" } });
        }
      });
    result.find(RangeHighlight).find("div.form-group").at(4).find("button").simulate("click");
    await tickUpdate(result);
    expect(saveRangeHighlightsSpy).toHaveBeenCalledTimes(1);
    updateRange();
    expect(dataViewer().instance().state.backgroundMode).toBe("range");
    expect(dataViewer().instance().state.rangeHighlight).toStrictEqual(saveRangeHighlightsSpy.mock.calls[0][1]);
    result.find(RangeHighlightOption).find("i").simulate("click");
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBeNull();
    expect(dataViewer().instance().state.rangeHighlight).toStrictEqual(saveRangeHighlightsSpy.mock.calls[0][1]);
    clickMainMenuButton(result, "Highlight Range");
    result.update();
    allRange().find("i.ico-check-box-outline-blank").simulate("click");
    updateRange();
    expect(dataViewer().instance().state.rangeHighlight.all.active).toBe(true);
    allRange().find("i.ico-check-box").simulate("click");
    updateRange();
    expect(dataViewer().instance().state.rangeHighlight.all.active).toBe(false);
    allRange().find("i.ico-remove-circle").simulate("click");
    updateRange();
    expect(_.size(dataViewer().instance().state.rangeHighlight)).toBe(0);
  });

  it("DataViewer: low variance highlighting", async () => {
    clickMainMenuButton(result, "Low Variance Flag");
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBe("lowVariance");
    clickMainMenuButton(result, "Low Variance Flag");
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBeNull();
  });
});
