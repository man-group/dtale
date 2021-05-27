import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import PPSDetails from "../../popups/pps/PPSDetails";
import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

describe("DataViewer tests", () => {
  let result, PredictivePowerScore, CorrelationsGrid;
  let testIdx = 0;
  const { opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 1340,
  });

  beforeAll(() => {
    dimensions.beforeAll();
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
    PredictivePowerScore = require("../../popups/pps/PredictivePowerScore").default;
    CorrelationsGrid = require("../../popups/correlations/CorrelationsGrid").default;
  });

  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    const props = { dataId: "" + testIdx++, chartData: { visible: true } };
    result = mount(
      <Provider store={store}>
        <PredictivePowerScore {...props} />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tickUpdate(result);
    const ppsGrid = result.find(PredictivePowerScore).first().find("div.ReactVirtualized__Grid__innerScrollContainer");
    ppsGrid.find("div.cell").at(1).simulate("click");
    await tickUpdate(result);
  });

  afterAll(() => {
    dimensions.afterAll();
    window.opener = opener;
  });

  it("DataViewer: predictive power score", async () => {
    const details = result.find(PPSDetails);
    expect(details.prop("ppsInfo")).toEqual(expect.objectContaining({ x: "col1", y: "col2" }));
  });

  it("handles encode strings", async () => {
    result.find(PredictivePowerScore).setState({ strings: ["foo"] });
    result.find(CorrelationsGrid).props().toggleStrings();
    await tickUpdate(result);
    expect(result.find(PredictivePowerScore).state().encodeStrings).toBe(true);
  });
});
