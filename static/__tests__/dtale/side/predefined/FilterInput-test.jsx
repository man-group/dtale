import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import ButtonToggle from "../../../../ButtonToggle";
import FilterInput from "../../../../dtale/side/predefined_filters/FilterInput";
import * as fetcher from "../../../../fetcher";
import ValueSelect from "../../../../filters/ValueSelect";
import reduxUtils from "../../../redux-test-utils";

describe("FilterInput", () => {
  let wrapper, props, fetchJsonSpy;
  const inputFilter = {
    name: "custom_foo1",
    description: "custom_foo1 description",
    column: "col1",
    inputType: "input",
  };
  const selectFilter = {
    name: "custom_foo2",
    description: "custom_foo2 description",
    column: "col1",
    inputType: "select",
  };
  const multiselectFilter = {
    name: "custom_foo3",
    description: "custom_foo3 description",
    column: "col1",
    inputType: "multiselect",
  };

  beforeEach(() => {
    fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    props = {
      dataId: "1",
      filter: inputFilter,
      value: { value: 1, active: true },
      columns: reduxUtils.DTYPES.dtypes,
      save: jest.fn(),
    };
    wrapper = shallow(<FilterInput {...props} />);
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it("handle input-style filters", () => {
    wrapper.find("button").simulate("click");
    expect(wrapper.state().edit).toBe(true);
    wrapper.find("button").first().simulate("click");
    expect(wrapper.state().edit).toBe(false);
    wrapper.find("button").simulate("click");
    expect(wrapper.state().edit).toBe(true);
    expect(wrapper.find("input")).toHaveLength(1);
    wrapper.find("input").simulate("change", { target: { value: "2" } });
    wrapper.find("button").last().simulate("click");
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, 2, true);
    expect(fetchJsonSpy).not.toHaveBeenCalled();
  });

  it("handles enabling/disabling filters", () => {
    wrapper.find(ButtonToggle).props().update("false");
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, 1, false);
    wrapper.find(ButtonToggle).props().update("true");
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, 1, true);
  });

  it("handle input-style filter parsing error", () => {
    wrapper.find("button").simulate("click");
    expect(wrapper.state().edit).toBe(true);
    expect(wrapper.find("input")).toHaveLength(1);
    wrapper.find("input").simulate("change", { target: { value: "a" } });
    wrapper.find("button").last().simulate("click");
    expect(props.save).not.toHaveBeenCalled();
    expect(wrapper.state().errors).toEqual(["Invalid integer, a!"]);
  });

  it("handle input-style float filter", () => {
    wrapper.setProps({
      columns: [{ ...reduxUtils.DTYPES.dtypes[0], dtype: "float64" }],
    });
    wrapper.find("button").simulate("click");
    expect(wrapper.find("input")).toHaveLength(1);
    wrapper.find("input").simulate("change", { target: { value: "a" } });
    wrapper.find("button").last().simulate("click");
    expect(props.save).not.toHaveBeenCalled();
    expect(wrapper.state().errors).toEqual(["Invalid float, a!"]);

    wrapper.find("input").simulate("change", { target: { value: "1.1" } });
    wrapper.find("button").last().simulate("click");
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, 1.1, true);
    expect(fetchJsonSpy).not.toHaveBeenCalled();
  });

  it("handle input-style string filter", () => {
    wrapper.setProps({
      columns: [{ ...reduxUtils.DTYPES.dtypes[0], dtype: "str" }],
    });
    wrapper.find("button").simulate("click");
    wrapper.find("input").simulate("change", { target: { value: "a" } });
    wrapper.find("button").last().simulate("click");
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, "a", true);
    expect(fetchJsonSpy).not.toHaveBeenCalled();
  });

  it("handle select-style filters", () => {
    fetchJsonSpy.mockImplementation((_url, callback) => {
      callback({ uniques: [1, 2, 3], success: true });
    });
    wrapper.setProps({
      filter: selectFilter,
      value: { value: 1, active: true },
    });
    wrapper.find("button").simulate("click");
    expect(wrapper.find(ValueSelect)).toHaveLength(1);
    wrapper
      .find(ValueSelect)
      .props()
      .updateState({ selected: { value: 2 } });
    wrapper.find("button").last().simulate("click");
    expect(props.save).toHaveBeenCalledWith(selectFilter.name, 2, true);
    expect(fetchJsonSpy).toHaveBeenCalledTimes(1);
    expect(fetchJsonSpy.mock.calls[0][0]).toBe("/dtale/column-filter-data/1?col=col1");
  });

  it("handle multiselect-style filters", () => {
    fetchJsonSpy.mockImplementation((_url, callback) => {
      callback({ uniques: [1, 2, 3], success: true });
    });
    wrapper.setProps({
      filter: multiselectFilter,
      value: { value: [1, 2], active: true },
    });
    wrapper.find("button").simulate("click");
    expect(wrapper.find(ValueSelect)).toHaveLength(1);
    wrapper
      .find(ValueSelect)
      .props()
      .updateState({ selected: [{ value: 2 }, { value: 3 }] });
    wrapper.find("button").last().simulate("click");
    expect(props.save).toHaveBeenCalledWith(multiselectFilter.name, [2, 3], true);
    expect(fetchJsonSpy).toHaveBeenCalledTimes(1);
  });
});
