import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { ReactGridCell } from "../../dtale/GridCell";

describe("GridCell", () => {
  let wrapper, props;

  beforeEach(() => {
    props = {
      columnIndex: 1,
      rowIndex: 1,
      style: {},
      gridState: {
        columns: [
          { index: 0, visible: true },
          {
            name: "foo",
            index: 1,
            dtype: "int64",
            visible: true,
            width: 100,
            resized: true,
          },
        ],
        columnFormats: {},
        sortInfo: [],
        menuOpen: false,
        rowCount: 2,
        toggleColumnMenu: jest.fn(),
        hideColumnMenu: jest.fn(),
        backgroundMode: null,
        rangeHighlight: null,
        rangeSelect: null,
        columnRange: null,
        rowRange: null,
      },
      propagateState: jest.fn(),
      dataId: "1",
      editedCell: "1|1",
      allowCellEdits: true,
      filteredRanges: null,
      openChart: jest.fn(),
      showTooltip: jest.fn(),
      hideTooltip: jest.fn(),
    };
    wrapper = shallow(<ReactGridCell {...props} />);
  });

  it("correctly triggers tooltip on edited cell hovering", () => {
    wrapper.props().onMouseOver();
    expect(props.showTooltip).toHaveBeenCalledTimes(1);
    wrapper.props().onMouseLeave();
    expect(props.hideTooltip).toHaveBeenCalledTimes(1);
  });

  it("adds resized class to cell", () => {
    wrapper.setProps({ editedCell: null });
    expect(wrapper.find("div").last().props().className).toBe("resized");
  });
});
