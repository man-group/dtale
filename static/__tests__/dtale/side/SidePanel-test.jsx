import { shallow } from "enzyme";
import React from "react";
import Draggable from "react-draggable";
import { GlobalHotKeys } from "react-hotkeys";

import { expect, it } from "@jest/globals";

import { ReactSidePanel } from "../../../dtale/side/SidePanel";
import { MockComponent } from "../../MockComponent";

describe("SidePanel", () => {
  let wrapper, props;

  beforeAll(() => {
    jest.mock("../../../dtale/side/MissingNoCharts", () => MockComponent);
  });

  beforeEach(async () => {
    props = {
      visible: false,
      view: undefined,
      hideSidePanel: jest.fn(),
      updatePanelWidth: jest.fn(),
      gridPanel: document.createElement("div"),
    };
    jest.spyOn(React, "createRef").mockReturnValueOnce({ current: document.createElement("div") });
    wrapper = shallow(<ReactSidePanel {...props} />);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => jest.restoreAllMocks());

  it("renders successfully", () => {
    expect(wrapper.find("div.side-panel-content")).toHaveLength(1);
    expect(wrapper.find("div").children()).toHaveLength(1);
  });

  it("shows missing charts", () => {
    wrapper.setProps({ visible: true, view: "missingno" });
    expect(wrapper.find("div.side-panel-content.is-expanded")).toHaveLength(1);
    expect(wrapper.find("div").children()).toHaveLength(5);
  });

  it("shows Gage R&R", () => {
    wrapper.setProps({ visible: true, view: "gage_rnr" });
    expect(wrapper.find("div.side-panel-content.is-expanded")).toHaveLength(1);
    expect(wrapper.find("div").children()).toHaveLength(5);
  });

  it("shows predefined filters", () => {
    wrapper.setProps({ visible: true, view: "predefined_filters" });
    expect(wrapper.find("div.side-panel-content.is-expanded")).toHaveLength(1);
    expect(wrapper.find("div").children()).toHaveLength(5);
  });

  it("hides side panel on ESC", () => {
    wrapper.setProps({ visible: true });
    const { keyMap, handlers } = wrapper.find(GlobalHotKeys).props();
    expect(keyMap.CLOSE_PANEL).toBe("esc");
    const closePanel = handlers.CLOSE_PANEL;
    closePanel();
    expect(props.hideSidePanel).toHaveBeenCalledTimes(1);
  });

  it("handles resize", () => {
    wrapper.setProps({ visible: true });
    wrapper.find(Draggable).props().onStart();
    wrapper.find(Draggable).props().onDrag(null, { deltaX: -20 });
    wrapper.find(Draggable).props().onStop();
    expect(wrapper.state().offset).toBe(-20);
    expect(props.updatePanelWidth).toBeCalledWith(-20);
  });
});
