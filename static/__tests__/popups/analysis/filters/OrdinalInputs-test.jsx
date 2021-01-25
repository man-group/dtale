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
      type: "word_value_counts",
      colType: "string",
      updateOrdinal,
    };
    result = shallow(<OrdinalInputs {...props} />);
  });

  afterEach(() => {
    updateOrdinal.mockReset();
  });

  it("calls updateOrdinal", () => {
    result.find(FilterSelect).first().prop("selectProps").onChange({ value: "bar" });
    result.find(FilterSelect).at(1).prop("selectProps").onChange({ value: "mean" });
    expect(updateOrdinal.mock.calls).toHaveLength(2);
    expect(updateOrdinal.mock.calls[0]).toEqual(["ordinalCol", { value: "bar" }]);
    expect(updateOrdinal.mock.calls[1]).toEqual(["ordinalAgg", { value: "mean" }]);
    expect(result.find(FilterSelect).first().prop("selectProps").noOptionsText({ value: "bar" })).toBe(
      "No columns found"
    );
  });

  it("renders cleaners on word_value_counts", () => {
    const cleaners = result.find(FilterSelect).last().prop("selectProps").options;
    expect(cleaners).toHaveLength(12);
    expect(cleaners[0].value).toBe("underscore_to_space");
  });

  it("does not render cleaners for int column", () => {
    result.setProps({ colType: "int" });
    expect(result.find("div.row")).toHaveLength(1);
  });
});
