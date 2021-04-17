import { shallow } from "enzyme";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";

import { expect, it } from "@jest/globals";

import * as ColumnMenu from "../../../dtale/column/ColumnMenu";
import ColumnMenuOption from "../../../dtale/column/ColumnMenuOption";
import serverState from "../../../dtale/serverStateManagement";
import DimensionsHelper from "../../DimensionsHelper";
import reduxUtils from "../../redux-test-utils";

describe("DescribePanel", () => {
  let wrapper, props, positionMenuSpy, ignoreMenuClicksSpy, toggleVisibilitySpy;
  const dimensions = new DimensionsHelper({
    offsetWidth: 1000,
    offsetHeight: 1000,
    innerWidth: 1000,
    innerHeight: 1000,
  });

  beforeEach(async () => {
    dimensions.beforeAll();
    positionMenuSpy = jest.spyOn(ColumnMenu, "positionMenu");
    positionMenuSpy.mockImplementation(() => undefined);
    ignoreMenuClicksSpy = jest.spyOn(ColumnMenu, "ignoreMenuClicks");
    ignoreMenuClicksSpy.mockImplementation(() => undefined);
    toggleVisibilitySpy = jest.spyOn(serverState, "toggleVisibility");
    toggleVisibilitySpy.mockImplementation(() => undefined);
    props = {
      selectedCol: "col1",
      columns: reduxUtils.DTYPES.dtypes,
      columnMenuOpen: true,
      sortInfo: null,
      propagateState: jest.fn(),
      dataId: "1",
      openChart: jest.fn(),
      hideColumnMenu: jest.fn(),
      outlierFilters: null,
      backgroundMode: null,
      isPreview: false,
      ribbonMenuOpen: false,
      showSidePanel: jest.fn(),
    };
    wrapper = shallow(<ColumnMenu.ReactColumnMenu {...props} />);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it("has global hotkey to close menu", () => {
    const closeMenu = wrapper.find(GlobalHotKeys).props().handlers.CLOSE_MENU;
    closeMenu();
    expect(props.hideColumnMenu).toHaveBeenCalledWith("col1");
  });

  it("opens side panel on describe", () => {
    wrapper
      .find(ColumnMenuOption)
      .findWhere(option => option.props().iconClass === "ico-visibility-off")
      .props()
      .open();
    expect(toggleVisibilitySpy).toHaveBeenCalledTimes(1);
    const toggleParams = toggleVisibilitySpy.mock.calls[0];
    expect(toggleParams[0]).toBe(props.dataId);
    expect(toggleParams[1]).toBe(props.selectedCol);
    toggleParams[2]();
    expect(props.propagateState).toHaveBeenCalledWith({
      columns: reduxUtils.DTYPES.dtypes.map(col => (col.name === props.selectedCol ? { ...col, visible: false } : col)),
      triggerResize: true,
    });
  });

  it("correctly hides column", () => {
    wrapper
      .find(ColumnMenuOption)
      .findWhere(option => option.props().iconClass === "ico-view-column")
      .props()
      .open();
  });
});
