import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import CategoryInputs from "../../../../popups/analysis/filters/CategoryInputs";
import FilterSelect from "../../../../popups/analysis/filters/FilterSelect";

describe("CategoryInputs tests", () => {
  let result, updateCategory;

  beforeEach(() => {
    updateCategory = jest.fn();
    const props = {
      selectedCol: "foo",
      cols: [{ name: "foo" }, { name: "bar" }],
      updateCategory,
    };
    result = shallow(<CategoryInputs {...props} />);
  });

  afterEach(() => {
    updateCategory.mockReset();
  });

  it("calls updateCategory", () => {
    updateCategory.mockReset();
    result.find(FilterSelect).first().prop("selectProps").onChange({ value: "bar" });
    result.find(FilterSelect).last().prop("selectProps").onChange({ value: "mean" });
    expect(updateCategory.mock.calls).toHaveLength(2);
    expect(updateCategory.mock.calls[0]).toEqual(["categoryCol", { value: "bar" }]);
    expect(updateCategory.mock.calls[1]).toEqual(["categoryAgg", { value: "mean" }]);
    expect(result.find(FilterSelect).first().prop("selectProps").noOptionsText({ value: "bar" })).toBe(
      "No columns found"
    );
  });
});
