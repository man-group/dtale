import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

describe("DataViewerInfo tests", () => {
  let DataViewerInfo;

  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  beforeEach(() => {
    DataViewerInfo = require("../../dtale/DataViewerInfo").ReactDataViewerInfo;
    buildInnerHTML();
  });

  it("DataViewerInfo rendering errors", () => {
    let props = { error: "Error test", traceback: "Traceback test" };
    const propagateState = state => (props = state);
    const result = mount(<DataViewerInfo {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    expect(result.find(RemovableError).length).toBe(1);
    result.find(RemovableError).find("i.ico-cancel").simulate("click");
    expect(props).toEqual({ error: null, traceback: null });
  });

  it("DataViewerInfo rendering hidden", () => {
    let props = { columns: [{ name: "a", visible: false }] };
    const propagateState = state => (props = state);
    const result = mount(<DataViewerInfo {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    expect(result.find("div.col").last().text()).toBe("Hidden:a");
  });

  it("DataViewerInfo rendering lots of hidden", async () => {
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
    expect(hiddenLink.text()).toBe("10 Columns");
    hiddenLink.simulate("click");
    result.find("div.hidden-menu-toggle").find("button").first().simulate("click");
    await tickUpdate(result);
  });

  it("DataViewerInfo rendering lots of filters", async () => {
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
    expect(filterLink.text()).toBe("bar == 1 and baz == 1 and f...");
    filterLink.simulate("click");
    result.find("div.filter-menu-toggle").find("button").first().simulate("click");
    await tickUpdate(result);
    result.find("div.filter-menu-toggle").find("button").last().simulate("click");
    await tickUpdate(result);
  });

  it("DataViewerInfo rendering lots of sorts", async () => {
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
    expect(sortLink.text()).toBe("foo (ASC), bar (DESC), baz (ASC)");
    sortLink.simulate("click");
    result.find("div.sort-menu-toggle").find("button").first().simulate("click");
    await tickUpdate(result);
  });
});
