import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import * as actions from "../../actions/dtale";
import NetworkUrlParams from "../../network/NetworkUrlParams";

describe("NetworkUrlParams", () => {
  const { onpopstate } = window;
  const { history } = global;
  let result, propagateState, getParamsSpy;
  const params = { to: "to", from: "from", group: "group", weight: "weight" };

  beforeAll(() => {
    delete window.onpopstate;
    window.onpopstate = jest.fn();
  });

  beforeEach(() => {
    propagateState = jest.fn();
    getParamsSpy = jest.spyOn(actions, "getParams");
    result = shallow(<NetworkUrlParams params={undefined} propagateState={propagateState} />);
  });

  afterEach(() => {
    getParamsSpy.mockRestore();
  });

  afterAll(() => {
    window.onpopstate = onpopstate;
    Object.defineProperty(global, "history", history);
  });

  it("renders successfully", () => {
    expect(result.html()).toBeNull();
  });

  it("correctly updates history", () => {
    const pushState = jest.fn();
    Object.defineProperty(global.history, "pushState", {
      value: pushState,
    });
    getParamsSpy.mockReturnValue({});
    result.setProps({ params });
    expect(pushState).toHaveBeenLastCalledWith({}, "", "?to=to&from=from&group=group&weight=weight");
    window.onpopstate();
    expect(propagateState).toHaveBeenLastCalledWith({
      to: null,
      from: null,
      group: null,
      weight: null,
    });
    pushState.mockClear();
    result.setProps({ params });
    expect(pushState).not.toHaveBeenCalled();
    getParamsSpy.mockReturnValue(params);
    result.setProps({ params: { ...params, test: "blah" } });
    expect(pushState).not.toHaveBeenCalled();
    result.unmount();
  });
});
