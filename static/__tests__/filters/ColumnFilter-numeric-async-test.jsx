import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import AsyncSelect from "react-select/async";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

describe("ColumnFilter numeric tests", () => {
  let ColumnFilter, NumericFilter;
  const INITIAL_UNIQUES = [1, 2, 3, 4, 5];
  const ASYNC_OPTIONS = [{ value: 6 }, { value: 7 }, { value: 8 }];
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher, DATA, DTYPES } = require("../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/column-filter-data/1?col=col1")) {
          return {
            success: true,
            hasMissing: true,
            uniques: INITIAL_UNIQUES,
            min: 1,
            max: 10,
          };
        }
        if (_.startsWith(url, "/dtale/data")) {
          const col1 = _.find(DTYPES, { name: "col1" });
          const col1Dtype = { ...col1, unique_ct: 1000 };
          return {
            ...DATA,
            columns: _.map(DATA.columns, c => (c.name === "col1" ? col1Dtype : c)),
          };
        }
        if (_.startsWith(url, "/dtale/async-column-filter-data/1?col=col1")) {
          return ASYNC_OPTIONS;
        }
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
    ColumnFilter = require("../../filters/ColumnFilter").default;
    NumericFilter = require("../../filters/NumericFilter").NumericFilter;
  });

  beforeEach(buildInnerHTML);

  const buildResult = async props => {
    const propagateState = state => (props = _.assignIn(props, state));
    const result = mount(<ColumnFilter {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
    return result;
  };
  const findAsync = result => result.find(AsyncSelect);

  it("ColumnFilter int rendering", async () => {
    const result = await buildResult({
      dataId: "1",
      selectedCol: "col1",
      columns: [{ name: "col1", dtype: "int64", visible: true, unique_ct: 1000 }],
      updateSettings: jest.fn(),
    });
    expect(result.find(NumericFilter).length).toBe(1);
    result.find("i.ico-check-box-outline-blank").simulate("click");
    await tickUpdate(result);
    expect(result.state().cfg).toEqual({ type: "int", missing: true });
    expect(findAsync(result).prop("isDisabled")).toBe(true);
    result.find("i.ico-check-box").simulate("click");
    await tickUpdate(result);
    expect(findAsync(result).prop("isDisabled")).toBe(false);
    const asyncOptions = await findAsync(result).prop("loadOptions")("1");
    expect(asyncOptions).toEqual(ASYNC_OPTIONS);
    expect(findAsync(result).prop("defaultOptions")).toEqual(_.map(INITIAL_UNIQUES, iu => ({ value: iu })));
    findAsync(result).prop("onChange")([{ value: 1 }]);
    await tickUpdate(result);
    expect(result.state().cfg).toEqual({
      type: "int",
      operand: "=",
      value: [1],
    });
    result.find(NumericFilter).find("div.row").first().find("button").at(1).simulate("click");
    expect(result.state().cfg).toEqual({
      type: "int",
      operand: "ne",
      value: [1],
    });
    await tickUpdate(result);
    result.find(NumericFilter).find("div.row").first().find("button").at(3).simulate("click");
    await tickUpdate(result);
    result
      .find(NumericFilter)
      .find("input")
      .first()
      .simulate("change", { target: { value: "a" } });
    result
      .find(NumericFilter)
      .find("input")
      .first()
      .simulate("change", { target: { value: "0" } });
    await tickUpdate(result);
    expect(result.state().cfg).toEqual({ type: "int", operand: ">", value: 0 });
  });
});
