import { mount } from "enzyme";
import React from "react";

import ChartLabel from "../../popups/charts/ChartLabel";
import * as t from "../jest-assertions";

describe("ChartLabel tests", () => {
  test("ChartLabel rendering", done => {
    const props = {
      x: { value: "foo" },
      y: [{ value: "bar" }],
      aggregation: "count",
    };
    const result = mount(<ChartLabel {...props} />);
    result.render();
    t.equal(result.text(), "Count of bar by foo", "should render label");
    done();
  });
});
