import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { ReactDataMenuItem } from "../../../dtale/ribbon/DataMenuItem";

describe("DataMenuItem", () => {
  let wrapper, props;
  const { location } = window;

  beforeEach(() => {
    delete window.location;
    window.location = {
      assign: jest.fn(),
      origin: "origin",
    };
    props = {
      id: "1",
      name: "foo",
      showTooltip: jest.fn(),
      hideTooltip: jest.fn(),
      hideRibbonMenu: jest.fn(),
      cleanup: jest.fn(),
      iframe: false,
      t: jest.fn(),
    };
    wrapper = shallow(<ReactDataMenuItem {...props} />);
  });

  afterAll(() => {
    window.location = location;
  });

  it("correctly calls show/hide tooltip on button", () => {
    wrapper.find("button").props().onMouseOver();
    expect(props.showTooltip).toHaveBeenCalledTimes(1);
    expect(props.t).toHaveBeenCalledWith("open_process");
    wrapper.find("button").props().onMouseLeave();
    expect(props.hideTooltip).toHaveBeenCalledTimes(1);
  });

  it("correctly calls show/hide tooltip on icon", () => {
    wrapper.find("i").props().onMouseOver();
    expect(props.showTooltip).toHaveBeenCalledTimes(1);
    expect(props.t).toHaveBeenCalledWith("clear_data");
    wrapper.find("i").props().onMouseLeave();
    expect(props.hideTooltip).toHaveBeenCalledTimes(1);
  });

  it("correctly updates view", () => {
    wrapper.find("button").props().onClick();
    expect(window.location.assign).toHaveBeenCalledWith("origin/dtale/main/1");
    expect(props.hideRibbonMenu).toHaveBeenCalledTimes(1);
  });

  it("correctly clears data", () => {
    wrapper.find("i").props().onClick();
    expect(props.cleanup).toHaveBeenCalledWith("1");
    expect(props.hideRibbonMenu).toHaveBeenCalledTimes(1);
  });

  it("renders data name", () => {
    expect(wrapper.find("button").text()).toBe("1 - foo");
  });
});
