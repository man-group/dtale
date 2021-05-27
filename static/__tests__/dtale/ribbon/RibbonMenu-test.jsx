import { mount } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { ReactRibbonMenu } from "../../../dtale/ribbon/RibbonMenu";

describe("RibbonMenu", () => {
  let wrapper, props;

  beforeEach(() => {
    props = {
      visible: true,
      openRibbonDropdown: jest.fn(),
      ribbonDropdown: null,
    };
    wrapper = mount(<ReactRibbonMenu {...props} />);
  });

  it("renders successfully", () => {
    expect(wrapper.find("RibbonMenuItem")).toHaveLength(5);
  });

  it("activates hover on click of item & opens dropdown", () => {
    wrapper.find("RibbonMenuItem").first().find("div").simulate("click");
    expect(wrapper.state().hoverActive).toBe(true);
    expect(props.openRibbonDropdown.mock.calls[0][0]).toBe("main");
  });

  it("opens dropdown when hover is active", () => {
    wrapper.setState({ hoverActive: true });
    wrapper.find("RibbonMenuItem").last().find("div").simulate("mouseover");
    expect(props.openRibbonDropdown.mock.calls[0][0]).toBe("settings");
  });

  it("turns off hover when menu closes", () => {
    wrapper.setState({ hoverActive: true });
    wrapper.setProps({ visible: false });
    expect(wrapper.state().hoverActive).toBe(false);
  });

  it("sets main title font", () => {
    props.mainTitleFont = "Arial";
    wrapper = mount(<ReactRibbonMenu {...props} />);
    const title = wrapper.find("span.title-font-base").props();
    expect(title.className).toBe("title-font-base");
    expect(title.style.fontFamily).toBe("Arial");
  });
});
