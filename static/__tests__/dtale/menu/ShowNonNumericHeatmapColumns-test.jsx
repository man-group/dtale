import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { describe, expect, it } from "@jest/globals";

import { ShowNonNumericHeatmapColumns } from "../../../dtale/menu/ShowNonNumericHeatmapColumns";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML } from "../../test-utils";

describe("ShowNonNumericHeatmapColumns tests", () => {
  let result, props, store;

  const setupOption = (propOverrides, showAllHeatmapColumns = false) => {
    props = {
      backgroundMode: null,
      toggleBackground: jest.fn(() => () => undefined),
      ...propOverrides,
    };
    store = reduxUtils.createDtaleStore();
    store.getState().showAllHeatmapColumns = showAllHeatmapColumns;
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <ShowNonNumericHeatmapColumns {...props} />,
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
    expect(result.find("i.ico-check-box-outline-blank")).toHaveLength(1);
  });

  it("handles changes to checkbox", () => {
    result.find("i.ico-check-box-outline-blank").simulate("click");
    expect(store.getState().showAllHeatmapColumns).toBe(true);
  });

  it("handles checkbox check w/ background", () => {
    setupOption({ backgroundMode: "heatmap-col" });
    result.find("i.ico-check-box-outline-blank").simulate("click");
    expect(store.getState().showAllHeatmapColumns).toBe(true);
    expect(props.toggleBackground).toHaveBeenLastCalledWith("heatmap-col-all");
  });

  it("handles checkbox uncheck w/ background", () => {
    setupOption({ backgroundMode: "heatmap-col-all" }, true);
    result.find("i.ico-check-box").simulate("click");
    expect(store.getState().showAllHeatmapColumns).toBe(false);
    expect(props.toggleBackground).toHaveBeenLastCalledWith("heatmap-col");
  });
});
