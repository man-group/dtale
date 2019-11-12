import { mount } from "enzyme";
import React from "react";

import { RemovableError } from "../../RemovableError";
import { DataViewerInfo } from "../../dtale/DataViewerInfo";
import * as t from "../jest-assertions";
import { buildInnerHTML } from "../test-utils";

describe("DataViewerInfo tests", () => {
  test("DataViewerInfo rendering errors", done => {
    buildInnerHTML();
    let props = { error: "Error test", traceback: "Traceback test" };
    const propagateState = state => (props = state);
    const result = mount(<DataViewerInfo {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    t.ok(result.find(RemovableError).length, 1, "should render error");
    result
      .find(RemovableError)
      .find("i.ico-cancel")
      .simulate("click");
    t.deepEqual(props, { error: null, traceback: null }, "should clear error");
    done();
  });
});
