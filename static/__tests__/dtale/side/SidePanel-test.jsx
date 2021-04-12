import { shallow } from "enzyme";
import React from "react";
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
    };
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
    expect(wrapper.find("div").children()).toHaveLength(3);
  });

  it("hides side panel on ESC", () => {
    wrapper.setProps({ visible: true });
    const { keyMap, handlers } = wrapper.find(GlobalHotKeys).props();
    expect(keyMap.CLOSE_PANEL).toBe("esc");
    const closePanel = handlers.CLOSE_PANEL;
    closePanel();
    expect(props.hideSidePanel).toHaveBeenCalledTimes(1);
  });
});
