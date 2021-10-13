import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

describe("ColumnFilter string tests", () => {
  let ColumnFilter, StringFilter;

  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/column-filter-data/1?col=col3")) {
          return { success: true, hasMissing: true, uniques: ["a", "b", "c"] };
        }
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
    ColumnFilter = require("../../filters/ColumnFilter").default;
    StringFilter = require("../../filters/StringFilter").default;
  });

  beforeEach(buildInnerHTML);

  it("ColumnFilter string rendering", async () => {
    let props = {
      dataId: "1",
      selectedCol: "col3",
      columns: [{ name: "col3", dtype: "object", visible: true }],
      columnFilters: { col3: { value: ["b"] } },
      updateSettings: jest.fn(),
    };
    const propagateState = state => (props = _.assignIn(props, state));
    const result = mount(<ColumnFilter {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
    expect(result.find(StringFilter).length).toBe(1);
    result.find("i.ico-check-box-outline-blank").simulate("click");
    await tickUpdate(result);
    expect(result.find(".Select__control--is-disabled").length).toBeGreaterThan(0);
    result.find("i.ico-check-box").simulate("click");
    await tickUpdate(result);
    expect(result.find(".Select__control--is-disabled").length).toBe(0);
    const uniqueSelect = result.find(Select).last();
    uniqueSelect
      .first()
      .props()
      .onChange([{ value: "a" }]);
    await tickUpdate(result);
    expect(result.state().cfg).toEqual(
      expect.objectContaining({
        type: "string",
        operand: "=",
        value: ["a"],
      })
    );
    result.find("StringFilter").find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.state().cfg).toEqual(
      expect.objectContaining({
        type: "string",
        operand: "ne",
        value: ["a"],
      })
    );
  });
});
