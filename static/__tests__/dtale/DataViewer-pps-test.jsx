import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import PPSDetails from "../../popups/pps/PPSDetails";
import mockPopsicle from "../MockPopsicle";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

describe("DataViewer tests", () => {
  const { opener } = window;
  let result, PredictivePowerScore;
  let testIdx = 0;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1105,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 1340,
    });

    delete window.opener;
    window.opener = { location: { reload: jest.fn() } };

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/scatter/0")) {
          return {
            error: "scatter error",
            traceback: "scatter error traceback",
          };
        }
        return urlFetcher(url);
      })
    );

    jest.mock("popsicle", () => mockBuildLibs);
    PredictivePowerScore = require("../../popups/pps/PredictivePowerScore").PredictivePowerScore;
  });

  beforeEach(async () => {
    buildInnerHTML({ settings: "" });
    const props = { dataId: "" + testIdx++, chartData: { visible: true } };
    result = mount(<PredictivePowerScore {...props} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
    const ppsGrid = result.find(PredictivePowerScore).first().find("div.ReactVirtualized__Grid__innerScrollContainer");
    ppsGrid.find("div.cell").at(1).simulate("click");
    await tickUpdate(result);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
    window.opener = opener;
  });

  it("DataViewer: predictive power score", async () => {
    const details = result.find(PPSDetails);
    expect(details.prop("ppsInfo")).toEqual(expect.objectContaining({ x: "col1", y: "col2" }));
  });
});
