/* eslint max-lines: "off" */
import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import { BouncerWrapper } from "../../../BouncerWrapper";
import { RemovableError } from "../../../RemovableError";
import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("DataViewer tests", () => {
  const { location, open, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 800,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });
  let result, Duplicates, Columns, ColumnNames, Rows, ShowDuplicates;

  beforeAll(() => {
    dimensions.beforeAll();
    delete window.location;
    delete window.open;
    delete window.opener;
    window.location = {
      href: "http://localhost:8080/dtale/main/1",
      reload: jest.fn(),
      pathname: "/dtale/column/1",
      assign: jest.fn(),
    };
    window.open = jest.fn();
    window.opener = { code_popup: { code: "test code", title: "Test" } };

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/duplicates")) {
          const urlParams = qs.parse(url.split("?")[1]);
          if (urlParams.action === "test") {
            const cfg = JSON.parse(urlParams.cfg);
            if (urlParams.type === "show") {
              if (_.head(cfg.group) === "foo") {
                return { results: {} };
              } else if (_.size(cfg.group) === 0) {
                return { error: "Failure" };
              }
              return {
                results: {
                  "a, b": { count: 3, filter: ["a", "b"] },
                },
              };
            }
            if (cfg.keep === "first") {
              if (urlParams.type === "rows") {
                return { results: 3 };
              }
              return { results: { Foo: ["foo"] } };
            } else if (cfg.keep == "last") {
              if (urlParams.type === "rows") {
                return { results: 0 };
              }
              return { results: {} };
            } else {
              return { error: "Failure" };
            }
          } else {
            return { data_id: 1 };
          }
        }
        return urlFetcher(url);
      })
    );
    mockChartJS();
    jest.mock("popsicle", () => mockBuildLibs);

    Duplicates = require("../../../popups/duplicates/Duplicates").ReactDuplicates;
    Columns = require("../../../popups/duplicates/Columns").Columns;
    ColumnNames = require("../../../popups/duplicates/ColumnNames").ColumnNames;
    Rows = require("../../../popups/duplicates/Rows").Rows;
    ShowDuplicates = require("../../../popups/duplicates/ShowDuplicates").ShowDuplicates;
  });

  beforeEach(async () => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tick();
    clickMainMenuButton(result, "Duplicates");
    await tickUpdate(result);
  });

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.open = open;
    window.opener = opener;
  });

  it("DataViewer: duplicate columns", async () => {
    result.find(Duplicates).find("div.modal-body").find("button").first().simulate("click");
    expect(result.find(Columns).length).toBe(1);
    const columnsComp = result.find(Columns).first();
    const columnsInputs = columnsComp.find(Select);
    columnsInputs.first().props().onChange({ value: "first" });
    columnsComp.find("button").last().simulate("click");
    await tickUpdate(result);
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(window.location.assign).toBeCalledWith("http://localhost:8080/dtale/main/1");
  });

  it("DataViewer: no duplicate columns", async () => {
    result.find(Duplicates).find("div.modal-body").find("button").first().simulate("click");
    expect(result.find(Columns).length).toBe(1);
    const columnsComp = result.find(Columns).first();
    const columnsInputs = columnsComp.find(Select);
    columnsInputs.first().props().onChange({ value: "last" });
    columnsComp.find("button").last().simulate("click");
    await tickUpdate(result);
    expect(result.find(Columns).find(BouncerWrapper).last().text()).toBe("No duplicate columns exist.");
  });

  it("DataViewer: columns error", async () => {
    result.find(Duplicates).find("div.modal-body").find("button").first().simulate("click");
    expect(result.find(Columns).length).toBe(1);
    const columnsComp = result.find(Columns).first();
    const columnsInputs = columnsComp.find(Select);
    columnsInputs.first().props().onChange({ value: "none" });
    columnsComp.find("button").last().simulate("click");
    await tickUpdate(result);
    expect(result.find(Columns).find(RemovableError)).toHaveLength(1);
  });

  it("DataViewer: duplicate column names", async () => {
    result.find(Duplicates).find("div.modal-body").find("button").at(1).simulate("click");
    expect(result.find(ColumnNames).length).toBe(1);
    const columnNamesComp = result.find(ColumnNames).first();
    const columnNamesInputs = columnNamesComp.find(Select);
    columnNamesInputs.first().props().onChange({ value: "first" });
    columnNamesComp.find("button").last().simulate("click");
    await tickUpdate(result);
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(window.location.assign).toBeCalledWith("http://localhost:8080/dtale/main/1");
  });

  it("DataViewer: no duplicate column names", async () => {
    result.find(Duplicates).find("div.modal-body").find("button").at(1).simulate("click");
    expect(result.find(ColumnNames).length).toBe(1);
    const columnNamesComp = result.find(ColumnNames).first();
    const columnNamesInputs = columnNamesComp.find(Select);
    columnNamesInputs.first().props().onChange({ value: "last" });
    columnNamesComp.find("button").last().simulate("click");
    await tickUpdate(result);
    expect(result.find(ColumnNames).find(BouncerWrapper).last().text()).toBe("No duplicate column names exist.");
  });

  it("DataViewer: column names error", async () => {
    result.find(Duplicates).find("div.modal-body").find("button").at(1).simulate("click");
    expect(result.find(ColumnNames).length).toBe(1);
    const columnNamesComp = result.find(ColumnNames).first();
    const columnNamesInputs = columnNamesComp.find(Select);
    columnNamesInputs.first().props().onChange({ value: "none" });
    columnNamesComp.find("button").last().simulate("click");
    await tickUpdate(result);
    expect(result.find(ColumnNames).find(RemovableError)).toHaveLength(1);
  });

  it("DataViewer: duplicate rows", async () => {
    result.find(Duplicates).find("div.modal-body").find("button").at(2).simulate("click");
    expect(result.find(Rows).length).toBe(1);
    const rowsComp = result.find(Rows).first();
    const rowsInputs = rowsComp.find(Select);
    rowsInputs.first().props().onChange({ value: "first" });
    rowsInputs
      .last()
      .props()
      .onChange([{ value: "foo" }, { value: "bar" }]);
    rowsComp.find("button").last().simulate("click");
    await tickUpdate(result);
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(window.location.assign).toBeCalledWith("http://localhost:8080/dtale/main/1");
  });

  it("DataViewer: no duplicate rows", async () => {
    result.find(Duplicates).find("div.modal-body").find("button").at(2).simulate("click");
    expect(result.find(Rows).length).toBe(1);
    const rowsComp = result.find(Rows).first();
    const rowsInputs = rowsComp.find(Select);
    rowsInputs.first().props().onChange({ value: "last" });
    rowsInputs
      .last()
      .props()
      .onChange([{ value: "foo" }, { value: "bar" }]);
    rowsComp.find("button").last().simulate("click");
    await tickUpdate(result);
    expect(result.find(Rows).find(BouncerWrapper).last().text()).toBe(
      "No duplicate rows exist for the column(s): foo, bar"
    );
  });

  it("DataViewer: rows error", async () => {
    result.find(Duplicates).find("div.modal-body").find("button").at(2).simulate("click");
    expect(result.find(Rows).length).toBe(1);
    const rowsComp = result.find(Rows).first();
    const rowsInputs = rowsComp.find(Select);
    rowsInputs.first().props().onChange({ value: "none" });
    rowsComp.find("button").last().simulate("click");
    await tickUpdate(result);
    expect(result.find(Rows).find(RemovableError)).toHaveLength(1);
  });

  it("DataViewer: show duplicates", async () => {
    result.find(Duplicates).find("div.modal-body").find("button").at(3).simulate("click");
    expect(result.find(ShowDuplicates).length).toBe(1);
    const showComp = result.find(ShowDuplicates).first();
    const showInputs = showComp.find(Select);
    showInputs
      .first()
      .props()
      .onChange([{ value: "bar" }]);
    showComp.find("button").last().simulate("click");
    await tickUpdate(result);
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(window.location.assign).toBeCalledWith("http://localhost:8080/dtale/main/1");
  });

  it("DataViewer: no show duplicates", async () => {
    result.find(Duplicates).find("div.modal-body").find("button").at(3).simulate("click");
    expect(result.find(ShowDuplicates).length).toBe(1);
    const showComp = result.find(ShowDuplicates).first();
    const showInputs = showComp.find(Select);
    showInputs
      .first()
      .props()
      .onChange([{ value: "foo" }]);
    showComp.find("button").last().simulate("click");
    await tickUpdate(result);
    expect(result.find(ShowDuplicates).find(BouncerWrapper).last().text()).toBe(
      "No duplicates exist in any of the (foo) groups"
    );
  });

  it("DataViewer: show duplicates error", async () => {
    result.find(Duplicates).find("div.modal-body").find("button").at(3).simulate("click");
    expect(result.find(ShowDuplicates).length).toBe(1);
    const showComp = result.find(ShowDuplicates).first();
    showComp.find("button").last().simulate("click");
    const showInputs = showComp.find(Select);
    showInputs
      .first()
      .props()
      .onChange([{ value: "baz" }]);
    await tickUpdate(result);
    expect(result.find(ShowDuplicates).find(RemovableError)).toHaveLength(1);
  });
});
