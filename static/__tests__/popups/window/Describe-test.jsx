import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../../RemovableError";
import * as urlUtils from "../../../actions/url-utils";
import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../../test-utils";

const chartData = {
  visible: true,
  query: "col == 3",
  col: "col1",
};

describe("Describe tests", () => {
  let result;
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
        if (url.startsWith("/dtale/describe/2?col=col1")) {
          return { error: "describe error" };
        }
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  const setup = async (dataId, settings = "") => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings }, store);
    store.getState().dataId = dataId;
    const { Describe } = require("../../../popups/describe/Describe");
    result = mount(
      <Provider store={store}>
        <Describe chartData={chartData} dataId={dataId} />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tickUpdate(result);
  };

  afterAll(dimensions.afterAll);

  it("Describe: dtypes error", async () => {
    await setup("1");
    expect(result.find(RemovableError).text()).toBe("dtypes error");
  });

  it("Describe: describe error", async () => {
    await setup("2");
    await tickUpdate(result);
    expect(result.find(RemovableError).text()).toBe("describe error");
  });

  it("Describe: filtered", async () => {
    const describeUrlSpy = jest.spyOn(urlUtils, "describeUrl");
    await setup("3", "{&quot;query&quot;:&quot;foo == 3&quot;}");
    expect(result.find("div.filtered")).toHaveLength(1);
    expect(describeUrlSpy).toHaveBeenCalledWith("3", "col1", true);
    result.find("div.filtered").find("i").simulate("click");
    expect(describeUrlSpy).toHaveBeenLastCalledWith("3", "col1", false);
  });
});
