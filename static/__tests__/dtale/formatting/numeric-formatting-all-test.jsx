import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { Provider } from "react-redux";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import { clickColMenuButton } from "../../iframe/iframe-utils";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("DataViewer tests", () => {
  let result, DataViewer, Formatting, NumericFormatting;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher, DATA, DTYPES } = require("../../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/data")) {
          const newData = _.clone(DATA);
          _.forEach(newData.results, r => (r.col5 = r.col1));
          newData.columns.push(_.assignIn({}, DTYPES.dtypes[0], { name: "col5" }));
          return newData;
        } else if (_.startsWith(url, "/dtale/dtypes")) {
          const newDtypes = _.clone(DTYPES);
          newDtypes.dtypes.push(_.assignIn({}, DTYPES.dtypes[0], { name: "col5" }));
          return newDtypes;
        }
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);

    DataViewer = require("../../../dtale/DataViewer").DataViewer;
    Formatting = require("../../../popups/formats/Formatting").ReactFormatting;
    NumericFormatting = require("../../../popups/formats/NumericFormatting").default;
  });

  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tickUpdate(result);
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: apply numeric formatting to all", async () => {
    result.find(".main-grid div.headerCell").at(0).find(".text-nowrap").simulate("click");
    result.update();
    clickColMenuButton(result, "Formats");
    result.update();
    result.find(NumericFormatting).find("div.form-group").first().find("button").last().simulate("click");
    result.find(Formatting).find("i.ico-check-box-outline-blank").simulate("click");
    result.find(Formatting).find(Modal.Footer).first().find("button").first().simulate("click");
    await tickUpdate(result);
    const grid = result.find(MultiGrid).first().instance();
    expect(grid.props.data["0"].col1.view).toBe("1.000000");
    expect(grid.props.data["0"].col5.view).toBe("1.000000");
  });
});
