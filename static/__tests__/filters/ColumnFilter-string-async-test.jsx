import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import AsyncSelect from "react-select/async";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

describe("ColumnFilter string tests", () => {
  let ColumnFilter, StringFilter;
  const INITIAL_UNIQUES = ["a", "b", "c", "d", "e"];
  const ASYNC_OPTIONS = [{ value: "f" }, { value: "g" }, { value: "h" }];

  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher, DATA, DTYPES } = require("../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/column-filter-data/1?col=col3")) {
          return { success: true, hasMissing: true, uniques: INITIAL_UNIQUES };
        }
        if (_.startsWith(url, "/dtale/data")) {
          const col3 = _.find(DTYPES, { name: "col3" });
          const col3Dtype = { ...col3, unique_ct: 1000 };
          return {
            ...DATA,
            columns: _.map(DATA.columns, c => (c.name === "col3" ? col3Dtype : c)),
          };
        }
        if (_.startsWith(url, "/dtale/async-column-filter-data/1?col=col3")) {
          return ASYNC_OPTIONS;
        }
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
    ColumnFilter = require("../../filters/ColumnFilter").default;
    StringFilter = require("../../filters/StringFilter").default;
  });

  beforeEach(buildInnerHTML);

  const findAsync = result => result.find(AsyncSelect);

  it("ColumnFilter string rendering", async () => {
    let props = {
      dataId: "1",
      selectedCol: "col3",
      columns: [{ name: "col3", dtype: "object", visible: true, unique_ct: 1000 }],
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
    expect(findAsync(result).prop("isDisabled")).toBe(true);
    result.find("i.ico-check-box").simulate("click");
    await tickUpdate(result);
    expect(findAsync(result).prop("isDisabled")).toBe(false);
    const asyncOptions = await findAsync(result).prop("loadOptions")("a");
    expect(asyncOptions).toEqual(ASYNC_OPTIONS);
    expect(findAsync(result).prop("defaultOptions")).toEqual(_.map(INITIAL_UNIQUES, iu => ({ value: iu })));
    findAsync(result).prop("onChange")([{ value: "a" }]);
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
