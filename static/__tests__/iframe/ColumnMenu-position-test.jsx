import { mount } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { positionMenu } from "../../dtale/column/ColumnMenu";
import { buildInnerHTML } from "../test-utils";

describe("ColumnMenu position tests", () => {
  beforeAll(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 100,
    });
  });

  it("ColumnMenu: calculations for menus on edge of browser window...", () => {
    buildInnerHTML({ settings: "" });
    mount(<span>Hello</span>, { attachTo: document.getElementById("content") });
    const menuDiv = { width: () => 20 };
    menuDiv.css = props => (menuDiv.currCss = props);
    positionMenu({ offset: () => ({ left: 90 }) }, menuDiv);
    expect(menuDiv.currCss.left).toBe(60);
    positionMenu({ offset: () => ({ left: 10 }) }, menuDiv);
    expect(menuDiv.currCss.left).toBe(10);
    positionMenu({ offset: () => ({ left: 15 }) }, menuDiv);
    expect(menuDiv.currCss.left).toBe(15);
  });
});
