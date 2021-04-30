import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { ReactFilterDisplay } from "../../../dtale/info/FilterDisplay";
import serverState from "../../../dtale/serverStateManagement";
import menuUtils from "../../../menuUtils";

describe("FilterDisplay", () => {
  let wrapper, props, updateSettingsSpy, openMenuSpy;

  beforeEach(() => {
    updateSettingsSpy = jest.spyOn(serverState, "updateSettings");
    updateSettingsSpy.mockImplementation((_settings, _dataId, callback) => {
      callback();
    });
    openMenuSpy = jest.spyOn(menuUtils, "openMenu");
    openMenuSpy.mockImplementation(() => undefined);
    props = {
      updateSettings: jest.fn(),
      dataId: "1",
      query: "query",
      columnFilters: { foo: { query: "foo == 1" } },
      outlierFilters: { foo: { query: "foo == 1" } },
      predefinedFilters: { foo: 1 },
      predefinedFilterConfigs: [
        {
          name: "custom_foo",
          column: "foo",
          description: "foo",
          inputType: "input",
        },
      ],
      menuOpen: null,
      propagateState: jest.fn(),
    };
    wrapper = shallow(<ReactFilterDisplay {...props} />);
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it("Displays all queries", () => {
    const filterLink = wrapper.find("div.filter-menu-toggle").first().find("span.pointer");
    expect(filterLink.text()).toBe("foo == 1 and foo == 1 and f...");
  });

  it("Clears all filters on clear-all", () => {
    wrapper.find("i.ico-cancel").last().simulate("click");
    expect(updateSettingsSpy).toHaveBeenCalled();
    expect(props.updateSettings).toHaveBeenLastCalledWith({
      query: "",
      columnFilters: {},
      outlierFilters: {},
      predefinedFilters: {},
    });
  });

  it("Clears all filters on clear-all", () => {
    wrapper
      .find("div.filter-menu-toggle")
      .first()
      .find("button")
      .forEach(clear => clear.simulate("click"));
    expect(updateSettingsSpy).toHaveBeenCalledTimes(4);
    expect(props.updateSettings).toHaveBeenCalledWith({ query: "" });
    expect(props.updateSettings).toHaveBeenCalledWith({ columnFilters: {} });
    expect(props.updateSettings).toHaveBeenCalledWith({ outlierFilters: {} });
    expect(props.updateSettings).toHaveBeenCalledWith({
      predefinedFilters: {},
    });
  });

  it("Displays menu", () => {
    wrapper.find("div.filter-menu-toggle").first().simulate("click");
    expect(openMenuSpy).toHaveBeenCalled();
    openMenuSpy.mock.calls[0][1]();
    expect(props.propagateState).toHaveBeenLastCalledWith({
      menuOpen: "filter",
    });
    openMenuSpy.mock.calls[0][2]();
    expect(props.propagateState).toHaveBeenLastCalledWith({ menuOpen: null });
  });
});
