import { shallow } from "enzyme";
import _ from "lodash";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";

import { expect, it } from "@jest/globals";

import ButtonToggle from "../../../../ButtonToggle";
import CategoryInputs from "../../../../popups/analysis/filters/CategoryInputs";
import DescribeFilters from "../../../../popups/analysis/filters/DescribeFilters";
import OrdinalInputs from "../../../../popups/analysis/filters/OrdinalInputs";
import TextEnterFilter from "../../../../popups/analysis/filters/TextEnterFilter";

describe("DescribeFilters tests", () => {
  let result, buildChart;

  beforeEach(() => {
    buildChart = jest.fn();
    const props = {
      selectedCol: "foo",
      cols: [{ name: "foo" }, { name: "bar" }],
      dtype: "int64",
      code: "test code",
      type: "boxplot",
      top: 100,
      buildChart: buildChart,
      details: {},
    };
    result = shallow(<DescribeFilters {...props} />);
  });

  afterEach(() => {
    buildChart.mockReset();
  });

  it("calls buildChart", () => {
    result.instance().updateOrdinal("ordinalCol", "bar");
    result.instance().updateOrdinal("ordinalAgg", "mean");
    expect(buildChart.mock.calls).toHaveLength(2);
    buildChart.mockReset();
    result.instance().updateCategory("categoryCol", "bar");
    result.instance().updateCategory("categoryAgg", "mean");
    expect(buildChart.mock.calls).toHaveLength(2);
  });

  describe(" rendering int column", () => {
    it("rendering boxplot", () => {
      expect(result.find(OrdinalInputs)).toHaveLength(0);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(0);
      expect(_.map(result.find(ButtonToggle).prop("options"), "value")).toEqual([
        "boxplot",
        "histogram",
        "value_counts",
        "qq",
      ]);
    });

    it("rendering histogram", () => {
      result.setState({ type: "histogram" });
      expect(result.find(OrdinalInputs)).toHaveLength(0);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(1);
    });

    it("rendering value_counts", () => {
      result.setState({ type: "value_counts" });
      expect(result.find(OrdinalInputs)).toHaveLength(1);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(1);
    });
  });

  describe(" rendering float column", () => {
    beforeEach(() => {
      result.setProps({ dtype: "float64", details: { type: "float64" } });
      result.update();
    });

    it("rendering boxplot", () => {
      expect(result.find(OrdinalInputs)).toHaveLength(0);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(0);
      expect(_.map(result.find(ButtonToggle).prop("options"), "value")).toEqual([
        "boxplot",
        "histogram",
        "categories",
        "qq",
      ]);
    });

    it("rendering histogram", () => {
      result.setState({ type: "histogram" });
      expect(result.find(OrdinalInputs)).toHaveLength(0);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(1);
    });

    it("rendering categories", () => {
      result.setState({ type: "categories" });
      expect(result.find(OrdinalInputs)).toHaveLength(0);
      expect(result.find(CategoryInputs)).toHaveLength(1);
      expect(result.find(TextEnterFilter)).toHaveLength(1);
    });
  });

  describe(" rendering datetime column", () => {
    beforeEach(() => {
      result.setProps({ dtype: "datetime[ns]", details: { type: "datetime" } });
      result.update();
    });

    it("rendering boxplot", () => {
      expect(result.find(OrdinalInputs)).toHaveLength(0);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(0);
      expect(_.map(result.find(ButtonToggle).prop("options"), "value")).toEqual([
        "boxplot",
        "histogram",
        "value_counts",
        "qq",
      ]);
    });

    it("rendering value_counts", () => {
      result.setState({ type: "value_counts" });
      expect(result.find(OrdinalInputs)).toHaveLength(1);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(1);
    });
  });

  describe("chart navigation", () => {
    const move = prop => result.find(GlobalHotKeys).props().handlers[prop]();

    it("moves selected chart on LEFT", () => {
      result.setState({ type: "histogram" });
      move("LEFT");
      expect(result.state().type).toBe("boxplot");
    });

    it("moves selected chart on RIGHT", () => {
      move("RIGHT");
      expect(result.state().type).toBe("histogram");
    });

    it("does nothing on RIGHT if at last chart", () => {
      result.setState({ type: "qq" });
      move("RIGHT");
      expect(result.state().type).toBe("qq");
    });

    it("does nothing on LEFT if at first chart", () => {
      result.setState({ type: "boxplot" });
      move("LEFT");
      expect(result.state().type).toBe("boxplot");
    });
  });
});
