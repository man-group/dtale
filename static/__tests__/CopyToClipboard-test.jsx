import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import { buildInnerHTML, withGlobalJquery } from "./test-utils";

describe("CopyToClipboard tests", () => {
  const render = () => {
    const { CopyToClipboard } = withGlobalJquery(() => require("../CopyToClipboard"));
    buildInnerHTML();
    const buttonBuilder = props => (
      <div id="clicker" {...props}>
        Hello
      </div>
    );
    const result = mount(<CopyToClipboard text="test code" buttonBuilder={buttonBuilder} />, {
      attachTo: document.getElementById("content"),
    });
    result.render();
    return result;
  };

  it("CopyToClipboard no queryCommandSupported test", () => {
    const result = render();
    expect(result.html()).toBeNull();
  });

  it("CopyToClipboard queryCommandSupported test", () => {
    Object.defineProperty(global.document, "queryCommandSupported", {
      value: () => true,
    });
    Object.defineProperty(global.document, "execCommand", { value: _.noop });
    const result = render();
    expect(result.find("#clicker").length).toBe(1);
    result.find("#clicker").simulate("click");
  });
});
