import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("Instances tests", () => {
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
        if (_.startsWith(url, "/dtale/data")) {
          const dataId = _.last(url.split("?")[0].split("/"));
          if (dataId == "8081") {
            return {
              results: [
                {
                  dtale_index: 0,
                  col1: 1,
                  col2: 2.5,
                  col3: "foo",
                  col4: "2000-01-01",
                  col5: 1,
                  col6: 2,
                },
                {
                  dtale_index: 1,
                  col1: 2,
                  col2: 3.5,
                  col3: "foo",
                  col4: "2000-01-01",
                  col5: 1,
                  col6: 2,
                },
                {
                  dtale_index: 2,
                  col1: 3,
                  col2: 4.5,
                  col3: "foo",
                  col4: "2000-01-01",
                  col5: 1,
                  col6: 2,
                },
                {
                  dtale_index: 3,
                  col1: 4,
                  col2: 5.5,
                  col3: "foo",
                  col5: 1,
                  col6: 2,
                },
                {
                  dtale_index: 4,
                  col1: 5,
                  col2: 6.5,
                  col3: "foo",
                  col4: "2000-01-01",
                  col5: 1,
                  col6: 2,
                },
                {
                  dtale_index: 5,
                  col1: 6,
                  col2: 7.5,
                  col3: "foo",
                  col4: "2000-01-01",
                  col5: 1,
                  col6: 2,
                },
              ],
              columns: [
                { name: "dtale_index", dtype: "int64" },
                { name: "col1", dtype: "int64" },
                { name: "col2", dtype: "float64" },
                { name: "col3", dtype: "object" },
                { name: "col4", dtype: "datetime64[ns]" },
                { name: "col5", dtype: "int64" },
                { name: "col6", dtype: "int64" },
              ],
              total: 6,
              success: true,
            };
          }
          if (dataId == "8082") {
            return { error: "No data found." };
          }
        }
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  test("Instances rendering data", done => {
    const Instances = require("../../popups/Instances").default;
    buildInnerHTML();
    const origWindow = global.window;
    global.window = Object.create(window);
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:8080",
        hostname: "localhost",
        port: "8080",
        origin: "http://localhost:8080",
        assign: _.noop,
      },
      writable: true,
    });
    const assignSpy = jest.spyOn(global.window.location, "assign");
    const result = mount(<Instances dataId="8080" />, {
      attachTo: document.getElementById("content"),
    });
    setTimeout(() => {
      result.update();
      result
        .find("button.preview-btn")
        .last()
        .simulate("click");
      setTimeout(() => {
        result.update();
        t.equal(
          result
            .find("h4.preview-header")
            .first()
            .text(),
          "2018-04-30 12:36:44Preview",
          "should render preview"
        );
        result
          .find("button.preview-btn")
          .first()
          .simulate("click");
        setTimeout(() => {
          result.update();
          t.equal(
            result
              .find("h4.preview-header")
              .first()
              .text(),
            "2018-04-30 12:36:44(foo)Preview",
            "should render preview"
          );
          t.equal(
            result
              .find("div.preview")
              .first()
              .find("div.ReactVirtualized__Table__row").length,
            6,
            "should render ... row"
          );
          t.equal(
            result
              .find("div.preview")
              .first()
              .find("div.ReactVirtualized__Table__row")
              .first()
              .find("div.cell").length,
            6,
            "should render ... column"
          );
          result
            .find("button.preview-btn")
            .at(1)
            .simulate("click");
          setTimeout(() => {
            result.update();
            t.equal(
              result
                .find("div.dtale-alert")
                .first()
                .text(),
              "No data found.",
              "should render error"
            );
            result
              .find("div.clickable")
              .last()
              .simulate("click");
            expect(assignSpy).toHaveBeenCalledWith("http://localhost:8080/dtale/main/8083");
            assignSpy.mockRestore();
            global.window = origWindow;
            result
              .find(".ico-delete")
              .first()
              .simulate("click");
            setTimeout(() => {
              result.update();
              done();
            }, 400);
          }, 200);
        }, 200);
      }, 200);
    }, 200);
  });

  test("Instances rendering error", done => {
    const Instances = require("../../popups/Instances").default;
    buildInnerHTML();
    const result = mount(<Instances dataId="8082" />, {
      attachTo: document.getElementById("content"),
    });
    setTimeout(() => {
      result.update();
      result.setState({ processes: { error: "Error Test" } });
      result.update();
      t.equal(
        result
          .find("div.dtale-alert")
          .first()
          .text(),
        "Error Test",
        "should render error"
      );
      done();
    }, 200);
  });
});
