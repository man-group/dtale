import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { describe, expect, it } from "@jest/globals";

import { ReactXArrayOption as XArrayOption } from "../../../dtale/menu/XArrayOption";

describe("XArrayOption tests", () => {
  it("renders selected xarray dimensions", () => {
    const result = mount(<XArrayOption xarray={true} xarrayDim={{ foo: 1 }} />, {
      attachTo: document.getElementById("content"),
    });
    expect(_.endsWith(result.find("div.hoverable__content").text(), "1 (foo)")).toBe(true);
  });
});
