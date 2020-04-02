import { mount } from "enzyme";
import React from "react";
import { ModalClose } from "react-modal-bootstrap";
import { Provider } from "react-redux";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

describe("DataViewer tests", () => {
  const { open } = window;

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
      value: 1205,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 775,
    });
    delete window.open;
    window.open = jest.fn();

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = {
        ctx,
        cfg,
        data: cfg.data,
        destroyed: false,
      };
      chartCfg.destroy = function destroy() {
        chartCfg.destroyed = true;
      };
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
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
    window.open = open;
  });

  test("DataViewer: filtering", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const Filter = require("../../popups/Filter").ReactFilter;

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
      clickMainMenuButton(result, "Custom Filter");
      result.update();
      setTimeout(() => {
        result.update();
        t.equal(result.find(Filter).length, 1, "should open filter");
        result
          .find(ModalClose)
          .first()
          .simulate("click");
        result.update();
        t.notOk(result.find(Filter).length, "should close filter");
        clickMainMenuButton(result, "Custom Filter");
        setTimeout(() => {
          result.update();
          result
            .find(Filter)
            .first()
            .find("div.modal-footer")
            .first()
            .find("button")
            .at(1)
            .simulate("click");
          setTimeout(() => {
            result.update();
            t.notOk(result.find(Filter).length, "should close filter");
            clickMainMenuButton(result, "Custom Filter");
            result.update();
            result
              .find(Filter)
              .first()
              .find("textarea")
              .simulate("change", { target: { value: "test" } });
            result.update();
            result
              .find(Filter)
              .first()
              .find("button")
              .last()
              .simulate("click");
            setTimeout(() => {
              result.update();
              t.equal(
                result
                  .find("div.row div.col-auto")
                  .first()
                  .text(),
                "Filter:foo == 1",
                "should display filter"
              );
              result
                .find("div.row div.col-auto")
                .first()
                .find("i.ico-cancel")
                .last()
                .simulate("click");
              setTimeout(() => {
                result.update();
                t.equal(result.find("div.row").length, 0, "should clear filter and hide info row");
                done();
              }, 400);
            }, 400);
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  });

  test("DataViewer: filtering with errors & documentation", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const Filter = require("../../popups/Filter").ReactFilter;

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
      clickMainMenuButton(result, "Custom Filter");
      setTimeout(() => {
        result.update();
        result
          .find(Filter)
          .first()
          .find("textarea")
          .simulate("change", { target: { value: "error" } });
        result.update();
        result
          .find(Filter)
          .first()
          .find("button")
          .last()
          .simulate("click");
        setTimeout(() => {
          result.update();
          t.equal(
            result
              .find(RemovableError)
              .find("div.dtale-alert")
              .text(),
            "No data found",
            "should display error"
          );
          result
            .find(Filter)
            .find(RemovableError)
            .first()
            .instance()
            .props.onRemove();
          result.update();
          t.equal(result.find(Filter).find("div.dtale-alert").length, 0, "should hide error");
          result
            .find(Filter)
            .find("div.modal-footer")
            .find("button")
            .first()
            .simulate("click");
          const pandasURL = "https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#indexing-query";
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe(pandasURL);
          done();
        }, 400);
      }, 400);
    }, 400);
  });

  test("DataViewer: filtering, context variables error", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const Filter = require("../../popups/Filter").ReactFilter;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "", dataId: "error" }, store);
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
      clickMainMenuButton(result, "Custom Filter");
      setTimeout(() => {
        result.update();
        t.equal(
          result
            .find(Filter)
            .find(RemovableError)
            .find("div.dtale-alert")
            .text(),
          "Error loading context variables",
          "should display error"
        );
        done();
      }, 400);
    }, 400);
  });

  test("DataViewer: column filters", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const Filter = require("../../popups/Filter").ReactFilter;

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
      clickMainMenuButton(result, "Custom Filter");
      setTimeout(() => {
        result.update();
        const mainCol = result.find(Filter).find("div.col-md-12.h-100");
        t.equal(mainCol.text(), "Active Column Filters:foo == 1 andCustom Filter:foo == 1");
        mainCol
          .find("i.ico-cancel")
          .first()
          .simulate("click");
        setTimeout(() => {
          t.equal(
            result
              .find(Filter)
              .find("div.col-md-12.h-100")
              .text(),
            "Custom Filter:foo == 1"
          );
          done();
        }, 400);
      }, 400);
    }, 400);
  });
});
