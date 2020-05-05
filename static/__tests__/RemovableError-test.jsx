import { mount } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../RemovableError";

describe("RemovableError tests", () => {
  it("RemovableError Remove null onRemove", () => {
    const result = mount(<RemovableError message="foo" onRemove={null} />);
    result.render();
    expect(result.hasClass("fa-times-circle")).toBe(false);
  });
});
