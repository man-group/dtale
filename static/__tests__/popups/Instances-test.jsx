import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../DimensionsHelper";
import { MockComponent } from "../MockComponent";
import mockPopsicle from "../MockPopsicle";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

describe("Instances tests", () => {
  let Instances, assignSpy;
  const { location } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    jest.mock("../../popups/merge/DataPreview", () => MockComponent);
    dimensions.beforeAll();

    delete window.location;
    window.location = {
      href: "http://localhost:8080",
      hostname: "localhost",
      port: "8080",
      origin: "http://localhost:8080",
      assign: _.noop,
    };
    assignSpy = jest.spyOn(window.location, "assign");

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
    Instances = require("../../popups/instances/Instances").default;
  });

  beforeEach(buildInnerHTML);

  afterAll(() => {
    dimensions.afterAll();
    assignSpy.mockRestore();
    window.location = location;
  });

  it("Instances rendering data", async () => {
    const result = mount(<Instances dataId="8080" />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
    result.find("button.preview-btn").last().simulate("click");
    await tickUpdate(result);
    expect(result.find("h4.preview-header").first().text()).toBe("8083 (2018-04-30 12:36:44)Preview");
    result.find("button.preview-btn").first().simulate("click");
    await tickUpdate(result);
    expect(result.find("h4.preview-header").first().text()).toBe("8081 - foo (2018-04-30 12:36:44)Preview");
    expect(result.find(MockComponent)).toHaveLength(1);
    result.find("div.clickable").last().simulate("click");
    expect(assignSpy).toHaveBeenCalledWith("http://localhost:8080/dtale/main/8083");
    result.find(".ico-delete").first().simulate("click");
    await tickUpdate(result);
  });

  it("Instances rendering error", async () => {
    const result = mount(<Instances dataId="8082" />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
    result.setState({ processes: { error: "Error Test" } });
    result.update();
    expect(result.find("div.dtale-alert").first().text()).toBe("Error Test");
  });
});
