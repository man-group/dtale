import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, findMainMenuButton, tick, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("DataViewer highlighting tests", () => {
  let result, DataViewer, ReactDataViewer;
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });

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

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  const heatMapBtn = () => findMainMenuButton(result, "By Col", "div.btn-group");
  const dataViewer = () => result.find(ReactDataViewer);

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
        .map(hc => hc.text())
    ).toEqual(["col1", "col2"]);
    heatMapBtn().find("button").last().simulate("click");
    expect(
      dataViewer()
        .find("div.headerCell")
        .map(hc => hc.text())
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
    const RangeHighlight = require("../../popups/RangeHighlight").RangeHighlight;
    const RangeHighlightOption = require("../../dtale/menu/RangeHighlightOption").default;
    clickMainMenuButton(result, "Highlight Range");
    result.update();
    result
      .find(RangeHighlight)
      .find("div.form-group")
      .forEach(input => {
        input.find("i").simulate("click");
        input.find("input").simulate("change", { target: { value: "3" } });
      });
    expect(dataViewer().instance().state.backgroundMode).toBe("range");
    expect(dataViewer().instance().state.rangeHighlight).toStrictEqual({
      isEquals: true,
      equals: 3,
      isGreaterThan: true,
      greaterThan: 3,
      isLessThan: true,
      lessThan: 3,
    });
    result.find(RangeHighlightOption).find("i").simulate("click");
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBeNull();
    expect(dataViewer().instance().state.rangeHighlight).toStrictEqual({
      isEquals: false,
      equals: 3,
      isGreaterThan: false,
      greaterThan: 3,
      isLessThan: false,
      lessThan: 3,
    });
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
