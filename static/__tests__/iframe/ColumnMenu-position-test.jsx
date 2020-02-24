import { mount } from "enzyme";
import React from "react";

import { positionMenu } from "../../dtale/iframe/ColumnMenu";
import * as t from "../jest-assertions";
import { buildInnerHTML } from "../test-utils";

const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");

describe("ColumnMenu position tests", () => {
  beforeAll(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 100,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
  });

  test("ColumnMenu: calculations for menus on edge of browser window...", done => {
    buildInnerHTML({ settings: "" });
    mount(<span>Hello</span>, { attachTo: document.getElementById("content") });
    const menuDiv = { width: () => 20 };
    menuDiv.css = props => (menuDiv.currCss = props);
    positionMenu({ offset: () => ({ left: 90 }) }, menuDiv);
    t.equal(menuDiv.currCss.left, 60);
    positionMenu({ offset: () => ({ left: 10 }) }, menuDiv);
    t.equal(menuDiv.currCss.left, 10);
    positionMenu({ offset: () => ({ left: 15 }) }, menuDiv);
    t.equal(menuDiv.currCss.left, 15);
    done();
  });
});
