import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { describe, expect, it } from "@jest/globals";

import { VerticalColumnHeaders } from "../../../dtale/menu/VerticalColumnHeaders";
import serverState from "../../../dtale/serverStateManagement";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML } from "../../test-utils";

describe("VerticalColumnHeaders tests", () => {
  let result, store, updateSettingsSpy;

  const setupOption = (settings = "") => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings }, store);
    result = mount(
      <Provider store={store}>
        <VerticalColumnHeaders />,
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
  };

  beforeEach(() => {
    updateSettingsSpy = jest.spyOn(serverState, "updateSettings");
    updateSettingsSpy.mockImplementation(() => undefined);
    setupOption();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it("renders successfully with defaults", () => {
    expect(result.find("i.ico-check-box-outline-blank")).toHaveLength(1);
  });

  it("renders successfully with specified value", () => {
    setupOption("{&quot;verticalHeaders&quot;:&quot;True&quot;}");
    expect(result.find("i.ico-check-box")).toHaveLength(1);
  });

  it("handles changes to checkbox", () => {
    result.find("i.ico-check-box-outline-blank").simulate("click");
    expect(updateSettingsSpy).toBeCalledTimes(1);
    updateSettingsSpy.mock.calls[0][2]();
    expect(store.getState().settings).toEqual(expect.objectContaining({ verticalHeaders: true }));
    result.update();
    result.find("i.ico-check-box").simulate("click");
    expect(updateSettingsSpy).toBeCalledTimes(2);
    expect(updateSettingsSpy.mock.calls[1][0]).toEqual({
      verticalHeaders: false,
    });
    updateSettingsSpy.mock.calls[1][2]();
    expect(store.getState().settings).toEqual(expect.objectContaining({ verticalHeaders: false }));
  });
});
