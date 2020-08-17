import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import * as CopyToClipboard from "../../CopyToClipboard";
import menuFuncs from "../../dtale/menu/dataViewerMenuUtils";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

describe("CodePopup tests", () => {
  beforeAll(() => {
    Object.defineProperty(global.document, "queryCommandSupported", {
      value: () => true,
    });
    Object.defineProperty(global.document, "execCommand", { value: _.noop });
  });

  it("CodePopup render & copy test", () => {
    const CodePopup = withGlobalJquery(() => require("../../popups/CodePopup")).CodePopup;
    buildInnerHTML();
    const result = mount(<CodePopup code="test code" />, {
      attachTo: document.getElementById("content"),
    });
    result.render();
    expect(result.find("pre").text()).toBe("test code");
    result.find("button").simulate("click");
  });

  it("returns null when it can't copy", () => {
    const CodePopup = withGlobalJquery(() => require("../../popups/CodePopup")).CodePopup;
    buildInnerHTML();
    const canCopySpy = jest.spyOn(CopyToClipboard, "canCopy");
    canCopySpy.mockImplementation(() => false);
    const result = mount(<CodePopup code="test code" />, {
      attachTo: document.getElementById("content"),
    });
    result.render();
    expect(result.find("div")).toHaveLength(1);
  });

  describe("renderCodePopupAnchor", () => {
    let menuFuncsOpenSpy;
    beforeEach(() => {
      menuFuncsOpenSpy = jest.spyOn(menuFuncs, "open");
      menuFuncsOpenSpy.mockImplementation(() => undefined);
    });

    it("onClick implemntation", () => {
      const { renderCodePopupAnchor } = withGlobalJquery(() => require("../../popups/CodePopup"));
      const code = "test code";
      const title = "test";
      const popupAnchor = renderCodePopupAnchor(code, title);
      const result = mount(popupAnchor);
      result.simulate("click");
      expect(menuFuncsOpenSpy).toHaveBeenCalledWith("/dtale/code-popup", null, 450, 700);
      expect(window.code_popup).toEqual({ code, title });
    });
  });
});
