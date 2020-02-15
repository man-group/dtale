import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { RemovableError } from "../../RemovableError";
import { ReactDataViewerInfo as DataViewerInfo } from "../../dtale/DataViewerInfo";
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

  test("DataViewerInfo rendering hidden", done => {
    buildInnerHTML();
    let props = { columns: [{ name: "a", visible: false }] };
    const propagateState = state => (props = state);
    const result = mount(<DataViewerInfo {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    t.equal(
      result
        .find("div.col-md-4")
        .last()
        .text(),
      "Hidden:a",
      "should display hidden columns"
    );
    done();
  });

  test("DataViewerInfo rendering lots of hidden", done => {
    buildInnerHTML();
    let props = {
      columns: _.map(_.range(10), idx => ({
        name: `test_col${idx}`,
        visible: false,
      })),
    };
    const propagateState = state => (props = state);
    const result = mount(<DataViewerInfo {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    t.equal(
      result
        .find("div.col-md-4")
        .last()
        .text(),
      "Hidden:10 Columns",
      "should display hidden columns"
    );
    done();
  });
});
