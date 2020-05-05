import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { ModalFooter } from "react-modal-bootstrap";
import { Provider } from "react-redux";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../../MockPopsicle";
import { clickColMenuButton } from "../../iframe/iframe-utils";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("DataViewer tests", () => {
  let result, DataViewer, Formatting, NumericFormatting;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });

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

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = {
        ctx,
        cfg,
        data: cfg.data,
        destroyed: false,
      };
      chartCfg.destroy = function destroy() {
        chartCfg.destroyed = true;
      };
      return chartCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
    DataViewer = require("../../../dtale/DataViewer").DataViewer;
    Formatting = require("../../../popups/formats/Formatting").default;
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

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  it("DataViewer: apply numeric formatting to all", async () => {
    result.find(".main-grid div.headerCell div").at(0).simulate("click");
    result.update();
    clickColMenuButton(result, "Formats");
    result.update();
    result.find(NumericFormatting).find("div.form-group").first().find("button").last().simulate("click");
    result.find(Formatting).find("i.ico-check-box-outline-blank").simulate("click");
    result.find(Formatting).find(ModalFooter).first().find("button").first().simulate("click");
    await tickUpdate(result);
    const grid = result.find(MultiGrid).first().instance();
    expect(grid.props.data["0"].col1.view).toBe("1.000000");
    expect(grid.props.data["0"].col5.view).toBe("1.000000");
  });
});
