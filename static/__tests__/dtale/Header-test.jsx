import { shallow } from "enzyme";
import React from "react";
import Draggable from "react-draggable";

import { expect, it } from "@jest/globals";

import { ReactHeader } from "../../dtale/Header";

describe("Header", () => {
  let wrapper, props;

  beforeEach(() => {
    props = {
      propagateState: jest.fn(),
      columns: [
        { index: 0, visible: true },
        { name: "foo", index: 1, dtype: "int64", visible: true, width: 100 },
      ],
      columnIndex: 1,
      style: {},
      sortInfo: [],
    };
    wrapper = shallow(<ReactHeader {...props} />);
  });

  it("handles drag operations", () => {
    let draggable = wrapper.find(Draggable);
    const event = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    draggable.props().onStart(event);
    expect(wrapper.state().drag).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    wrapper.find(".text-nowrap").props().onClick();
    draggable = wrapper.find(Draggable);
    draggable.props().onDrag(event, { deltaX: 10 });
    const updatedColumns = [{ ...props.columns[0] }, { ...props.columns[1], width: 110, resized: true }];
    expect(props.propagateState).toHaveBeenCalledWith({
      columns: updatedColumns,
      triggerResize: true,
    });
    expect(event.preventDefault).toHaveBeenCalledTimes(2);
    expect(event.stopPropagation).toHaveBeenCalledTimes(2);
    draggable = wrapper.find(Draggable);
    draggable.props().onStop(event);
    expect(wrapper.state().drag).toBe(false);
    expect(event.preventDefault).toHaveBeenCalledTimes(3);
    expect(event.stopPropagation).toHaveBeenCalledTimes(3);
    wrapper.setProps({ columns: updatedColumns });
    expect(wrapper.find(".resized")).toHaveLength(1);
  });
});
