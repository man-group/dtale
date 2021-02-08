import { mount } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import * as fetcher from "../../../fetcher";
import * as uploadUtils from "../../../popups/upload/uploadUtils";
import { buildInnerHTML } from "../../test-utils";

describe("SheetSelector", () => {
  let result, SheetSelector, propagateState, jumpToDatasetSpy, fetchJsonSpy;

  beforeAll(() => {
    SheetSelector = require("../../../popups/upload/SheetSelector").default;
  });

  beforeEach(() => {
    fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    jumpToDatasetSpy = jest.spyOn(uploadUtils, "jumpToDataset");
    jumpToDatasetSpy.mockImplementation(() => undefined);
    propagateState = jest.fn();
    buildInnerHTML({ settings: "" });
    result = mount(<SheetSelector propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    result.setProps({
      sheets: [
        { name: "Sheet 1", dataId: 1, selected: true },
        { name: "Sheet 2", dataId: 2, selected: true },
      ],
    });
    result.update();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("toggles selections", async () => {
    result.find("Resizable").find("i.ico-check-box").first().simulate("click");
    expect(result.state().sheets[0].selected).toBe(false);
  });

  it("calls jumpToDataset without clearing data", async () => {
    result.find("button").last().simulate("click");
    expect(jumpToDatasetSpy.mock.calls[0][0]).toBe(1);
  });

  it("calls jumpToDataset with clearing data", async () => {
    result.setProps({
      sheets: [
        { name: "Sheet 1", dataId: 1, selected: false },
        { name: "Sheet 2", dataId: 2, selected: true },
      ],
    });
    result.update();
    result.find("button").last().simulate("click");
    fetchJsonSpy.mock.calls[0][1]({ success: true });
    expect(jumpToDatasetSpy.mock.calls[0][0]).toBe(2);
  });

  it("propagates state to clear sheets", async () => {
    result.find("button").first().simulate("click");
    fetchJsonSpy.mock.calls[0][1]({ success: true });
    expect(propagateState).toBeCalledWith({ sheets: [] });
  });
});
