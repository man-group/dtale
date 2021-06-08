import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { describe, expect, it } from "@jest/globals";

import { HeatMapOption } from "../../../dtale/menu/HeatMapOption";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML } from "../../test-utils";

describe("HeatMapOption tests", () => {
  let result, props, toggleBackgroundSpy, store;

  const setupOption = (propOverrides, showAllHeatmapColumns = false) => {
    toggleBackgroundSpy = jest.fn();
    props = {
      backgroundMode: null,
      toggleBackground: jest.fn(backgroundMode => () => toggleBackgroundSpy(backgroundMode)),
      ...propOverrides,
    };
    store = reduxUtils.createDtaleStore();
    store.getState().showAllHeatmapColumns = showAllHeatmapColumns;
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <HeatMapOption {...props} />,
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
  };

  beforeEach(() => {
    setupOption();
  });

  it("renders successfully with defaults", () => {
    expect(result.find("button").map(b => b.text())).toEqual(["By Col", "Overall"]);
    result.find("button").first().simulate("click");
    expect(toggleBackgroundSpy).toHaveBeenLastCalledWith("heatmap-col");
    result.find("button").last().simulate("click");
    expect(toggleBackgroundSpy).toHaveBeenLastCalledWith("heatmap-all");
  });

  it("handles background updates w/ all columns displayed", () => {
    setupOption({}, true);
    result.find("button").first().simulate("click");
    expect(toggleBackgroundSpy).toHaveBeenLastCalledWith("heatmap-col-all");
    result.find("button").last().simulate("click");
    expect(toggleBackgroundSpy).toHaveBeenLastCalledWith("heatmap-all-all");
  });
});
