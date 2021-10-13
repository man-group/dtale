import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { Provider } from "react-redux";
import Select from "react-select";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import { clickColMenuButton } from "../../iframe/iframe-utils";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, mockChartJS, tickUpdate, withGlobalJquery } from "../../test-utils";

const TEXT_TESTS = [
  "EX: -123456.789 => -123456.789000",
  "EX: -123456.789 => -123,456.789000",
  "EX: -123456.789 => -123.456789k",
  "EX: -123456.789 => -1.234568e+5",
  "EX: -123456.789 => 1.23456789b-BPS",
];

describe("DataViewer tests", () => {
  let result, DataViewer, ReactDataViewer, Formatting, NumericFormatting;
  const { open } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    delete window.open;
    window.open = jest.fn();

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);

    const dv = require("../../../dtale/DataViewer");
    DataViewer = dv.DataViewer;
    ReactDataViewer = dv.ReactDataViewer;
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

  afterAll(() => {
    dimensions.afterAll();
    window.open = open;
  });

  it("DataViewer: numeric formatting", async () => {
    // select column
    result.find(".main-grid div.headerCell").at(1).find(".text-nowrap").simulate("click");
    result.update();
    clickColMenuButton(result, "Formats");
    result.update();
    expect(result.find(NumericFormatting).length).toBe(1);
    result.find(Formatting).find(Modal.Header).first().find("button").simulate("click");
    result.update();
    expect(result.find(Formatting).instance().props.visible).toBe(false);
    result.update();
    clickColMenuButton(result, "Formats");
    result.update();

    result.find(NumericFormatting).find("i.ico-info-outline").first().simulate("click");
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe("http://numeraljs.com/#format");
    _.forEach(TEXT_TESTS, (expected, i) => {
      let clicker = result.find(NumericFormatting).find("div.form-group").at(i).find("button");
      if (i == 0) {
        clicker = clicker.last();
      } else {
        clicker = clicker.first();
      }
      clicker.simulate("click");
      expect(result.find(NumericFormatting).find("small").first().text()).toBe(expected);
    });
    result.find(NumericFormatting).find("div.form-group").at(5).find("button").first().simulate("click");
    expect(_.includes(result.find(NumericFormatting).find("small").first().html(), 'style="color: red;"')).toBe(true);
    _.forEach(_.range(1, 6), i => {
      result.find(NumericFormatting).find("div.form-group").at(i).find("button").last().simulate("click");
    });
    result.find(Formatting).find("div.form-group").last().find(Select).props().onChange({ value: "-" });
    result.find(Formatting).find(Modal.Footer).first().find("button").first().simulate("click");
    await tickUpdate(result);
    const grid = result.find(MultiGrid).first().instance();
    expect(grid.props.data["0"].col2.view).toBe("2.500000");
    expect(result.find(ReactDataViewer).instance().state.nanDisplay).toBe("-");
  });
});
