import { shallow } from "enzyme";
import React from "react";

import { ReactGridCellEditor } from "../../dtale/GridCellEditor";

describe("GridCellEditor", () => {
  let wrapper, props, addEventListenerSpy, removeEventListenerSpy;

  beforeEach(() => {
    props = {
      value: "aaa",
      colCfg: {},
      rowIndex: 1,
      propagateState: jest.fn(),
      openChart: jest.fn(),
      clearEdit: jest.fn(),
      dataId: "1",
      gridState: {
        data: {},
        columns: [{}],
        sortInfo: [],
        columnFormats: {},
      },
      settings: {},
      maxColumnWidth: null,
    };
    addEventListenerSpy = jest.spyOn(window, "addEventListener");
    removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    wrapper = shallow(<ReactGridCellEditor {...props} />);
  });

  it("clears edit on escape", () => {
    wrapper.instance().componentDidMount();
    expect(addEventListenerSpy).toHaveBeenCalled();
    addEventListenerSpy.mock.calls[0][1]({ key: "Escape" });
    expect(props.clearEdit).toHaveBeenCalled();
  });

  it("drops window listener on unmount", () => {
    wrapper.instance().componentWillUnmount();
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
