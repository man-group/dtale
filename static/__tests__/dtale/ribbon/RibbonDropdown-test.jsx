import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { MenuItem } from "../../../dtale/menu/MenuItem";
import { DataMenuItem } from "../../../dtale/ribbon/DataMenuItem";
import { ReactRibbonDropdown } from "../../../dtale/ribbon/RibbonDropdown";
import * as fetcher from "../../../fetcher";
import * as Instances from "../../../popups/instances/Instances";
import { tick, tickUpdate } from "../../test-utils";

describe("RibbonDropdown", () => {
  let wrapper, props, fetchJsonPromiseSpy, cleanupSpy;
  const processes = [{ id: "2", name: "foo" }, { id: "3" }];
  const { location } = window;

  const setupElementAndDropdown = async name => {
    const element = document.createElement("div");
    const rectSpy = jest.spyOn(element, "getBoundingClientRect");
    rectSpy.mockImplementation(() => ({ left: 5, top: 5, width: 10 }));
    wrapper.instance().ref = { current: element };
    wrapper.setProps({ visible: true, name, element });
    await tick();
  };

  beforeEach(async () => {
    delete window.location;
    window.location = { reload: jest.fn() };
    cleanupSpy = jest.spyOn(Instances, "executeCleanup");
    cleanupSpy.mockImplementation(() => undefined);
    fetchJsonPromiseSpy = jest.spyOn(fetcher, "fetchJsonPromise");
    fetchJsonPromiseSpy.mockImplementation(() => Promise.resolve({ data: processes }));
    props = {
      visible: false,
      name: undefined,
      element: undefined,
      hideRibbonMenu: jest.fn(),
      columns: [],
      propagateState: jest.fn(),
      openChart: jest.fn(),
      dataId: "1",
    };
    wrapper = shallow(<ReactRibbonDropdown {...props} />);
    await tickUpdate(wrapper);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => {
    window.location = location;
    jest.restoreAllMocks();
  });

  it("renders successfully", () => {
    expect(wrapper.find("div")).toHaveLength(1);
  });

  it("stops propagation on clicks", () => {
    const event = {
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    };
    wrapper.find("div").props().onClick(event);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("renders main successfully", async () => {
    await setupElementAndDropdown("main");
    expect(wrapper.state().processes).toBe(processes);
    expect(wrapper.state().processLoad).toBeDefined();
    expect(wrapper.find("div").props().style).toEqual({ left: 5, top: 30 });
    expect(wrapper.find(DataMenuItem)).toHaveLength(2);
    wrapper.setProps({ visible: false, name: null, element: null });
    await tick();
    expect(wrapper.find("div").props().style).toEqual({});
  });

  it("can clear current data", async () => {
    await setupElementAndDropdown("main");
    wrapper.find(MenuItem).first().props().onClick();
    expect(cleanupSpy.mock.calls[0][0]).toBe("1");
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it("can clear other data", async () => {
    await setupElementAndDropdown("main");
    wrapper.find(DataMenuItem).first().props().cleanup("2");
    expect(cleanupSpy.mock.calls[0][0]).toBe("2");
    cleanupSpy.mock.calls[0][1]();
    expect(wrapper.state().processes).toEqual([{ id: "3" }]);
  });

  it("renders actions successfully", async () => {
    await setupElementAndDropdown("actions");
    expect(wrapper.find("ul")).toHaveLength(1);
  });

  it("renders visualize successfully", async () => {
    await setupElementAndDropdown("visualize");
    expect(wrapper.find("ul")).toHaveLength(1);
  });

  it("renders highlight successfully", async () => {
    await setupElementAndDropdown("highlight");
    expect(wrapper.find("ul")).toHaveLength(1);
  });

  it("renders settings successfully", async () => {
    await setupElementAndDropdown("settings");
    expect(wrapper.find("ul")).toHaveLength(1);
  });
});
