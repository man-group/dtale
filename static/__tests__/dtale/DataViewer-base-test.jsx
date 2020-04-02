import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { DataViewerMenu } from "../../dtale/DataViewerMenu";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

const COL_PROPS = [
  {
    locked: true,
    width: 70,
    name: "dtale_index",
    dtype: "int64",
    visible: true,
  },
  { locked: false, width: 20, name: "col1", dtype: "int64", visible: true },
  {
    locked: false,
    width: 20,
    name: "col2",
    dtype: "float64",
    visible: true,
    min: 2.5,
    max: 5.5,
  },
  { locked: false, width: 20, name: "col3", dtype: "object", visible: true },
  {
    locked: false,
    width: 20,
    name: "col4",
    dtype: "datetime64[ns]",
    visible: true,
  },
];

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

  test("DataViewer: base operations (column selection, locking, sorting, moving to front, col-analysis,...", done => {
    const { DataViewer } = require("../../dtale/DataViewer");

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
      const grid = result
        .find(MultiGrid)
        .first()
        .instance();
      t.deepEqual(
        result.find(".main-grid div.headerCell").map(hc => hc.text()),
        ["col1", "col2", "col3", "col4"],
        "should render column headers"
      );
      t.deepEqual(grid.props.columns, COL_PROPS, "should properly size/lock columns");
      result
        .find("div.crossed")
        .first()
        .find("div.grid-menu")
        .first()
        .simulate("click");
      t.deepEqual(
        result
          .find(DataViewerMenu)
          .find("ul li span.font-weight-bold")
          .map(s => s.text()),
        _.concat(
          ["Describe", "Custom Filter", "Build Column", "Summarize Data", "Correlations", "Charts", "Heat Map"],
          ["Highlight Dtypes", "Instances 1", "Code Export", "Export", "Refresh Widths", "About", "Shutdown"]
        ),
        "Should render default menu options"
      );
      setTimeout(() => {
        clickMainMenuButton(result, "Refresh Widths");
        clickMainMenuButton(result, "Shutdown", "a");
        done();
      }, 400);
    }, 600);
  });
});
