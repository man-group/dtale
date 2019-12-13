import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { DataViewerMenu } from "../../dtale/DataViewerMenu";
import { ReactColumnMenu as ColumnMenu } from "../../dtale/iframe/ColumnMenu";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, withGlobalJquery } from "../test-utils";
import { clickColMenuButton, clickColMenuSortButton } from "./iframe-utils";

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

describe("DataViewer iframe tests", () => {
  const { location, open } = window;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });

    delete window.location;
    delete window.open;
    window.location = { reload: jest.fn() };
    window.open = jest.fn();

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
    window.location = location;
    window.open = open;
  });

  test("DataViewer: base operations (column selection, locking, sorting, moving to front, histograms,...", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const Header = require("../../dtale/Header").ReactHeader;
    const Formatting = require("../../dtale/Formatting").default;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "", iframe: "True" }, store);
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
          ["Describe", "Filter", "Correlations", "Coverage", "Resize", "Heat Map", "Instances 1", "About"],
          ["Refresh", "Full-Mode", "Shutdown"]
        ),
        "Should render default menu options"
      );

      result
        .find(".main-grid div.headerCell div")
        .last()
        .simulate("click");
      t.equal(result.find("#column-menu-div").length, 1, "should show column menu");
      result
        .find(Header)
        .last()
        .instance()
        .props.hideColumnMenu("col4");
      result.update();
      t.equal(result.find("#column-menu-div").length, 0, "should hide column menu");
      result
        .find(".main-grid div.headerCell div")
        .last()
        .simulate("click");
      let colMenu = result.find(ColumnMenu).first();
      t.equal(
        colMenu
          .find("header")
          .first()
          .text(),
        "col4 Options",
        "should show col4 menu"
      );
      t.deepEqual(
        colMenu.find("ul li span.font-weight-bold").map(s => s.text()),
        ["Move To Front", "Lock", "Describe", "Histogram", "Formats"],
        "Should render column menu options"
      );
      clickColMenuSortButton(result, "Asc");
      t.equal(
        result
          .find("div.row div.col-md-4")
          .at(1)
          .text(),
        "Sort:col4 (ASC)",
        "should display column sort"
      );
      setTimeout(() => {
        result.update();
        result
          .find(".main-grid div.headerCell div")
          .at(2)
          .simulate("click");
        colMenu = result.find(ColumnMenu).first();
        t.equal(
          colMenu
            .find("header")
            .first()
            .text(),
          "col3 Options",
          "should show col3 menu"
        );
        result
          .find(Header)
          .at(2)
          .instance()
          .props.hideColumnMenu("col3");
        result
          .find(".main-grid div.headerCell div")
          .last()
          .simulate("click");
        result.update();
        clickColMenuButton(result, "Move To Front");
        t.deepEqual(
          result.find(".main-grid div.headerCell").map(hc => hc.text()),
          ["▼col4", "col1", "col2", "col3"],
          "should move col4 to front of main grid"
        );
        result
          .find(".main-grid div.headerCell div")
          .first()
          .simulate("click");
        result.update();
        // lock
        clickColMenuButton(result, "Lock");
        t.deepEqual(
          result
            .find("div.TopRightGrid_ScrollWrapper")
            .first()
            .find("div.headerCell")
            .map(hc => hc.text()),
          ["col1", "col2", "col3"],
          "should move col4 out of main grid"
        );

        //unlock
        result
          .find(".main-grid div.headerCell div")
          .first()
          .simulate("click");
        result.update();
        clickColMenuButton(result, "Unlock");
        result.update();
        t.deepEqual(
          result
            .find("div.TopRightGrid_ScrollWrapper")
            .first()
            .find("div.headerCell")
            .map(hc => hc.text()),
          ["▼col4", "col1", "col2", "col3"],
          "should move col4 back into main grid"
        );

        //clear sorts
        result
          .find("div.row i.ico-cancel")
          .first()
          .simulate("click");
        setTimeout(() => {
          result.update();
          t.equal(result.find("div.row").length, 0, "should remove information row");
          result
            .find(".main-grid div.headerCell div")
            .last()
            .simulate("click");
          result.update();
          clickColMenuButton(result, "Histogram");
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe(
            "/dtale/popup/histogram/1?col=col3"
          );
          clickColMenuButton(result, "Describe");
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/dtale/popup/describe/1?col=col3");
          clickMainMenuButton(result, "Describe");
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/dtale/popup/describe/1");
          clickMainMenuButton(result, "Correlations");
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/dtale/popup/correlations/1");
          clickMainMenuButton(result, "Coverage");
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/dtale/popup/coverage/1");
          clickMainMenuButton(result, "Instances 1");
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/dtale/popup/instances");
          clickMainMenuButton(result, "Resize");
          clickMainMenuButton(result, "Refresh");
          expect(window.location.reload).toHaveBeenCalled();
          clickMainMenuButton(result, "Full-Mode", "a");
          clickMainMenuButton(result, "Shutdown", "a");
          clickColMenuButton(result, "Formats");
          t.equal(result.find(Formatting).length, 1, "should show Formats");
          done();
        }, 400);
      }, 400);
    }, 600);
  });
});
