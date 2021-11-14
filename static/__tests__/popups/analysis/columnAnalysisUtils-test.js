import $ from "jquery";

import { withGlobalJquery } from "../../test-utils";
import chartUtils from "../../../chartUtils";
import * as fetcher from "../../../fetcher";

describe("columnAnalysisUtils", () => {
  let createChart, dataLoader, createChartSpy, fetchJsonSpy;

  beforeEach(() => {
    const mockJquery = withGlobalJquery(() => selector => {
      if (selector === "describe") {
        return { html: () => undefined, empty: () => undefined };
      }
      return $(selector);
    });

    jest.mock("jquery", () => mockJquery);
    createChartSpy = jest.spyOn(chartUtils, "createChart");
    createChartSpy.mockImplementation(() => undefined);
    fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    fetchJsonSpy.mockImplementation(() => undefined);

    const columnAnalysisUtils = require("../../../popups/analysis/columnAnalysisUtils");
    createChart = columnAnalysisUtils.createChart;
    dataLoader = columnAnalysisUtils.dataLoader;
  });

  afterEach(jest.restoreAllMocks);

  it("correctly handles targeted histogram data", () => {
    const fetchedData = {
      targets: [
        { target: "foo", data: [3, 4] },
        { target: "bar", data: [5, 6] },
      ],
      desc: {},
      labels: ["1", "2"],
    };
    createChart(null, fetchedData, { type: "histogram" });
    expect(createChartSpy).toHaveBeenCalled();
    const finalChart = createChartSpy.mock.calls[0][1];
    expect(finalChart.data.datasets.map(d => d.label)).toEqual(["foo", "bar"]);
  });

  it("correctly handles probability histogram load", () => {
    const propagateState = jest.fn();
    const props = { chartData: { selectedCol: "foo" }, height: 400, dataId: "1" };
    dataLoader(props, {}, propagateState, { type: "histogram", density: true });
    expect(fetchJsonSpy).toHaveBeenCalled();
    const params = Object.fromEntries(new URLSearchParams(fetchJsonSpy.mock.calls[0][0].split("?")[1]));
    expect(params).toMatchObject({ density: "true" });
  });
});
