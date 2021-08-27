import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { Bouncer } from "../../../Bouncer";
import { RemovableError } from "../../../RemovableError";
import serverState from "../../../dtale/serverStateManagement";
import { ReactFilterPopup } from "../../../popups/filter/FilterPopup";
import StructuredFilters from "../../../popups/filter/StructuredFilters";
import * as filterUtils from "../../../popups/filter/filterUtils";

describe("FilterPopup", () => {
  let wrapper, props, loadInfoSpy, saveFilterSpy, updateSettingsSpy, updateQueryEngineSpy;

  beforeEach(() => {
    loadInfoSpy = jest.spyOn(filterUtils, "loadInfo");
    loadInfoSpy.mockImplementation((_dataId, callback) => {
      callback({
        error: null,
        loading: false,
        query: "foo == foo",
        columnFilters: { 0: "bar == bar" },
        outlierFilters: { 0: "baz == baz" },
      });
    });
    saveFilterSpy = jest.spyOn(filterUtils, "saveFilter");
    saveFilterSpy.mockImplementation((_dataId, _query, callback) => {
      callback({});
    });
    updateSettingsSpy = jest.spyOn(serverState, "updateSettings");
    updateSettingsSpy.mockImplementation((_settings, _dataId, callback) => {
      callback();
    });
    updateQueryEngineSpy = jest.spyOn(serverState, "updateQueryEngine");
    updateQueryEngineSpy.mockImplementation((_engine, callback) => {
      callback();
    });
    props = {
      dataId: "1",
      chartData: {
        visible: true,
      },
      updateSettings: jest.fn(),
      onClose: jest.fn(),
      queryEngine: "python",
      setEngine: jest.fn(),
    };
    wrapper = shallow(<ReactFilterPopup {...props} />);
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it("renders successfully", () => {
    expect(wrapper.html()).not.toBeNull();
  });

  it("renders bouncer", () => {
    wrapper.setState({ loading: true });
    expect(wrapper.find(Bouncer)).toHaveLength(1);
  });

  it("drops filter", () => {
    wrapper.find(StructuredFilters).first().props().dropFilter("columnFilters", "0");
    expect(updateSettingsSpy).toHaveBeenCalledTimes(1);
    expect(props.updateSettings).toHaveBeenCalledTimes(1);
    props.updateSettings.mock.calls[0][1]();
    expect(wrapper.state().columnFilters).toEqual({});
  });

  it("saves filter", () => {
    wrapper.find("textarea").simulate("change", { target: { value: "foo == foo" } });
    wrapper
      .find("button")
      .findWhere(btn => btn.text() == "Apply")
      .first()
      .simulate("click");
    expect(saveFilterSpy).toHaveBeenCalledTimes(1);
    expect(saveFilterSpy.mock.calls[0][1]).toBe("foo == foo");
    expect(props.updateSettings).toHaveBeenCalledTimes(1);
    expect(props.updateSettings.mock.calls[0][0]).toEqual({
      query: "foo == foo",
    });
    props.updateSettings.mock.calls[0][1]();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("save failure", () => {
    saveFilterSpy.mockImplementation((_dataId, _query, callback) => {
      callback({ error: "error" });
    });
    wrapper.find("textarea").simulate("change", { target: { value: "foo == foo" } });
    wrapper
      .find("button")
      .findWhere(btn => btn.text() == "Apply")
      .first()
      .simulate("click");
    expect(wrapper.state().error).toBe("error");
    wrapper.find(RemovableError).first().props().onRemove();
    expect(wrapper.state().error).toBeNull();
  });

  it("clears filter", () => {
    wrapper
      .find("button")
      .findWhere(btn => btn.text() == "Clear")
      .first()
      .simulate("click");
    expect(updateSettingsSpy).toHaveBeenCalledTimes(1);
    expect(updateSettingsSpy.mock.calls[0][0]).toEqual({ query: "" });
    expect(props.updateSettings).toHaveBeenCalledTimes(1);
    expect(props.updateSettings.mock.calls[0][0]).toEqual({
      query: "",
    });
    props.updateSettings.mock.calls[0][1]();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("updates query engine", () => {
    wrapper
      .find("button")
      .findWhere(btn => btn.text() == "numexpr")
      .first()
      .simulate("click");
    expect(updateQueryEngineSpy).toHaveBeenCalledTimes(1);
    expect(updateQueryEngineSpy.mock.calls[0][0]).toBe("numexpr");
    expect(props.setEngine).toHaveBeenCalledWith("numexpr");
  });

  describe("new window", () => {
    const { location, close, opener } = window;

    beforeAll(() => {
      delete window.location;
      delete window.close;
      delete window.opener;
      window.location = { pathname: "/dtale/popup/filter" };
      window.close = jest.fn();
      window.opener = {
        location: {
          reload: jest.fn(),
        },
      };
    });

    afterAll(() => {
      window.location = location;
      window.close = close;
      window.opener = opener;
    });

    it("drops filter", () => {
      wrapper.find(StructuredFilters).first().props().dropFilter("columnFilters", "0");
      expect(updateSettingsSpy).toHaveBeenCalledTimes(1);
      expect(window.opener.location.reload).toHaveBeenCalledTimes(1);
    });

    it("saves filter", () => {
      wrapper.find("textarea").simulate("change", { target: { value: "foo == foo" } });
      wrapper
        .find("button")
        .findWhere(btn => btn.text() == "Apply")
        .first()
        .simulate("click");
      expect(window.opener.location.reload).toHaveBeenCalledTimes(1);
      expect(window.close).toHaveBeenCalledTimes(1);
    });

    it("clears filter", () => {
      wrapper
        .find("button")
        .findWhere(btn => btn.text() == "Clear")
        .first()
        .simulate("click");
      expect(window.opener.location.reload).toHaveBeenCalledTimes(1);
      expect(window.close).toHaveBeenCalledTimes(1);
    });
  });
});
