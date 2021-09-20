import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { ReactGridEventHandler } from "../../dtale/GridEventHandler";

jest.useFakeTimers();

describe("RibbonDropdown", () => {
  let wrapper, props, setTimeoutSpy, clearTimeoutSpy;

  beforeEach(() => {
    setTimeoutSpy = jest.spyOn(window, "setTimeout");
    clearTimeoutSpy = jest.spyOn(window, "clearTimeout");
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
      showTooltip: jest.fn(),
      hideTooltip: jest.fn(),
    };
    wrapper = shallow(<ReactGridEventHandler {...props} />);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => jest.restoreAllMocks());

  it("opens ribbon menu for first 5 pixels", () => {
    wrapper.find("div").last().props().onMouseMove({ clientY: 5 });
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1000);
    expect(props.setRibbonVisibility).toHaveBeenCalledWith(true);
  });

  it("hides ribbon menu outside of first 35 pixels", () => {
    wrapper.setProps({ ribbonMenuOpen: true });
    wrapper.find("div").last().props().onMouseMove({ clientY: 45 });
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    jest.runAllTimers();
    expect(props.setRibbonVisibility).toHaveBeenCalledWith(false);
  });

  it("does not hide ribbon menu when dropdown is open", () => {
    wrapper.setProps({ ribbonMenuOpen: true, ribbonDropdownOpen: true });
    wrapper.find("div").last().props().onMouseMove({ clientY: 45 });
    expect(setTimeoutSpy).toHaveBeenCalledTimes(0);
  });

  it("displays blue-line correctly", () => {
    wrapper.setProps({ dragResize: 5 });
    expect(wrapper.find("div.blue-line")).toHaveLength(1);
  });

  it("hides tooltip when cellIdx is empty", () => {
    wrapper
      .find("div")
      .last()
      .props()
      .onMouseOver({
        clientY: 100,
        target: {
          attributes: {
            cell_idx: {
              nodeValue: "1|2",
            },
          },
          querySelector: () => ({ clientWidth: 100, scrollWidth: 100 }),
        },
      });
    expect(props.hideTooltip).toHaveBeenCalledTimes(1);
  });

  it("shows tooltip when cellIdx is populated", () => {
    const columns = [
      { name: "index", visible: true },
      { name: "a", dtype: "string", index: 1, visible: true },
    ];
    const data = { 0: { a: { raw: "Hello World" } } };
    props.gridState = { data, columns };
    wrapper = shallow(<ReactGridEventHandler {...props} />);
    const target = { attributes: { cell_idx: { nodeValue: "0|1" } } };
    wrapper.find("div").last().props().onMouseOver({ target });
    expect(props.showTooltip).not.toHaveBeenCalled();
    target.attributes.cell_idx.nodeValue = "1|1";
    target.querySelector = () => undefined;
    wrapper.find("div").last().props().onMouseOver({ target });
    expect(props.showTooltip).not.toHaveBeenCalled();
    const childDiv = { clientWidth: 100, scrollWidth: 150 };
    target.querySelector = () => childDiv;
    wrapper.find("div").last().props().onMouseOver({ target });
    expect(props.showTooltip).toHaveBeenLastCalledWith(childDiv, "Hello World");
  });

  it("selects row on click of index", () => {
    wrapper.instance().handleClicks({
      target: { attributes: { cell_idx: { nodeValue: "0|1" } } },
    });
    expect(props.propagateState).toHaveBeenCalledWith(expect.objectContaining({ selectedRow: 1 }));
  });
});
