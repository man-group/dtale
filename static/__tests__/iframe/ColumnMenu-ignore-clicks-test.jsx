import { mount } from "enzyme";
import $ from "jquery";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

describe("ColumnMenu ignoreClicks tests", () => {
  const dimensions = new DimensionsHelper({ innerWidth: 100 });
  beforeAll(() => {
    dimensions.beforeAll();
    const mockJquery = withGlobalJquery(() => selector => {
      if (selector === "div.column-filter") {
        return {
          is: t => t.id === "pass",
          has: t => (t.id === "pass" ? [0] : {}),
        };
      }
      if (_.includes(["pass", "pass2"], _.get(selector, "id"))) {
        return { hasClass: () => true };
      }
      if (_.includes(["fail", "fail2", "fail3", "pass3"], _.get(selector, "id"))) {
        return { hasClass: () => false };
      }
      return $(selector);
    });

    jest.mock("jquery", () => mockJquery);
  });

  afterAll(dimensions.afterAll);

  it("ColumnMenu: make sure clicks in certain areas of the menu won't close it", () => {
    const { ignoreMenuClicks } = require("../../dtale/column/ColumnMenu");
    buildInnerHTML({ settings: "" });
    mount(<span>Hello</span>, { attachTo: document.getElementById("content") });
    expect(ignoreMenuClicks({ target: { id: "pass" } })).toBe(true);
    expect(ignoreMenuClicks({ target: { id: "fail" } })).toBe(false);
    expect(ignoreMenuClicks({ target: { id: "pass2" } })).toBe(true);
    expect(ignoreMenuClicks({ target: { id: "pass3", nodeName: "svg" } })).toBe(true);
    expect(ignoreMenuClicks({ target: { id: "fail3" } })).toBe(false);
  });
});
