/* eslint max-lines: "off" */
/* eslint max-statements: "off" */
import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, findMainMenuButton, withGlobalJquery } from "../test-utils";
import { clickColMenuButton, clickColMenuSubButton } from "./iframe-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

const COL_PROPS = _.map(reduxUtils.DATA.columns, (c, i) => _.assignIn({ width: i == 0 ? 70 : 20, locked: i == 0 }, c));

class MockDateInput extends React.Component {
  render() {
    return null;
  }
}
MockDateInput.displayName = "DateInput";

describe("DataViewer iframe tests", () => {
  const { location, open, top, self } = window;

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
    delete window.top;
    delete window.self;
    window.location = { reload: jest.fn() };
    window.open = jest.fn();
    window.top = { location: { href: "http://test.com" } };
    window.self = { location: { href: "http://test/dtale/iframe" } };

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
    jest.mock("@blueprintjs/datetime", () => ({ DateInput: MockDateInput }));
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    window.location = location;
    window.open = open;
    window.top = top;
    window.self = self;
  });

  test("DataViewer: base operations (column selection, locking, sorting, moving to front, col-analysis,...", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const ColumnMenu = require("../../dtale/iframe/ColumnMenu").ReactColumnMenu;
    const Header = require("../../dtale/Header").ReactHeader;
    const Formatting = require("../../popups/formats/Formatting").default;
    const DataViewerMenu = require("../../dtale/DataViewerMenu").DataViewerMenu;

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
          ["Describe", "Custom Filter", "Build Column", "Summarize Data", "Correlations", "Charts", "Heat Map"],
          ["Highlight Dtypes", "Instances 1", "Code Export", "Export", "Refresh Widths", "About", "Reload Data"],
          ["Open Popup", "Shutdown"]
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
        'Column "col4"',
        "should show col4 menu"
      );
      t.deepEqual(
        colMenu.find("ul li span.font-weight-bold").map(s => s.text()),
        ["Lock", "Hide", "Delete", "Describe", "Column Analysis", "Formats"],
        "Should render column menu options"
      );
      clickColMenuSubButton(result, "Asc");
      t.equal(
        result
          .find("div.row div.col")
          .first()
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
          'Column "col3"',
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
        clickColMenuSubButton(result, "fa-step-backward", 1);
        t.deepEqual(
          result.find(".main-grid div.headerCell").map(hc => hc.text()),
          ["▲col4", "col1", "col2", "col3"],
          "should move col4 to front of main grid"
        );
        result
          .find(".main-grid div.headerCell div")
          .last()
          .simulate("click");
        result.update();
        clickColMenuSubButton(result, "fa-caret-left", 1);
        t.deepEqual(
          result.find(".main-grid div.headerCell").map(hc => hc.text()),
          ["▲col4", "col1", "col3", "col2"],
          "should move col4 to front of main grid"
        );
        result
          .find(".main-grid div.headerCell div")
          .at(2)
          .simulate("click");
        result.update();
        clickColMenuSubButton(result, "fa-caret-right", 1);
        t.deepEqual(
          result.find(".main-grid div.headerCell").map(hc => hc.text()),
          ["▲col4", "col1", "col2", "col3"],
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
          result
            .find(".main-grid div.headerCell div")
            .at(2)
            .simulate("click");
          clickColMenuButton(result, "Column Analysis");
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe(
            "/dtale/popup/column-analysis/1?selectedCol=col2"
          );
          clickColMenuButton(result, "Describe");
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe(
            "/dtale/popup/describe/1?selectedCol=col2"
          );
          clickMainMenuButton(result, "Describe");
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/dtale/popup/describe/1");
          clickMainMenuButton(result, "Correlations");
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/dtale/popup/correlations/1");
          clickMainMenuButton(result, "Charts");
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/charts/1");
          clickMainMenuButton(result, "Instances 1");
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("/dtale/popup/instances/1");
          const exports = findMainMenuButton(result, "CSV", "div.btn-group");
          exports
            .find("button")
            .first()
            .simulate("click");
          let exportURL = window.open.mock.calls[window.open.mock.calls.length - 1][0];
          t.ok(_.startsWith(exportURL, "/dtale/data-export/1") && _.includes(exportURL, "tsv=false"));
          exports
            .find("button")
            .last()
            .simulate("click");
          exportURL = window.open.mock.calls[window.open.mock.calls.length - 1][0];
          t.ok(_.startsWith(exportURL, "/dtale/data-export/1") && _.includes(exportURL, "tsv=true"));
          clickMainMenuButton(result, "Refresh Widths");
          clickMainMenuButton(result, "Reload Data");
          expect(window.location.reload).toHaveBeenCalled();
          clickMainMenuButton(result, "Shutdown", "a");
          clickColMenuButton(result, "Formats");
          t.equal(result.find(Formatting).length, 1, "should show Formats");
          done();
        }, 400);
      }, 400);
    }, 600);
  });
});
