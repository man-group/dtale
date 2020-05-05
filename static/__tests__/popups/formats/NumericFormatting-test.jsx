import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import NumericFormatting from "../../../popups/formats/NumericFormatting";

describe("NumericFormatting tests", () => {
  it("NumericFormatting test", () => {
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
    expect(result.state()).toEqual(state);
  });
});
