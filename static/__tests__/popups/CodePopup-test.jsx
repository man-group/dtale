import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import * as t from "../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

describe("CodePopup tests", () => {
  test("CodePopup test", done => {
    const { CodePopup } = withGlobalJquery(() => require("../../popups/CodePopup"));
    buildInnerHTML();

    const result = mount(<CodePopup code="test code" />, {
      attachTo: document.getElementById("content"),
    });
    result.render();
    t.equal(result.find("pre").text(), "test code");
    done();
  });

  test("CodePopup copy test", done => {
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
    result.find("button").simulate("click");
    done();
  });
});
