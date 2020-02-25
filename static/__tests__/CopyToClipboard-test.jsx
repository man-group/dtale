import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import * as t from "./jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "./test-utils";

describe("CopyToClipboard tests", () => {
  test("CopyToClipboard no queryCommandSupported test", done => {
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
    t.equal(result.html(), null, "shouldn't render anything");
    done();
  });

  test("CopyToClipboard queryCommandSupported test", done => {
    const { CopyToClipboard } = withGlobalJquery(() => require("../CopyToClipboard"));
    buildInnerHTML();
    Object.defineProperty(global.document, "queryCommandSupported", {
      value: () => true,
    });
    Object.defineProperty(global.document, "execCommand", { value: _.noop });
    const buttonBuilder = props => (
      <div id="clicker" {...props}>
        Hello
      </div>
    );
    const result = mount(<CopyToClipboard text="test code" buttonBuilder={buttonBuilder} />, {
      attachTo: document.getElementById("content"),
    });
    result.render();
    t.ok(result.find("#clicker").length, 1, "should display button");
    result.find("#clicker").simulate("click");
    done();
  });
});
