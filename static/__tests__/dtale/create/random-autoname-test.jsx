import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import CreateRandom from "../../../popups/create/CreateRandom";
import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../../test-utils";

import { clickBuilder } from "./create-test-utils";

describe("DataViewer tests", () => {
  let result, CreateColumn;

  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { DTYPES, urlFetcher } = require("../../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/dtypes")) {
          return {
            dtypes: _.concat(DTYPES.dtypes, {
              name: "random_col1",
              index: 4,
              dtype: "mixed-integer",
              visible: true,
              unique_ct: 1,
            }),
            success: true,
          };
        }
        return urlFetcher(url);
      })
    );

    mockChartJS();

    jest.mock("popsicle", () => mockBuildLibs);
  });

  beforeEach(async () => {
    CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;
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
    clickMainMenuButton(result, "Dataframe Functions");
    await tickUpdate(result);
    clickBuilder(result, "Random");
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: creating auto-name", async () => {
    expect(result.find(CreateRandom).length).toBe(1);
    const randomInputs = result.find(CreateRandom).first();
    randomInputs.find("div.form-group").first().find("button").last().simulate("click");
    result.update();
    expect(result.find(CreateColumn).instance().state.name).toBe("random_col2");
  });
});
