import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import ChartLabel from "../../../popups/charts/ChartLabel";

describe("ChartLabel tests", () => {
  let result, setStateSpy;

  beforeEach(() => {
    setStateSpy = jest.spyOn(ChartLabel.prototype, "setState");
    const props = {
      x: { value: "foo" },
      y: [{ value: "bar" }],
      aggregation: "count",
    };
    result = shallow(<ChartLabel {...props} />);
  });

  afterEach(() => {
    setStateSpy.mockRestore();
  });

  it("ChartLabel rendering", () => {
    expect(result.text()).toBe("Count of bar by foo");
  });

  it("updates when url changes", () => {
    result.setProps({ url: "http://test.com" });
    expect(setStateSpy).toBeCalledWith({ label: "Count of bar by foo" });
  });

  it("includes rolling computation in label", () => {
    result.setProps({
      url: "http://test.com",
      aggregation: "rolling",
      rollingComputation: "corr",
      rollingWindow: 10,
    });
    expect(result.text()).toBe("Rolling Correlation (window: 10) of bar by foo");
  });

  it("includes group in label", () => {
    result.setProps({ url: "http://test.com", group: [{ value: "z" }] });
    expect(result.text()).toBe("Count of bar by foo grouped by z");
  });
});
