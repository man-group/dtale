import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import CorrelationsOption from "../../../dtale/menu/CorrelationsOption";
import ExportOption from "../../../dtale/menu/ExportOption";
import FilterOption from "../../../dtale/menu/FilterOption";
import { MenuItem } from "../../../dtale/menu/MenuItem";
import MergeOption from "../../../dtale/menu/MergeOption";
import MissingOption from "../../../dtale/menu/MissingOption";
import { PPSOption } from "../../../dtale/menu/PPSOption";
import { PredefinedFiltersOption } from "../../../dtale/menu/PredefinedFiltersOption";
import ShowHideColumnsOption from "../../../dtale/menu/ShowHideColumnsOption";
import menuFuncs from "../../../dtale/menu/dataViewerMenuUtils";
import { DataMenuItem } from "../../../dtale/ribbon/DataMenuItem";
import { ReactRibbonDropdown } from "../../../dtale/ribbon/RibbonDropdown";
import * as fetcher from "../../../fetcher";
import * as Instances from "../../../popups/instances/Instances";
import DimensionsHelper from "../../DimensionsHelper";
import { tick, tickUpdate } from "../../test-utils";

describe("RibbonDropdown", () => {
  let wrapper, props, fetchJsonPromiseSpy, cleanupSpy;
  const processes = [{ id: "2", name: "foo" }, { id: "3" }];
  const { location, open } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 500,
    innerHeight: 500,
  });

  const setupElementAndDropdown = async (name, dims = {}) => {
    const element = document.createElement("div");
    const rectSpy = jest.spyOn(element, "getBoundingClientRect");
    rectSpy.mockImplementation(() => ({ left: 5, top: 5, width: 10, ...dims }));
    wrapper.instance().ref = { current: element };
    wrapper.setProps({ visible: true, name, element });
    await tick();
  };

  beforeEach(async () => {
    dimensions.beforeAll();
    delete window.location;
    delete window.open;
    window.open = jest.fn();
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
      showSidePanel: jest.fn(),
      dataId: "1",
    };
    wrapper = shallow(<ReactRibbonDropdown {...props} />);
    await tickUpdate(wrapper);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.open = open;
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

  it("handles screen edge successfully", async () => {
    await setupElementAndDropdown("main", { left: 450, width: 100 });
    expect(wrapper.find("div").props().style).toEqual({ left: 380, top: 30 });
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
    wrapper.find(ShowHideColumnsOption).props().open();
    expect(props.showSidePanel).toHaveBeenLastCalledWith("show_hide");
    expect(props.hideRibbonMenu).toHaveBeenCalledTimes(1);
    wrapper.find(FilterOption).props().open();
    expect(props.showSidePanel).toHaveBeenLastCalledWith("filter");
    wrapper.find(PredefinedFiltersOption).props().open();
    expect(props.showSidePanel).toHaveBeenLastCalledWith("predefined_filters");
  });

  it("renders visualize successfully", async () => {
    await setupElementAndDropdown("visualize");
    expect(wrapper.find("ul")).toHaveLength(1);
    wrapper.find(MissingOption).props().open();
    expect(props.showSidePanel).toHaveBeenLastCalledWith("missingno");
    wrapper.find(CorrelationsOption).props().open();
    expect(props.showSidePanel).toHaveBeenLastCalledWith("correlations");
    wrapper.find(PPSOption).props().open();
    expect(props.showSidePanel).toHaveBeenLastCalledWith("pps");
    expect(props.hideRibbonMenu).toHaveBeenCalledTimes(3);
  });

  it("renders highlight successfully", async () => {
    await setupElementAndDropdown("highlight");
    expect(wrapper.find("ul")).toHaveLength(1);
  });

  it("renders settings successfully", async () => {
    await setupElementAndDropdown("settings");
    expect(wrapper.find("ul")).toHaveLength(1);
  });

  it("hides menu on click", async () => {
    const funcsSpy = jest.spyOn(menuFuncs, "buildHotkeyHandlers");
    const exportFile = jest.fn(() => () => undefined);
    funcsSpy.mockImplementation(() => ({
      exportFile,
      openTab: jest.fn(),
      openPopup: jest.fn(),
      toggleBackground: jest.fn(),
      toggleOutlierBackground: jest.fn(),
      CODE: jest.fn(),
      SHUTDOWN: jest.fn(),
      BUILD: jest.fn(),
      FILTER: jest.fn(),
      DESCRIBE: jest.fn(),
      DUPLICATES: jest.fn(),
      CHARTS: jest.fn(),
      NETWORK: jest.fn(),
    }));
    wrapper = shallow(<ReactRibbonDropdown {...props} />);
    await tickUpdate(wrapper);
    await setupElementAndDropdown("main");
    wrapper.find(ExportOption).props().open("tsv")();
    expect(exportFile).toHaveBeenCalledWith("tsv");
    expect(props.hideRibbonMenu).toHaveBeenCalledTimes(1);
    await setupElementAndDropdown("actions");
    wrapper.find(MergeOption).props().open();
    expect(window.open).toHaveBeenCalledWith("/dtale/popup/merge", "_blank");
    expect(props.hideRibbonMenu).toHaveBeenCalledTimes(2);
  });
});
