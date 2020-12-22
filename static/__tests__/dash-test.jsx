import { mount } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import chartsData from "./data/charts";

describe("dash tests", () => {
  beforeAll(() => {
    jest.mock("react-wordcloud", () => {
      const MockComponent = require("./MockComponent").MockComponent;
      return MockComponent;
    });
  });

  it("dash rendering", () => {
    const { Wordcloud } = require("../dash/lib/index");
    const result = mount(<Wordcloud id="wc-test" data={chartsData} y={["col1"]} />);
    expect(result.find("MockComponent").length).toBe(1);
  });
});
