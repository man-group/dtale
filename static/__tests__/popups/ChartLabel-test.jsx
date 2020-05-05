import { mount } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import ChartLabel from "../../popups/charts/ChartLabel";

describe("ChartLabel tests", () => {
  it("ChartLabel rendering", () => {
    const props = {
      x: { value: "foo" },
      y: [{ value: "bar" }],
      aggregation: "count",
    };
    const result = mount(<ChartLabel {...props} />);
    result.render();
    expect(result.text()).toBe("Count of bar by foo");
  });
});
