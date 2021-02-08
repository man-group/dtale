import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

describe("ActionConfig", () => {
  let result;

  beforeEach(() => {
    const { ReactActionConfig } = require("../../../popups/merge/ActionConfig");
    const props = {
      action: "merge",
      mergeConfig: { how: "inner", sort: false, indicator: false },
      stackConfig: { ignoreIndex: false },
      updateActionType: jest.fn(),
      updateActionConfig: jest.fn(),
    };
    result = mount(<ReactActionConfig {...props} />);
  });

  it("triggers merge config functions", () => {
    result.find("ButtonToggle").first().props().update("stack");
    expect(result.props().updateActionType).toHaveBeenLastCalledWith("stack");
    result.find("ButtonToggle").last().props().update("left");
    expect(result.props().updateActionConfig).toHaveBeenLastCalledWith({
      action: "merge",
      prop: "how",
      value: "left",
    });
    result.find("i.ico-check-box-outline-blank").first().simulate("click");
    expect(result.props().updateActionConfig).toHaveBeenLastCalledWith({
      action: "merge",
      prop: "sort",
      value: true,
    });
    result.find("i.ico-check-box-outline-blank").last().simulate("click");
    expect(result.props().updateActionConfig).toHaveBeenLastCalledWith({
      action: "merge",
      prop: "indicator",
      value: true,
    });
    result.find("dt").first().simulate("click");
    expect(result.state().example).toBe(true);
    expect(_.endsWith(result.find("img").props().src, "merging_merge_on_key_multiple.png")).toBe(true);
  });

  it("triggers stack config functions", () => {
    result.setProps({ action: "stack" });
    result.find("ButtonToggle").first().props().update("stack");
    result.find("i.ico-check-box-outline-blank").first().simulate("click");
    expect(result.props().updateActionConfig).toHaveBeenLastCalledWith({
      action: "stack",
      prop: "ignoreIndex",
      value: true,
    });
    result.find("dt").first().simulate("click");
    expect(result.state().example).toBe(true);
    expect(_.endsWith(result.find("img").props().src, "merging_concat_basic.png")).toBe(true);
  });

  it("displays different merge examples", () => {
    result.setProps({
      mergeConfig: { ...result.props().mergeConfig, how: "left" },
    });
    result.setState({ example: true });
    expect(_.endsWith(result.find("img").props().src, "merging_merge_on_key_left.png")).toBe(true);
    result.setProps({
      mergeConfig: { ...result.props().mergeConfig, how: "right" },
    });
    expect(_.endsWith(result.find("img").props().src, "merging_merge_on_key_right.png")).toBe(true);
    result.setProps({
      mergeConfig: { ...result.props().mergeConfig, how: "outer" },
    });
    expect(_.endsWith(result.find("img").props().src, "merging_merge_on_key_outer.png")).toBe(true);
  });
});
