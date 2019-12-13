import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("DataViewer tests", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
      return chartCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  test("DataViewer: base operations (column selection, locking, sorting, moving to front, histograms,...", done => {
    const { DataViewer, ReactDataViewer } = require("../../dtale/DataViewer");

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );

    setTimeout(() => {
      result.update();
      let dv = result.find(ReactDataViewer).instance();
      dv.getData(dv.state.ids, true);
      dv.getData(dv.state.ids, true);
      dv = result.find(ReactDataViewer).instance();
      t.deepEqual(
        _.pick(dv.state, ["loading", "loadQueue"]),
        { loading: true, loadQueue: [[0, 55]] },
        "should update state"
      );
      dv.getData(dv.state.ids, true);
      dv = result.find(ReactDataViewer).instance();
      t.deepEqual(
        _.pick(dv.state, ["loading", "loadQueue"]),
        {
          loading: true,
          loadQueue: [
            [0, 55],
            [0, 55],
          ],
        },
        "should update state"
      );
      setTimeout(() => {
        result.update();
        dv = result.find(ReactDataViewer).instance();
        t.deepEqual(
          _.pick(dv.state, ["loading", "loadQueue"]),
          { loading: false, loadQueue: [] },
          "should clear state"
        );
        dv.getData(dv.state.ids);
        dv.getData([0, 1, 2, 3]);
        dv = result.find(ReactDataViewer).instance();
        result.find(ReactDataViewer).setState({ query: "error", loadQueue: [], loading: false });
        result.update();
        dv = result.find(ReactDataViewer).instance();
        dv.getData(dv.state.ids, true);
        setTimeout(() => {
          result.update();
          t.equal(result.find(RemovableError).length, 1, "should display error");
          done();
        }, 400);
      }, 400);
    }, 600);
  });
});
