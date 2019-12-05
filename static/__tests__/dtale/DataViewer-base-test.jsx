import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { ModalClose } from "react-modal-bootstrap";
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

  test("DataViewer: base operations (column selection, locking, sorting, moving to front, histograms,...", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const Histogram = require("../../popups/Histogram").ReactHistogram;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" });
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
          ["Iframe-Mode", "Shutdown"]
        ),
        "Should render default menu options"
      );

      result
        .find(".main-grid div.headerCell div")
        .last()
        .simulate("click");
      result.update();
      t.equal(result.find(".main-grid div.headerCell.selected").length, 1, "should select col4");
      result
        .find(".main-grid div.headerCell div")
        .last()
        .simulate("click");
      result.update();
      t.equal(result.find(".main-grid div.headerCell.selected").length, 0, "should clear selection");
      result
        .find(".main-grid div.headerCell div")
        .last()
        .simulate("click");
      result.update();

      t.deepEqual(
        result
          .find(DataViewerMenu)
          .find("ul li span.font-weight-bold")
          .map(s => s.text()),
        _.concat(
          ["Describe", "Move To Front", "Lock", "Sort Ascending", "Sort Descending", "Clear Sort", "Filter", "Formats"],
          ["Histogram", "Correlations", "Coverage", "Resize", "Heat Map", "Instances 1", "About", "Iframe-Mode"],
          ["Shutdown"]
        ),
        "Should render menu options associated with selected column"
      );

      clickMainMenuButton(result, "Sort Descending");
      t.equal(
        result
          .find("div.row div.col-md-4")
          .first()
          .text(),
        "Selected:col4",
        "should display selected column"
      );
      t.equal(
        result
          .find("div.row div.col-md-4")
          .at(1)
          .text(),
        "Sort:col4 (DESC)",
        "should display column sort"
      );
      setTimeout(() => {
        result.update();
        result
          .find(".main-grid div.headerCell div")
          .at(2)
          .simulate("click");
        result.update();
        t.equal(
          result
            .find("div.row div.col-md-4")
            .first()
            .text(),
          "Selected:col4, col3",
          "should display selected columns"
        );

        // deselect
        result
          .find("div.row i.ico-cancel")
          .first()
          .simulate("click");
        result.update();
        result
          .find(".main-grid div.headerCell div")
          .last()
          .simulate("click");
        result.update();

        // move to front
        clickMainMenuButton(result, "Move To Front");
        result.update();
        t.deepEqual(
          result.find(".main-grid div.headerCell").map(hc => hc.text()),
          ["▲col4", "col1", "col2", "col3"],
          "should move col4 to front of main grid"
        );

        // lock
        clickMainMenuButton(result, "Lock");
        result.update();
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
        clickMainMenuButton(result, "Unlock");
        result.update();
        t.deepEqual(
          result
            .find("div.TopRightGrid_ScrollWrapper")
            .first()
            .find("div.headerCell")
            .map(hc => hc.text()),
          ["▲col4", "col1", "col2", "col3"],
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
          clickMainMenuButton(result, "Histogram");
          setTimeout(() => {
            result.update();
            t.equal(result.find(Histogram).length, 1, "should show histogram");
            setTimeout(() => {
              result.update();
              result
                .find(ModalClose)
                .first()
                .simulate("click");
              t.equal(result.find(Histogram).length, 0, "should hide histogram");
              clickMainMenuButton(result, "Resize");
              clickMainMenuButton(result, "Iframe-Mode", "a");
              clickMainMenuButton(result, "Shutdown", "a");
              done();
            }, 400);
          }, 400);
        }, 400);
      }, 400);
    }, 600);
  });
});
