import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../RemovableError";
import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../test-utils";

describe("DataViewer tests", () => {
  let result, Correlations, ChartsBody;
  let testIdx = 0;
  const { opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1105,
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
    mockChartJS();
    jest.mock("popsicle", () => mockBuildLibs);

    Correlations = require("../../popups/Correlations").Correlations;
    ChartsBody = require("../../popups/charts/ChartsBody").default;
  });

  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    const props = { dataId: "" + testIdx++, chartData: { visible: true } };
    result = mount(
      <Provider store={store}>
        <Correlations {...props} />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tickUpdate(result);
    const corrGrid = result.find(Correlations).first().find("div.ReactVirtualized__Grid__innerScrollContainer");
    corrGrid.find("div.cell").at(1).simulate("click");
    await tickUpdate(result);
  });

  afterAll(() => {
    dimensions.afterAll();
    window.opener = opener;
  });

  it("DataViewer: correlations scatter error", async () => {
    expect(result.find(ChartsBody).length).toBe(1);
    const tsChart = result.find(ChartsBody).instance().state.charts[0];
    tsChart.cfg.options.onClick({});
    await tickUpdate(result);
    expect(result.find(RemovableError).length).toBe(1);
  });

  it("DataViewer: correlations", async () => {
    Object.defineProperty(global.document, "queryCommandSupported", {
      value: () => true,
    });
    Object.defineProperty(global.document, "execCommand", { value: _.noop });
    expect(result.find(ChartsBody).length).toBe(1);
    const tsChart = result.find(ChartsBody).instance().state.charts[0];
    const layoutObj = {
      chart: tsChart,
      scales: {
        "y-corr": {
          getPixelForValue: px => px,
        },
      },
      data: tsChart.data,
    };
    layoutObj.chart.ctx.createLinearGradient = (_px1, _px2, _px3, _px4) => ({
      addColorStop: (_px5, _px6) => null,
    });
    tsChart.cfg.plugins[0].afterLayout(layoutObj);
    tsChart.cfg.options.onClick({});
    const ticks = { ticks: [0, 0] };
    tsChart.cfg.options.scales.yAxes[0].afterTickToLabelConversion(ticks);
    expect(ticks.ticks).toEqual([null, null]);
    await tickUpdate(result);
    expect(result.find(Correlations).instance().state.chart !== null).toBe(true);
    result.find(Correlations).instance().state.chart.cfg.options.onClick({});
    await tickUpdate(result);
    expect(window.opener.location.reload).toHaveBeenCalled();
  });
});
