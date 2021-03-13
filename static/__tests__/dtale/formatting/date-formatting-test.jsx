import { mount } from "enzyme";
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
  });

  afterAll(() => {
    dimensions.afterAll();
    window.open = open;
  });

  it("DataViewer: date formatting", async () => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    const Formatting = require("../../../popups/formats/Formatting").ReactFormatting;
    const DateFormatting = require("../../../popups/formats/DateFormatting").default;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );

    await tickUpdate(result);
    // select column
    result.find(".main-grid div.headerCell").last().find(".text-nowrap").simulate("click");
    result.update();
    clickColMenuButton(result, "Formats");
    result.update();
    expect(result.find(DateFormatting).length).toBe(1);

    result.find(Formatting).find("i.ico-info-outline").first().simulate("click");
    const momentUrl = "https://momentjs.com/docs/#/displaying/format/";
    expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe(momentUrl);
    const input = result.find(DateFormatting).find("div.form-group").at(0).find("input");

    input.simulate("change", { target: { value: "YYYYMMDD" } });
    expect(result.find(DateFormatting).find("div.row").last().text()).toBe(
      "Raw:December 31st 1999, 7:00:00 pmFormatted:19991231"
    );

    result.find(Formatting).find(Modal.Footer).first().find("button").first().simulate("click");
    await tickUpdate(result);
    const grid = result.find(MultiGrid).first().instance();
    expect(grid.props.data["0"].col4.view.length).toBe(8);
  });
});
