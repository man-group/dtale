import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import { buildInnerHTML, withGlobalJquery } from "../test-utils";

describe("CodePopup tests", () => {
  it("CodePopup render & copy test", () => {
    const { CodePopup } = withGlobalJquery(() => require("../../popups/CodePopup"));
    buildInnerHTML();
    Object.defineProperty(global.document, "queryCommandSupported", {
      value: () => true,
    });
    Object.defineProperty(global.document, "execCommand", { value: _.noop });

    const result = mount(<CodePopup code="test code" />, {
      attachTo: document.getElementById("content"),
    });
    result.render();
    expect(result.find("pre").text()).toBe("test code");
    result.find("button").simulate("click");
  });
});
