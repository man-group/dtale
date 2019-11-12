import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { ReactDataViewerMenu as DataViewerMenu } from "../../dtale/DataViewerMenu";
import * as t from "../jest-assertions";
import { buildInnerHTML } from "../test-utils";

describe("DataViewerMenu tests", () => {
  test("DataViewerMenu: render", done => {
    buildInnerHTML();
    const props = {
      openChart: _.noop,
      propagateState: _.noop,
      menuOpen: true,
      selectedCols: [],
      sortInfo: [],
      columns: [],
    };
    const result = mount(<DataViewerMenu {...props} />, { attachTo: document.getElementById("content") });
    t.ok(
      result
        .find("ul li span.toggler-action")
        .last()
        .text() === "Shutdown",
      "should render shutdown"
    );
    done();
  });

  test("DataViewerMenu: hide_shutdown == True", done => {
    buildInnerHTML("", "True");
    const props = {
      openChart: _.noop,
      propagateState: _.noop,
      menuOpen: true,
      selectedCols: [],
      sortInfo: [],
      columns: [],
    };
    const result = mount(<DataViewerMenu {...props} />, { attachTo: document.getElementById("content") });
    t.ok(
      result
        .find("ul li span.toggler-action")
        .last()
        .text() === "Instances 1",
      "should hide shutdown"
    );
    done();
  });

  test("DataViewerMenu: processes == 2", done => {
    buildInnerHTML("", "True", 2);
    const props = {
      openChart: _.noop,
      propagateState: _.noop,
      menuOpen: true,
      selectedCols: [],
      sortInfo: [],
      columns: [],
    };
    const result = mount(<DataViewerMenu {...props} />, { attachTo: document.getElementById("content") });
    t.ok(
      result
        .find("ul li span.toggler-action")
        .last()
        .text() === "Instances 2",
      "should show instances"
    );
    done();
  });
});
