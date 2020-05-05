import { mount } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import CorrelationsTsOptions from "../../popups/correlations/CorrelationsTsOptions";

describe("CorrelationsTsOptions tests", () => {
  it("CorrelationsTsOptions hasDate == false", () => {
    const result = mount(<CorrelationsTsOptions hasDate={false} />);
    result.render();
    expect(result.html()).toBeNull();
  });

  it("CorrelationsTsOptions selectedCols empty", () => {
    const result = mount(<CorrelationsTsOptions hasDate={true} selectedCols={[]} />);
    result.render();
    expect(result.html()).toBeNull();
  });
});
