import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

describe("DataViewerInfo tests", () => {
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  test("DataViewerInfo rendering errors", done => {
    const DataViewerInfo = require("../../dtale/DataViewerInfo").ReactDataViewerInfo;

    buildInnerHTML();
    let props = { error: "Error test", traceback: "Traceback test" };
    const propagateState = state => (props = state);
    const result = mount(<DataViewerInfo {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    t.ok(result.find(RemovableError).length, 1, "should render error");
    result.find(RemovableError).find("i.ico-cancel").simulate("click");
    t.deepEqual(props, { error: null, traceback: null }, "should clear error");
    done();
  });

  test("DataViewerInfo rendering hidden", done => {
    const DataViewerInfo = require("../../dtale/DataViewerInfo").ReactDataViewerInfo;

    buildInnerHTML();
    let props = { columns: [{ name: "a", visible: false }] };
    const propagateState = state => (props = state);
    const result = mount(<DataViewerInfo {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    t.equal(result.find("div.col").last().text(), "Hidden:a", "should display hidden columns");
    done();
  });

  test("DataViewerInfo rendering lots of hidden", done => {
    const DataViewerInfo = require("../../dtale/DataViewerInfo").ReactDataViewerInfo;

    buildInnerHTML();
    let props = {
      dataId: "1",
      columns: _.map(_.range(10), idx => ({
        name: `test_col${idx}`,
        visible: false,
      })),
    };
    const propagateState = state => (props = state);
    const result = mount(<DataViewerInfo {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    const hiddenLink = result.find("div.col").last().find("span.pointer");
    t.equal(hiddenLink.text(), "10 Columns", "should display hidden columns");
    hiddenLink.simulate("click");
    result.find("div.hidden-menu-toggle").find("button").first().simulate("click");
    setTimeout(() => {
      result.update();
      done();
    }, 400);
  });

  test("DataViewerInfo rendering lots of filters", done => {
    const DataViewerInfo = require("../../dtale/DataViewerInfo").ReactDataViewerInfo;

    buildInnerHTML();
    let props = {
      dataId: "1",
      query: "foo == 1",
      columnFilters: {
        bar: { query: "bar == 1" },
        baz: { query: "baz == 1" },
      },
    };
    const propagateState = state => (props = state);
    const result = mount(<DataViewerInfo {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    const filterLink = result.find("div.filter-menu-toggle").first().find("span.pointer");
    t.equal(filterLink.text(), "bar == 1 and baz == 1 and f...", "should display filters");
    filterLink.simulate("click");
    result.find("div.filter-menu-toggle").find("button").first().simulate("click");
    setTimeout(() => {
      result.update();
      result.find("div.filter-menu-toggle").find("button").last().simulate("click");
      setTimeout(() => {
        result.update();
        done();
      }, 400);
    }, 400);
  });

  test("DataViewerInfo rendering lots of sorts", done => {
    const DataViewerInfo = require("../../dtale/DataViewerInfo").ReactDataViewerInfo;

    buildInnerHTML();
    let props = {
      dataId: "1",
      sortInfo: [
        ["foo", "ASC"],
        ["bar", "DESC"],
        ["baz", "ASC"],
      ],
    };
    const propagateState = state => (props = state);
    const result = mount(<DataViewerInfo {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    const sortLink = result.find("div.sort-menu-toggle").first().find("span.pointer");
    t.equal(sortLink.text(), "foo (ASC), bar (DESC), baz (ASC)", "should display sorts");
    sortLink.simulate("click");
    result.find("div.sort-menu-toggle").find("button").first().simulate("click");
    setTimeout(() => {
      result.update();
      done();
    }, 400);
  });
});
