import { mount } from "enzyme";
import React from "react";

import { JSAnchor } from "../JSAnchor";
import * as t from "./jest-assertions";

describe("JSAnchor tests", () => {
  test("JSAnchor click test", done => {
    const clicks = [];
    const result = mount(
      <JSAnchor onClick={() => clicks.push(1)}>
        <span>Hello</span>
      </JSAnchor>
    );
    result.render();
    result.find("a").simulate("click");
    t.ok(clicks.length == 1, "should activate click function");
    done();
  });

  test("JSAnchor no-click test", done => {
    const result = mount(
      <JSAnchor>
        <span>Hello</span>
      </JSAnchor>
    );
    result.render();
    result.find("a").simulate("click");
    done();
  });
});
