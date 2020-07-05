import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { DtaleHotkeys, ReactDtaleHotkeys } from "../../dtale/DtaleHotkeys";
import menuUtils from "../../menuUtils";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML } from "../test-utils";

describe("DtaleHotkeys tests", () => {
  const { open, innerWidth, innerHeight } = window;
  let result, propagateState, openChart, buildClickHandlerSpy;

  beforeAll(() => {
    propagateState = jest.fn();
    openChart = jest.fn();
    delete window.open;
    window.open = jest.fn();
    window.innerHeight = 800;
    window.innerWidth = 1400;
  });

  beforeEach(() => {
    buildClickHandlerSpy = jest.spyOn(menuUtils, "buildClickHandler");
    buildInnerHTML({ settings: "" });
    result = mount(<ReactDtaleHotkeys {...{ propagateState, dataId: "1", openChart }} />, {
      attachTo: document.getElementById("content"),
    });
  });

  afterEach(() => {
    buildClickHandlerSpy.mockClear();
    jest.clearAllMocks();
  });

  afterAll(() => {
    window.open = open;
    window.innerHeight = innerHeight;
    window.innerWidth = innerWidth;
  });

  it("renders GlobalHotKeys", () => {
    expect(result.find(GlobalHotKeys).length).toBe(1);
  });

  it("does not render when cell being edited", () => {
    result.setProps({ editedCell: "true" });
    expect(result.find(GlobalHotKeys).length).toBe(0);
  });

  it("sets state and fires click handler on menu open", () => {
    const hotkeys = result.find(GlobalHotKeys);
    const menuHandler = hotkeys.prop("handlers").MENU;
    menuHandler();
    expect(propagateState.mock.calls).toHaveLength(1);
    expect(propagateState.mock.calls[0][0]).toEqual({ menuOpen: true });
    expect(buildClickHandlerSpy.mock.calls).toHaveLength(1);
    buildClickHandlerSpy.mock.calls[0][1]();
    expect(propagateState.mock.calls).toHaveLength(2);
    expect(propagateState.mock.calls[1][0]).toEqual({ menuOpen: false });
  });

  it("opens new tab on describe open", () => {
    const hotkeys = result.find(GlobalHotKeys);
    const describeHandler = hotkeys.prop("handlers").DESCRIBE;
    describeHandler();
    expect(window.open.mock.calls).toHaveLength(1);
    expect(window.open.mock.calls[0][0]).toBe("/dtale/popup/describe/1");
  });

  it("calls window.open on code export", () => {
    const hotkeys = result.find(GlobalHotKeys);
    const codeHandler = hotkeys.prop("handlers").CODE;
    codeHandler();
    expect(window.open.mock.calls).toHaveLength(1);
    expect(window.open.mock.calls[0][0]).toBe("/dtale/popup/code-export/1");
  });

  it("calls window.open on code export", () => {
    const hotkeys = result.find(GlobalHotKeys);
    const chartsHandler = hotkeys.prop("handlers").CHARTS;
    chartsHandler();
    expect(window.open.mock.calls).toHaveLength(1);
    expect(window.open.mock.calls[0][0]).toBe("/charts/1");
  });

  it("calls openChart from redux", () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    const reduxResult = mount(
      <Provider store={store}>
        <DtaleHotkeys propagateState={propagateState} />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    const hotkeys = reduxResult.find(GlobalHotKeys);
    const filterHandler = hotkeys.prop("handlers").FILTER;
    filterHandler();
    expect(_.pick(store.getState().chartData, ["type", "visible"])).toEqual({
      type: "filter",
      visible: true,
    });
  });
});
