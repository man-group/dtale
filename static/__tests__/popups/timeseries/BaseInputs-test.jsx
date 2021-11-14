import { shallow } from "enzyme";
import React from "react";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import { BaseInputs } from "../../../popups/timeseries/BaseInputs";

describe("BaseInputs", () => {
  let wrapper, props;

  beforeEach(() => {
    props = {
      columns: [{ dtype: "int", name: "foo" }],
      cfg: {},
      updateState: jest.fn(),
    };
    wrapper = shallow(<BaseInputs {...props} />);
  });

  it("renders successfully", () => {
    expect(wrapper.find("div.col-md-4")).toHaveLength(3);
  });

  it("updates state", () => {
    wrapper
      .find("ColumnSelect")
      .first()
      .props()
      .updateState({ index: { value: "date" } });
    wrapper
      .find("ColumnSelect")
      .last()
      .props()
      .updateState({ col: { value: "foo" } });
    wrapper.find(Select).props().onChange({ value: "sum" });
    expect(props.updateState).toHaveBeenLastCalledWith({
      index: "date",
      col: "foo",
      agg: "sum",
    });
  });
});
