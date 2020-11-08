import { mount } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import AxisEditor from "../../../popups/charts/AxisEditor";

describe("ChartLabel tests", () => {
  let result;

  beforeEach(() => {
    const props = {
      data: {
        min: { y: 1 },
        max: { y: 5 },
      },
      y: [{ value: "y" }],
    };
    result = mount(<AxisEditor {...props} />);
  });

  it("creates label", () => {
    expect(result.find("span.axis-select").text()).toBe("y (1,5)");
  });

  it("handles errors & changes", () => {
    const updateAxis = jest.fn();
    result.setProps({ updateAxis });
    result.find("span.axis-select").simulate("click");
    result
      .find("input.axis-input")
      .first()
      .simulate("change", { target: { value: "3" } });
    result
      .find("input.axis-input")
      .last()
      .simulate("change", { target: { value: "4" } });
    result.instance().closeMenu();
    expect(updateAxis).toBeCalledWith({ min: { y: 3 }, max: { y: 4 } });
    result
      .find("input.axis-input")
      .last()
      .simulate("change", { target: { value: "a" } });
    result.instance().closeMenu();
    expect(result.instance().state.errors).toEqual(["y has invalid max!"]);
  });
});
