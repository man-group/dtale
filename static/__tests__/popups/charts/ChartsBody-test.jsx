import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../../MockPopsicle";
import { mockChartJS, mockD3Cloud, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("ChartsBody tests", () => {
  let result, ChartsBody;

  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "chart-data-error-test1")) {
          return { data: {} };
        }
        if (_.startsWith(url, "chart-data-error-test2")) {
          return { error: "Error test." };
        }
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    mockChartJS();
    mockD3Cloud();

    jest.mock("popsicle", () => mockBuildLibs);

    ChartsBody = require("../../../popups/charts/ChartsBody").default;
  });

  const mountChart = async props => {
    result = mount(<ChartsBody {...props} visible={true} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
  };

  it("handles missing data", async () => {
    await mountChart({ url: "chart-data-error-test1" });
    expect(_.includes(result.html(), "No data found.")).toBe(true);
  });

  it("handles errors", async () => {
    await mountChart({ url: "chart-data-error-test2" });
    expect(_.includes(result.html(), "Error test.")).toBe(true);
    result.setProps({ visible: false });
    expect(result.html()).toBeNull();
  });
});
