import { mount } from "enzyme";
import React from "react";

import { RemovableError } from "../RemovableError";
import * as t from "./jest-assertions";

describe("RemovableError tests", () => {
  test("RemovableError Remove null onRemove", () => {
    const result = mount(<RemovableError message="foo" onRemove={null} />);
    result.render();
    t.notOk(result.hasClass("fa-times-circle"), "the icon should not exist");
  });
});
