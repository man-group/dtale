import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

describe("ColumnFilter numeric tests", () => {
  let ColumnFilter, NumericFilter;
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/column-filter-data/1?col=col1")) {
          return {
            success: true,
            hasMissing: true,
            uniques: [1, 2, 3],
            min: 1,
            max: 3,
          };
        }
        if (_.startsWith(url, "/dtale/column-filter-data/1?col=col2")) {
          return { success: true, hasMissing: true, min: 1.0, max: 3.0 };
        }
        const { urlFetcher } = require("../redux-test-utils").default;
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

  it("ColumnFilter int rendering", async () => {
    const result = await buildResult({
      dataId: "1",
      selectedCol: "col1",
      columns: [{ name: "col1", dtype: "int64", visible: true }],
      updateSettings: jest.fn(),
    });
    expect(result.find(NumericFilter).length).toBe(1);
    result.find("i.ico-check-box-outline-blank").simulate("click");
    await tickUpdate(result);
    expect(result.state().cfg).toEqual({ type: "int", missing: true });
    expect(result.find(".Select__control--is-disabled").length).toBeGreaterThan(0);
    result.find("i.ico-check-box").simulate("click");
    await tickUpdate(result);
    expect(result.find(".Select__control--is-disabled").length).toBe(0);
    const uniqueSelect = result.find(Select);
    uniqueSelect
      .first()
      .props()
      .onChange([{ value: 1 }]);
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

  it("ColumnFilter float rendering", async () => {
    const result = await buildResult({
      dataId: "1",
      selectedCol: "col2",
      columns: [{ name: "col2", dtype: "float64", min: 2.5, max: 5.5, visible: true }],
      updateSettings: jest.fn(),
    });
    expect(result.find(NumericFilter).length).toBe(1);
    result.find("i.ico-check-box-outline-blank").simulate("click");
    await tickUpdate(result);
    expect(result.find("input").first().props().disabled).toBe(true);
    result.find("i.ico-check-box").simulate("click");
    await tickUpdate(result);
    expect(result.find("input").first().props().disabled).toBe(false);
    result
      .find(NumericFilter)
      .find("input")
      .first()
      .simulate("change", { target: { value: "1.1" } });
    await tickUpdate(result);
    expect(result.state().cfg).toEqual({
      type: "float",
      operand: "=",
      value: 1.1,
    });
    result.find(NumericFilter).find("div.row").first().find("button").last().simulate("click");
    await tickUpdate(result);
    result
      .find(NumericFilter)
      .find("input")
      .first()
      .simulate("change", { target: { value: "1.2" } });
    await tickUpdate(result);
    expect(result.state().cfg).toEqual({
      type: "float",
      operand: "()",
      min: 1.2,
      max: 3,
    });
    result
      .find(NumericFilter)
      .find("input")
      .first()
      .simulate("change", { target: { value: "a" } });
    result
      .find(NumericFilter)
      .find("input")
      .last()
      .simulate("change", { target: { value: "b" } });
    await tickUpdate(result);
    expect(result.state().cfg).toEqual({ type: "float" });
  });
});
