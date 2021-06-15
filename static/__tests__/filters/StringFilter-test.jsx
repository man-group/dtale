import { shallow } from "enzyme";
import React from "react";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import * as fetcher from "../../fetcher";
import { NE } from "../../filters/NumericFilter";
import StringFilter from "../../filters/StringFilter";

describe("StringFilter", () => {
  let wrapper, props, fetchJsonSpy;

  beforeEach(() => {
    fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    fetchJsonSpy.mockImplementation(() => undefined);
    props = {
      selectedCol: "foo",
      columnFilters: { foo: { value: ["a"], action: "equals", operand: "ne" } },
      updateState: jest.fn(),
      uniques: ["a", "b", "c"],
      missing: false,
      uniqueCt: 3,
    };
    wrapper = shallow(<StringFilter {...props} />);
  });

  it("reads presets successfully", () => {
    expect(wrapper.state().operand).toBe(NE);
    expect(wrapper.state().selected).toEqual([{ value: "a" }]);
    expect(wrapper.state().action.value).toBe("equals");
  });

  it("handles case-sensitive update", () => {
    wrapper.find("button").last().simulate("click");
    expect(props.updateState).toHaveBeenLastCalledWith(expect.objectContaining({ caseSensitive: true }));
  });

  it("handles action/raw update", () => {
    wrapper.find(Select).first().props().onChange({ value: "startswith" });
    expect(wrapper.find("input")).toHaveLength(1);
    wrapper.find("input").simulate("change", { target: { value: "b" } });
    wrapper.find("input").simulate("keyDown", { key: "Enter" });
    expect(props.updateState).toHaveBeenLastCalledWith(expect.objectContaining({ raw: "b" }));
  });

  it("handles length check", () => {
    wrapper.find(Select).first().props().onChange({ value: "length" });
    expect(wrapper.find("input")).toHaveLength(1);
    props.updateState.mockReset();
    wrapper.find("input").simulate("change", { target: { value: "b" } });
    wrapper.find("input").simulate("keyDown", { key: "Enter" });
    expect(props.updateState).not.toHaveBeenCalled();
    wrapper.find("input").simulate("change", { target: { value: "1,3" } });
    wrapper.find("input").simulate("keyDown", { key: "Enter" });
    expect(props.updateState).toHaveBeenLastCalledWith(expect.objectContaining({ raw: "1,3" }));
  });
});
