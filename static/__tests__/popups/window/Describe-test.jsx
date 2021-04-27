import { mount } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../../RemovableError";
import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../../test-utils";

const chartData = {
  visible: true,
  query: "col == 3",
  col: "col1",
};

describe("Describe tests", () => {
  let result;
  let testIdx = 1;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (url === "/dtale/dtypes/1") {
          return { error: "dtypes error" };
        }
        if (url === "/dtale/describe/2?col=col1") {
          return { error: "describe error" };
        }
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  beforeEach(async () => {
    const { Describe } = require("../../../popups/describe/Describe");
    buildInnerHTML({ settings: "" });
    result = mount(<Describe chartData={chartData} dataId={"" + testIdx++} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
  });

  afterAll(dimensions.afterAll);

  it("Describe: dtypes error", async () => {
    expect(result.find(RemovableError).text()).toBe("dtypes error");
  });

  it("Describe: describe error", async () => {
    await tickUpdate(result);
    expect(result.find(RemovableError).text()).toBe("describe error");
  });
});
