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

  it("DataViewer: string formatting", async () => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    const Formatting = require("../../../popups/formats/Formatting").ReactFormatting;
    const StringFormatting = require("../../../popups/formats/StringFormatting").default;
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
    result.find(".main-grid div.headerCell").at(2).find(".text-nowrap").simulate("click");
    result.update();
    clickColMenuButton(result, "Formats");
    result.update();
    expect(result.find(StringFormatting).length).toBe(1);
    const linkToggle = result.find(StringFormatting).find("div.form-group").at(0).find("i");
    linkToggle.simulate("click");
    expect(result.find(StringFormatting).state().fmt).toMatchObject(
      expect.objectContaining({ link: true, html: false })
    );
    const htmlToggle = result.find(StringFormatting).find("div.form-group").at(1).find("i");
    htmlToggle.simulate("click");
    expect(result.find(StringFormatting).state().fmt).toMatchObject(
      expect.objectContaining({ link: false, html: true })
    );
    const input = result.find(StringFormatting).find("div.form-group").at(2).find("input");
    input.simulate("change", { target: { value: "2" } });
    expect(result.find(StringFormatting).find("div.row").last().text()).toBe(
      "Raw:I am a long piece of text, please truncate me.Truncated:..."
    );
    result.find(Formatting).find(Modal.Footer).first().find("button").first().simulate("click");
    await tickUpdate(result);
    const grid = result.find(MultiGrid).first().instance();
    expect(grid.props.data["0"].col3.view).toBe("...");
  });
});
