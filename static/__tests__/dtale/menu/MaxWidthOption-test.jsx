import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { describe, expect, it } from "@jest/globals";

import { MaxWidthOption, ReactMaxDimensionOption } from "../../../dtale/menu/MaxDimensionOption";
import serverState from "../../../dtale/serverStateManagement";
import { StyledSlider } from "../../../sliderUtils";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML } from "../../test-utils";

describe("MaxWidthOption tests", () => {
  let result, store, udpateMaxColumnWidthSpy;

  const setupOption = (maxColumnWidth = null) => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "", maxColumnWidth }, store);
    result = mount(
      <Provider store={store}>
        <MaxWidthOption />,
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
  };

  beforeEach(() => {
    udpateMaxColumnWidthSpy = jest.spyOn(serverState, "updateMaxColumnWidth");
    udpateMaxColumnWidthSpy.mockImplementation(() => undefined);
    setupOption();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it("renders successfully with defaults", () => {
    expect(result.find("i.ico-check-box-outline-blank")).toHaveLength(1);
  });

  it("renders successfully with specified value", () => {
    setupOption("55");
    expect(result.find("i.ico-check-box")).toHaveLength(1);
    expect(result.find("input").props().value).toBe("55");
  });

  it("handles changes to text input", () => {
    result.find("input").simulate("change", { target: { value: "f150" } });
    expect(result.find(ReactMaxDimensionOption).state().currMaxDimension).toBe(100);
    result.find("input").simulate("change", { target: { value: "150" } });
    expect(result.find(ReactMaxDimensionOption).state().currMaxDimension).toBe(150);
    result.find("input").simulate("keyDown", { key: "Enter" });
    expect(udpateMaxColumnWidthSpy).toBeCalledTimes(1);
    udpateMaxColumnWidthSpy.mock.calls[0][1]();
    expect(store.getState().maxColumnWidth).toBe(150);
  });

  it("handles changes to slider", () => {
    result.find(StyledSlider).props().onAfterChange(150);
    expect(result.find(ReactMaxDimensionOption).state().currMaxDimension).toBe(150);
    expect(udpateMaxColumnWidthSpy).toBeCalledTimes(1);
    udpateMaxColumnWidthSpy.mock.calls[0][1]();
    expect(store.getState().maxColumnWidth).toBe(150);
  });

  it("handles changes to checkbox", () => {
    result.find("i.ico-check-box-outline-blank").simulate("click");
    expect(result.find(ReactMaxDimensionOption).state().currMaxDimension).toBe(100);
    expect(udpateMaxColumnWidthSpy).toBeCalledTimes(1);
    udpateMaxColumnWidthSpy.mock.calls[0][1]();
    expect(store.getState().maxColumnWidth).toBe(100);
    result.update();
    result.find("i.ico-check-box").simulate("click");
    expect(udpateMaxColumnWidthSpy).toBeCalledTimes(2);
    expect(udpateMaxColumnWidthSpy.mock.calls[1][0]).toBe("");
    udpateMaxColumnWidthSpy.mock.calls[1][1]();
    expect(store.getState().maxColumnWidth).toBe(null);
  });
});
