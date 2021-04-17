import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { ReactSidePanelButtons } from "../../../dtale/side/SidePanelButtons";

describe("SidePanelButtons", () => {
  let wrapper, props;
  const { open } = window;

  beforeAll(() => {
    delete window.open;
    window.open = jest.fn();
  });

  beforeEach(() => {
    props = {
      dataId: "1",
      column: "foo",
      visible: true,
      view: "describe",
      hideSidePanel: jest.fn(),
    };
    wrapper = shallow(<ReactSidePanelButtons {...props} />);
  });

  afterAll(() => (window.open = open));

  it("add close/tab functions", () => {
    const buttons = wrapper.find("button");
    buttons.last().simulate("click");
    expect(props.hideSidePanel).toBeCalledTimes(1);
    buttons.first().simulate("click");
    expect(window.open).toHaveBeenCalledWith("/dtale/popup/describe/1?selectedCol=foo", "_blank");
  });

  it("does not render when the side panel is not visible", () => {
    wrapper.setProps({ visible: false });
    expect(wrapper.html()).toBeNull();
  });
});
