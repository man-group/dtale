import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import { MockComponent } from "../../MockComponent";
import mockPopsicle from "../../MockPopsicle";
import correlationsData from "../../data/correlations";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../../test-utils";

const chartData = {
  visible: true,
  type: "correlations",
  title: "Correlations Test",
  query: "col == 3",
  col1: "col1",
  col2: "col3",
};

describe("Correlations tests", () => {
  let result, Correlations, ChartsBody, CorrelationsTsOptions, CorrelationsGrid;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    // Mock for redux purposes
    jest.mock("../../../dtale/side/SidePanelButtons", () => ({
      SidePanelButtons: MockComponent,
    }));
    dimensions.beforeAll();
    mockChartJS();
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/correlations/")) {
          const query = qs.parse(url.split("?")[1]).query;
          if (query == "null") {
            return { error: "No data found." };
          }
          if (query == "one-date") {
            return {
              data: correlationsData.data,
              dates: [{ name: "col4", rolling: false }],
            };
          }
          if (query == "no-date") {
            return { data: correlationsData.data, dates: [] };
          }
          if (query == "rolling") {
            return _.assignIn({ rolling: true }, correlationsData);
          }
        }
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);

    Correlations = require("../../../popups/Correlations").default;
    CorrelationsGrid = require("../../../popups/correlations/CorrelationsGrid").default;
    ChartsBody = require("../../../popups/charts/ChartsBody").default;
    CorrelationsTsOptions = require("../../../popups/correlations/CorrelationsTsOptions").default;
  });

  afterAll(dimensions.afterAll);

  const buildResult = async (props = chartData) => {
    buildInnerHTML({ settings: "" });
    const result = mount(<Correlations chartData={props} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
    return result;
  };

  it("Correlations rendering data", async () => {
    result = await buildResult();
    await tickUpdate(result);
    expect(result.find(ChartsBody).length).toBe(1);
    expect(
      result
        .find("select.custom-select")
        .first()
        .find("option")
        .map(o => o.text())
    ).toEqual(["col4", "col5"]);
    result
      .find("select.custom-select")
      .first()
      .simulate("change", { target: { value: "col5" } });
    await tickUpdate(result);
    expect(result.state().selectedDate).toBe("col5");
  });

  it("Correlations rendering data and filtering it", async () => {
    result = await buildResult();
    expect(result.find(ChartsBody).length).toBe(1);
  });

  it("Correlations rendering data w/ one date column", async () => {
    result = await buildResult(_.assign({}, chartData, { query: "one-date" }));
    await tickUpdate(result);
    result.update();
    expect(result.find(ChartsBody).length).toBe(1);
    expect(result.find("select.custom-select").length).toBe(0);
    expect(result.state().selectedDate).toBe("col4");
  });

  it("Correlations rendering data w/ no date columns", async () => {
    result = await buildResult(_.assign({}, chartData, { query: "no-date" }));
    await tickUpdate(result);
    expect(result.find("#rawScatterChart").length).toBe(1);
  });

  it("Correlations rendering rolling data", async () => {
    result = await buildResult(_.assign({}, chartData, { query: "rolling" }));
    await tickUpdate(result);
    expect(result.find(ChartsBody).length).toBe(1);
    expect(result.find("#rawScatterChart").length).toBe(1);
    expect(
      result
        .find("select.custom-select")
        .first()
        .find("option")
        .map(o => o.text())
    ).toEqual(["col4", "col5"]);
    result
      .find("select.custom-select")
      .first()
      .simulate("change", { target: { value: "col5" } });
    await tickUpdate(result);
    expect(result.state().selectedDate).toBe("col5");
    const windowInput = result
      .find(CorrelationsTsOptions)
      .find("input")
      .findWhere(i => i.prop("type") === "text")
      .first();
    windowInput.simulate("change", { target: { value: "" } });
    windowInput.simulate("keyPress", { key: "Shift" });
    windowInput.simulate("keyPress", { key: "Enter" });
    windowInput.simulate("change", { target: { value: "a" } });
    windowInput.simulate("keyPress", { key: "Enter" });
    windowInput.simulate("change", { target: { value: "5" } });
    windowInput.simulate("keyPress", { key: "Enter" });
    await tickUpdate(result);
  });

  it("Correlations w/ col1 pre-selected", async () => {
    result = await buildResult(_.omit(chartData, "col2"));
    expect(result.find(Correlations).instance().state.selectedCols).toEqual(["col1", "col2"]);
  });

  it("Correlations w/ col2 pre-selected", async () => {
    result = await buildResult(_.omit(chartData, "col1"));
    expect(result.find(Correlations).instance().state.selectedCols).toEqual(["col1", "col3"]);
  });

  it("Correlations w/ encoded strings", async () => {
    result.setState({ strings: ["col5"] });
    result.find(CorrelationsGrid).props().toggleStrings();
    expect(result.state().encodeStrings).toBe(true);
    await tickUpdate(result);
  });

  it("Handles grid height drag", () => {
    result.find(CorrelationsGrid).find("Draggable").props().onDrag(null, { deltaY: 100 });
    expect(result.find(CorrelationsGrid).state().height).toBe(400);
  });
});
