import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import NumericFormatting from "../../../popups/formats/NumericFormatting";
import * as t from "../../jest-assertions";

describe("NumericFormatting tests", () => {
  test("NumericFormatting test", done => {
    const columnFormats = {
      col1: { fmt: "0,000.000", style: { currency: "USD" } },
    };
    const result = mount(<NumericFormatting {...{ columnFormats, selectedCol: "col1", updateState: _.noop }} />);
    const state = {
      precision: 3,
      thousands: true,
      abbreviate: false,
      exponent: false,
      bps: false,
      redNegs: false,
      fmt: "0,000.000",
      currency: { value: "USD", label: "USD ($)" },
    };
    t.deepEqual(result.state(), state, "should parse formatting");
    done();
  });
});
