import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { ReactGridEventHandler } from "../../dtale/GridEventHandler";

jest.useFakeTimers();

describe("RibbonDropdown", () => {
  let wrapper, props;

  beforeEach(() => {
    props = {
      dataId: "1",
      gridState: {},
      propagateState: jest.fn(),
      children: null,
      allowCellEdits: true,
      openChart: jest.fn(),
      editCell: jest.fn(),
      setRibbonVisibility: jest.fn(),
      ribbonMenuOpen: false,
      ribbonDropdownOpen: false,
    };
    wrapper = shallow(<ReactGridEventHandler {...props} />);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => jest.restoreAllMocks());

  it("opens ribbon menu for first 5 pixels", () => {
    wrapper.find("div").last().props().onMouseMove({ clientY: 5 });
    expect(clearTimeout).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1000);
    expect(props.setRibbonVisibility).toHaveBeenCalledWith(true);
  });

  it("hides ribbon menu outside of first 35 pixels", () => {
    wrapper.setProps({ ribbonMenuOpen: true });
    wrapper.find("div").last().props().onMouseMove({ clientY: 45 });
    expect(setTimeout).toHaveBeenCalledTimes(1);
    jest.runAllTimers();
    expect(props.setRibbonVisibility).toHaveBeenCalledWith(false);
  });

  it("does not hide ribbon menu when dropdown is open", () => {
    wrapper.setProps({ ribbonMenuOpen: true, ribbonDropdownOpen: true });
    wrapper.find("div").last().props().onMouseMove({ clientY: 45 });
    expect(setTimeout).toHaveBeenCalledTimes(0);
  });
});
