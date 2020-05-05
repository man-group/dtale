import { mount } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { JSAnchor } from "../JSAnchor";

describe("JSAnchor tests", () => {
  it("JSAnchor click test", () => {
    const clicks = [];
    const result = mount(
      <JSAnchor onClick={() => clicks.push(1)}>
        <span>Hello</span>
      </JSAnchor>
    );
    result.render();
    result.find("a").simulate("click");
    expect(clicks.length).toBe(1);
  });

  it("JSAnchor no-click test", () => {
    const result = mount(
      <JSAnchor>
        <span>Hello</span>
      </JSAnchor>
    );
    result.render();
    result.find("a").simulate("click");
  });
});
