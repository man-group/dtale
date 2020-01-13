import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import chartsData from "./data/charts";
import * as t from "./jest-assertions";
import { withGlobalJquery } from "./test-utils";

describe("dash tests", () => {
  beforeAll(() => {
    const mockD3Cloud = withGlobalJquery(() => () => {
      const cloudCfg = {};
      const propUpdate = prop => val => {
        cloudCfg[prop] = val;
        return cloudCfg;
      };
      cloudCfg.size = propUpdate("size");
      cloudCfg.padding = propUpdate("padding");
      cloudCfg.words = propUpdate("words");
      cloudCfg.rotate = propUpdate("rotate");
      cloudCfg.spiral = propUpdate("spiral");
      cloudCfg.random = propUpdate("random");
      cloudCfg.text = propUpdate("text");
      cloudCfg.font = propUpdate("font");
      cloudCfg.fontStyle = propUpdate("fontStyle");
      cloudCfg.fontWeight = propUpdate("fontWeight");
      cloudCfg.fontSize = () => ({
        on: () => ({ start: _.noop }),
      });
      return cloudCfg;
    });

    jest.mock("d3-cloud", () => mockD3Cloud);
  });

  test("dash rendering", done => {
    const ReactWordcloud = require("react-wordcloud").default;
    const { Wordcloud } = require("../dash/lib/index");
    const result = mount(<Wordcloud id="wc-test" data={chartsData} y={["col1"]} />);
    t.ok(result.find(ReactWordcloud).length == 1, "should generate wordcloud");
    done();
  });
});
