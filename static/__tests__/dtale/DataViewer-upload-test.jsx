import { mount } from "enzyme";
import $ from "jquery";
import React from "react";
import Dropzone from "react-dropzone";
import { ModalClose } from "react-modal-bootstrap";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, tick, tickUpdate, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("DataViewer tests", () => {
  const { post } = $;
  const { close, location, open, opener } = window;
  let result, DataViewer, Upload;
  let readAsDataURLSpy, btoaSpy;

  beforeAll(() => {
    delete window.location;
    delete window.close;
    delete window.open;
    delete window.opener;
    window.location = {
      reload: jest.fn(),
      pathname: "/dtale/column/1",
      assign: jest.fn(),
    };
    window.close = jest.fn();
    window.open = jest.fn();
    window.opener = { location: { assign: jest.fn() } };
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
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);

    $.post = jest.fn();

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
      chartCfg.getElementAtEvent = _evt => [{ _datasetIndex: 0, _index: 0, _chart: { config: cfg, data: cfg.data } }];
      return chartCfg;
    });

    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
    DataViewer = require("../../dtale/DataViewer").DataViewer;
    Upload = require("../../popups/Upload").ReactUpload;
  });

  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tick();
    clickMainMenuButton(result, "Upload CSV");
    await tickUpdate(result);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    $.post = post;
    window.location = location;
    window.close = close;
    window.open = open;
    window.opener = opener;
  });

  const upload = () => result.find(Upload).first();

  it("DataViewer: upload open/close", async () => {
    expect(result.find(Upload).length).toBe(1);
    result.find(ModalClose).first().simulate("click");
    expect(result.find(Upload).length).toBe(0);
  });

  it("DataViewer: upload", async () => {
    const mFile = new File(["test"], "test.csv");
    readAsDataURLSpy = jest.spyOn(FileReader.prototype, "readAsDataURL");
    btoaSpy = jest.spyOn(window, "btoa");
    const uploadModal = upload();
    const dd = uploadModal.find(Dropzone);
    dd.props().onDrop([mFile]);
    await tickUpdate(result);
    await tickUpdate(result);

    expect($.post.mock.calls).toHaveLength(1);
    const postCalls = $.post.mock.calls;
    const firstPostCall = postCalls[0];
    expect(firstPostCall[0]).toBe("/dtale/upload");
    expect(firstPostCall[1]).toEqual({
      contents: "data:application/octet-stream;base64,dGVzdA==",
      filename: "test.csv",
    });
    firstPostCall[2]({ data_id: "2" });
    expect(window.location.assign).toBeCalledWith("/2");

    window.location.pathname = "/dtale/popup/upload";
    firstPostCall[2]({ data_id: "2" });
    expect(window.close).toBeCalledTimes(1);
    expect(window.opener.location.assign).toBeCalledWith("/2");

    firstPostCall[2]({ error: "error test" });
    result.update();
    expect(result.find(RemovableError)).toHaveLength(1);

    readAsDataURLSpy.mockRestore();
    btoaSpy.mockRestore();
  });
});
