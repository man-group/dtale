import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import FilterSelect from "../../../../popups/analysis/filters/FilterSelect";
import OrdinalInputs from "../../../../popups/analysis/filters/OrdinalInputs";

describe("OrdinalInputs tests", () => {
  let result, updateOrdinal;

  beforeEach(() => {
    updateOrdinal = jest.fn();
    const props = {
      selectedCol: "foo",
      cols: [{ name: "foo" }, { name: "bar" }],
      updateOrdinal,
    };
    result = shallow(<OrdinalInputs {...props} />);
  });

  afterEach(() => {
    updateOrdinal.mockReset();
  });

  it("calls updateOrdinal", () => {
    result.find(FilterSelect).first().prop("selectProps").onChange({ value: "bar" });
    result.find(FilterSelect).last().prop("selectProps").onChange({ value: "mean" });
    expect(updateOrdinal.mock.calls).toHaveLength(2);
    expect(updateOrdinal.mock.calls[0]).toEqual(["ordinalCol", { value: "bar" }]);
    expect(updateOrdinal.mock.calls[1]).toEqual(["ordinalAgg", { value: "mean" }]);
    expect(result.find(FilterSelect).first().prop("selectProps").noOptionsText({ value: "bar" })).toBe(
      "No columns found"
    );
  });
});
