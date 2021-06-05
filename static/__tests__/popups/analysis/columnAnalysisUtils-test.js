import $ from "jquery";

import { withGlobalJquery } from "../../test-utils";
import chartUtils from "../../../chartUtils";

describe("columnAnalysisUtils", () => {
  let createChart, createChartSpy;

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
    createChart = require("../../../popups/analysis/columnAnalysisUtils").createChart;
  });

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
});
